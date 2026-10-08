/**
 * Product editor vocabulary, draft types and pure helpers — shared by the client editor
 * (live previews) and the server actions (authoritative validation). No server or
 * browser-only imports here.
 */
import type { ArtSpec } from '@/components/art/JewelryArt';
import { DIAMOND_CLARITIES, DIAMOND_COLORS, METAL_COLORS, PURITIES, SETTING_TYPES, SHAPE_SLUGS, STYLES, purityMultiplier } from '@/lib/catalog';
import { retailRound } from '@/lib/utils';

// ───────────────────────────── vocab ─────────────────────────────

export const METAL_SLUGS = METAL_COLORS.map((m) => m.slug) as string[];
export const PURITY_SLUGS = PURITIES.map((p) => p.slug) as string[];
export const STYLE_SLUGS = STYLES.map((s) => s.slug) as string[];
export const SETTING_SLUGS = SETTING_TYPES.map((s) => s.slug) as string[];
export const SHAPE_LIST = SHAPE_SLUGS as string[];
export const COLOR_GRADES = DIAMOND_COLORS as readonly string[];
export const CLARITY_GRADES = DIAMOND_CLARITIES as readonly string[];

export const ART_KINDS = ['ring', 'band', 'signet', 'studs', 'hoops', 'drops', 'pendant', 'tennis-necklace', 'station-necklace', 'tennis-bracelet', 'bangle'] as const;
export const ART_HEADS = ['solitaire', 'halo', 'double-halo', 'hidden-halo', 'three-stone', 'toi-et-moi', 'bezel', 'cluster', 'five-stone', 'east-west'] as const;
export const ART_BANDS = ['plain', 'pave', 'cathedral', 'bold', 'knife'] as const;
export const ART_STONES = ['full', 'half', 'none'] as const;
export const ART_SIZES = ['huggie', 'medium', 'large', 'thin', 'wide'] as const;
export const ART_STONE_SHAPES = [...SHAPE_SLUGS, 'baguette'] as string[];

export const DIAMOND_MODES = ['NONE', 'CENTER_STONE', 'TOTAL_WEIGHT'] as const;
export type DiamondMode = (typeof DIAMOND_MODES)[number];

export const PRODUCT_SORTS = [
  { value: 'position', label: 'Position' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'stock-asc', label: 'Stock: low to high' },
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number]['value'];

export const PRODUCT_STATUSES = ['active', 'inactive', 'featured', 'out-of-stock'] as const;
export type ProductStatusFilter = (typeof PRODUCT_STATUSES)[number];

/** Two-tone metals carry a 5% premium (extra casting & finishing). */
export const TWO_TONE_PREMIUM = 1.05;

// ───────────────────────────── draft types ─────────────────────────────

export type ArtDraft = {
  kind: string;
  head: string;
  band: string;
  stones: string;
  stoneShape: string;
  size: string;
  sides: string;
  second: string;
  prongs: string;
  graduated: boolean;
};

export type VariantDraft = {
  id: string | null;
  purity: string;
  metalColor: string;
  sku: string;
  /** rupees, as typed */
  price: string;
  stock: string;
  isActive: boolean;
  /** SKU follows the product SKU pattern until edited by hand */
  skuAuto: boolean;
  /** Price follows the base price until edited by hand */
  priceAuto: boolean;
  orderCount: number;
  cartCount: number;
};

export type CenterDraft = { id: string | null; shape: string; minCarat: string; maxCarat: string };

export type OptionDraft = {
  id: string | null;
  /** stable client key (rows can be reordered before they have an id) */
  key: string;
  label: string;
  totalCarat: string;
  color: string;
  clarity: string;
  /** rupees, as typed */
  priceDelta: string;
  isDefault: boolean;
};

export type ProductDraft = {
  name: string;
  slug: string;
  sku: string;
  subtitle: string;
  categoryId: string;
  collectionIds: string[];
  description: string;
  details: string;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  position: string;
  metalColors: string[];
  purities: string[];
  defaultMetalColor: string;
  defaultPurity: string;
  shapes: string[];
  styles: string[];
  settingType: string;
  centerCarat: string;
  totalCarat: string;
  hasCenterStone: boolean;
  requiresSize: boolean;
  tags: string[];
  /** rupees, as typed */
  basePrice: string;
  art: ArtDraft;
  variants: VariantDraft[];
  diamondMode: DiamondMode;
  center: CenterDraft;
  options: OptionDraft[];
  seoTitle: string;
  seoDescription: string;
};

export type MediaItem = { id: string; url: string; alt: string | null; kind: string; metalColor: string | null; position: number };

export type ProductMeta = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  categoryActive: boolean;
  fromPrice: number;
  rating: number;
  reviewCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductEditorData = { meta: ProductMeta; draft: ProductDraft; media: MediaItem[] };

/** Returned by saveProduct: the fresh editor state (new ids for created rows) */
export type SaveProductResult = { id: string; created: boolean; editor: ProductEditorData | null };

export type EditorOptions = {
  categories: { id: string; name: string; slug: string; isActive: boolean }[];
  collections: { id: string; name: string; slug: string }[];
};

// ───────────────────────────── helpers ─────────────────────────────

export const variantKey = (purity: string, metal: string) => `${purity}|${metal}`;

/** Field-error keys used by the server and the editor (stable across re-ordering). */
export const variantErrKey = (purity: string, metal: string, field: string) => `variants.${purity}.${metal}.${field}`;
export const optionErrKey = (key: string, field: string) => `options.${key}.${field}`;

export function variantSku(productSku: string, purity: string, metal: string) {
  const base = productSku.trim().toUpperCase() || 'SKU';
  return `${base}-${purity}-${metal.toUpperCase().replace(/-/g, '')}`;
}

/** Suggested setting price (cents) for a purity/metal from the base price (cents). */
export function suggestedVariantPrice(baseCents: number, purity: string, metal: string) {
  const raw = Math.round(baseCents * purityMultiplier(purity) * (metal.includes('-') ? TWO_TONE_PREMIUM : 1));
  return Math.max(0, retailRound(raw));
}

/** "1,29,999.50" / "₹1299" → paise (null when blank or invalid) */
export function parseMoneyInput(s: string): number | null {
  const clean = s.replace(/[$₹,\s]/g, '');
  if (clean === '') return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function centsToDollarInput(cents: number | null | undefined) {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace(/\.00$/, '');
}

export function parseFloatInput(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Ordered purity × metal grid for the chosen options (catalog order). */
export function variantGrid(purities: string[], metals: string[]) {
  const ps = PURITY_SLUGS.filter((p) => purities.includes(p));
  const ms = METAL_SLUGS.filter((m) => metals.includes(m));
  return ps.flatMap((purity) => ms.map((metalColor) => ({ purity, metalColor })));
}

export function newVariant(purity: string, metalColor: string, productSku: string, baseCents: number | null): VariantDraft {
  return {
    id: null,
    purity,
    metalColor,
    sku: variantSku(productSku, purity, metalColor),
    price: baseCents != null ? centsToDollarInput(suggestedVariantPrice(baseCents, purity, metalColor)) : '',
    stock: '10',
    isActive: true,
    skuAuto: true,
    priceAuto: true,
    orderCount: 0,
    cartCount: 0,
  };
}

/**
 * Keeps derived parts of the draft consistent after any edit:
 *  - defaults stay within the chosen metals / purities
 *  - every purity × metal combination has a variant row (auto SKU & price until edited)
 *  - unsaved rows for removed combinations are dropped; saved ones are kept as "orphans"
 */
export function normalizeDraft(d: ProductDraft): ProductDraft {
  const defaultMetalColor = d.metalColors.includes(d.defaultMetalColor) ? d.defaultMetalColor : (METAL_SLUGS.find((m) => d.metalColors.includes(m)) ?? '');
  const defaultPurity = d.purities.includes(d.defaultPurity) ? d.defaultPurity : (PURITY_SLUGS.find((p) => d.purities.includes(p)) ?? '');
  const base = parseMoneyInput(d.basePrice);
  const byKey = new Map(d.variants.map((v) => [variantKey(v.purity, v.metalColor), v]));
  const grid = variantGrid(d.purities, d.metalColors);
  const inGrid = new Set(grid.map((c) => variantKey(c.purity, c.metalColor)));

  const variants: VariantDraft[] = grid.map(({ purity, metalColor }) => {
    const v = byKey.get(variantKey(purity, metalColor)) ?? newVariant(purity, metalColor, d.sku, base);
    const sku = v.skuAuto ? variantSku(d.sku, purity, metalColor) : v.sku;
    const price = v.priceAuto ? (base != null ? centsToDollarInput(suggestedVariantPrice(base, purity, metalColor)) : '') : v.price;
    return sku === v.sku && price === v.price ? v : { ...v, sku, price };
  });
  for (const v of d.variants) if (v.id && !inGrid.has(variantKey(v.purity, v.metalColor))) variants.push(v);

  return { ...d, defaultMetalColor, defaultPurity, variants };
}

/** Variants in the current purity × metal grid (the ones that will be saved). */
export function gridVariants(d: ProductDraft) {
  const inGrid = new Set(variantGrid(d.purities, d.metalColors).map((c) => variantKey(c.purity, c.metalColor)));
  return d.variants.filter((v) => inGrid.has(variantKey(v.purity, v.metalColor)));
}

/** Saved variants whose combination is no longer offered. */
export function orphanVariants(d: ProductDraft) {
  const inGrid = new Set(variantGrid(d.purities, d.metalColors).map((c) => variantKey(c.purity, c.metalColor)));
  return d.variants.filter((v) => v.id && !inGrid.has(variantKey(v.purity, v.metalColor)));
}

const pick = <T extends string>(list: readonly T[], v: string | undefined): T | undefined => (v && (list as readonly string[]).includes(v) ? (v as T) : undefined);

/** Builder state → stored/rendered ArtSpec (empty keys stripped). */
export function toArtSpec(a: ArtDraft): ArtSpec {
  const spec: ArtSpec = { kind: pick(ART_KINDS, a.kind) ?? 'ring' };
  const head = pick(ART_HEADS, a.head);
  const band = pick(ART_BANDS, a.band);
  const stones = pick(ART_STONES, a.stones);
  const size = pick(ART_SIZES, a.size);
  const stoneShape = pick(ART_STONE_SHAPES, a.stoneShape);
  const sides = pick(ART_STONE_SHAPES, a.sides);
  const second = pick(SHAPE_LIST, a.second);
  const prongs = a.prongs.trim() === '' ? NaN : Number(a.prongs);
  if (head) spec.head = head;
  if (band) spec.band = band;
  if (stones) spec.stones = stones;
  if (stoneShape) spec.stoneShape = stoneShape;
  if (size) spec.size = size;
  if (sides) spec.sides = sides;
  if (second) spec.second = second;
  if (Number.isInteger(prongs) && prongs >= 2 && prongs <= 12) spec.prongs = prongs;
  if (a.graduated) spec.graduated = true;
  return spec;
}

/** Stored Json → builder state (unknown keys / values ignored). */
export function artDraftFrom(json: unknown): ArtDraft {
  const o = json && typeof json === 'object' && !Array.isArray(json) ? (json as Record<string, unknown>) : {};
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '');
  return {
    kind: pick(ART_KINDS, s('kind')) ?? 'ring',
    head: s('head'),
    band: s('band'),
    stones: s('stones'),
    stoneShape: s('stoneShape'),
    size: s('size'),
    sides: s('sides'),
    second: s('second'),
    prongs: typeof o.prongs === 'number' ? String(o.prongs) : '',
    graduated: o.graduated === true,
  };
}

let keySeq = 0;
export function optionKey() {
  keySeq += 1;
  return `o${Date.now().toString(36)}${keySeq}`;
}

export function emptyDraft(categoryId = ''): ProductDraft {
  return normalizeDraft({
    name: '',
    slug: '',
    sku: '',
    subtitle: '',
    categoryId,
    collectionIds: [],
    description: '',
    details: '',
    isActive: true,
    isFeatured: false,
    isTrending: false,
    isNew: true,
    position: '0',
    metalColors: ['yellow', 'white', 'rose'],
    purities: ['14K', '18K'],
    defaultMetalColor: 'yellow',
    defaultPurity: '14K',
    shapes: ['round'],
    styles: [],
    settingType: '',
    centerCarat: '',
    totalCarat: '',
    hasCenterStone: false,
    requiresSize: false,
    tags: [],
    basePrice: '',
    art: { kind: 'ring', head: 'solitaire', band: 'plain', stones: '', stoneShape: '', size: '', sides: '', second: '', prongs: '', graduated: false },
    variants: [],
    diamondMode: 'NONE',
    center: { id: null, shape: 'round', minCarat: '', maxCarat: '' },
    options: [],
    seoTitle: '',
    seoDescription: '',
  });
}

/** What the editor submits (JSON in the `payload` field). The server re-validates every value. */
export function toPayload(d: ProductDraft) {
  return {
    name: d.name,
    slug: d.slug,
    sku: d.sku,
    subtitle: d.subtitle,
    categoryId: d.categoryId,
    collectionIds: d.collectionIds,
    description: d.description,
    details: d.details,
    isActive: d.isActive,
    isFeatured: d.isFeatured,
    isTrending: d.isTrending,
    isNew: d.isNew,
    position: d.position,
    metalColors: d.metalColors,
    purities: d.purities,
    defaultMetalColor: d.defaultMetalColor,
    defaultPurity: d.defaultPurity,
    shapes: d.shapes,
    styles: d.styles,
    settingType: d.settingType,
    centerCarat: d.centerCarat,
    totalCarat: d.totalCarat,
    hasCenterStone: d.hasCenterStone,
    requiresSize: d.requiresSize,
    tags: d.tags,
    basePrice: d.basePrice,
    art: d.art,
    variants: gridVariants(d).map((v) => ({ purity: v.purity, metalColor: v.metalColor, sku: v.sku, price: v.price, stock: v.stock, isActive: v.isActive })),
    diamonds: { mode: d.diamondMode, center: d.center, options: d.options },
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
  };
}
