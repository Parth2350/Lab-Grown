import 'server-only';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { Prisma, type OrderStatus } from '@prisma/client';
import { db } from './db';
import { getSettings } from './settings';
import { getCardsByIds } from './catalog';
import { revalidateCatalog } from './revalidate';
import { recomputeFromPrice } from './product-pricing';
import { site } from '@/config/site';
import { RING_SIZES, label } from '@/lib/catalog';
import { computeTotals, evaluateCoupon, unitPrice as composeUnitPrice, type StoreSettings } from '@/lib/pricing';
import type { ArtSpec } from '@/components/art/JewelryArt';
import type { CartLine } from '@/store/cart';
import type { ProductCard } from '@/lib/types';
import { checkoutSchema, fieldErrors, type AddressInput, type LineInput } from '@/components/commerce/schemas';

// ───────────────────────────── errors & rate limiting ─────────────────────────────

export class CheckoutError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(message: string, status = 400, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

type Bucket = { count: number; reset: number };
const g = globalThis as unknown as { __aurRate?: Map<string, Bucket> };
const buckets = (g.__aurRate ??= new Map<string, Bucket>());

/** Small fixed-window, in-memory rate limiter (per server instance). */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return b.count > limit ? { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) } : { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

/** Rejects cross-site browser requests to state-changing endpoints (defence in depth on top of SameSite cookies). */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    /* malformed origin */
  }
  if (!host || originHost !== host) throw new CheckoutError('Request blocked.', 403);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof CheckoutError) return NextResponse.json({ error: e.message, ...(e.extra ?? {}) }, { status: e.status });
  console.error('[commerce]', e);
  return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 });
}

export function tooMany(retryAfter: number) {
  return NextResponse.json(
    { error: 'Too many attempts — please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}

// ───────────────────────────── helpers ─────────────────────────────

const key = (l: { productId: string; variantId: string; diamondId?: string | null; diamondOptionId?: string | null; ringSize?: string | null }) =>
  // Mirrors lineKey() in src/store/cart.ts so server-built lines merge with local ones.
  [l.productId, l.variantId, l.diamondId ?? '', l.diamondOptionId ?? '', l.ringSize ?? ''].join('|');

type DiamondRow = { id: string; shape: string; carat: number; color: string; clarity: string; cut: string; price: number; isAvailable: boolean; certificate: { lab: string } | null };
type OptionRow = { id: string; kind: 'CENTER_STONE' | 'TOTAL_WEIGHT'; shape: string | null; minCarat: number | null; maxCarat: number | null; label: string | null; totalCarat: number | null; color: string | null; clarity: string | null; priceDelta: number };

export function diamondSummary(d: Pick<DiamondRow, 'shape' | 'carat' | 'color' | 'clarity' | 'cut' | 'certificate'>) {
  return [`${d.carat.toFixed(2)} ct ${label.shape(d.shape)}`, d.color, d.clarity, d.cut, d.certificate?.lab].filter(Boolean).join(' · ');
}

export function optionSummary(o: Pick<OptionRow, 'label' | 'totalCarat' | 'color' | 'clarity'>) {
  const base = o.label ?? (o.totalCarat != null ? `${o.totalCarat.toFixed(2)} ct total weight` : 'Diamond package');
  return o.color && o.clarity ? `${base} · ${o.color}/${o.clarity}` : base;
}

// ───────────────────────────── pricing (authoritative) ─────────────────────────────

export type PricedLine = {
  index: number;
  key: string;
  productId: string;
  variantId: string;
  diamondId: string | null;
  diamondOptionId: string | null;
  ringSize: string | null;
  quantity: number;
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  purity: string;
  metalColor: string;
  unitPrice: number;
  lineTotal: number;
  summary: string | null;
  diamond: { id: string; summary: string; price: number; shape: string; carat: number } | null;
  option: { id: string; label: string; priceDelta: number } | null;
  art: ArtSpec | null;
  shape: string;
  carat: number;
  image: string | null;
  stock: number;
};

export type LineIssue = { index: number; key: string; code: string; message: string };

/**
 * Re-prices every line from the database: variant price + certified diamond (validated
 * against the product's centre-stone rules) or the product's diamond-weight option.
 * Lines that cannot be priced at all are returned only as issues.
 */
export async function priceLines(inputs: LineInput[], opts: { checkStock?: boolean } = {}) {
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
  const [products, variants, diamonds] = await Promise.all([
    db.product.findMany({
      where: { id: { in: uniq(inputs.map((l) => l.productId)) } },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        requiresSize: true,
        art: true,
        shapes: true,
        centerCarat: true,
        totalCarat: true,
        category: { select: { slug: true, isActive: true } },
        images: { where: { kind: 'image' }, orderBy: { position: 'asc' }, take: 1, select: { url: true } },
        diamondOptions: {
          orderBy: { position: 'asc' },
          select: { id: true, kind: true, shape: true, minCarat: true, maxCarat: true, label: true, totalCarat: true, color: true, clarity: true, priceDelta: true },
        },
      },
    }),
    db.productVariant.findMany({
      where: { id: { in: uniq(inputs.map((l) => l.variantId)) } },
      select: { id: true, productId: true, sku: true, purity: true, metalColor: true, price: true, stock: true, isActive: true },
    }),
    db.diamond.findMany({
      where: { id: { in: uniq(inputs.map((l) => l.diamondId)) } },
      select: { id: true, shape: true, carat: true, color: true, clarity: true, cut: true, price: true, isAvailable: true, certificate: { select: { lab: true } } },
    }),
  ]);
  const pMap = new Map(products.map((p) => [p.id, p]));
  const vMap = new Map(variants.map((v) => [v.id, v]));
  const dMap = new Map(diamonds.map((d) => [d.id, d]));

  const lines: PricedLine[] = [];
  const issues: LineIssue[] = [];
  const seenDiamonds = new Set<string>();
  const qtyByVariant = new Map<string, number>();
  for (const l of inputs) qtyByVariant.set(l.variantId, (qtyByVariant.get(l.variantId) ?? 0) + l.quantity);

  inputs.forEach((l, index) => {
    const k = key(l);
    const fail = (code: string, message: string) => issues.push({ index, key: k, code, message });
    const p = pMap.get(l.productId);
    if (!p || !p.isActive || !p.category.isActive) return fail('unavailable', `${p?.name ?? 'One piece in your bag'} is no longer available.`);
    const v = vMap.get(l.variantId);
    if (!v || v.productId !== p.id || !v.isActive) return fail('variant', `The selected metal for ${p.name} is no longer offered.`);

    const center = p.diamondOptions.find((o) => o.kind === 'CENTER_STONE') as OptionRow | undefined;
    const weights = p.diamondOptions.filter((o) => o.kind === 'TOTAL_WEIGHT');
    let diamond: DiamondRow | null = null;
    let option: OptionRow | null = null;
    let issue: [string, string] | null = null;

    if (l.diamondId) {
      const d = dMap.get(l.diamondId);
      if (!center) return fail('diamond_mismatch', `${p.name} is not set with a loose diamond.`);
      if (!d) return fail('diamond_sold', `The diamond selected for ${p.name} is no longer available.`);
      // any diamond shape can be set — the customer picks it on the product page; only the carat range is fixed by the setting
      const fits = d.carat >= (center.minCarat ?? 0) - 1e-6 && d.carat <= (center.maxCarat ?? 99) + 1e-6;
      if (!fits) return fail('diamond_mismatch', `The selected diamond does not fit the ${p.name} setting.`);
      diamond = d;
      if (!d.isAvailable) issue = ['diamond_sold', `The ${d.carat.toFixed(2)} ct ${label.shape(d.shape).toLowerCase()} diamond for ${p.name} has just been reserved by another client. Please choose another stone.`];
      else if (seenDiamonds.has(d.id)) issue = ['duplicate_diamond', `The same certified diamond appears twice in your bag.`];
      else if (l.quantity !== 1) issue = ['quantity', `Each certified diamond is one of a kind — ${p.name} is limited to a quantity of 1.`];
      seenDiamonds.add(d.id);
    } else if (center) {
      issue = ['diamond_required', `Choose a centre diamond for ${p.name}.`];
    }

    if (l.diamondOptionId) {
      const o = p.diamondOptions.find((x) => x.id === l.diamondOptionId) as OptionRow | undefined;
      if (!o) return fail('option', `The diamond option chosen for ${p.name} is no longer offered.`);
      if (o.kind === 'TOTAL_WEIGHT' && diamond) return fail('option', `Choose either a centre diamond or a diamond weight for ${p.name}.`);
      option = o;
    } else if (weights.length && !center && !issue) {
      issue = ['option_required', `Choose a diamond weight for ${p.name}.`];
    }

    let ringSize: string | null = null;
    if (p.requiresSize) {
      if (!l.ringSize) issue ??= ['size_required', `Select a ring size for ${p.name}.`];
      else if (!RING_SIZES.includes(l.ringSize)) issue ??= ['size_invalid', `Select a valid ring size for ${p.name}.`];
      else ringSize = l.ringSize;
    }

    if (opts.checkStock && !issue) {
      const want = qtyByVariant.get(v.id) ?? l.quantity;
      if (v.stock < want)
        issue =
          v.stock > 0
            ? ['stock', `Only ${v.stock} of ${p.name} in ${v.purity} ${label.metal(v.metalColor)} remain — please reduce the quantity.`]
            : ['stock', `${p.name} in ${v.purity} ${label.metal(v.metalColor)} is currently out of stock.`];
    }

    const unit = composeUnitPrice({ variantPrice: v.price, diamondPrice: diamond?.price, optionDelta: option?.priceDelta });
    const art = (p.art as ArtSpec | null) ?? null;
    const shape = diamond?.shape ?? center?.shape ?? p.shapes[0] ?? 'round';
    const carat = diamond?.carat ?? option?.totalCarat ?? p.centerCarat ?? p.totalCarat ?? 1;
    const dSummary = diamond ? diamondSummary(diamond) : null;
    const oSummary = option && option.kind === 'TOTAL_WEIGHT' ? optionSummary(option) : null;
    const line: PricedLine = {
      index,
      key: key({ ...l, ringSize }),
      productId: p.id,
      variantId: v.id,
      diamondId: diamond?.id ?? null,
      diamondOptionId: option?.id ?? null,
      ringSize,
      quantity: diamond ? 1 : l.quantity,
      name: p.name,
      slug: p.slug,
      sku: v.sku,
      categorySlug: p.category.slug,
      purity: v.purity,
      metalColor: v.metalColor,
      unitPrice: unit,
      lineTotal: unit * (diamond ? 1 : l.quantity),
      summary: dSummary ?? oSummary,
      diamond: diamond ? { id: diamond.id, summary: dSummary!, price: diamond.price, shape: diamond.shape, carat: diamond.carat } : null,
      option: option ? { id: option.id, label: oSummary ?? 'Centre stone', priceDelta: option.priceDelta } : null,
      art,
      shape,
      carat,
      image: p.images[0]?.url ?? null,
      stock: v.stock,
    };
    lines.push(line);
    if (issue) fail(issue[0], issue[1]);
  });

  return { lines, issues };
}

// ───────────────────────────── coupons ─────────────────────────────

export async function findCoupon(code: string) {
  const c = code.trim();
  if (!c) return null;
  return db.coupon.findFirst({ where: { code: { equals: c, mode: 'insensitive' } } });
}

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await findCoupon(code);
  const r = evaluateCoupon(coupon, subtotal);
  const message = coupon ? r.message : 'We don’t recognise this code';
  return { ok: r.ok, discount: r.ok ? r.discount : 0, message, code: coupon?.code ?? code.trim().toUpperCase() };
}

// ───────────────────────────── quote ─────────────────────────────

export async function quote(input: { lines: LineInput[]; couponCode?: string | null; deliveryMethod?: string | null }) {
  const settings = await getSettings();
  const { lines, issues } = await priceLines(input.lines, { checkStock: true });
  const method = settings.shippingMethods.find((m) => m.id === input.deliveryMethod) ?? settings.shippingMethods[0];
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const coupon = input.couponCode ? await validateCoupon(input.couponCode, subtotal) : null;
  const totals = computeTotals({
    lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    shippingPrice: method?.price ?? 0,
    discount: coupon?.ok ? coupon.discount : 0,
    taxRate: settings.taxRate,
  });
  return {
    lines: lines.map((l) => ({ key: l.key, index: l.index, unitPrice: l.unitPrice, quantity: l.quantity })),
    issues,
    coupon,
    deliveryMethod: method?.id ?? null,
    totals,
  };
}

// ───────────────────────────── receipt tokens ─────────────────────────────

const secret = () => process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'tvj-development-secret';

/** Capability token handed to the browser that placed the order (lets guests view their confirmation). */
export function receiptToken(orderNumber: string) {
  return crypto.createHmac('sha256', secret()).update(`receipt:${orderNumber}`).digest('base64url').slice(0, 32);
}

export function verifyReceiptToken(orderNumber: string, token: string | null | undefined) {
  if (!token) return false;
  const a = Buffer.from(receiptToken(orderNumber));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ───────────────────────────── Razorpay ─────────────────────────────

export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

function razorpayAuth() {
  return 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
}

async function createRazorpayOrder(amount: number, receipt: string) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: razorpayAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: site.currency, receipt, notes: { orderNumber: receipt, store: site.name } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });
  const json = (await res.json().catch(() => null)) as { id?: string; amount?: number; currency?: string; error?: { description?: string } } | null;
  if (!res.ok || !json?.id) throw new Error(json?.error?.description ?? `Razorpay responded with ${res.status}`);
  return { id: json.id, amount: json.amount ?? amount, currency: json.currency ?? site.currency };
}

/** Best-effort lookup of the payment method actually used (upi/card/netbanking/wallet). */
async function fetchRazorpayPayment(paymentId: string) {
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: razorpayAuth() },
      cache: 'no-store',
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string; method?: string; status?: string; amount?: number; order_id?: string };
  } catch {
    return null;
  }
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = Buffer.from(crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex'));
  const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// ───────────────────────────── create order ─────────────────────────────

export type AddressSnapshot = {
  label?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const snapshot = (a: AddressSnapshot): AddressSnapshot => ({
  firstName: a.firstName,
  lastName: a.lastName,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2 || null,
  city: a.city,
  state: a.state,
  postalCode: a.postalCode,
  country: a.country,
});

const orderNumber = () => `TVJ-${crypto.randomInt(100000, 1000000)}`;

type Viewer = { id: string; email?: string | null } | null;

export type PlaceOrderResult =
  | {
      mode: 'razorpay';
      orderNumber: string;
      receiptToken: string;
      keyId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      totals: ReturnType<typeof computeTotals>;
      prefill: { name: string; email: string; contact: string; method?: string };
    }
  | { mode: 'demo'; orderNumber: string; receiptToken: string; amount: number; currency: string; totals: ReturnType<typeof computeTotals> };

export async function placeOrder(raw: unknown, viewer: Viewer): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) throw new CheckoutError('Please review the highlighted details.', 400, { fieldErrors: fieldErrors(parsed.error) });
  const input = parsed.data;
  const settings = await getSettings();

  const method = settings.shippingMethods.find((m) => m.id === input.deliveryMethod);
  if (!method) throw new CheckoutError('Choose a delivery method.', 400, { fieldErrors: { deliveryMethod: 'Choose a delivery method' } });

  const user = viewer ? await db.user.findUnique({ where: { id: viewer.id }, select: { id: true } }) : null;

  let address: AddressSnapshot;
  if (input.addressId) {
    if (!user) throw new CheckoutError('Please sign in to use a saved address.', 401);
    const saved = await db.address.findFirst({ where: { id: input.addressId, userId: user.id } });
    if (!saved) throw new CheckoutError('That saved address could not be found.', 400, { fieldErrors: { addressId: 'Choose a saved address' } });
    address = snapshot(saved);
  } else {
    address = snapshot(input.address as AddressInput);
  }

  const { lines, issues } = await priceLines(input.lines, { checkStock: true });
  if (issues.length) throw new CheckoutError('Some pieces in your bag need your attention.', 409, { issues });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const c = await validateCoupon(input.couponCode, subtotal);
    if (!c.ok) throw new CheckoutError(c.message, 409, { fieldErrors: { couponCode: c.message } });
    discount = c.discount;
    couponCode = c.code;
  }
  const totals = computeTotals({
    lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    shippingPrice: method.price,
    discount,
    taxRate: settings.taxRate,
  });

  const provider = razorpayConfigured() ? 'razorpay' : 'demo';
  const payMethod = input.paymentMethod === 'razorpay' ? null : input.paymentMethod;

  let created: { id: string; number: string; paymentId: string } | null = null;
  for (let attempt = 0; attempt < 6 && !created; attempt++) {
    const number = orderNumber();
    try {
      created = await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            number,
            userId: user?.id ?? null,
            email: input.customer.email,
            phone: input.customer.phone,
            customerName: input.customer.name,
            shippingAddress: address as unknown as Prisma.InputJsonObject,
            billingAddress: address as unknown as Prisma.InputJsonObject,
            deliveryMethod: method.id,
            status: 'PENDING',
            currency: site.currency,
            subtotal: totals.subtotal,
            discount: totals.discount,
            shipping: totals.shipping,
            tax: totals.tax,
            total: totals.total,
            couponCode,
            notes: input.notes || null,
            items: {
              create: lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                diamondId: l.diamondId,
                diamondOptionId: l.diamondOptionId,
                name: l.name,
                sku: l.sku,
                slug: l.slug,
                purity: l.purity,
                metalColor: l.metalColor,
                diamondSummary: l.summary,
                ringSize: l.ringSize,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                lineTotal: l.lineTotal,
              })),
            },
            payments: { create: { provider, method: payMethod, amount: totals.total, currency: site.currency, status: 'PENDING' } },
          },
          select: { id: true, number: true, payments: { select: { id: true } } },
        });

        if (user && input.saveAddress && !input.addressId) {
          const existing = await tx.address.findMany({ where: { userId: user.id } });
          const dup = existing.some(
            (a) =>
              a.line1.toLowerCase() === address.line1.toLowerCase() &&
              a.postalCode.replace(/\s/g, '').toLowerCase() === address.postalCode.replace(/\s/g, '').toLowerCase() &&
              a.country === address.country &&
              a.firstName.toLowerCase() === address.firstName.toLowerCase(),
          );
          if (!dup && existing.length < 20)
            await tx.address.create({ data: { ...address, userId: user.id, isDefault: existing.length === 0 } });
        }
        return { id: order.id, number: order.number, paymentId: order.payments[0].id };
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
      throw e;
    }
  }
  if (!created) throw new CheckoutError('We could not reserve an order number. Please try again.', 503);

  const token = receiptToken(created.number);
  if (provider === 'razorpay') {
    try {
      const rzp = await createRazorpayOrder(totals.total, created.number);
      await db.payment.update({ where: { id: created.paymentId }, data: { providerOrderId: rzp.id } });
      return {
        mode: 'razorpay',
        orderNumber: created.number,
        receiptToken: token,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID!,
        razorpayOrderId: rzp.id,
        amount: rzp.amount,
        currency: rzp.currency,
        totals,
        prefill: { name: input.customer.name, email: input.customer.email, contact: input.customer.phone, ...(payMethod ? { method: payMethod } : {}) },
      };
    } catch (e) {
      await db.$transaction([
        db.payment.update({ where: { id: created.paymentId }, data: { status: 'FAILED', raw: { error: String((e as Error).message).slice(0, 300) } } }),
        db.order.update({ where: { id: created.id }, data: { status: 'CANCELLED', adminNotes: 'Payment gateway unavailable when the order was placed.' } }),
      ]);
      throw new CheckoutError('Our payment partner is temporarily unavailable. You have not been charged — please try again in a moment.', 502);
    }
  }
  return { mode: 'demo', orderNumber: created.number, receiptToken: token, amount: totals.total, currency: site.currency, totals };
}

// ───────────────────────────── finalize (idempotent) ─────────────────────────────

type FinalizeInput = {
  provider: 'razorpay' | 'demo';
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  signature?: string | null;
  method?: string | null;
  raw?: Prisma.InputJsonValue;
};

/**
 * Marks an order paid exactly once: captures the payment, decrements variant stock,
 * retires sold diamonds, counts coupon usage and refreshes catalog caches.
 */
export async function finalizeOrder(orderId: string, pay: FinalizeInput) {
  const result = await db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'PAID' } });
    if (claimed.count === 0) return { already: true as const, centerProducts: [] as string[] };

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        currency: true,
        couponCode: true,
        adminNotes: true,
        items: { select: { productId: true, variantId: true, diamondId: true, sku: true, quantity: true } },
        payments: { orderBy: { createdAt: 'desc' }, select: { id: true, status: true, providerOrderId: true, method: true } },
      },
    });

    const data = {
      status: 'CAPTURED' as const,
      providerPaymentId: pay.providerPaymentId ?? null,
      signature: pay.signature ?? null,
      ...(pay.providerOrderId ? { providerOrderId: pay.providerOrderId } : {}),
      ...(pay.method ? { method: pay.method } : {}),
      ...(pay.raw !== undefined ? { raw: pay.raw } : {}),
    };
    const target =
      order.payments.find((p) => p.status === 'PENDING' && (!pay.providerOrderId || p.providerOrderId === pay.providerOrderId)) ??
      order.payments.find((p) => p.status === 'PENDING');
    if (target) await tx.payment.update({ where: { id: target.id }, data });
    else await tx.payment.create({ data: { ...data, orderId: order.id, provider: pay.provider, amount: order.total, currency: order.currency } });

    const notes: string[] = [];
    const byVariant = new Map<string, { qty: number; sku: string }>();
    for (const it of order.items) {
      if (!it.variantId) continue;
      const cur = byVariant.get(it.variantId);
      byVariant.set(it.variantId, { qty: (cur?.qty ?? 0) + it.quantity, sku: it.sku });
    }
    for (const [variantId, { qty, sku }] of byVariant) {
      const r = await tx.productVariant.updateMany({ where: { id: variantId, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
      if (r.count === 0) {
        await tx.productVariant.updateMany({ where: { id: variantId }, data: { stock: 0 } });
        notes.push(`Inventory shortfall on ${sku} (ordered ${qty}) — confirm production lead time with the client.`);
      }
    }

    const diamondIds = order.items.map((i) => i.diamondId).filter((x): x is string => !!x);
    if (diamondIds.length) {
      const r = await tx.diamond.updateMany({ where: { id: { in: diamondIds }, isAvailable: true }, data: { isAvailable: false } });
      if (r.count < diamondIds.length) notes.push('A certified diamond on this order was already marked sold — source a matching stone before production.');
    }

    if (order.couponCode) await tx.coupon.updateMany({ where: { code: { equals: order.couponCode, mode: 'insensitive' } }, data: { usedCount: { increment: 1 } } });

    if (notes.length) await tx.order.update({ where: { id: order.id }, data: { adminNotes: [order.adminNotes, ...notes].filter(Boolean).join('\n') } });

    if (order.userId) {
      const pairs = order.items.filter((i) => i.productId && i.variantId);
      if (pairs.length)
        await tx.cartItem.deleteMany({
          where: { cart: { userId: order.userId }, OR: pairs.map((i) => ({ productId: i.productId!, variantId: i.variantId! })) },
        });
    }

    const centerProducts = [...new Set(order.items.filter((i) => i.diamondId && i.productId).map((i) => i.productId!))];
    return { already: false as const, centerProducts };
  });

  if (!result.already) {
    try {
      // Diamonds left inventory → other products' "From" prices may change.
      if (result.centerProducts.length) {
        const shapes = await db.productDiamondOption.findMany({ where: { productId: { in: result.centerProducts }, kind: 'CENTER_STONE' }, select: { shape: true } });
        const affected = await db.productDiamondOption.findMany({
          where: { kind: 'CENTER_STONE', shape: { in: shapes.map((s) => s.shape).filter((s): s is string => !!s) } },
          select: { productId: true },
        });
        for (const pid of new Set([...result.centerProducts, ...affected.map((a) => a.productId)])) await recomputeFromPrice(pid);
      }
      await revalidateCatalog();
    } catch (e) {
      console.error('[orders] post-payment revalidation failed', e);
    }
  }
  return result;
}

export async function finalizeRazorpay(input: { orderNumber: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  if (!razorpayConfigured()) throw new CheckoutError('Online payments are not configured.', 400);
  const order = await db.order.findUnique({
    where: { number: input.orderNumber },
    select: { id: true, number: true, status: true, payments: { select: { providerOrderId: true } } },
  });
  if (!order || !order.payments.some((p) => p.providerOrderId === input.razorpay_order_id)) throw new CheckoutError('Order not found.', 404);
  if (!verifyRazorpaySignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature))
    throw new CheckoutError('We could not verify this payment. If you were charged, our concierge will reconcile it within 24 hours.', 400);
  if (order.status !== 'PENDING') return { orderNumber: order.number, status: order.status };
  const details = await fetchRazorpayPayment(input.razorpay_payment_id);
  await finalizeOrder(order.id, {
    provider: 'razorpay',
    providerOrderId: input.razorpay_order_id,
    providerPaymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
    method: details?.method ?? null,
    raw: details ? (JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue) : undefined,
  });
  return { orderNumber: order.number, status: 'PAID' as OrderStatus };
}

/** Verifies Razorpay's webhook signature (HMAC-SHA256 of the raw body with the webhook secret). */
export function verifyRazorpayWebhook(rawBody: string, signature: string | null) {
  const secretKey = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secretKey || !signature) return false;
  const expected = Buffer.from(crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex'));
  const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/**
 * Server-to-server confirmation (payment.captured / order.paid). Covers shoppers who
 * close the tab before the browser handler reports back. Idempotent with the client path.
 */
export async function finalizeFromWebhook(payment: { id?: string; order_id?: string; amount?: number; currency?: string; method?: string; status?: string }) {
  if (!payment.order_id || !payment.id) return { handled: false as const, reason: 'missing ids' };
  const row = await db.payment.findFirst({
    where: { providerOrderId: payment.order_id, provider: 'razorpay' },
    select: { order: { select: { id: true, status: true, total: true, currency: true } } },
  });
  if (!row) return { handled: false as const, reason: 'unknown order' };
  if (row.order.status !== 'PENDING') return { handled: true as const, already: true };
  if (payment.amount != null && payment.amount !== row.order.total) {
    console.error('[razorpay webhook] amount mismatch', payment.order_id, payment.amount, row.order.total);
    return { handled: false as const, reason: 'amount mismatch' };
  }
  await finalizeOrder(row.order.id, {
    provider: 'razorpay',
    providerOrderId: payment.order_id,
    providerPaymentId: payment.id,
    method: payment.method ?? null,
    raw: JSON.parse(JSON.stringify({ via: 'webhook', ...payment })) as Prisma.InputJsonValue,
  });
  return { handled: true as const, already: false };
}

export async function finalizeDemo(orderNumber: string, auth: { viewer: Viewer; token?: string | null }) {
  if (razorpayConfigured()) throw new CheckoutError('Demo payments are disabled because live payments are configured.', 403);
  const order = await db.order.findUnique({
    where: { number: orderNumber },
    select: { id: true, number: true, status: true, userId: true, items: { select: { diamondId: true } } },
  });
  const allowed = !!order && (verifyReceiptToken(orderNumber, auth.token) || (!!auth.viewer && order.userId === auth.viewer.id));
  if (!order || !allowed) throw new CheckoutError('Order not found.', 404);
  if (order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED')
    return { orderNumber: order.number, status: order.status };
  if (order.status !== 'PENDING') throw new CheckoutError('This order can no longer be paid. Please place a new order.', 409);
  const ids = order.items.map((i) => i.diamondId).filter((x): x is string => !!x);
  if (ids.length) {
    const sold = await db.diamond.count({ where: { id: { in: ids }, isAvailable: false } });
    if (sold) throw new CheckoutError('A diamond on this order has just been reserved by another client. Please return to your bag and choose another stone.', 409);
  }
  await finalizeOrder(order.id, { provider: 'demo', providerPaymentId: `demo_${crypto.randomBytes(6).toString('hex')}`, raw: { demo: true } });
  return { orderNumber: order.number, status: 'PAID' as OrderStatus };
}

// ───────────────────────────── order views ─────────────────────────────

export function deliveryInfo(settings: StoreSettings, id: string) {
  const m = settings.shippingMethods.find((x) => x.id === id);
  return { id, label: m?.label ?? id, eta: m?.eta ?? null, description: m?.description ?? null };
}

const orderViewSelect = {
  id: true,
  number: true,
  userId: true,
  email: true,
  phone: true,
  customerName: true,
  status: true,
  currency: true,
  subtotal: true,
  discount: true,
  shipping: true,
  tax: true,
  total: true,
  couponCode: true,
  deliveryMethod: true,
  shippingAddress: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      name: true,
      sku: true,
      slug: true,
      purity: true,
      metalColor: true,
      diamondSummary: true,
      ringSize: true,
      quantity: true,
      unitPrice: true,
      lineTotal: true,
      diamond: { select: { shape: true, carat: true } },
      diamondOption: { select: { totalCarat: true } },
      product: { select: { art: true, shapes: true, centerCarat: true, totalCarat: true, images: { where: { kind: 'image' }, take: 1, orderBy: { position: 'asc' }, select: { url: true } } } },
    },
  },
  payments: { orderBy: { createdAt: 'desc' }, select: { provider: true, method: true, status: true, amount: true, providerPaymentId: true, createdAt: true } },
  shipments: { orderBy: { createdAt: 'desc' }, select: { carrier: true, method: true, trackingNumber: true, status: true, shippedAt: true, deliveredAt: true } },
} satisfies Prisma.OrderSelect;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof orderViewSelect }>;

export function toOrderView(o: OrderRow, settings: StoreSettings) {
  return {
    number: o.number,
    email: o.email,
    phone: o.phone,
    customerName: o.customerName,
    status: o.status,
    currency: o.currency,
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    tax: o.tax,
    total: o.total,
    couponCode: o.couponCode,
    isGuest: !o.userId,
    delivery: deliveryInfo(settings, o.deliveryMethod),
    shippingAddress: (o.shippingAddress ?? {}) as Partial<AddressSnapshot>,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      slug: i.slug,
      purity: i.purity,
      metalColor: i.metalColor,
      diamondSummary: i.diamondSummary,
      ringSize: i.ringSize,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      art: (i.product?.art as ArtSpec | null) ?? null,
      image: i.product?.images[0]?.url ?? null,
      shape: i.diamond?.shape ?? i.product?.shapes[0] ?? 'round',
      carat: i.diamond?.carat ?? i.diamondOption?.totalCarat ?? i.product?.centerCarat ?? i.product?.totalCarat ?? 1,
    })),
    payments: o.payments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    shipments: o.shipments.map((s) => ({ ...s, shippedAt: s.shippedAt?.toISOString() ?? null, deliveredAt: s.deliveredAt?.toISOString() ?? null })),
  };
}
export type OrderView = ReturnType<typeof toOrderView>;

/** Order for its owner (account pages). Returns null for anyone else. */
export async function getOwnedOrder(orderNumber: string, userId: string) {
  const o = await db.order.findFirst({ where: { number: orderNumber, userId }, select: orderViewSelect });
  if (!o) return null;
  return toOrderView(o, await getSettings());
}

/**
 * Confirmation-page access: the signed-in owner (or the account whose email placed a
 * guest order) or the browser holding the receipt token issued at checkout.
 */
export async function getReceipt(orderNumber: string, viewer: Viewer, token?: string | null) {
  const o = await db.order.findUnique({ where: { number: orderNumber }, select: orderViewSelect });
  if (!o) return null;
  const owner = !!viewer && (o.userId === viewer.id || (!o.userId && !!viewer.email && o.email.toLowerCase() === viewer.email.toLowerCase()));
  if (!owner && !verifyReceiptToken(orderNumber, token)) return null;
  return toOrderView(o, await getSettings());
}

// ───────────────────────────── cart / wishlist / compare sync ─────────────────────────────

function toCartLine(l: PricedLine, addedAt: number): CartLine {
  return {
    key: l.key,
    productId: l.productId,
    slug: l.slug,
    name: l.name,
    sku: l.sku,
    category: l.categorySlug,
    variantId: l.variantId,
    purity: l.purity,
    metalColor: l.metalColor,
    diamond: l.diamond,
    option: l.option,
    ringSize: l.ringSize,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    art: l.art,
    shape: l.shape,
    carat: l.carat,
    image: l.image,
    addedAt,
  };
}

// Issues that make a saved line unusable (others — e.g. stock — are surfaced at checkout instead).
const HARD_ISSUES = new Set(['diamond_sold', 'duplicate_diamond']);

async function sanitizeLines(inputs: LineInput[]) {
  const { lines, issues } = await priceLines(inputs);
  const hard = new Set(issues.filter((i) => HARD_ISSUES.has(i.code)).map((i) => i.index));
  const seen = new Set<string>();
  return lines.filter((l) => {
    if (hard.has(l.index) || seen.has(l.key)) return false;
    seen.add(l.key);
    return true;
  });
}

async function activeIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true } });
  const ok = new Set(rows.map((r) => r.id));
  return [...new Set(ids)].filter((id) => ok.has(id));
}

export async function getUserState(userId: string): Promise<{ cart: CartLine[]; wishlist: ProductCard[]; compare: ProductCard[] }> {
  const [items, wish, compare] = await Promise.all([
    db.cartItem.findMany({ where: { cart: { userId } }, orderBy: { createdAt: 'asc' } }),
    db.wishlistItem.findMany({ where: { wishlist: { userId } }, orderBy: { createdAt: 'desc' }, select: { productId: true } }),
    db.compareItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { productId: true } }),
  ]);
  const added = new Map(items.map((i, n) => [n, i.createdAt.getTime()]));
  const lines = await sanitizeLines(
    items.map((i) => ({ productId: i.productId, variantId: i.variantId, diamondId: i.diamondId, diamondOptionId: i.diamondOptionId, ringSize: i.ringSize, quantity: Math.min(10, Math.max(1, i.quantity)) })),
  );
  const [wishlist, compareCards] = await Promise.all([getCardsByIds(wish.map((w) => w.productId)), getCardsByIds(compare.map((c) => c.productId).slice(0, 4))]);
  return { cart: lines.map((l) => toCartLine(l, added.get(l.index) ?? Date.now())), wishlist, compare: compareCards };
}

export async function saveUserState(userId: string, state: { cart: LineInput[]; wishlist: string[]; compare: string[] }) {
  const [lines, wishIds, compareIds] = await Promise.all([sanitizeLines(state.cart), activeIds(state.wishlist), activeIds(state.compare)]);
  const now = Date.now();
  await db.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: { updatedAt: new Date() }, select: { id: true } });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    if (lines.length)
      await tx.cartItem.createMany({
        data: lines.map((l, i) => ({
          cartId: cart.id,
          productId: l.productId,
          variantId: l.variantId,
          diamondId: l.diamondId,
          diamondOptionId: l.diamondOptionId,
          ringSize: l.ringSize,
          quantity: l.quantity,
          createdAt: new Date(now + i),
        })),
      });
    const wl = await tx.wishlist.upsert({ where: { userId }, create: { userId }, update: { updatedAt: new Date() }, select: { id: true } });
    await tx.wishlistItem.deleteMany({ where: { wishlistId: wl.id } });
    if (wishIds.length)
      await tx.wishlistItem.createMany({ data: wishIds.map((productId, i) => ({ wishlistId: wl.id, productId, createdAt: new Date(now - i) })), skipDuplicates: true });
    await tx.compareItem.deleteMany({ where: { userId } });
    if (compareIds.length)
      await tx.compareItem.createMany({ data: compareIds.slice(0, 4).map((productId, i) => ({ userId, productId, createdAt: new Date(now - i) })), skipDuplicates: true });
  });
  return { cart: lines.length, wishlist: wishIds.length, compare: Math.min(4, compareIds.length) };
}

// ───────────────────────────── returns ─────────────────────────────

const DAY = 86_400_000;
const OPEN_RETURN = new Set(['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED']);

/** Delivered orders still inside the returns window, plus the customer's existing requests. */
export async function getReturnsOverview(userId: string) {
  const settings = await getSettings();
  const [orders, requests] = await Promise.all([
    db.order.findMany({
      where: { userId, status: 'DELIVERED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        number: true,
        createdAt: true,
        updatedAt: true,
        total: true,
        items: { select: { name: true, quantity: true } },
        shipments: { select: { deliveredAt: true } },
        returns: { select: { status: true } },
      },
    }),
    db.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, reason: true, details: true, status: true, createdAt: true, updatedAt: true, order: { select: { number: true } } },
    }),
  ]);
  const now = Date.now();
  const eligible = orders
    .map((o) => {
      const delivered = o.shipments.map((s) => s.deliveredAt?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0) || o.updatedAt.getTime();
      const deadline = delivered + settings.returnsDays * DAY;
      return {
        number: o.number,
        placedAt: o.createdAt.toISOString(),
        deliveredAt: new Date(delivered).toISOString(),
        deadline: new Date(deadline).toISOString(),
        total: o.total,
        items: o.items.map((i) => `${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`),
        open: deadline >= now && !o.returns.some((r) => OPEN_RETURN.has(r.status)),
      };
    })
    .filter((o) => o.open);
  return {
    returnsDays: settings.returnsDays,
    eligible,
    requests: requests.map((r) => ({ id: r.id, orderNumber: r.order.number, reason: r.reason, details: r.details, status: r.status, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
  };
}

export async function createReturnRequest(userId: string, input: { orderNumber: string; reasonLabel: string; details: string | null }) {
  const overview = await getReturnsOverview(userId);
  const target = overview.eligible.find((o) => o.number === input.orderNumber);
  if (!target) throw new CheckoutError(`This order is not eligible for a return. Returns are accepted within ${overview.returnsDays} days of delivery.`, 409);
  const order = await db.order.findFirst({ where: { number: input.orderNumber, userId }, select: { id: true } });
  if (!order) throw new CheckoutError('Order not found.', 404);
  return db.returnRequest.create({
    data: { orderId: order.id, userId, reason: input.reasonLabel, details: input.details },
    select: { id: true, status: true, createdAt: true },
  });
}
