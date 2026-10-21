import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { db } from './db';
import type { ArtSpec } from '@/components/art/JewelryArt';
import {
  computeFacets,
  matchesFilters,
  matchesQuery,
  matchesScope,
  parseQuery,
  sortRows,
  type Filters,
  type IndexRow,
  type Scope,
} from '@/lib/filters';
import type { DiamondData, ProductCard, ProductDetail, StoneData } from '@/lib/types';
import { SHAPES } from '@/lib/catalog';

// ───────────────────────────── catalog index ─────────────────────────────

export const getCatalogIndex = unstable_cache(
  async (): Promise<IndexRow[]> => {
    const rows = await db.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      select: {
        id: true,
        slug: true,
        name: true,
        sku: true,
        fromPrice: true,
        metalColors: true,
        purities: true,
        shapes: true,
        centerCarat: true,
        totalCarat: true,
        caratSort: true,
        settingType: true,
        styles: true,
        tags: true,
        isFeatured: true,
        isTrending: true,
        isNew: true,
        position: true,
        createdAt: true,
        category: { select: { slug: true, name: true } },
        collections: { select: { slug: true, name: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      sku: r.sku,
      category: r.category.slug,
      categoryName: r.category.name,
      collections: r.collections.map((c) => c.slug),
      fromPrice: r.fromPrice,
      metalColors: r.metalColors,
      purities: r.purities,
      shapes: r.shapes,
      centerCarat: r.centerCarat,
      totalCarat: r.totalCarat,
      caratSort: r.caratSort,
      settingType: r.settingType,
      styles: r.styles,
      isFeatured: r.isFeatured,
      isTrending: r.isTrending,
      isNew: r.isNew,
      position: r.position,
      createdAt: r.createdAt.getTime(),
      text: [r.name, r.sku, r.category.name, ...r.styles, ...r.shapes, ...r.tags, ...r.collections.map((c) => c.name)]
        .join(' ')
        .toLowerCase()
        .replace(/-/g, ' '),
    }));
  },
  ['catalog-index', 'bc1'],
  { tags: ['products'], revalidate: 3600 },
);

// ───────────────────────────── cards ─────────────────────────────

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  sku: true,
  fromPrice: true,
  metalColors: true,
  purities: true,
  defaultMetalColor: true,
  defaultPurity: true,
  shapes: true,
  centerCarat: true,
  totalCarat: true,
  settingType: true,
  styles: true,
  art: true,
  rating: true,
  reviewCount: true,
  isNew: true,
  hasCenterStone: true,
  madeToOrder: true,
  category: { select: { slug: true, name: true } },
  // cards need each metal's first two photos (catalogue products order them first)
  images: { where: { kind: 'image' }, orderBy: { position: 'asc' }, select: { url: true, alt: true, kind: true, metalColor: true, shape: true }, take: 12 },
  variants: { where: { isActive: true }, select: { purity: true, price: true, stock: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow): ProductCard {
  const minVariant = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.fromPrice;
  const diamondFrom = Math.max(0, p.fromPrice - minVariant);
  const priceByPurity: Record<string, number> = {};
  for (const v of p.variants) {
    const val = v.price + diamondFrom;
    if (priceByPurity[v.purity] == null || val < priceByPurity[v.purity]) priceByPurity[v.purity] = val;
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    category: p.category,
    fromPrice: p.fromPrice,
    priceByPurity,
    metalColors: p.metalColors,
    purities: p.purities,
    defaultMetalColor: p.defaultMetalColor,
    defaultPurity: p.defaultPurity,
    shapes: p.shapes,
    centerCarat: p.centerCarat,
    totalCarat: p.totalCarat,
    settingType: p.settingType,
    styles: p.styles,
    art: (p.art as ArtSpec | null) ?? null,
    images: p.images,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isNew: p.isNew,
    hasCenterStone: p.hasCenterStone,
    inStock: p.madeToOrder || p.variants.some((v) => v.stock > 0),
  };
}

export async function getCardsByIds(ids: string[]): Promise<ProductCard[]> {
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { id: { in: ids }, isActive: true }, select: cardSelect });
  const map = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as ProductCard[];
}

export const getCardsCached = unstable_cache(async (ids: string[]) => getCardsByIds(ids), ['cards-by-ids', 'bc1'], {
  tags: ['products'],
  revalidate: 3600,
});

// ───────────────────────────── listings ─────────────────────────────

export type Listing = {
  products: ProductCard[];
  total: number;
  scopeTotal: number;
  page: number;
  pageCount: number;
  facets: ReturnType<typeof computeFacets>;
};

/**
 * Products per listing page. Kept small so collection pages stay light: very large HTML lets the
 * browser start hydrating before the page has fully arrived (an intermittent hydration warning).
 * "Load more" / infinite scroll fetch the next pages from /api/products with the same size.
 */
export const LISTING_PAGE_SIZE = 12;

export async function listProducts(scope: Scope, filters: Filters, pageSize = LISTING_PAGE_SIZE, opts: { cumulative?: boolean } = {}): Promise<Listing> {
  const index = await getCatalogIndex();
  let rows = index.filter((r) => matchesScope(r, scope));
  const scopeTotal = rows.length;
  if (filters.q) {
    const pq = parseQuery(filters.q);
    rows = rows.filter((r) => matchesQuery(r, pq));
  }
  const facets = computeFacets(rows, filters);
  const matched = sortRows(
    rows.filter((r) => matchesFilters(r, filters)),
    filters.sort,
  );
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const page = Math.min(filters.page, pageCount);
  // cumulative = render pages 1..page (SSR for "Load more" deep links)
  const start = opts.cumulative ? 0 : (page - 1) * pageSize;
  const slice = matched.slice(start, page * pageSize);
  const products = await getCardsCached(slice.map((r) => r.id));
  return { products, total: matched.length, scopeTotal, page, pageCount, facets };
}

export async function countProducts(scope: Scope, filters?: Partial<Filters>) {
  const index = await getCatalogIndex();
  const f = { price: [], metal: [], purity: [], shape: [], center: [], total: [], setting: [], style: [], collection: [], q: '', sort: 'featured', page: 1, ...filters } as Filters;
  return index.filter((r) => matchesScope(r, scope) && matchesFilters(r, f)).length;
}

export async function getTrending(limit = 12) {
  const index = await getCatalogIndex();
  const ids = index
    .filter((r) => r.isTrending)
    .sort((a, b) => a.position - b.position)
    .slice(0, limit)
    .map((r) => r.id);
  return getCardsCached(ids);
}

export async function getProductsWhere(scope: Scope, filters: Partial<Filters> = {}, limit = 12, sort: Filters['sort'] = 'featured') {
  const index = await getCatalogIndex();
  const f = { price: [], metal: [], purity: [], shape: [], center: [], total: [], setting: [], style: [], collection: [], q: '', page: 1, ...filters, sort } as Filters;
  const rows = sortRows(
    index.filter((r) => matchesScope(r, scope) && matchesFilters(r, f)),
    sort,
  ).slice(0, limit);
  return getCardsCached(rows.map((r) => r.id));
}

export async function getRelated(productId: string, limit = 8) {
  const index = await getCatalogIndex();
  const me = index.find((r) => r.id === productId);
  if (!me) return [];
  const scored = index
    .filter((r) => r.id !== productId)
    .map((r) => ({
      r,
      score:
        (r.category === me.category ? 4 : 0) +
        r.shapes.filter((s) => me.shapes.includes(s)).length * 2 +
        r.styles.filter((s) => me.styles.includes(s)).length +
        r.collections.filter((c) => me.collections.includes(c)).length,
    }))
    .sort((a, b) => b.score - a.score || a.r.position - b.r.position)
    .slice(0, limit);
  return getCardsCached(scored.map((s) => s.r.id));
}

// ───────────────────────────── taxonomy ─────────────────────────────

export const getCategories = unstable_cache(
  async () =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      select: { id: true, slug: true, name: true, description: true, image: true, seoTitle: true, seoDescription: true },
    }),
  ['categories'],
  { tags: ['categories'], revalidate: 3600 },
);

export async function getCategory(slug: string) {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export const getCollections = unstable_cache(
  async () =>
    db.collection.findMany({
      orderBy: { position: 'asc' },
      select: { id: true, slug: true, name: true, description: true, image: true, isFeatured: true, seoTitle: true, seoDescription: true },
    }),
  ['collections'],
  { tags: ['collections'], revalidate: 3600 },
);

export async function getCollection(slug: string) {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

// ───────────────────────────── product detail ─────────────────────────────

const diamondSelect = {
  id: true,
  sku: true,
  shape: true,
  carat: true,
  color: true,
  clarity: true,
  cut: true,
  polish: true,
  symmetry: true,
  fluorescence: true,
  measurements: true,
  tablePct: true,
  depthPct: true,
  ratio: true,
  growth: true,
  price: true,
  certificate: { select: { lab: true, number: true, url: true } },
} satisfies Prisma.DiamondSelect;

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const p = await db.product.findUnique({
      where: { slug },
      select: {
        ...cardSelect,
        isActive: true,
        subtitle: true,
        description: true,
        details: true,
        seoTitle: true,
        seoDescription: true,
        requiresSize: true,
        familyKey: true,
        sourceTitle: true,
        productType: true,
        ringSizes: true,
        showEngraving: true,
        optionAxes: true,
        caratKind: true,
        updatedAt: true,
        images: { orderBy: { position: 'asc' }, select: { url: true, alt: true, kind: true, metalColor: true, shape: true } },
        variants: {
          where: { isActive: true },
          select: { id: true, sku: true, purity: true, metalColor: true, price: true, stock: true, shape: true, centerCarat: true, totalCarat: true, length: true, stones: true, sizePrices: true },
        },
        diamondOptions: { orderBy: { position: 'asc' } },
        collections: { select: { slug: true, name: true } },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 24,
          select: { id: true, authorName: true, location: true, rating: true, title: true, body: true, isVerified: true, createdAt: true },
        },
      },
    });
    if (!p || !p.isActive) return null;
    const card = toCard(p as unknown as CardRow);
    // many variants share one stone breakdown: send each distinct one once (keeps big products' pages light)
    const stoneSets: StoneData[][] = [];
    const stoneIdx = new Map<string, number>();
    const variants = p.variants.map(({ stones, sizePrices, ...v }) => {
      let stonesIdx: number | null = null;
      if (Array.isArray(stones) && stones.length) {
        const k = JSON.stringify(stones);
        stonesIdx = stoneIdx.get(k) ?? stoneSets.push(stones as StoneData[]) - 1;
        stoneIdx.set(k, stonesIdx);
      }
      return { ...v, stonesIdx, sizePrices: (sizePrices as Record<string, number> | null) ?? null };
    });

    let defaultDiamond: DiamondData | null = null;
    const center = p.diamondOptions.find((o) => o.kind === 'CENTER_STONE');
    if (center?.shape) {
      const base = { shape: center.shape, isAvailable: true, carat: { gte: center.minCarat ?? 0, lte: center.maxCarat ?? 99 } };
      defaultDiamond =
        (await db.diamond.findFirst({
          where: { ...base, carat: { gte: Math.max(center.minCarat ?? 0, (p.centerCarat ?? 0) - 0.05), lte: center.maxCarat ?? 99 } },
          orderBy: { price: 'asc' },
          select: diamondSelect,
        })) ?? (await db.diamond.findFirst({ where: base, orderBy: { price: 'asc' }, select: diamondSelect }));
    }

    return {
      ...card,
      subtitle: p.subtitle,
      description: p.description,
      details: p.details,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      requiresSize: p.requiresSize,
      familyKey: p.familyKey,
      sourceTitle: p.sourceTitle,
      productType: p.productType,
      ringSizes: p.ringSizes,
      showEngraving: p.showEngraving,
      madeToOrder: p.madeToOrder,
      optionAxes: p.optionAxes,
      caratKind: p.caratKind,
      stoneSets,
      variants,
      diamondOptions: p.diamondOptions.map((o) => ({
        id: o.id,
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
      })),
      defaultDiamond,
      reviews: p.reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      collections: p.collections,
      updatedAt: p.updatedAt.toISOString(),
    };
  },
  ['product-by-slug', 'bc2'],
  { tags: ['products'], revalidate: 3600 },
);

// ───────────────────────────── diamonds ─────────────────────────────

export type DiamondQuery = {
  shape?: string;
  minCarat?: number;
  maxCarat?: number;
  colors?: string[];
  clarities?: string[];
  cuts?: string[];
  labs?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price-asc' | 'price-desc' | 'carat-asc' | 'carat-desc';
  page?: number;
  pageSize?: number;
};

export async function queryDiamonds(q: DiamondQuery) {
  const where: Prisma.DiamondWhereInput = {
    isAvailable: true,
    ...(q.shape ? { shape: q.shape } : {}),
    carat: { gte: q.minCarat ?? 0, lte: q.maxCarat ?? 99 },
    ...(q.colors?.length ? { color: { in: q.colors } } : {}),
    ...(q.clarities?.length ? { clarity: { in: q.clarities } } : {}),
    ...(q.cuts?.length ? { cut: { in: q.cuts } } : {}),
    ...(q.labs?.length ? { certificate: { lab: { in: q.labs } } } : {}),
    price: { gte: q.minPrice ?? 0, lte: q.maxPrice ?? 100_000_000 },
  };
  const orderBy: Prisma.DiamondOrderByWithRelationInput =
    q.sort === 'price-desc' ? { price: 'desc' } : q.sort === 'carat-asc' ? { carat: 'asc' } : q.sort === 'carat-desc' ? { carat: 'desc' } : { price: 'asc' };
  const pageSize = Math.min(200, q.pageSize ?? 24);
  const page = Math.max(1, q.page ?? 1);
  const [total, items] = await Promise.all([
    db.diamond.count({ where }),
    db.diamond.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: diamondSelect }),
  ]);
  return { total, items: items as DiamondData[], page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getDiamond(id: string) {
  return (await db.diamond.findUnique({ where: { id }, select: { ...diamondSelect, isAvailable: true } })) as (DiamondData & { isAvailable: boolean }) | null;
}

// ───────────────────────────── search ─────────────────────────────

export async function searchCatalog(raw: string, limit = 8) {
  const q = raw.trim();
  const index = await getCatalogIndex();
  const pq = parseQuery(q);
  const matched = q ? sortRows(index.filter((r) => matchesQuery(r, pq)), 'featured') : [];
  const lower = q.toLowerCase();
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);
  return {
    total: matched.length,
    products: await getCardsCached(matched.slice(0, limit).map((r) => r.id)),
    categories: categories
      .filter((c) => lower && (c.name.toLowerCase().includes(lower) || pq.categories.includes(c.slug) || lower.split(' ').some((w) => w.length > 3 && c.name.toLowerCase().includes(w))))
      .slice(0, 4)
      .map((c) => ({ slug: c.slug, name: c.name, href: `/${c.slug}` })),
    collections: collections
      .filter((c) => lower && (c.name.toLowerCase().includes(lower) || lower.split(' ').some((w) => w.length > 3 && c.name.toLowerCase().includes(w)) || pq.styles.includes(c.slug)))
      .slice(0, 4)
      .map((c) => ({ slug: c.slug, name: c.name, href: `/collections/${c.slug}` })),
    shapes: SHAPES.filter((s) => pq.shapes.includes(s.slug) || (lower.length > 1 && s.slug.startsWith(lower))).map((s) => ({
      slug: s.slug,
      name: s.label,
      href: `/collections/shape/${s.slug}`,
    })),
  };
}
