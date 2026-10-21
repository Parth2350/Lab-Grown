/**
 * Catalogue variants carry their own options (shape, carat, chain length) and an exact price.
 * Shared by the product page, the bag, WhatsApp messages and server-side pricing.
 */
import { label } from './catalog';
import type { StoneData, VariantData } from './types';

type VariantOptions = { shape?: string | null; centerCarat?: number | null; totalCarat?: number | null; length?: string | null };

/** 1 → "1", 1.5 → "1.5", 2.08 → "2.08" */
export const fmtCarat = (n: number) => String(Math.round(n * 100) / 100);

/** The carat the shopper chooses: centre stone or total weight, as the product defines it */
export const caratOf = (v: VariantOptions, caratKind?: string | null) => (caratKind === 'total' ? v.totalCarat : v.centerCarat ?? v.totalCarat) ?? null;

/** "Oval · 2.08 ct centre · 2.63 ctw · 16 in" — null when the variant has no options */
export function variantSummary(v: VariantOptions) {
  const parts: string[] = [];
  if (v.shape) parts.push(label.shape(v.shape));
  if (v.centerCarat) parts.push(`${fmtCarat(v.centerCarat)} ct centre`);
  if (v.totalCarat && v.totalCarat !== v.centerCarat) parts.push(`${fmtCarat(v.totalCarat)} ctw`);
  if (v.length) parts.push(`${v.length} in`);
  return parts.length ? parts.join(' · ') : null;
}

/** Ring-size prices: larger sizes use more gold */
export const sizedPrice = (v: { price: number; sizePrices?: Record<string, number> | null }, ringSize?: string | null) =>
  (ringSize && v.sizePrices?.[ringSize]) || v.price;

// ── compact transfer: big catalogue products have hundreds of variants, so the product page sends them
//    as rows of values instead of repeating every field name (≈60% less page weight) ──
const VARIANT_KEYS = ['id', 'sku', 'purity', 'metalColor', 'price', 'stock', 'shape', 'centerCarat', 'totalCarat', 'length', 'stonesIdx', 'sizePrices'] as const;
type PackedValue = string | number | null | (number | null)[];
const STONE_KEYS = ['role', 'shape', 'type', 'color', 'clarity', 'size', 'pieces', 'carat'] as const;
type StoneRow = (string | number | null)[];
/** sizes: the ring-size order that sizePrices are listed in; stones: the product's stone sets */
export type PackedVariants = { sizes: string[]; rows: PackedValue[][]; stones: StoneRow[][] };

export function packVariants(vs: VariantData[], stoneSets: StoneData[][] = []): PackedVariants {
  const sizes = [...new Set(vs.flatMap((v) => Object.keys(v.sizePrices ?? {})))];
  const rows = vs.map((v) => VARIANT_KEYS.map((k) => (k === 'sizePrices' ? (v.sizePrices ? sizes.map((s) => v.sizePrices![s] ?? null) : null) : ((v[k] ?? null) as PackedValue))));
  const stones = stoneSets.map((set) => set.map((st) => STONE_KEYS.map((k) => st[k] ?? null)));
  return { sizes, rows, stones };
}

export function unpackVariants({ sizes, rows }: PackedVariants): VariantData[] {
  return rows.map((r) => {
    const v = Object.fromEntries(VARIANT_KEYS.map((k, i) => [k, r[i]])) as Record<string, unknown>;
    const prices = v.sizePrices as (number | null)[] | null;
    v.sizePrices = prices ? Object.fromEntries(sizes.flatMap((s, i) => (prices[i] != null ? [[s, prices[i]]] : []))) : null;
    return v as unknown as VariantData;
  });
}

export const unpackStones = ({ stones }: PackedVariants): StoneData[][] => stones.map((set) => set.map((r) => Object.fromEntries(STONE_KEYS.map((k, i) => [k, r[i]])) as unknown as StoneData));
