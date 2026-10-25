/**
 * Catalog vocabulary shared by the storefront, filters, admin and seed.
 * Slugs are what live in the database and in URLs; labels are what shoppers see.
 */
import { CATALOG_COMMON_SHAPES, CATALOG_SHAPE_LABELS } from './catalog-generated';

export const SHAPES = [
  { slug: 'round', label: 'Round', blurb: 'The most brilliant cut — timeless and endlessly sparkling.' },
  { slug: 'oval', label: 'Oval', blurb: 'Elongated elegance that flatters the hand.' },
  { slug: 'princess', label: 'Princess', blurb: 'Crisp square lines with modern fire.' },
  { slug: 'cushion', label: 'Cushion', blurb: 'Soft pillowed corners and romantic glow.' },
  { slug: 'emerald', label: 'Emerald', blurb: 'Hall-of-mirrors step facets, quietly glamorous.' },
  { slug: 'pear', label: 'Pear', blurb: 'A graceful teardrop — part round, part marquise.' },
  { slug: 'marquise', label: 'Marquise', blurb: 'Regal and elongated, maximising carat presence.' },
  { slug: 'radiant', label: 'Radiant', blurb: 'Trimmed corners with brilliant-cut sparkle.' },
  { slug: 'asscher', label: 'Asscher', blurb: 'Art Deco step cut with a mesmerising windmill.' },
  { slug: 'heart', label: 'Heart', blurb: 'The ultimate symbol of love, precisely cut.' },
] as const;
export type ShapeSlug = (typeof SHAPES)[number]['slug'];
export const SHAPE_SLUGS = SHAPES.map((s) => s.slug) as ShapeSlug[];

export const METAL_COLORS = [
  { slug: 'yellow', label: 'Yellow Gold', short: 'Yellow', swatch: 'linear-gradient(135deg,#F6E2A8 0%,#D9B465 50%,#A87F33 100%)' },
  { slug: 'white', label: 'White Gold', short: 'White', swatch: 'linear-gradient(135deg,#FFFFFF 0%,#DADDE0 50%,#A9AEB4 100%)' },
  { slug: 'rose', label: 'Rose Gold', short: 'Rose', swatch: 'linear-gradient(135deg,#F7D2C0 0%,#DFA088 50%,#B06F58 100%)' },
  { slug: 'yellow-white', label: 'Yellow & White Gold', short: 'Yellow & White', swatch: 'linear-gradient(135deg,#E9CB80 0%,#E9CB80 50%,#D6D9DC 50%,#D6D9DC 100%)' },
  { slug: 'rose-white', label: 'Rose & White Gold', short: 'Rose & White', swatch: 'linear-gradient(135deg,#E8AE97 0%,#E8AE97 50%,#D6D9DC 50%,#D6D9DC 100%)' },
  { slug: 'black', label: 'Black Rhodium Gold', short: 'Black', swatch: 'linear-gradient(135deg,#6B6B70 0%,#3A3A3F 50%,#1E1E22 100%)' },
] as const;
export type MetalColor = (typeof METAL_COLORS)[number]['slug'];

export const PURITIES = [
  { slug: '9K', label: '9K', karat: 9, fineness: '37.5% gold', multiplier: 1 },
  { slug: '10K', label: '10K', karat: 10, fineness: '41.7% gold', multiplier: 1.08 },
  { slug: '14K', label: '14K', karat: 14, fineness: '58.5% gold', multiplier: 1.32 },
  { slug: '18K', label: '18K', karat: 18, fineness: '75.0% gold', multiplier: 1.68 },
] as const;
export type Purity = (typeof PURITIES)[number]['slug'];

export const SETTING_TYPES = [
  { slug: 'bezel', label: 'Bezel' },
  { slug: 'six-prong', label: 'Six Prong' },
  { slug: 'eight-prong', label: 'Eight Prong' },
  { slug: 'five-prong', label: 'Five Prong' },
  { slug: 'three-stone', label: 'Three Stone' },
  { slug: 'four-prong', label: 'Four Prong' },
  { slug: 'three-prong', label: 'Three Prong' },
  { slug: 'pave', label: 'Pavé' },
  { slug: 'channel', label: 'Channel' },
] as const;

export const STYLES = [
  { slug: 'anniversary', label: 'Anniversary' },
  { slug: 'baguette', label: 'Baguette' },
  { slug: 'bangle', label: 'Bangle' },
  { slug: 'bezel', label: 'Bezel' },
  { slug: 'bold-gold', label: 'Bold Gold' },
  { slug: 'solitaire', label: 'Solitaire' },
  { slug: 'halo', label: 'Halo' },
  { slug: 'hidden-halo', label: 'Hidden Halo' },
  { slug: 'three-stone', label: 'Three Stone' },
  { slug: 'toi-et-moi', label: 'Toi et Moi' },
  { slug: 'vintage', label: 'Vintage' },
  { slug: 'modern', label: 'Modern' },
  { slug: 'eternity', label: 'Eternity' },
  { slug: 'stackable', label: 'Stackable' },
  { slug: 'cocktail', label: 'Cocktail' },
  { slug: 'tennis', label: 'Tennis' },
  { slug: 'stud', label: 'Studs' },
  { slug: 'hoop', label: 'Hoops' },
  { slug: 'drop', label: 'Drop' },
  { slug: 'layering', label: 'Layering' },
] as const;

export const FILTER_COLLECTIONS = [
  { slug: 'solitaire', label: 'Solitaire' },
  { slug: 'engagement', label: 'Engagement' },
  { slug: 'geometric', label: 'Geometric' },
  { slug: 'art-deco', label: 'Art Deco' },
  { slug: 'emerald-cut', label: 'Emerald Cut' },
] as const;

/** Price buckets in whole currency units; `max` null = open-ended */
export const PRICE_RANGES = [
  { slug: '0-50000', label: 'Under ₹50,000', min: 0, max: 50000 },
  { slug: '50000-100000', label: '₹50,000 – ₹1,00,000', min: 50000, max: 100000 },
  { slug: '100000-200000', label: '₹1,00,000 – ₹2,00,000', min: 100000, max: 200000 },
  { slug: '200000-500000', label: '₹2,00,000 – ₹5,00,000', min: 200000, max: 500000 },
  { slug: '500000-', label: '₹5,00,000+', min: 500000, max: null },
] as const;

export const CARAT_RANGES = [
  { slug: '0-1', label: 'Under 1 ct', min: 0, max: 1 },
  { slug: '1-2', label: '1 – 2 ct', min: 1, max: 2 },
  { slug: '2-3', label: '2 – 3 ct', min: 2, max: 3 },
  { slug: '3-', label: '3 ct +', min: 3, max: null },
] as const;

export const SORT_OPTIONS = [
  { slug: 'featured', label: 'Featured' },
  { slug: 'price-asc', label: 'Price: Low to High' },
  { slug: 'price-desc', label: 'Price: High to Low' },
  { slug: 'carat-desc', label: 'Carat: High to Low' },
  { slug: 'carat-asc', label: 'Carat: Low to High' },
  { slug: 'newest', label: 'Newest' },
] as const;
export type SortSlug = (typeof SORT_OPTIONS)[number]['slug'];

// ─── Diamond grading ───
export const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H'] as const;
export const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1'] as const;
export const DIAMOND_CUTS = ['Ideal', 'Excellent', 'Very Good'] as const;
export const CERT_LABS = ['IGI', 'GIA'] as const;

export const RING_SIZES = ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'];

/** Shapes offered in the shape filter: the classic ten, then the catalogue's common fancy cuts */
export const FILTER_SHAPES: readonly { slug: string; label: string }[] = [...SHAPES, ...CATALOG_COMMON_SHAPES.map((slug) => ({ slug, label: CATALOG_SHAPE_LABELS[slug] ?? titleCase(slug) }))];

/** Partner-catalogue photos and videos are served straight from the partner's media server (already web-sized). */
export const isCatalogMedia = (url?: string | null) => !!url && url.startsWith('https://webassests.s3.');

const CATALOG_PHOTOS = 'https://webassests.s3.us-east-1.amazonaws.com/images/';
/** A partner-catalogue photo through our own /cdn/catalog/ path (see next.config rewrites): the same file, cached near the shopper */
export const catalogSrc = (url: string) => (url.startsWith(CATALOG_PHOTOS) ? '/cdn/catalog/' + url.slice(CATALOG_PHOTOS.length) : url);

export const label = {
  shape: (s?: string | null) => SHAPES.find((x) => x.slug === s)?.label ?? (s ? CATALOG_SHAPE_LABELS[s] ?? titleCase(s) : ''),
  metal: (s?: string | null) => METAL_COLORS.find((x) => x.slug === s)?.label ?? (s ? titleCase(s) : ''),
  setting: (s?: string | null) => SETTING_TYPES.find((x) => x.slug === s)?.label ?? (s ? titleCase(s) : ''),
  style: (s?: string | null) => STYLES.find((x) => x.slug === s)?.label ?? (s ? titleCase(s) : ''),
};

export function titleCase(s: string) {
  return s
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function purityMultiplier(p: string) {
  return PURITIES.find((x) => x.slug === p)?.multiplier ?? 1;
}

/** Display name for a metal selection, e.g. "14K Yellow Gold" */
export function metalName(purity: string, color: string) {
  return `${purity} ${label.metal(color)}`;
}
