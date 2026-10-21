import 'server-only';
import { label } from '@/lib/catalog';

/**
 * A product in the partner catalogue's own shape (the BrillianceCarat product object), built from our
 * database — shown in the admin product list and editor. Prices are whole rupees, as in the source.
 */
type V = { sku: string; purity: string; metalColor: string; price: number; isActive: boolean; shape: string | null; centerCarat: number | null; totalCarat: number | null; length: string | null };
type Img = { url: string; kind: string; metalColor: string | null; shape?: string | null };
export type ProductObjectSource = {
  familyKey: string | null;
  sku: string;
  slug: string;
  sourceTitle: string | null;
  name: string;
  productType: string | null;
  category: { name: string };
  fromPrice: number;
  priceTo: number;
  isActive: boolean;
  metalColors: string[];
  purities: string[];
  defaultMetalColor: string;
  defaultPurity: string;
  shapes: string[];
  centerCarat: number | null;
  totalCarat: number | null;
  images: Img[];
  variants: V[];
};

const PURITY_ORDER = ['9K', '10K', '14K', '18K'];
const rupees = (paise: number) => Math.round(paise / 100);
const sortedNumbers = (xs: (number | null)[]) => [...new Set(xs.filter((x): x is number => x != null))].sort((a, b) => a - b);

export function productObject(p: ProductObjectSource) {
  const live = p.variants.filter((v) => v.isActive);
  const vs = live.length ? live : p.variants;
  const home = (v: V) => v.metalColor === p.defaultMetalColor && v.purity === p.defaultPurity;
  const def =
    vs.find((v) => home(v) && (v.shape ?? null) === (p.shapes[0] ?? v.shape ?? null) && (v.centerCarat ?? null) === (p.centerCarat ?? v.centerCarat ?? null) && (v.totalCarat ?? null) === (p.totalCarat ?? v.totalCarat ?? null)) ??
    vs.find(home) ??
    vs[0];
  const sameChoice = (v: V) => !def || ((v.shape ?? null) === (def.shape ?? null) && v.centerCarat === def.centerCarat && v.totalCarat === def.totalCarat && v.length === def.length);
  const photos = p.images.filter((i) => i.kind === 'image');
  const photosOf = (metal: string) => {
    const own = photos.filter((i) => i.metalColor === metal && (!i.shape || !def?.shape || i.shape === def.shape));
    return own.length ? own : photos.filter((i) => i.metalColor === metal);
  };
  const lead = photosOf(p.defaultMetalColor);
  const metalOptions = vs
    .filter(sameChoice)
    .sort((a, b) => p.metalColors.indexOf(a.metalColor) - p.metalColors.indexOf(b.metalColor) || PURITY_ORDER.indexOf(a.purity) - PURITY_ORDER.indexOf(b.purity))
    .map((v) => ({
      metalType: label.metal(v.metalColor),
      metalStamp: v.purity,
      price: rupees(v.price),
      image: photosOf(v.metalColor)[0]?.url ?? null,
      hoverImage: photosOf(v.metalColor)[1]?.url ?? null,
      itemCode: v.sku,
      available: v.isActive,
    }));
  const centerCarats = sortedNumbers(vs.map((v) => v.centerCarat));
  const totalCarats = sortedNumbers(vs.map((v) => v.totalCarat));
  return {
    familyKey: p.familyKey ?? p.sku,
    slug: p.slug,
    title: p.sourceTitle ?? p.name,
    displayTitle: p.name,
    productType: p.productType ?? p.category.name.toUpperCase(),
    image: lead[0]?.url ?? photos[0]?.url ?? null,
    hoverImage: lead[1]?.url ?? null,
    colorImages: Object.fromEntries(p.metalColors.map((m) => [label.metal(m), photosOf(m)[0]?.url ?? null]).filter(([, url]) => url)),
    currency: '₹',
    priceFrom: rupees(p.fromPrice),
    priceTo: rupees(p.priceTo || Math.max(0, ...vs.map((v) => v.price))),
    defaultPrice: def ? rupees(def.price) : null,
    compareAtFrom: null,
    compareAtTo: null,
    variantCount: p.variants.length,
    available: p.isActive && vs.some((v) => v.isActive),
    defaultItemCode: def?.sku ?? null,
    shapes: [...new Set([...vs.map((v) => v.shape), ...p.shapes].filter((s): s is string => !!s))].map((s) => label.shape(s)),
    centerCarats: centerCarats.length ? centerCarats : sortedNumbers([p.centerCarat]),
    totalCarats: totalCarats.length ? totalCarats : sortedNumbers([p.totalCarat]),
    lengths: [...new Set(vs.map((v) => v.length).filter((l): l is string => !!l))].sort((a, b) => Number(a) - Number(b)),
    metalStamps: PURITY_ORDER.filter((x) => p.purities.includes(x)),
    metalTypes: p.metalColors.map((m) => label.metal(m)),
    metalPrices: Object.fromEntries(p.metalColors.map((m) => [label.metal(m), rupees(Math.min(...vs.filter((v) => v.metalColor === m).map((v) => v.price)))]).filter(([, n]) => Number.isFinite(n))),
    metalOptions,
    defaultMetalType: label.metal(p.defaultMetalColor),
    defaultMetalStamp: p.defaultPurity,
  };
}

export type ProductObject = ReturnType<typeof productObject>;

/** select for productObject() */
export const productObjectSelect = {
  familyKey: true,
  sku: true,
  slug: true,
  sourceTitle: true,
  name: true,
  productType: true,
  category: { select: { name: true } },
  fromPrice: true,
  priceTo: true,
  isActive: true,
  metalColors: true,
  purities: true,
  defaultMetalColor: true,
  defaultPurity: true,
  shapes: true,
  centerCarat: true,
  totalCarat: true,
  images: { where: { kind: 'image' }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], take: 16, select: { url: true, kind: true, metalColor: true, shape: true } },
  variants: { select: { sku: true, purity: true, metalColor: true, price: true, isActive: true, shape: true, centerCarat: true, totalCarat: true, length: true } },
} as const;
