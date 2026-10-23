/**
 * Seeds a complete demo store: catalog, certified diamond inventory, customers,
 * orders, reviews, coupons, bespoke requests, partner applications and settings.
 *
 *   npm run db:seed
 *
 * Demo logins for LOCAL development (production seeds use SEED_ADMIN_PASSWORD instead):
 *   Admin    → admin@aurevia.example / Aurevia@Admin1
 *   Customer → demo@aurevia.example  / Aurevia@Demo1
 */
import { PrismaClient, type OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { CATEGORIES, COLLECTIONS, PRODUCTS, REVIEW_POOL, REVIEWERS, FIRST_NAMES, LAST_NAMES, CITIES, type SeedProduct } from './data/catalog';
import { QUIZ_SLUG } from '../src/config/quiz';
import { DEFAULT_SETTINGS, computeTotals } from '../src/lib/pricing';

const prisma = new PrismaClient();

// Deterministic PRNG so every seed produces the same store
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20101);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));

const PURITY_MULT: Record<string, number> = { '9K': 1, '10K': 1.08, '14K': 1.32, '18K': 1.68 };
const CAT_CODE: Record<string, string> = {
  'engagement-rings': 'ER',
  'wedding-bands': 'WB',
  rings: 'RG',
  earrings: 'EA',
  pendants: 'PD',
  necklaces: 'NK',
  bracelets: 'BR',
};
const RING_CATS = new Set(['engagement-rings', 'wedding-bands', 'rings']);

/** Catalogue prices are authored in US dollars and sold in rupees: $1,298.40 → ₹1,23,300 (paise, nearest ₹100) */
const USD_TO_INR = 95;
const retail = (dollars: number) => Math.max(1, Math.round((dollars * USD_TO_INR) / 100)) * 10000;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ───────────────────────────── diamonds ─────────────────────────────

const SHAPES = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'marquise', 'radiant', 'asscher', 'heart'];
const COLORS = ['D', 'E', 'F', 'G', 'H'];
const CLARITIES = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1'];
const CUTS = ['Ideal', 'Excellent', 'Very Good'];
const COLOR_F: Record<string, number> = { D: 1.22, E: 1.14, F: 1.07, G: 1, H: 0.93 };
const CLARITY_F: Record<string, number> = { IF: 1.28, VVS1: 1.18, VVS2: 1.11, VS1: 1.05, VS2: 1, SI1: 0.88 };
const CUT_F: Record<string, number> = { Ideal: 1.08, Excellent: 1, 'Very Good': 0.92 };
const RATIO: Record<string, [number, number]> = {
  round: [1, 1.01], oval: [1.33, 1.45], princess: [1, 1.04], cushion: [1.0, 1.15], emerald: [1.38, 1.5],
  pear: [1.5, 1.65], marquise: [1.9, 2.1], radiant: [1.15, 1.3], asscher: [1, 1.04], heart: [0.92, 1.0],
};
const CARAT_BANDS: [number, number, number][] = [
  [0.3, 0.6, 5], [0.6, 0.95, 4], [1.0, 1.3, 6], [1.3, 1.75, 5], [1.75, 2.3, 6], [2.3, 2.8, 4], [2.8, 3.4, 4], [3.4, 4.3, 3],
];

function diamondPriceDollars(shape: string, carat: number, color: string, clarity: string, cut: string) {
  const shapeF = shape === 'round' ? 1.1 : shape === 'heart' || shape === 'asscher' ? 0.97 : 1;
  return (120 + 420 * carat ** 1.65) * COLOR_F[color] * CLARITY_F[clarity] * CUT_F[cut] * shapeF;
}

function buildDiamonds() {
  const list: {
    id: string; sku: string; shape: string; carat: number; color: string; clarity: string; cut: string; polish: string; symmetry: string;
    fluorescence: string; measurements: string; tablePct: number; depthPct: number; ratio: number; growth: string; price: number;
  }[] = [];
  const certs: { id: string; diamondId: string; lab: string; number: string; issuedAt: Date }[] = [];
  let n = 1;
  for (const shape of SHAPES) {
    for (const [min, max, count] of CARAT_BANDS) {
      for (let i = 0; i < count; i++) {
        const carat = Math.round(between(min, max) * 100) / 100;
        const color = pick(COLORS);
        const clarity = pick(CLARITIES);
        const cut = shape === 'round' ? pick(['Ideal', 'Ideal', 'Excellent']) : pick(CUTS);
        const ratio = Math.round(between(...RATIO[shape]) * 100) / 100;
        const width = Math.cbrt(carat) * 6.4 / Math.sqrt(ratio);
        const length = width * ratio;
        const depth = width * between(0.6, 0.66);
        const id = randomUUID();
        const lab = rand() < 0.78 ? 'IGI' : 'GIA';
        list.push({
          id,
          sku: `LGD-${String(n).padStart(5, '0')}`,
          shape,
          carat,
          color,
          clarity,
          cut,
          polish: pick(['Excellent', 'Excellent', 'Very Good']),
          symmetry: pick(['Excellent', 'Excellent', 'Very Good']),
          fluorescence: pick(['None', 'None', 'None', 'Faint']),
          measurements: `${length.toFixed(2)} × ${width.toFixed(2)} × ${depth.toFixed(2)} mm`,
          tablePct: Math.round(between(55, 64) * 10) / 10,
          depthPct: Math.round(between(60, 66) * 10) / 10,
          ratio,
          growth: rand() < 0.7 ? 'CVD' : 'HPHT',
          price: retail(diamondPriceDollars(shape, carat, color, clarity, cut)),
        });
        certs.push({
          id: randomUUID(),
          diamondId: id,
          lab,
          number: lab === 'IGI' ? `LG${int(500000000, 699999999)}` : `${int(1000000000, 9999999999)}`,
          issuedAt: new Date(Date.now() - int(20, 400) * 86400000),
        });
        n++;
      }
    }
  }
  return { list, certs };
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
  console.log('Clearing existing data …');
  await prisma.$transaction([
    prisma.recommendationAnswer.deleteMany(),
    prisma.recommendationQuiz.deleteMany(),
    prisma.returnRequest.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.compareItem.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productDiamondOption.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.category.deleteMany(),
    prisma.diamondCertificate.deleteMany(),
    prisma.diamond.deleteMany(),
    prisma.metalOption.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.bespokeRequest.deleteMany(),
    prisma.partnerApplication.deleteMany(),
    prisma.contactMessage.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  console.log('Settings, metals, categories, collections …');
  await prisma.setting.create({ data: { key: 'store', value: DEFAULT_SETTINGS as object } });
  await prisma.metalOption.createMany({
    data: [
      { kind: 'PURITY', code: '9K', label: '9K Gold', description: '37.5% pure gold — durable everyday wear', priceMultiplier: 1, position: 0 },
      { kind: 'PURITY', code: '10K', label: '10K Gold', description: '41.7% pure gold', priceMultiplier: 1.08, position: 1 },
      { kind: 'PURITY', code: '14K', label: '14K Gold', description: '58.5% pure gold — our most popular', priceMultiplier: 1.32, position: 2 },
      { kind: 'PURITY', code: '18K', label: '18K Gold', description: '75% pure gold — richest colour', priceMultiplier: 1.68, position: 3 },
      { kind: 'COLOR', code: 'yellow', label: 'Yellow Gold', position: 0 },
      { kind: 'COLOR', code: 'white', label: 'White Gold', position: 1 },
      { kind: 'COLOR', code: 'rose', label: 'Rose Gold', position: 2 },
      { kind: 'COLOR', code: 'yellow-white', label: 'Yellow & White Gold', priceMultiplier: 1.05, position: 3 },
      { kind: 'COLOR', code: 'rose-white', label: 'Rose & White Gold', priceMultiplier: 1.05, position: 4 },
    ],
  });

  const catIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        position: i,
        seoTitle: `Lab-Grown Diamond ${c.name}`,
        seoDescription: c.description.slice(0, 155),
      },
    });
    catIds[c.slug] = row.id;
  }
  for (const [i, c] of COLLECTIONS.entries()) {
    await prisma.collection.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        isFeatured: !!c.featured,
        position: i,
        seoTitle: `${c.name} Lab-Grown Diamond Jewelry`,
        seoDescription: c.description,
      },
    });
  }

  console.log('Diamond inventory …');
  const { list: diamonds, certs } = buildDiamonds();
  await prisma.diamond.createMany({ data: diamonds });
  await prisma.diamondCertificate.createMany({ data: certs });

  console.log('Products …');
  const counters: Record<string, number> = {};
  const created: { id: string; slug: string; name: string; sku: string; cat: string; centerShape?: string; minCt?: number; maxCt?: number; hasCenter: boolean }[] = [];
  const now = Date.now();

  for (const [index, p] of PRODUCTS.entries()) {
    const code = CAT_CODE[p.cat];
    counters[code] = (counters[code] ?? 1000) + 1;
    const sku = `TVJ-${code}-${counters[code]}`;
    const slug = slugify(p.name);
    const metals = p.metals ?? ['yellow', 'white', 'rose'];
    const purities = p.purities ?? ['9K', '10K', '14K', '18K'];
    const hasCenter = p.center != null && !p.options;
    const shape = p.shapes[0];

    const variants = purities.flatMap((purity) =>
      metals.map((metal) => ({
        sku: `${sku}-${purity}-${metal.toUpperCase().replace('-', '')}`,
        purity,
        metalColor: metal,
        price: retail(p.base * PURITY_MULT[purity] * (metal.includes('-') ? 1.05 : 1)),
        stock: rand() < 0.08 ? int(0, 2) : int(4, 18),
      })),
    );
    const minVariant = Math.min(...variants.map((v) => v.price));

    let minCt: number | undefined;
    let maxCt: number | undefined;
    let fromPrice = minVariant;
    const optionRows: {
      kind: 'CENTER_STONE' | 'TOTAL_WEIGHT'; shape?: string; minCarat?: number; maxCarat?: number; label?: string; totalCarat?: number;
      color?: string; clarity?: string; priceDelta: number; isDefault: boolean; position: number;
    }[] = [];

    if (hasCenter) {
      minCt = Math.max(0.3, Math.round(((p.center ?? 1) - 0.5) * 100) / 100);
      maxCt = Math.round(((p.center ?? 1) + 1.3) * 100) / 100;
      const eligible = diamonds.filter((d) => d.shape === shape && d.carat >= minCt! && d.carat <= maxCt!);
      fromPrice += Math.min(...eligible.map((d) => d.price));
      optionRows.push({ kind: 'CENTER_STONE', shape, minCarat: minCt, maxCarat: maxCt, priceDelta: 0, isDefault: true, position: 0 });
    } else if (p.options?.length) {
      const defIdx = p.options.length > 2 ? 1 : 0;
      p.options.forEach((o, i) =>
        optionRows.push({
          kind: 'TOTAL_WEIGHT',
          label: `${o.tw.toFixed(2)} ct total weight`,
          totalCarat: o.tw,
          color: o.color ?? (o.tw >= 2 ? 'F' : 'G'),
          clarity: o.clarity ?? 'VS1',
          priceDelta: retail(o.delta),
          isDefault: i === defIdx,
          position: i,
        }),
      );
      fromPrice += Math.min(...optionRows.map((o) => o.priceDelta));
    }

    const totalCarat = hasCenter ? p.total ?? p.center : p.options?.[p.options.length > 2 ? 1 : 0]?.tw ?? p.total;
    const centerCarat = hasCenter ? p.center : undefined;
    const defaultMetal = metals[0];
    const shapeLabel = shape ? shape[0].toUpperCase() + shape.slice(1) : '';
    const catName = CATEGORIES.find((c) => c.slug === p.cat)!.name;
    const description = `${p.note} ${
      hasCenter
        ? `Choose your own certified ${shapeLabel.toLowerCase()} lab-grown diamond from our hand-selected inventory, then select your gold colour and purity.`
        : p.options?.length
          ? `Available in several total carat weights, each set with ${p.options.some((o) => o.tw >= 2) ? 'F colour' : 'G colour'}, VS1+ clarity lab-grown diamonds.`
          : 'Crafted in solid gold and hand-polished to a mirror finish.'
    } Made to order in our own workshop and delivered with complimentary insured shipping.`;

    const prod = await prisma.product.create({
      data: {
        slug,
        sku,
        name: p.name,
        subtitle: p.styles.map((s) => s.replace(/-/g, ' ')).join(' · '),
        description,
        details:
          'Every piece is cast in recycled solid gold, hand-set by master setters and inspected under 10× magnification before it leaves our workshop. Diamonds are lab-grown, physically and chemically identical to mined diamonds, and independently graded.',
        categoryId: catIds[p.cat],
        collections: { connect: (p.coll ?? []).map((s) => ({ slug: s })) },
        basePrice: retail(p.base),
        fromPrice,
        metalColors: metals,
        purities,
        defaultMetalColor: defaultMetal,
        defaultPurity: purities.includes('14K') ? '14K' : purities[0],
        shapes: p.shapes,
        centerCarat,
        totalCarat,
        caratSort: centerCarat ?? totalCarat ?? 0,
        settingType: p.setting,
        styles: p.styles,
        tags: [...p.styles, ...p.shapes, p.cat],
        hasCenterStone: hasCenter,
        requiresSize: RING_CATS.has(p.cat),
        art: p.art as object,
        isFeatured: !!p.flags?.includes('featured'),
        isTrending: !!p.flags?.includes('trending'),
        isNew: !!p.flags?.includes('new'),
        position: index,
        seoTitle: `${p.name} | Lab-Grown Diamond ${catName}`,
        seoDescription: p.note.slice(0, 155),
        createdAt: new Date(now - (PRODUCTS.length - index) * 86400000 * (p.flags?.includes('new') ? 0.2 : 3)),
        variants: { create: variants },
        diamondOptions: { create: optionRows },
      },
    });
    created.push({ id: prod.id, slug, name: p.name, sku, cat: p.cat, centerShape: hasCenter ? shape : undefined, minCt, maxCt, hasCenter });
  }

  console.log('Users …');
  // Production seeds pass SEED_ADMIN_PASSWORD (a secret); the demo customer then gets an
  // unguessable password unless SEED_DEMO_PASSWORD is also provided.
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@aurevia.example').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Aurevia@Admin1';
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? (process.env.SEED_ADMIN_PASSWORD ? randomUUID() : 'Aurevia@Demo1');
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const demoHash = await bcrypt.hash(demoPassword, 10);
  await prisma.user.create({ data: { name: 'Store Admin', email: adminEmail, passwordHash: adminHash, role: 'ADMIN' } });
  const demo = await prisma.user.create({
    data: {
      name: 'Riya Kapoor',
      email: 'demo@aurevia.example',
      phone: '+91 98200 12345',
      passwordHash: demoHash,
      addresses: {
        create: [
          { label: 'Home', firstName: 'Riya', lastName: 'Kapoor', phone: '+91 98200 12345', line1: '21 Marine Drive', line2: 'Apartment 7B', city: 'Mumbai', state: 'Maharashtra', postalCode: '400020', country: 'India', isDefault: true },
          { label: 'Office', firstName: 'Riya', lastName: 'Kapoor', phone: '+91 98200 12345', line1: '4th Floor, Nariman Point Tower', city: 'Mumbai', state: 'Maharashtra', postalCode: '400021', country: 'India' },
        ],
      },
    },
  });
  const customers = [demo];
  for (let i = 0; i < 34; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = pick(LAST_NAMES);
    const city = pick(CITIES);
    customers.push(
      await prisma.user.create({
        data: {
          name: `${first} ${last}`,
          email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
          phone: `+1 555 01${String(10 + i).padStart(2, '0')}`,
          createdAt: new Date(now - int(5, 240) * 86400000),
          addresses: {
            create: [{ firstName: first, lastName: last, phone: '+1 555 0100', line1: `${int(1, 250)} ${pick(['Park', 'Hill', 'Lake', 'Rose', 'Oak'])} Avenue`, city: city.city, state: city.state, postalCode: city.postal, country: city.country, isDefault: true }],
          },
        },
      }),
    );
  }

  console.log('Reviews …');
  for (const p of created) {
    const count = int(0, 7);
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = pick(REVIEW_POOL);
      const [author, location] = pick(REVIEWERS);
      sum += r.rating;
      await prisma.review.create({
        data: {
          productId: p.id,
          authorName: author,
          location,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: 'APPROVED',
          isVerified: rand() < 0.85,
          createdAt: new Date(now - int(3, 300) * 86400000),
        },
      });
    }
    await prisma.product.update({ where: { id: p.id }, data: { rating: count ? Math.round((sum / count) * 10) / 10 : 0, reviewCount: count } });
  }
  // a couple waiting for moderation
  await prisma.review.createMany({
    data: [
      { productId: created[0].id, authorName: 'Megan P.', location: 'Boston, US', rating: 5, title: 'Obsessed', body: 'Cannot stop staring at it. The hidden halo is such a lovely surprise detail.', status: 'PENDING' },
      { productId: created[1].id, authorName: 'Arnav D.', location: 'Pune, IN', rating: 4, title: 'Great ring', body: 'Beautiful ring, the box could be a little sturdier for travel.', status: 'PENDING' },
    ],
  });

  console.log('Orders, payments & shipments …');
  const statuses: OrderStatus[] = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'SHIPPED', 'SHIPPED', 'PROCESSING', 'PAID', 'PENDING', 'CANCELLED'];
  const allVariants = await prisma.productVariant.findMany({ select: { id: true, productId: true, purity: true, metalColor: true, price: true, sku: true } });
  const allOptions = await prisma.productDiamondOption.findMany();
  const methods = ['upi', 'card', 'netbanking', 'wallet'];
  for (let i = 0; i < 72; i++) {
    const customer = i < 4 ? demo : pick(customers);
    const daysAgo = i < 4 ? int(4, 120) : Math.floor(rand() ** 1.4 * 180);
    const createdAt = new Date(now - daysAgo * 86400000 - int(0, 80000) * 1000);
    const lineCount = rand() < 0.75 ? 1 : 2;
    const items = [];
    for (let l = 0; l < lineCount; l++) {
      const p = pick(created);
      const vs = allVariants.filter((v) => v.productId === p.id);
      const v = pick(vs);
      let diamondPrice = 0;
      let diamondId: string | undefined;
      let diamondOptionId: string | undefined;
      let diamondSummary: string | undefined;
      if (p.hasCenter) {
        const d = pick(diamonds.filter((x) => x.shape === p.centerShape && x.carat >= p.minCt! && x.carat <= p.maxCt!));
        diamondPrice = d.price;
        diamondId = d.id;
        diamondSummary = `${d.carat.toFixed(2)} ct ${d.shape} · ${d.color} · ${d.clarity} · ${d.cut}`;
      } else {
        const opts = allOptions.filter((o) => o.productId === p.id);
        if (opts.length) {
          const o = pick(opts);
          diamondPrice = o.priceDelta;
          diamondOptionId = o.id;
          diamondSummary = o.label ?? undefined;
        }
      }
      const qty = rand() < 0.9 ? 1 : 2;
      const unitPrice = v.price + diamondPrice;
      items.push({
        productId: p.id, variantId: v.id, diamondId, diamondOptionId, name: p.name, sku: v.sku, slug: p.slug, purity: v.purity, metalColor: v.metalColor,
        diamondSummary, ringSize: RING_CATS.has(p.cat) ? pick(['5', '5.5', '6', '6.5', '7', '7.5']) : undefined, quantity: qty, unitPrice, lineTotal: unitPrice * qty,
      });
    }
    const method = pick(DEFAULT_SETTINGS.shippingMethods);
    const coupon = rand() < 0.15 ? 'WELCOME10' : undefined;
    const sub = items.reduce((s, it) => s + it.lineTotal, 0);
    const totals = computeTotals({ lines: items.map((it) => ({ unitPrice: it.unitPrice, quantity: it.quantity })), shippingPrice: method.price, discount: coupon ? Math.round(sub * 0.1) : 0, taxRate: DEFAULT_SETTINGS.taxRate });
    const status = daysAgo > 20 ? (rand() < 0.93 ? 'DELIVERED' : pick(['CANCELLED', 'REFUNDED'] as OrderStatus[])) : pick(statuses);
    const addr = await prisma.address.findFirst({ where: { userId: customer.id } });
    const paid = status !== 'PENDING' && status !== 'CANCELLED';
    await prisma.order.create({
      data: {
        number: `TVJ-${100100 + i}`,
        userId: customer.id,
        email: customer.email,
        phone: customer.phone,
        customerName: customer.name ?? 'Customer',
        shippingAddress: addr ? { firstName: addr.firstName, lastName: addr.lastName, line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, phone: addr.phone } : {},
        deliveryMethod: method.id,
        status,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        couponCode: coupon,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        payments: {
          create: [{ provider: 'razorpay', method: pick(methods), amount: totals.total, status: paid ? (status === 'REFUNDED' ? 'REFUNDED' : 'CAPTURED') : status === 'CANCELLED' ? 'FAILED' : 'PENDING', providerOrderId: `order_demo${i}`, providerPaymentId: paid ? `pay_demo${i}` : null, createdAt }],
        },
        shipments:
          status === 'SHIPPED' || status === 'DELIVERED'
            ? {
                create: [{
                  carrier: pick(['BlueDart Insured', 'FedEx Priority', 'DHL Express', 'Malca-Amit']), method: method.id, trackingNumber: `TRK${int(10000000, 99999999)}`,
                  status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT', shippedAt: new Date(createdAt.getTime() + 4 * 86400000),
                  deliveredAt: status === 'DELIVERED' ? new Date(createdAt.getTime() + 9 * 86400000) : null,
                }],
              }
            : undefined,
      },
    });
  }

  console.log('Coupons, requests, applications, messages, quiz …');
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', description: '10% off your first order', type: 'PERCENT', value: 10, minSubtotal: 0, usedCount: 11 },
      { code: 'LUXE150', description: '₹14,500 off orders over ₹1,40,000', type: 'FIXED', value: 1450000, minSubtotal: 14000000, usedCount: 4 },
      { code: 'BRIDAL15', description: '15% off bridal orders over ₹1,90,000', type: 'PERCENT', value: 15, minSubtotal: 19000000, maxUses: 100, usedCount: 7, endsAt: new Date(now + 120 * 86400000) },
      { code: 'SUMMER20', description: 'Expired summer promotion', type: 'PERCENT', value: 20, minSubtotal: 0, isActive: false, endsAt: new Date(now - 30 * 86400000) },
    ],
  });
  await prisma.bespokeRequest.createMany({
    data: [
      { jewelryType: 'Engagement ring', shape: 'oval', carat: '2 – 3 ct', metal: '18K Yellow Gold', budget: '₹2,50,000 – ₹5,00,000', notes: 'Looking for a low-set oval with a very thin band and a hidden halo in white gold.', name: 'Hannah Wright', email: 'hannah.w@example.com', phone: '+1 555 0177', country: 'United States', status: 'NEW', inspirationUrls: [] },
      { jewelryType: 'Necklace', shape: 'emerald', carat: '5 ct +', metal: '14K White Gold', budget: '₹5,00,000 – ₹10,00,000', notes: 'Emerald-cut rivière for my wedding day, around 16 inches.', name: 'Ishita Rao', email: 'ishita.rao@example.com', country: 'India', status: 'IN_REVIEW', inspirationUrls: [] },
      { jewelryType: 'Wedding band', shape: 'marquise', carat: '1 – 2 ct', metal: '14K Rose Gold', budget: '₹1,00,000 – ₹2,50,000', notes: 'Contoured band to fit around a pear engagement ring.', name: 'Grace Lee', email: 'grace.lee@example.com', country: 'Singapore', status: 'QUOTED', inspirationUrls: [] },
      { jewelryType: 'Earrings', shape: 'pear', carat: '2 – 3 ct', metal: '18K White Gold', budget: '₹2,50,000 – ₹5,00,000', notes: 'Chandelier-style drop earrings for a gala.', name: 'Mei Chen', email: 'mei.chen@example.com', country: 'Singapore', status: 'IN_PRODUCTION', inspirationUrls: [] },
    ],
  });
  await prisma.partnerApplication.createMany({
    data: [
      { name: 'Aanya Malhotra', email: 'aanya@example.com', country: 'India', socialHandle: '@aanya.styles', audienceSize: '50k – 100k', experience: 'Fashion & bridal content creator', message: 'Would love to feature your bridal collection.', status: 'PENDING' },
      { name: 'Chloe Martin', email: 'chloe@example.com', country: 'France', company: 'Maison Mariée', website: 'https://example.com', audienceSize: '10k – 50k', experience: 'Wedding planner', status: 'APPROVED' },
      { name: 'Omar Haddad', email: 'omar@example.com', country: 'United Arab Emirates', audienceSize: '1k – 10k', experience: 'Personal stylist', status: 'PENDING' },
    ],
  });
  await prisma.contactMessage.createMany({
    data: [
      { name: 'Leo Brown', email: 'leo@example.com', subject: 'Ring sizing', message: 'Can I get a free ring sizer before ordering?' },
      { name: 'Pooja Iyer', email: 'pooja@example.com', phone: '+91 99000 11111', subject: 'Visit the workshop', message: 'Is it possible to book an appointment to view diamonds in person?' },
    ],
  });
  await prisma.newsletterSubscriber.createMany({ data: ['ava@example.com', 'liam@example.com', 'maya@example.com'].map((email) => ({ email })) });
  await prisma.recommendationQuiz.create({ data: { slug: QUIZ_SLUG, title: 'Find Your Match', questions: [] } });

  const counts = await Promise.all([prisma.product.count(), prisma.productVariant.count(), prisma.diamond.count(), prisma.order.count(), prisma.review.count()]);
  console.log(`Done → ${counts[0]} products, ${counts[1]} variants, ${counts[2]} diamonds, ${counts[3]} orders, ${counts[4]} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
