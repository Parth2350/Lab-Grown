import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { CERT_LABS, DIAMOND_CLARITIES, DIAMOND_COLORS, DIAMOND_CUTS, SHAPE_SLUGS } from '@/lib/catalog';
import { DIAMOND_SORT_VALUES, type DiamondSort } from '@/components/admin/diamonds/options';
import { sp, spEnum, spList, spNumber, type SearchParams } from '../list';

export type DiamondFilters = {
  q: string;
  shape?: string;
  caratMin?: number;
  caratMax?: number;
  colors: string[];
  clarities: string[];
  cut?: string;
  lab?: string;
  available?: 'yes' | 'no';
  /** rupees */
  priceMin?: number;
  /** rupees */
  priceMax?: number;
  sort: DiamondSort;
};

const positive = (n: number | undefined) => (n != null && n >= 0 ? n : undefined);

export function parseDiamondFilters(params: SearchParams): DiamondFilters {
  const colorSet = new Set<string>(DIAMOND_COLORS);
  const claritySet = new Set<string>(DIAMOND_CLARITIES);
  return {
    q: sp(params, 'q').slice(0, 80),
    shape: spEnum(params, 'shape', SHAPE_SLUGS),
    caratMin: positive(spNumber(params, 'caratMin')),
    caratMax: positive(spNumber(params, 'caratMax')),
    colors: spList(params, 'color').map((c) => c.toUpperCase()).filter((c) => colorSet.has(c)),
    clarities: spList(params, 'clarity').map((c) => c.toUpperCase()).filter((c) => claritySet.has(c)),
    cut: spEnum(params, 'cut', DIAMOND_CUTS),
    lab: spEnum(params, 'lab', CERT_LABS),
    available: spEnum(params, 'available', ['yes', 'no'] as const),
    priceMin: positive(spNumber(params, 'priceMin')),
    priceMax: positive(spNumber(params, 'priceMax')),
    sort: spEnum(params, 'sort', DIAMOND_SORT_VALUES, 'newest'),
  };
}

export function hasDiamondFilters(f: DiamondFilters) {
  return Boolean(f.q || f.shape || f.caratMin != null || f.caratMax != null || f.colors.length || f.clarities.length || f.cut || f.lab || f.available || f.priceMin != null || f.priceMax != null);
}

export function diamondWhere(f: DiamondFilters): Prisma.DiamondWhereInput {
  const and: Prisma.DiamondWhereInput[] = [];
  if (f.q) {
    and.push({
      OR: [{ sku: { contains: f.q, mode: 'insensitive' } }, { certificate: { is: { number: { contains: f.q, mode: 'insensitive' } } } }],
    });
  }
  if (f.shape) and.push({ shape: f.shape });
  if (f.caratMin != null || f.caratMax != null) and.push({ carat: { ...(f.caratMin != null ? { gte: f.caratMin } : {}), ...(f.caratMax != null ? { lte: f.caratMax } : {}) } });
  if (f.colors.length) and.push({ color: { in: f.colors } });
  if (f.clarities.length) and.push({ clarity: { in: f.clarities } });
  if (f.cut) and.push({ cut: f.cut });
  if (f.lab) and.push({ certificate: { is: { lab: f.lab } } });
  if (f.available) and.push({ isAvailable: f.available === 'yes' });
  if (f.priceMin != null || f.priceMax != null)
    and.push({ price: { ...(f.priceMin != null ? { gte: Math.round(f.priceMin * 100) } : {}), ...(f.priceMax != null ? { lte: Math.round(f.priceMax * 100) } : {}) } });
  return and.length ? { AND: and } : {};
}

const ORDER: Record<DiamondSort, Prisma.DiamondOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }, { sku: 'desc' }],
  'price-asc': [{ price: 'asc' }, { sku: 'asc' }],
  'price-desc': [{ price: 'desc' }, { sku: 'asc' }],
  'carat-asc': [{ carat: 'asc' }, { price: 'asc' }],
  'carat-desc': [{ carat: 'desc' }, { price: 'asc' }],
};

export async function listAdminDiamonds(f: DiamondFilters, page: { skip: number; take: number }) {
  const where = diamondWhere(f);
  const [rows, total] = await Promise.all([
    db.diamond.findMany({
      where,
      orderBy: ORDER[f.sort],
      skip: page.skip,
      take: page.take,
      select: {
        id: true,
        sku: true,
        shape: true,
        carat: true,
        color: true,
        clarity: true,
        cut: true,
        growth: true,
        price: true,
        isAvailable: true,
        certificate: { select: { lab: true, number: true, url: true } },
        _count: { select: { orderItems: true, cartItems: true } },
      },
    }),
    db.diamond.count({ where }),
  ]);
  return { rows, total };
}

/** Available-stone totals for the current filter set (count / value / averages, aggregated in SQL). */
export async function diamondSummary(f: DiamondFilters) {
  const available = await db.diamond.aggregate({
    where: { AND: [diamondWhere(f), { isAvailable: true }] },
    _count: { _all: true },
    _sum: { price: true },
    _avg: { price: true, carat: true },
  });
  return {
    available: available._count._all,
    value: available._sum.price ?? 0,
    avgPrice: Math.round((available._avg.price ?? 0) / 100) * 100,
    avgCarat: available._avg.carat ?? 0,
  };
}

export async function getAdminDiamond(id: string) {
  return db.diamond.findUnique({
    where: { id },
    include: { certificate: true },
  });
}

/** Next sequential SKU in the LGD-00001 series (a suggestion — the admin can type any unique SKU). */
export async function suggestDiamondSku() {
  const rows = await db.diamond.findMany({ where: { sku: { startsWith: 'LGD-' } }, select: { sku: true }, orderBy: { sku: 'desc' }, take: 50 });
  const max = rows.reduce((m, r) => {
    const n = Number(r.sku.slice(4));
    return Number.isInteger(n) && n > m ? n : m;
  }, 0);
  return `LGD-${String(max + 1).padStart(5, '0')}`;
}

/** Where a diamond is used: orders (blocks deletion), carts, and products that offer its shape as a centre stone. */
export async function diamondUsage(d: { id: string; shape: string; carat: number }) {
  const [orderItems, cartCount, productCount] = await Promise.all([
    db.orderItem.findMany({
      where: { diamondId: d.id },
      orderBy: { order: { createdAt: 'desc' } },
      take: 5,
      select: { id: true, name: true, order: { select: { id: true, number: true, status: true, createdAt: true } } },
    }),
    db.cartItem.count({ where: { diamondId: d.id } }),
    db.product.count({
      where: {
        diamondOptions: {
          some: {
            kind: 'CENTER_STONE',
            shape: d.shape,
            AND: [{ OR: [{ minCarat: null }, { minCarat: { lte: d.carat } }] }, { OR: [{ maxCarat: null }, { maxCarat: { gte: d.carat } }] }],
          },
        },
      },
    }),
  ]);
  const orderCount = orderItems.length < 5 ? orderItems.length : await db.orderItem.count({ where: { diamondId: d.id } });
  return { orderItems, orderCount, cartCount, productCount };
}
