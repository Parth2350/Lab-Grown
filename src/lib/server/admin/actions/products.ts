'use server';
import 'server-only';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { recomputeFromPrice } from '@/lib/server/product-pricing';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { ActionError, ValidationError, adminAction, fdString, ok, parse, revalidateAdmin, zCuid, zInt, zOptFloat, zOptInt, zOptText, zSlug, zText } from '../action';
import { getProductEditorData } from '../queries/products';
import type { ActionResult, FormState } from '../types';
import { removeLocalUploads } from './product-files';
import {
  ART_BANDS,
  ART_HEADS,
  ART_KINDS,
  ART_SIZES,
  ART_STONES,
  ART_STONE_SHAPES,
  CLARITY_GRADES,
  COLOR_GRADES,
  METAL_SLUGS,
  PURITY_SLUGS,
  SETTING_SLUGS,
  SHAPE_LIST,
  STYLE_SLUGS,
  optionErrKey,
  suggestedVariantPrice,
  variantErrKey,
  variantKey,
  variantSku,
  type SaveProductResult,
} from '@/components/admin/products/shared';

// ───────────────────────────── schema ─────────────────────────────

const oneOf = (list: readonly string[], message: string) => z.string({ required_error: message, invalid_type_error: message }).refine((v) => list.includes(v), { message });

const optOneOf = (list: readonly string[], message: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), oneOf(list, message).optional());

/** Rupees (string, e.g. "1,23,400" or "₹1,23,400") → paise; required */
const zDollars = (label: string, max = 10_000_000) =>
  z
    .preprocess(
      (v) => {
        if (typeof v !== 'string') return v;
        const c = v.replace(/[$₹,\s]/g, '');
        return c === '' ? undefined : Number(c);
      },
      z
        .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` })
        .finite(`${label} must be a number`)
        .min(0, `${label} cannot be negative`)
        .max(max, `${label} is too large`),
    )
    .transform((d) => Math.round(d * 100));

/** Rupees (string) → paise | null when blank */
const zOptDollars = (label: string, max = 10_000_000) =>
  z
    .preprocess(
      (v) => {
        if (typeof v !== 'string') return v;
        const c = v.replace(/[$₹,\s]/g, '');
        return c === '' ? undefined : Number(c);
      },
      z
        .number({ invalid_type_error: `${label} must be a number` })
        .finite(`${label} must be a number`)
        .min(0, `${label} cannot be negative`)
        .max(max, `${label} is too large`)
        .optional(),
    )
    .transform((d) => (d == null ? null : Math.round(d * 100)));

const zCarat = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : typeof v === 'string' ? Number(v) : v),
    z
      .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` })
      .finite(`${label} must be a number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`),
  );

const skuField = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .toUpperCase()
    .min(2, `${label} must be at least 2 characters`)
    .max(48, `${label} must be 48 characters or fewer`)
    .regex(/^[A-Z0-9](?:[A-Z0-9._-]*[A-Z0-9])?$/, `${label} may only use letters, numbers, dots, hyphens and underscores`);

const uniq = <T,>(list: T[]) => [...new Set(list)];

const artSchema = z.object({
  kind: oneOf(ART_KINDS, 'Choose an illustration type'),
  head: optOneOf(ART_HEADS, 'Unknown head style'),
  band: optOneOf(ART_BANDS, 'Unknown band style'),
  stones: optOneOf(ART_STONES, 'Unknown stone coverage'),
  stoneShape: optOneOf(ART_STONE_SHAPES, 'Unknown stone shape'),
  size: optOneOf(ART_SIZES, 'Unknown size'),
  sides: optOneOf(ART_STONE_SHAPES, 'Unknown side-stone shape'),
  second: optOneOf(SHAPE_LIST, 'Unknown second-stone shape'),
  prongs: zOptInt('Prongs', { min: 2, max: 12 }),
  graduated: z.boolean().optional().default(false),
});

const variantSchema = z.object({
  purity: oneOf(PURITY_SLUGS, 'Unknown purity'),
  metalColor: oneOf(METAL_SLUGS, 'Unknown metal colour'),
  sku: skuField('Variant SKU'),
  price: zOptDollars('Price'),
  stock: zInt('Stock', { min: 0, max: 100_000 }),
  isActive: z.boolean(),
});

const centerSchema = z
  .object({
    id: zCuid.nullable().optional(),
    shape: oneOf(SHAPE_LIST, 'Choose a diamond shape'),
    minCarat: zCarat('Minimum carat', 0.1, 30),
    maxCarat: zCarat('Maximum carat', 0.1, 30),
  })
  .superRefine((c, ctx) => {
    if (c.maxCarat < c.minCarat) ctx.addIssue({ code: 'custom', path: ['maxCarat'], message: 'Maximum carat must be at least the minimum' });
  });

const optionSchema = z.object({
  id: zCuid.nullable().optional(),
  key: z.string().max(64).optional(),
  label: zOptText(80),
  totalCarat: zCarat('Total carat', 0.01, 100),
  color: oneOf(COLOR_GRADES, 'Choose a colour grade'),
  clarity: oneOf(CLARITY_GRADES, 'Choose a clarity grade'),
  priceDelta: zDollars('Price'),
  isDefault: z.boolean(),
});

const diamondsSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('NONE') }),
  z.object({ mode: z.literal('CENTER_STONE'), center: centerSchema }),
  z.object({ mode: z.literal('TOTAL_WEIGHT'), options: z.array(optionSchema).min(1, 'Add at least one diamond package').max(12, 'Up to 12 diamond packages') }),
]);

const productSchema = z
  .object({
    name: zText('Name', 160),
    slug: zSlug,
    sku: skuField('SKU'),
    subtitle: zOptText(200),
    categoryId: z.string({ required_error: 'Choose a category' }).trim().min(1, 'Choose a category').max(64),
    collectionIds: z.array(zCuid).max(50).transform(uniq),
    description: zText('Description', 6000),
    details: zOptText(6000),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    isTrending: z.boolean(),
    isNew: z.boolean(),
    position: zInt('Position', { min: 0, max: 100_000 }),
    metalColors: z.array(oneOf(METAL_SLUGS, 'Unknown metal colour')).min(1, 'Choose at least one metal colour').transform(uniq),
    purities: z.array(oneOf(PURITY_SLUGS, 'Unknown purity')).min(1, 'Choose at least one purity').transform(uniq),
    defaultMetalColor: z.string(),
    defaultPurity: z.string(),
    shapes: z.array(oneOf(SHAPE_LIST, 'Unknown shape')).max(SHAPE_LIST.length).transform(uniq),
    styles: z.array(oneOf(STYLE_SLUGS, 'Unknown style')).max(STYLE_SLUGS.length).transform(uniq),
    settingType: z.union([z.literal(''), oneOf(SETTING_SLUGS, 'Unknown setting type')]).transform((v) => v || null),
    centerCarat: zOptFloat('Centre carat', { min: 0.01, max: 50 }),
    totalCarat: zOptFloat('Total carat', { min: 0.01, max: 100 }),
    hasCenterStone: z.boolean(),
    requiresSize: z.boolean(),
    tags: z
      .array(z.string().trim().toLowerCase().max(40, 'Tags must be 40 characters or fewer'))
      .max(30, 'Up to 30 tags')
      .transform((t) => uniq(t.filter(Boolean))),
    basePrice: zDollars('Base price'),
    art: artSchema,
    variants: z.array(variantSchema).max(PURITY_SLUGS.length * METAL_SLUGS.length),
    diamonds: diamondsSchema,
    seoTitle: zOptText(120),
    seoDescription: zOptText(320),
  })
  .superRefine((d, ctx) => {
    if (!d.metalColors.includes(d.defaultMetalColor)) ctx.addIssue({ code: 'custom', path: ['defaultMetalColor'], message: 'Default metal must be one of the offered metal colours' });
    if (!d.purities.includes(d.defaultPurity)) ctx.addIssue({ code: 'custom', path: ['defaultPurity'], message: 'Default purity must be one of the offered purities' });
    const seen = new Map<string, number>();
    d.variants.forEach((v, i) => {
      const prev = seen.get(v.sku);
      if (prev != null) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'Each variant needs its own SKU' });
      else seen.set(v.sku, i);
    });
    if (d.diamonds.mode === 'TOTAL_WEIGHT') {
      const defaults = d.diamonds.options.filter((o) => o.isDefault).length;
      if (defaults !== 1) ctx.addIssue({ code: 'custom', path: ['diamonds', 'options'], message: 'Choose exactly one default diamond package' });
    }
  });

type ProductInput = z.output<typeof productSchema>;

// ───────────────────────────── error keys ─────────────────────────────

type RawPayload = {
  variants?: { purity?: unknown; metalColor?: unknown }[];
  diamonds?: { options?: { key?: unknown }[] };
};

/** zod paths → stable editor keys (variants by combination, packages by client key). */
function remapErrors(errors: Record<string, string>, raw: RawPayload) {
  const out: Record<string, string> = {};
  const put = (k: string, msg: string) => {
    if (!out[k]) out[k] = msg;
  };
  for (const [k, msg] of Object.entries(errors)) {
    let m: RegExpExecArray | null;
    if ((m = /^variants\.(\d+)\.(\w+)$/.exec(k))) {
      const v = Array.isArray(raw.variants) ? raw.variants[Number(m[1])] : undefined;
      if (v && typeof v.purity === 'string' && typeof v.metalColor === 'string') put(variantErrKey(v.purity, v.metalColor, m[2]), msg);
      else put('variants', msg);
    } else if ((m = /^diamonds\.options\.(\d+)\.(\w+)$/.exec(k))) {
      const o = Array.isArray(raw.diamonds?.options) ? raw.diamonds.options[Number(m[1])] : undefined;
      if (o && typeof o.key === 'string') put(optionErrKey(o.key, m[2]), msg);
      else put('options', msg);
    } else if (k.startsWith('diamonds.center.')) put(`center.${k.slice('diamonds.center.'.length)}`, msg);
    else if (k === 'diamonds.options') put('options', msg);
    else if (k.startsWith('diamonds')) put('diamondMode', msg);
    else if ((m = /^(\w+)\.\d+$/.exec(k))) put(m[1], msg);
    else put(k, msg);
  }
  return out;
}

function readPayload(fd: FormData): RawPayload & Record<string, unknown> {
  const raw = fdString(fd, 'payload');
  if (!raw || raw.length > 500_000) throw new ActionError('The form could not be read. Please reload the page and try again.');
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed as RawPayload & Record<string, unknown>;
  } catch {
    throw new ActionError('The form could not be read. Please reload the page and try again.');
  }
}

function validateProduct(raw: RawPayload & Record<string, unknown>): ProductInput {
  try {
    return parse(productSchema, raw);
  } catch (e) {
    if (e instanceof ValidationError) throw new ValidationError(e.message, remapErrors(e.fieldErrors, raw));
    throw e;
  }
}

function artJson(a: ProductInput['art']): Prisma.InputJsonObject {
  const out: Record<string, string | number | boolean> = { kind: a.kind };
  for (const k of ['head', 'band', 'stones', 'stoneShape', 'size', 'sides', 'second'] as const) {
    const v = a[k];
    if (v) out[k] = v;
  }
  if (a.prongs != null) out.prongs = a.prongs;
  if (a.graduated) out.graduated = true;
  return out;
}

const fail = (fieldErrors: Record<string, string>): never => {
  const first = Object.values(fieldErrors)[0] ?? 'Please check the form';
  throw new ValidationError(`Please check the form — ${first.charAt(0).toLowerCase()}${first.slice(1)}`, fieldErrors);
};

// ───────────────────────────── save ─────────────────────────────

export async function saveProduct(_prev: FormState<SaveProductResult>, fd: FormData): Promise<FormState<SaveProductResult>> {
  return adminAction<SaveProductResult>(async () => {
    const rawId = fdString(fd, 'id');
    const id = rawId ? parse(zCuid, rawId) : null;
    const raw = readPayload(fd);
    const d = validateProduct(raw);

    // Only purity × metal combinations that are offered are saved (server decides, not the client).
    const offered = new Set(d.purities.flatMap((p) => d.metalColors.map((m) => variantKey(p, m))));
    const sent = new Map(d.variants.filter((v) => offered.has(variantKey(v.purity, v.metalColor))).map((v) => [variantKey(v.purity, v.metalColor), v]));

    // ── referential + uniqueness checks (friendly field errors before touching the DB) ──
    const [existing, category, collections, slugTaken, skuTaken, existingVariants] = await Promise.all([
      id ? db.product.findUnique({ where: { id }, select: { id: true } }) : Promise.resolve(null),
      db.category.findUnique({ where: { id: d.categoryId }, select: { id: true } }),
      d.collectionIds.length ? db.collection.findMany({ where: { id: { in: d.collectionIds } }, select: { id: true } }) : Promise.resolve([]),
      db.product.findFirst({ where: { slug: d.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } }),
      db.product.findFirst({ where: { sku: d.sku, ...(id ? { NOT: { id } } : {}) }, select: { id: true } }),
      id
        ? db.productVariant.findMany({
            where: { productId: id },
            select: { id: true, purity: true, metalColor: true, sku: true, price: true, stock: true, isActive: true, _count: { select: { orderItems: true, cartItems: true } } },
          })
        : Promise.resolve([]),
    ]);
    if (id && !existing) throw new ActionError('This product no longer exists — it may have been deleted.');

    const errors: Record<string, string> = {};
    if (!category) errors.categoryId = 'Choose a category';
    if (collections.length !== d.collectionIds.length) errors.collectionIds = 'One of the selected collections no longer exists';
    if (slugTaken) errors.slug = 'That slug is already used by another product';
    if (skuTaken) errors.sku = 'That SKU is already used by another product';

    const existingByCombo = new Map(existingVariants.map((v) => [variantKey(v.purity, v.metalColor), v]));
    // Every offered combination gets a row: the submitted values, else the saved ones, else server defaults
    // (auto SKU, price suggested from the base price, stock 10). Blank prices are filled the same way.
    const wanted = d.purities.flatMap((purity) =>
      d.metalColors.map((metalColor) => {
        const key = variantKey(purity, metalColor);
        const v = sent.get(key);
        const cur = existingByCombo.get(key);
        return {
          purity,
          metalColor,
          sku: v?.sku ?? cur?.sku ?? variantSku(d.sku, purity, metalColor),
          price: v?.price ?? cur?.price ?? suggestedVariantPrice(d.basePrice, purity, metalColor),
          stock: v?.stock ?? cur?.stock ?? 10,
          isActive: v?.isActive ?? cur?.isActive ?? true,
        };
      }),
    );
    const orphans = existingVariants.filter((v) => !offered.has(variantKey(v.purity, v.metalColor)));
    const keptOrphans = orphans.filter((v) => v._count.orderItems + v._count.cartItems > 0);
    const droppedOrphans = orphans.filter((v) => v._count.orderItems + v._count.cartItems === 0);
    const reserved = new Set(keptOrphans.map((v) => v.sku));

    const skuClash = await db.productVariant.findMany({
      where: { sku: { in: wanted.map((v) => v.sku) }, ...(id ? { productId: { not: id } } : {}) },
      select: { sku: true },
    });
    const clashing = new Set(skuClash.map((s) => s.sku));
    for (const v of wanted) {
      if (clashing.has(v.sku)) errors[variantErrKey(v.purity, v.metalColor, 'sku')] = 'This SKU is already used by another product';
      else if (reserved.has(v.sku)) errors[variantErrKey(v.purity, v.metalColor, 'sku')] = 'This SKU belongs to a retired variant that is kept for order history';
    }
    if (Object.keys(errors).length) fail(errors);

    const diamonds = d.diamonds;
    const hasCenterStone = diamonds.mode === 'CENTER_STONE' ? true : d.hasCenterStone;
    const scalar = {
      name: d.name,
      slug: d.slug,
      sku: d.sku,
      subtitle: d.subtitle,
      description: d.description,
      details: d.details,
      categoryId: d.categoryId,
      basePrice: d.basePrice,
      metalColors: d.metalColors,
      purities: d.purities,
      defaultMetalColor: d.defaultMetalColor,
      defaultPurity: d.defaultPurity,
      shapes: d.shapes,
      centerCarat: d.centerCarat,
      totalCarat: d.totalCarat,
      caratSort: d.centerCarat ?? d.totalCarat ?? 0,
      settingType: d.settingType,
      styles: d.styles,
      tags: d.tags,
      hasCenterStone,
      requiresSize: d.requiresSize,
      art: artJson(d.art),
      isActive: d.isActive,
      isFeatured: d.isFeatured,
      isTrending: d.isTrending,
      isNew: d.isNew,
      position: d.position,
      seoTitle: d.seoTitle,
      seoDescription: d.seoDescription,
    } satisfies Prisma.ProductUncheckedUpdateInput;

    type OptionRow = {
      id: string | null;
      data: {
        kind: 'CENTER_STONE' | 'TOTAL_WEIGHT';
        shape: string | null;
        minCarat: number | null;
        maxCarat: number | null;
        label: string | null;
        totalCarat: number | null;
        color: string | null;
        clarity: string | null;
        priceDelta: number;
        isDefault: boolean;
        position: number;
      };
    };
    const optionRows: OptionRow[] =
      diamonds.mode === 'CENTER_STONE'
        ? [
            {
              id: diamonds.center.id ?? null,
              data: {
                kind: 'CENTER_STONE',
                shape: diamonds.center.shape,
                minCarat: diamonds.center.minCarat,
                maxCarat: diamonds.center.maxCarat,
                label: null,
                totalCarat: null,
                color: null,
                clarity: null,
                priceDelta: 0,
                isDefault: true,
                position: 0,
              },
            },
          ]
        : diamonds.mode === 'TOTAL_WEIGHT'
          ? diamonds.options.map((o, i) => ({
              id: o.id ?? null,
              data: {
                kind: 'TOTAL_WEIGHT',
                shape: null,
                minCarat: null,
                maxCarat: null,
                label: o.label ?? `${o.totalCarat.toFixed(2)} ct total weight`,
                totalCarat: o.totalCarat,
                color: o.color,
                clarity: o.clarity,
                priceDelta: o.priceDelta,
                isDefault: o.isDefault,
                position: i,
              },
            }))
          : [];

    const productId = await db.$transaction(
      async (tx) => {
        let pid: string;
        if (id) {
          await tx.product.update({ where: { id }, data: { ...scalar, collections: { set: d.collectionIds.map((cid) => ({ id: cid })) } } });
          pid = id;
        } else {
          const created = await tx.product.create({
            data: { ...scalar, fromPrice: 0, collections: { connect: d.collectionIds.map((cid) => ({ id: cid })) } },
            select: { id: true },
          });
          pid = created.id;
        }

        // ── variants ──
        if (droppedOrphans.length) await tx.productVariant.deleteMany({ where: { id: { in: droppedOrphans.map((v) => v.id) }, productId: pid } });
        if (keptOrphans.length) await tx.productVariant.updateMany({ where: { id: { in: keptOrphans.map((v) => v.id) }, productId: pid }, data: { isActive: false } });
        // Park changed SKUs first so swapping SKUs between variants can't trip the unique index.
        for (const v of wanted) {
          const cur = existingByCombo.get(variantKey(v.purity, v.metalColor));
          if (cur && cur.sku !== v.sku) await tx.productVariant.update({ where: { id: cur.id }, data: { sku: `~${cur.id}` } });
        }
        for (const v of wanted) {
          const cur = existingByCombo.get(variantKey(v.purity, v.metalColor));
          const data = { sku: v.sku, price: v.price, stock: v.stock, isActive: v.isActive };
          if (cur) await tx.productVariant.update({ where: { id: cur.id }, data });
          else await tx.productVariant.create({ data: { ...data, productId: pid, purity: v.purity, metalColor: v.metalColor } });
        }

        // ── diamond options: update rows that still exist (carts keep their option), replace the rest ──
        const currentOptions = await tx.productDiamondOption.findMany({ where: { productId: pid }, select: { id: true, kind: true } });
        const kindById = new Map(currentOptions.map((o) => [o.id, o.kind]));
        const reuse = new Set(optionRows.filter((r) => r.id && kindById.get(r.id) === r.data.kind).map((r) => r.id as string));
        await tx.productDiamondOption.deleteMany({ where: { productId: pid, id: { notIn: [...reuse] } } });
        for (const r of optionRows) {
          if (r.id && reuse.has(r.id)) await tx.productDiamondOption.update({ where: { id: r.id }, data: r.data });
          else await tx.productDiamondOption.create({ data: { ...r.data, productId: pid } });
        }
        return pid;
      },
      { timeout: 20_000, maxWait: 10_000 },
    );

    await recomputeFromPrice(productId);
    await revalidateCatalog();
    revalidateAdmin();
    const editor = await getProductEditorData(productId);
    const notes: string[] = [];
    if (keptOrphans.length) notes.push(`${keptOrphans.length} retired variant${keptOrphans.length === 1 ? ' was' : 's were'} deactivated to preserve order history`);
    return ok(`${id ? 'Saved' : 'Created'} ${d.name}${notes.length ? ` — ${notes.join('; ')}` : ''}`, { id: productId, created: !id, editor });
  });
}

// ───────────────────────────── list actions ─────────────────────────────

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.product.update({ where: { id: parse(zCuid, id) }, data: { isActive: parse(z.boolean(), isActive) }, select: { name: true, isActive: true } });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`${row.name} is now ${row.isActive ? 'live on the store' : 'hidden from the store'}`);
  });
}

function copyCandidate(base: string, n: number, sep: string, word: string) {
  return n === 1 ? `${base}${sep}${word}` : `${base}${sep}${word}${sep}${n}`;
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  return adminAction(async () => {
    const src = await db.product.findUnique({
      where: { id: parse(zCuid, id) },
      include: { variants: true, diamondOptions: { orderBy: { position: 'asc' } }, collections: { select: { id: true } } },
    });
    if (!src) throw new ActionError('This product no longer exists.');

    const rebaseSku = (sku: string, newBase: string, purity: string, metal: string) => (sku.startsWith(src.sku) ? `${newBase}${sku.slice(src.sku.length)}` : variantSku(newBase, purity, metal));

    let slug = '';
    let sku = '';
    for (let n = 1; n <= 50 && !slug; n++) {
      const s = copyCandidate(src.slug, n, '-', 'copy').slice(0, 120);
      const k = copyCandidate(src.sku, n, '-', 'COPY').slice(0, 48);
      const vSkus = src.variants.map((v) => rebaseSku(v.sku, k, v.purity, v.metalColor));
      const [slugUsed, skuUsed, vUsed] = await Promise.all([
        db.product.count({ where: { slug: s } }),
        db.product.count({ where: { sku: k } }),
        vSkus.length ? db.productVariant.count({ where: { sku: { in: vSkus } } }) : Promise.resolve(0),
      ]);
      if (!slugUsed && !skuUsed && !vUsed) {
        slug = s;
        sku = k;
      }
    }
    if (!slug) throw new ActionError('Could not find a free slug for the copy. Please rename some earlier copies first.');

    const copy = await db.product.create({
      data: {
        slug,
        sku,
        name: `Copy of ${src.name}`.slice(0, 160),
        subtitle: src.subtitle,
        description: src.description,
        details: src.details,
        categoryId: src.categoryId,
        collections: { connect: src.collections.map((c) => ({ id: c.id })) },
        basePrice: src.basePrice,
        fromPrice: src.fromPrice,
        metalColors: src.metalColors,
        purities: src.purities,
        defaultMetalColor: src.defaultMetalColor,
        defaultPurity: src.defaultPurity,
        shapes: src.shapes,
        centerCarat: src.centerCarat,
        totalCarat: src.totalCarat,
        caratSort: src.caratSort,
        settingType: src.settingType,
        styles: src.styles,
        tags: src.tags,
        hasCenterStone: src.hasCenterStone,
        requiresSize: src.requiresSize,
        art: (src.art ?? undefined) as Prisma.InputJsonValue | undefined,
        isActive: false,
        isFeatured: src.isFeatured,
        isTrending: src.isTrending,
        isNew: src.isNew,
        position: src.position,
        seoTitle: src.seoTitle,
        seoDescription: src.seoDescription,
        variants: {
          create: src.variants.map((v) => ({ sku: rebaseSku(v.sku, sku, v.purity, v.metalColor), purity: v.purity, metalColor: v.metalColor, price: v.price, stock: v.stock, isActive: v.isActive })),
        },
        diamondOptions: {
          create: src.diamondOptions.map((o) => ({
            kind: o.kind,
            shape: o.shape,
            minCarat: o.minCarat,
            maxCarat: o.maxCarat,
            label: o.label,
            totalCarat: o.totalCarat,
            color: o.color,
            clarity: o.clarity,
            priceDelta: o.priceDelta,
            isDefault: o.isDefault,
            position: o.position,
          })),
        },
      },
      select: { id: true, name: true },
    });
    await recomputeFromPrice(copy.id);
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`Created “${copy.name}” — it stays hidden until you activate it`, { id: copy.id });
  });
}

export async function deleteProduct(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  return adminAction<{ deleted: boolean }>(async () => {
    const product = await db.product.findUnique({
      where: { id: parse(zCuid, id) },
      select: { id: true, name: true, isActive: true, images: { select: { url: true } }, _count: { select: { orderItems: true } } },
    });
    if (!product) throw new ActionError('This product no longer exists.');

    if (product._count.orderItems > 0) {
      await db.product.update({ where: { id: product.id }, data: { isActive: false } });
      await revalidateCatalog();
      revalidateAdmin();
      const n = product._count.orderItems;
      return ok(`${product.name} appears on ${n} order line${n === 1 ? '' : 's'}, so it was hidden from the store instead of deleted.`, { deleted: false });
    }

    await db.product.delete({ where: { id: product.id } });
    await removeLocalUploads(product.images.map((i) => i.url));
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`${product.name} deleted`, { deleted: true });
  });
}

// ───────────────────────────── editor helpers ─────────────────────────────

const eligibleSchema = z.object({
  shape: oneOf(SHAPE_LIST, 'Unknown shape'),
  min: z.number().finite().min(0).max(100),
  max: z.number().finite().min(0).max(100),
});

/** Live count of available loose diamonds that fit a centre-stone setting. */
export async function countEligibleDiamonds(shape: string, min: number, max: number): Promise<ActionResult<{ count: number; cheapestPrice: number | null }>> {
  return adminAction(async () => {
    const q = parse(eligibleSchema, { shape, min, max });
    if (q.max < q.min) return ok(undefined, { count: 0, cheapestPrice: null });
    const agg = await db.diamond.aggregate({
      where: { shape: q.shape, isAvailable: true, carat: { gte: q.min - 1e-6, lte: q.max + 1e-6 } },
      _count: { _all: true },
      _min: { price: true },
    });
    return ok(undefined, { count: agg._count._all, cheapestPrice: agg._min.price ?? null });
  });
}
