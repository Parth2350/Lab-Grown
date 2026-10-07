import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { METAL_COLORS, PURITIES } from '@/lib/catalog';
import { sp, spEnum, type SearchParams } from '../list';

export const INVENTORY_SORTS = [
  { value: 'stock-asc', label: 'Stock: lowest first' },
  { value: 'stock-desc', label: 'Stock: highest first' },
  { value: 'name', label: 'Product name' },
  { value: 'sku', label: 'Variant SKU' },
] as const;
export type InventorySort = (typeof INVENTORY_SORTS)[number]['value'];
const SORT_VALUES = INVENTORY_SORTS.map((s) => s.value) as InventorySort[];

export type StockFilter = 'all' | 'low' | 'out';

export type InventoryFilters = {
  q: string;
  category?: string;
  stock: StockFilter;
  metal?: string;
  purity?: string;
  sort: InventorySort;
};

export function parseInventoryFilters(params: SearchParams): InventoryFilters {
  const stock = spEnum(params, 'stock', ['all', 'low', 'out'] as const, 'all');
  const category = sp(params, 'category');
  return {
    q: sp(params, 'q').slice(0, 80),
    category: /^[a-z0-9-]{1,120}$/.test(category) ? category : undefined,
    stock,
    metal: spEnum(
      params,
      'metal',
      METAL_COLORS.map((m) => m.slug),
    ),
    purity: spEnum(
      params,
      'purity',
      PURITIES.map((p) => p.slug),
    ),
    // Low / out-of-stock views default to the most urgent rows first.
    sort: spEnum(params, 'sort', SORT_VALUES, stock === 'all' ? 'name' : 'stock-asc'),
  };
}

/** Filters except the stock level (used for the stock tab counts). */
export function inventoryBaseWhere(f: InventoryFilters): Prisma.ProductVariantWhereInput {
  const and: Prisma.ProductVariantWhereInput[] = [];
  if (f.q) {
    and.push({
      OR: [
        { sku: { contains: f.q, mode: 'insensitive' } },
        { product: { name: { contains: f.q, mode: 'insensitive' } } },
        { product: { sku: { contains: f.q, mode: 'insensitive' } } },
      ],
    });
  }
  if (f.category) and.push({ product: { category: { slug: f.category } } });
  if (f.metal) and.push({ metalColor: f.metal });
  if (f.purity) and.push({ purity: f.purity });
  return and.length ? { AND: and } : {};
}

export function stockWhere(stock: StockFilter, threshold: number): Prisma.ProductVariantWhereInput {
  if (stock === 'out') return { stock: { lte: 0 } };
  if (stock === 'low') return { stock: { lte: threshold } };
  return {};
}

const ORDER: Record<InventorySort, Prisma.ProductVariantOrderByWithRelationInput[]> = {
  'stock-asc': [{ stock: 'asc' }, { product: { name: 'asc' } }, { sku: 'asc' }],
  'stock-desc': [{ stock: 'desc' }, { product: { name: 'asc' } }, { sku: 'asc' }],
  name: [{ product: { name: 'asc' } }, { purity: 'asc' }, { metalColor: 'asc' }],
  sku: [{ sku: 'asc' }],
};

export async function listInventory(f: InventoryFilters, threshold: number, page: { skip: number; take: number }) {
  const where: Prisma.ProductVariantWhereInput = { AND: [inventoryBaseWhere(f), stockWhere(f.stock, threshold)] };
  const [rows, total] = await Promise.all([
    db.productVariant.findMany({
      where,
      orderBy: ORDER[f.sort],
      skip: page.skip,
      take: page.take,
      select: {
        id: true,
        sku: true,
        purity: true,
        metalColor: true,
        price: true,
        stock: true,
        isActive: true,
        product: { select: { id: true, name: true, sku: true, isActive: true, category: { select: { name: true } } } },
      },
    }),
    db.productVariant.count({ where }),
  ]);
  return { rows, total };
}

/** Store-wide stock health (header stats). */
export async function inventoryStats(threshold: number) {
  const [agg, low, out] = await Promise.all([
    db.productVariant.aggregate({ _sum: { stock: true }, _count: { _all: true } }),
    db.productVariant.count({ where: { stock: { lte: threshold } } }),
    db.productVariant.count({ where: { stock: { lte: 0 } } }),
  ]);
  return { units: agg._sum.stock ?? 0, variants: agg._count._all, low, out };
}

/** Counts per stock tab under the current non-stock filters. */
export async function inventoryTabCounts(f: InventoryFilters, threshold: number) {
  const base = inventoryBaseWhere(f);
  const [all, low, out] = await Promise.all([
    db.productVariant.count({ where: base }),
    db.productVariant.count({ where: { AND: [base, stockWhere('low', threshold)] } }),
    db.productVariant.count({ where: { AND: [base, stockWhere('out', threshold)] } }),
  ]);
  return { all, low, out };
}
