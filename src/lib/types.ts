import type { ArtSpec } from '@/components/art/JewelryArt';

export type MediaImage = { url: string; alt: string | null; kind: string; metalColor: string | null };

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

export type VariantData = { id: string; sku: string; purity: string; metalColor: string; price: number; stock: number };

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
  variants: VariantData[];
  diamondOptions: DiamondOptionData[];
  defaultDiamond: DiamondData | null;
  reviews: ReviewData[];
  collections: { slug: string; name: string }[];
  updatedAt: string;
};

export type FacetOption = { value: string; label: string; count: number };
export type Facets = Record<string, FacetOption[]>;
