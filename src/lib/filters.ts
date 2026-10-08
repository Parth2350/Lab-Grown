/**
 * Collection filters: URL <-> state, plus the single matching predicate used for
 * listings AND facet counts so the two can never disagree.
 */
import { formatMoney } from './utils';
import {
  CARAT_RANGES,
  FILTER_COLLECTIONS,
  METAL_COLORS,
  PRICE_RANGES,
  PURITIES,
  SETTING_TYPES,
  SHAPES,
  SORT_OPTIONS,
  STYLES,
  label,
  type SortSlug,
} from './catalog';

export const FILTER_KEYS = ['price', 'metal', 'purity', 'shape', 'center', 'total', 'setting', 'style', 'collection'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export type Filters = Record<FilterKey, string[]> & { q: string; sort: SortSlug; page: number };

export const FILTER_GROUPS: { key: FilterKey; title: string; options: readonly { slug: string; label: string }[] }[] = [
  { key: 'price', title: 'Price', options: PRICE_RANGES },
  { key: 'metal', title: 'Metal Type', options: METAL_COLORS },
  { key: 'purity', title: 'Metal Purity', options: PURITIES },
  { key: 'shape', title: 'Diamond Shape', options: SHAPES },
  { key: 'center', title: 'Center Stone Carat', options: CARAT_RANGES },
  { key: 'total', title: 'Total Carat', options: CARAT_RANGES },
  { key: 'setting', title: 'Setting Type', options: SETTING_TYPES },
  { key: 'style', title: 'Style', options: STYLES },
  { key: 'collection', title: 'Collection', options: FILTER_COLLECTIONS },
];

type SP = Record<string, string | string[] | undefined> | URLSearchParams;

function read(sp: SP, key: string): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const v = sp[key];
  return Array.isArray(v) ? v.join(',') : v;
}

export function parseFilters(sp: SP): Filters {
  const f = { q: (read(sp, 'q') ?? '').trim().slice(0, 120) } as Filters;
  for (const k of FILTER_KEYS) {
    f[k] = (read(sp, k) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  const sort = read(sp, 'sort') as SortSlug | undefined;
  f.sort = SORT_OPTIONS.some((s) => s.slug === sort) ? sort! : 'featured';
  f.page = Math.max(1, Math.min(500, parseInt(read(sp, 'page') ?? '1', 10) || 1));
  return f;
}

export function filtersToSearch(f: Partial<Filters>, extra?: Record<string, string>) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  for (const k of FILTER_KEYS) if (f[k]?.length) p.set(k, f[k]!.join(','));
  if (f.sort && f.sort !== 'featured') p.set('sort', f.sort);
  if (f.page && f.page > 1) p.set('page', String(f.page));
  if (extra) for (const [k, v] of Object.entries(extra)) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function activeFilterCount(f: Filters) {
  return FILTER_KEYS.reduce((n, k) => n + f[k].length, 0);
}

/** "200-500" → [200, 500]; "1000-" → [1000, Infinity] (whole currency units) */
export function parseRange(slug: string): [number, number] {
  const [a, b] = slug.split('-');
  const min = Number(a) || 0;
  const max = b === '' || b === undefined ? Infinity : Number(b);
  return [min, Number.isFinite(max) ? max : Infinity];
}

export function rangeLabel(key: FilterKey, slug: string) {
  const group = FILTER_GROUPS.find((g) => g.key === key);
  const known = group?.options.find((o) => o.slug === slug);
  if (known) return known.label;
  if (key === 'price') {
    const [min, max] = parseRange(slug);
    if (!min) return `Under ${formatMoney(max * 100)}`;
    if (max === Infinity) return `${formatMoney(min * 100)}+`;
    return `${formatMoney(min * 100)} – ${formatMoney(max * 100)}`;
  }
  if (key === 'center' || key === 'total') {
    const [min, max] = parseRange(slug);
    return max === Infinity ? `${min} ct +` : `${min} – ${max} ct`;
  }
  if (key === 'metal') return label.metal(slug);
  if (key === 'shape') return label.shape(slug);
  if (key === 'style') return label.style(slug);
  if (key === 'setting') return label.setting(slug);
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ───────────────────────────── smart query parsing ─────────────────────────────

export type ParsedQuery = {
  terms: string[];
  carat?: { min: number; max: number };
  shapes: string[];
  styles: string[];
  metals: string[];
  purities: string[];
  categories: string[];
  sku?: string;
};

const CATEGORY_WORDS: Record<string, string> = {
  engagement: 'engagement-rings',
  proposal: 'engagement-rings',
  wedding: 'wedding-bands',
  band: 'wedding-bands',
  bands: 'wedding-bands',
  earring: 'earrings',
  earrings: 'earrings',
  studs: 'earrings',
  stud: 'earrings',
  hoops: 'earrings',
  pendant: 'pendants',
  pendants: 'pendants',
  necklace: 'necklaces',
  necklaces: 'necklaces',
  bracelet: 'bracelets',
  bracelets: 'bracelets',
  bangle: 'bracelets',
};
const STYLE_WORDS: Record<string, string> = {
  halo: 'halo',
  hidden: 'hidden-halo',
  solitaire: 'solitaire',
  eternity: 'eternity',
  tennis: 'tennis',
  vintage: 'vintage',
  bezel: 'bezel',
  hoop: 'hoop',
  hoops: 'hoop',
  stud: 'stud',
  studs: 'stud',
  drop: 'drop',
  drops: 'drop',
  baguette: 'baguette',
  stackable: 'stackable',
  stacking: 'stackable',
  cocktail: 'cocktail',
  anniversary: 'anniversary',
  modern: 'modern',
  layering: 'layering',
  toi: 'toi-et-moi',
  three: 'three-stone',
};
const STOP = new Set(['ct', 'carat', 'carats', 'ring', 'rings', 'diamond', 'diamonds', 'lab', 'grown', 'gold', 'and', 'with', 'the', 'a', 'et', 'moi', 'stone', 'cut', 'k']);

export function parseQuery(raw: string): ParsedQuery {
  const q = raw.toLowerCase().replace(/[^a-z0-9.\s-]/g, ' ');
  const out: ParsedQuery = { terms: [], shapes: [], styles: [], metals: [], purities: [], categories: [] };
  const sku = raw.match(/\b(aur-[a-z]{2}-\d{3,6}|lgd-\d{3,6}|sku\s*-?\s*\d{3,})/i);
  if (sku) out.sku = sku[0].replace(/\s+/g, '').toUpperCase();
  const ct = q.match(/(\d+(?:\.\d+)?)\s*(?:ct|carat|carats)\b/);
  if (ct) {
    const v = parseFloat(ct[1]);
    out.carat = { min: Math.max(0, v - 0.26), max: v + 0.49 };
  }
  const k = q.match(/\b(9|10|14|18)\s*k\b/);
  if (k) out.purities.push(`${k[1]}K`);
  const tokens = q.replace(/(\d+(?:\.\d+)?)\s*(?:ct|carat|carats)\b/g, ' ').split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    const shape = SHAPES.find((s) => s.slug === t || `${s.slug}s` === t);
    if (shape) {
      out.shapes.push(shape.slug);
      continue;
    }
    if (t === 'yellow' || t === 'white' || t === 'rose') {
      out.metals.push(t);
      continue;
    }
    if (STYLE_WORDS[t]) {
      // words like "studs" or "hoops" imply a style; the style match is enough
      out.styles.push(STYLE_WORDS[t]);
      continue;
    }
    if (CATEGORY_WORDS[t]) {
      out.categories.push(CATEGORY_WORDS[t]);
      continue;
    }
    if (STOP.has(t) || /^\d+k$/.test(t) || t.length < 2) continue;
    out.terms.push(t);
  }
  return out;
}

// ───────────────────────────── matching ─────────────────────────────

/** The minimum per-product data needed to filter, facet, sort and search */
export type IndexRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  categoryName: string;
  collections: string[];
  fromPrice: number;
  metalColors: string[];
  purities: string[];
  shapes: string[];
  centerCarat: number | null;
  totalCarat: number | null;
  caratSort: number;
  settingType: string | null;
  styles: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  position: number;
  createdAt: number;
  text: string;
};

export type Scope = {
  category?: string;
  collection?: string;
  shape?: string;
  maxPrice?: number;
  minPrice?: number;
  ids?: string[];
};

const inRanges = (value: number | null, slugs: string[], scale = 1) =>
  value != null &&
  slugs.some((s) => {
    const [min, max] = parseRange(s);
    return value >= min * scale && (max === Infinity || value < max * scale);
  });

export function matchesScope(r: IndexRow, s: Scope) {
  if (s.category && r.category !== s.category) return false;
  if (s.collection && !r.collections.includes(s.collection)) return false;
  if (s.shape && !r.shapes.includes(s.shape)) return false;
  if (s.maxPrice != null && r.fromPrice > s.maxPrice) return false;
  if (s.minPrice != null && r.fromPrice < s.minPrice) return false;
  if (s.ids && !s.ids.includes(r.id)) return false;
  return true;
}

export function matchesQuery(r: IndexRow, pq: ParsedQuery) {
  if (pq.sku) {
    const norm = pq.sku.replace(/^SKU-?/, '');
    if (/^(TVJ|AUR|LGD)-/.test(norm)) return r.sku.toUpperCase().includes(norm);
    const digits = norm.replace(/\D/g, '');
    return digits.length >= 3 && r.sku.includes(digits);
  }
  if (pq.shapes.length && !pq.shapes.some((s) => r.shapes.includes(s))) return false;
  if (pq.styles.length && !pq.styles.every((s) => r.styles.includes(s) || r.text.includes(s.replace(/-/g, ' ')))) return false;
  if (pq.metals.length && !pq.metals.some((m) => r.metalColors.some((c) => c.startsWith(m)))) return false;
  if (pq.purities.length && !pq.purities.some((p) => r.purities.includes(p))) return false;
  if (pq.categories.length && !pq.categories.includes(r.category)) return false;
  if (pq.carat) {
    const c = r.centerCarat ?? r.totalCarat;
    if (c == null || c < pq.carat.min || c > pq.carat.max) return false;
  }
  return pq.terms.every((t) => r.text.includes(t));
}

export function matchesFilters(r: IndexRow, f: Filters, except?: FilterKey) {
  const on = (k: FilterKey) => k !== except && f[k].length > 0;
  if (on('price') && !inRanges(r.fromPrice, f.price, 100)) return false;
  if (on('metal') && !f.metal.some((m) => r.metalColors.includes(m))) return false;
  if (on('purity') && !f.purity.some((p) => r.purities.includes(p))) return false;
  if (on('shape') && !f.shape.some((s) => r.shapes.includes(s))) return false;
  if (on('center') && !inRanges(r.centerCarat, f.center)) return false;
  if (on('total') && !inRanges(r.totalCarat, f.total)) return false;
  if (on('setting') && !(r.settingType && f.setting.includes(r.settingType))) return false;
  if (on('style') && !f.style.some((s) => r.styles.includes(s))) return false;
  if (on('collection') && !f.collection.some((c) => r.collections.includes(c))) return false;
  return true;
}

export function sortRows(rows: IndexRow[], sort: SortSlug) {
  const s = [...rows];
  switch (sort) {
    case 'price-asc':
      return s.sort((a, b) => a.fromPrice - b.fromPrice);
    case 'price-desc':
      return s.sort((a, b) => b.fromPrice - a.fromPrice);
    case 'carat-desc':
      return s.sort((a, b) => b.caratSort - a.caratSort || a.fromPrice - b.fromPrice);
    case 'carat-asc':
      return s.sort((a, b) => a.caratSort - b.caratSort || a.fromPrice - b.fromPrice);
    case 'newest':
      return s.sort((a, b) => b.createdAt - a.createdAt);
    default:
      return s.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isTrending) - Number(a.isTrending) || a.position - b.position,
      );
  }
}

/** Disjunctive facet counts: each group is counted with every *other* active filter applied */
export function computeFacets(rows: IndexRow[], f: Filters) {
  const facets: Record<string, { value: string; label: string; count: number }[]> = {};
  for (const g of FILTER_GROUPS) {
    const pool = rows.filter((r) => matchesFilters(r, f, g.key));
    const count = (slug: string) => {
      switch (g.key) {
        case 'price':
          return pool.filter((r) => inRanges(r.fromPrice, [slug], 100)).length;
        case 'metal':
          return pool.filter((r) => r.metalColors.includes(slug)).length;
        case 'purity':
          return pool.filter((r) => r.purities.includes(slug)).length;
        case 'shape':
          return pool.filter((r) => r.shapes.includes(slug)).length;
        case 'center':
          return pool.filter((r) => inRanges(r.centerCarat, [slug])).length;
        case 'total':
          return pool.filter((r) => inRanges(r.totalCarat, [slug])).length;
        case 'setting':
          return pool.filter((r) => r.settingType === slug).length;
        case 'style':
          return pool.filter((r) => r.styles.includes(slug)).length;
        case 'collection':
          return pool.filter((r) => r.collections.includes(slug)).length;
      }
    };
    const opts = g.options.map((o) => ({ value: o.slug, label: o.label, count: count(o.slug) }));
    // keep any active-but-unlisted values (e.g. a custom price range from a link) visible
    for (const v of f[g.key]) if (!opts.some((o) => o.value === v)) opts.unshift({ value: v, label: rangeLabel(g.key, v), count: count(v) });
    facets[g.key] = opts.filter((o) => o.count > 0 || f[g.key].includes(o.value));
  }
  return facets;
}
