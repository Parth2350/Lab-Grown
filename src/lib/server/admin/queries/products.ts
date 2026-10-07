import 'server-only';
import type { Prisma } from '@prisma/client';
import type { ArtSpec } from '@/components/art/JewelryArt';
import { db } from '@/lib/server/db';
import type { MediaImage } from '@/lib/types';
import { pageCount, paging, sp, spEnum, type SearchParams } from '../list';
import { readStoreSettings } from '../settings';
import {
  PRODUCT_SORTS,
  PRODUCT_STATUSES,
  artDraftFrom,
  normalizeDraft,
  type DiamondMode,
  type EditorOptions,
  type MediaItem,
  type OptionDraft,
  type ProductDraft,
  type ProductEditorData,
  type ProductSort,
  type ProductStatusFilter,
  type VariantDraft,
} from '@/components/admin/products/shared';

export const PRODUCTS_PAGE_SIZE = 25;

// ───────────────────────────── list ─────────────────────────────

export type ProductListRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  fromPrice: number;
  rating: number;
  reviewCount: number;
  category: { name: string; slug: string; isActive: boolean };
  art: ArtSpec | null;
  images: MediaImage[];
  metal: string;
  shape: string;
  carat: number | null;
  stock: number;
  activeVariants: number;
  totalVariants: number;
  soldOutVariants: number;
};

const listSelect = {
  id: true,
  slug: true,
  name: true,
  sku: true,
  isActive: true,
  isFeatured: true,
  isTrending: true,
  isNew: true,
  fromPrice: true,
  rating: true,
  reviewCount: true,
  art: true,
  defaultMetalColor: true,
  shapes: true,
  centerCarat: true,
  totalCarat: true,
  category: { select: { name: true, slug: true, isActive: true } },
  images: { where: { kind: 'image' }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], take: 6, select: { url: true, alt: true, kind: true, metalColor: true } },
  _count: { select: { variants: true } },
} satisfies Prisma.ProductSelect;

const STATUS_WHERE: Record<ProductStatusFilter, Prisma.ProductWhereInput> = {
  active: { isActive: true },
  inactive: { isActive: false },
  featured: { isFeatured: true },
  'out-of-stock': { variants: { none: { isActive: true, stock: { gt: 0 } } } },
};

const ORDER_BY: Record<Exclude<ProductSort, 'stock-asc'>, Prisma.ProductOrderByWithRelationInput[]> = {
  position: [{ position: 'asc' }, { createdAt: 'desc' }],
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  name: [{ name: 'asc' }, { id: 'asc' }],
  'price-asc': [{ fromPrice: 'asc' }, { name: 'asc' }],
  'price-desc': [{ fromPrice: 'desc' }, { name: 'asc' }],
};

function searchWhere(q: string): Prisma.ProductWhereInput | undefined {
  if (!q) return undefined;
  const term = q.slice(0, 100);
  const lower = term.toLowerCase();
  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } },
      { slug: { contains: lower } },
      { variants: { some: { sku: { contains: term, mode: 'insensitive' } } } },
      { shapes: { has: lower } },
      { tags: { has: lower } },
    ],
  };
}

export async function listProducts(params: SearchParams) {
  const q = sp(params, 'q');
  const category = sp(params, 'category');
  const status = spEnum(params, 'status', PRODUCT_STATUSES);
  const sort = spEnum(params, 'sort', PRODUCT_SORTS.map((s) => s.value), 'newest');
  const { page, skip, take, pageSize } = paging(params, PRODUCTS_PAGE_SIZE);

  const base: Prisma.ProductWhereInput = { AND: [searchWhere(q) ?? {}, category ? { category: { slug: category } } : {}] };
  const where: Prisma.ProductWhereInput = status ? { AND: [base, STATUS_WHERE[status]] } : base;

  const [categories, settings, all, active, inactive, featured, outOfStock] = await Promise.all([
    db.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }], select: { id: true, slug: true, name: true, isActive: true } }),
    readStoreSettings(),
    db.product.count({ where: base }),
    db.product.count({ where: { AND: [base, STATUS_WHERE.active] } }),
    db.product.count({ where: { AND: [base, STATUS_WHERE.inactive] } }),
    db.product.count({ where: { AND: [base, STATUS_WHERE.featured] } }),
    db.product.count({ where: { AND: [base, STATUS_WHERE['out-of-stock']] } }),
  ]);
  const total = status ? { active, inactive, featured, 'out-of-stock': outOfStock }[status] : all;

  // Page of products (stock sort is an aggregate → order ids by SUM(stock) in SQL, then load the page)
  let rows: Prisma.ProductGetPayload<{ select: typeof listSelect }>[];
  let stockBy: Map<string, { stock: number; active: number }>;
  if (sort === 'stock-asc') {
    const [ids, sums] = await Promise.all([
      db.product.findMany({ where, select: { id: true, name: true } }),
      db.productVariant.groupBy({ by: ['productId'], where: { isActive: true, product: where }, _sum: { stock: true }, _count: { _all: true } }),
    ]);
    stockBy = new Map(sums.map((s) => [s.productId, { stock: s._sum.stock ?? 0, active: s._count._all }]));
    const ordered = ids.sort((a, b) => (stockBy.get(a.id)?.stock ?? 0) - (stockBy.get(b.id)?.stock ?? 0) || a.name.localeCompare(b.name)).slice(skip, skip + take);
    const loaded = await db.product.findMany({ where: { id: { in: ordered.map((o) => o.id) } }, select: listSelect });
    const byId = new Map(loaded.map((r) => [r.id, r]));
    rows = ordered.map((o) => byId.get(o.id)).filter((r): r is NonNullable<typeof r> => !!r);
  } else {
    rows = await db.product.findMany({ where, orderBy: ORDER_BY[sort], skip, take, select: listSelect });
    const sums = rows.length
      ? await db.productVariant.groupBy({ by: ['productId'], where: { productId: { in: rows.map((r) => r.id) }, isActive: true }, _sum: { stock: true }, _count: { _all: true } })
      : [];
    stockBy = new Map(sums.map((s) => [s.productId, { stock: s._sum.stock ?? 0, active: s._count._all }]));
  }

  const soldOut = rows.length
    ? await db.productVariant.groupBy({ by: ['productId'], where: { productId: { in: rows.map((r) => r.id) }, isActive: true, stock: { lte: 0 } }, _count: { _all: true } })
    : [];
  const soldOutBy = new Map(soldOut.map((s) => [s.productId, s._count._all]));

  const items: ProductListRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    sku: r.sku,
    isActive: r.isActive,
    isFeatured: r.isFeatured,
    isTrending: r.isTrending,
    isNew: r.isNew,
    fromPrice: r.fromPrice,
    rating: r.rating,
    reviewCount: r.reviewCount,
    category: r.category,
    art: (r.art as ArtSpec | null) ?? null,
    images: r.images,
    metal: r.defaultMetalColor,
    shape: r.shapes[0] ?? 'round',
    carat: r.centerCarat ?? r.totalCarat,
    stock: stockBy.get(r.id)?.stock ?? 0,
    activeVariants: stockBy.get(r.id)?.active ?? 0,
    totalVariants: r._count.variants,
    soldOutVariants: soldOutBy.get(r.id) ?? 0,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: pageCount(total, pageSize),
    filters: { q, category, status: status ?? '', sort },
    counts: { all, active, inactive, featured, 'out-of-stock': outOfStock },
    categories,
    lowStockThreshold: settings.lowStockThreshold,
  };
}

// ───────────────────────────── editor ─────────────────────────────

export async function getProductEditorOptions(): Promise<EditorOptions> {
  const [categories, collections] = await Promise.all([
    db.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }], select: { id: true, name: true, slug: true, isActive: true } }),
    db.collection.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }], select: { id: true, name: true, slug: true } }),
  ]);
  return { categories, collections };
}

export async function getProductMedia(productId: string): Promise<MediaItem[]> {
  return db.productImage.findMany({
    where: { productId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, url: true, alt: true, kind: true, metalColor: true, position: true },
  });
}

const num = (n: number | null | undefined) => (n == null ? '' : String(n));
const dollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, '');

/** Everything the product editor needs for an existing product (null when it doesn't exist). */
export async function getProductEditorData(id: string): Promise<ProductEditorData | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ purity: 'asc' }, { metalColor: 'asc' }] },
      diamondOptions: { orderBy: [{ position: 'asc' }, { id: 'asc' }] },
      collections: { select: { id: true } },
      category: { select: { isActive: true } },
      images: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], select: { id: true, url: true, alt: true, kind: true, metalColor: true, position: true } },
      _count: { select: { orderItems: true } },
    },
  });
  if (!p) return null;

  const variantIds = p.variants.map((v) => v.id);
  const [orderRefs, cartRefs] = variantIds.length
    ? await Promise.all([
        db.orderItem.groupBy({ by: ['variantId'], where: { variantId: { in: variantIds } }, _count: { _all: true } }),
        db.cartItem.groupBy({ by: ['variantId'], where: { variantId: { in: variantIds } }, _count: { _all: true } }),
      ])
    : [[], []];
  const orderBy = new Map(orderRefs.map((r) => [r.variantId, r._count._all]));
  const cartBy = new Map(cartRefs.map((r) => [r.variantId, r._count._all]));

  const variants: VariantDraft[] = p.variants.map((v) => ({
    id: v.id,
    purity: v.purity,
    metalColor: v.metalColor,
    sku: v.sku,
    price: dollars(v.price),
    stock: String(v.stock),
    isActive: v.isActive,
    skuAuto: false,
    priceAuto: false,
    orderCount: orderBy.get(v.id) ?? 0,
    cartCount: cartBy.get(v.id) ?? 0,
  }));

  const center = p.diamondOptions.find((o) => o.kind === 'CENTER_STONE');
  const weights = p.diamondOptions.filter((o) => o.kind === 'TOTAL_WEIGHT');
  const diamondMode: DiamondMode = center ? 'CENTER_STONE' : weights.length ? 'TOTAL_WEIGHT' : 'NONE';
  const options: OptionDraft[] = weights.map((o) => ({
    id: o.id,
    key: o.id,
    label: o.label ?? '',
    totalCarat: num(o.totalCarat),
    color: o.color ?? 'G',
    clarity: o.clarity ?? 'VS1',
    priceDelta: dollars(o.priceDelta),
    isDefault: o.isDefault,
  }));
  if (options.length && !options.some((o) => o.isDefault)) options[0].isDefault = true;

  const draft: ProductDraft = normalizeDraft({
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    subtitle: p.subtitle ?? '',
    categoryId: p.categoryId,
    collectionIds: p.collections.map((c) => c.id),
    description: p.description,
    details: p.details ?? '',
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isTrending: p.isTrending,
    isNew: p.isNew,
    position: String(p.position),
    metalColors: p.metalColors,
    purities: p.purities,
    defaultMetalColor: p.defaultMetalColor,
    defaultPurity: p.defaultPurity,
    shapes: p.shapes,
    styles: p.styles,
    settingType: p.settingType ?? '',
    centerCarat: num(p.centerCarat),
    totalCarat: num(p.totalCarat),
    hasCenterStone: p.hasCenterStone,
    requiresSize: p.requiresSize,
    tags: p.tags,
    basePrice: dollars(p.basePrice),
    art: artDraftFrom(p.art),
    variants,
    diamondMode,
    center: center
      ? { id: center.id, shape: center.shape ?? p.shapes[0] ?? 'round', minCarat: num(center.minCarat), maxCarat: num(center.maxCarat) }
      : { id: null, shape: p.shapes[0] ?? 'round', minCarat: '', maxCarat: '' },
    options,
    seoTitle: p.seoTitle ?? '',
    seoDescription: p.seoDescription ?? '',
  });

  return {
    meta: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      isActive: p.isActive,
      categoryActive: p.category.isActive,
      fromPrice: p.fromPrice,
      rating: p.rating,
      reviewCount: p.reviewCount,
      orderCount: p._count.orderItems,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    },
    draft,
    media: p.images,
  };
}
