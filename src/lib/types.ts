import type { ArtSpec } from '@/components/art/JewelryArt';

export type MediaImage = { url: string; alt: string | null; kind: string; metalColor: string | null; shape?: string | null };

/** Lightweight product shape used by cards, carousels, wishlist and compare */
export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: { slug: string; name: string };
  fromPrice: number;
  priceByPurity: Record<string, number>;
  metalColors: string[];
  purities: string[];
  defaultMetalColor: string;
  defaultPurity: string;
  shapes: string[];
  centerCarat: number | null;
  totalCarat: number | null;
  settingType: string | null;
  styles: string[];
  art: ArtSpec | null;
  images: MediaImage[];
  rating: number;
  reviewCount: number;
  isNew: boolean;
  hasCenterStone: boolean;
  inStock: boolean;
};

export type DiamondData = {
  id: string;
  sku: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
  measurements: string | null;
  tablePct: number | null;
  depthPct: number | null;
  ratio: number | null;
  growth: string;
  price: number;
  certificate: { lab: string; number: string; url: string | null } | null;
};

export type StoneData = { role: 'center' | 'side'; shape: string | null; type: string; color: string | null; clarity: string | null; size: string | null; pieces: number | null; carat: number | null };

export type VariantData = {
  id: string;
  sku: string;
  purity: string;
  metalColor: string;
  price: number;
  stock: number;
  /** catalogue option axes (null for admin-made products) */
  shape?: string | null;
  centerCarat?: number | null;
  totalCarat?: number | null;
  length?: string | null;
  /** index into ProductDetail.stoneSets (many variants share the same stones) */
  stonesIdx?: number | null;
  /** ring-size prices in paise */
  sizePrices?: Record<string, number> | null;
};

export type DiamondOptionData = {
  id: string;
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
};

export type ReviewData = {
  id: string;
  authorName: string;
  location: string | null;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
};

export type ProductDetail = ProductCard & {
  subtitle: string | null;
  description: string;
  details: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  requiresSize: boolean;
  /** partner catalogue product (null = made in the admin) */
  familyKey: string | null;
  sourceTitle: string | null;
  productType: string | null;
  ringSizes: string[];
  showEngraving: boolean;
  madeToOrder: boolean;
  /** extra product-page choices carried by the variants: "shape" | "carat" | "length" */
  optionAxes: string[];
  caratKind: string | null;
  /** distinct stone breakdowns of the catalogue variants (see VariantData.stonesIdx) */
  stoneSets: StoneData[][];
  variants: VariantData[];
  diamondOptions: DiamondOptionData[];
  defaultDiamond: DiamondData | null;
  reviews: ReviewData[];
  collections: { slug: string; name: string }[];
  updatedAt: string;
};

export type FacetOption = { value: string; label: string; count: number };
export type Facets = Record<string, FacetOption[]>;
