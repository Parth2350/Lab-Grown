import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from './db';
import { getCardsByIds, getCatalogIndex } from './catalog';
import { QUIZ_QUESTIONS, QUIZ_SLUG, type QuizQuestion } from '@/config/quiz';
import { label } from '@/lib/catalog';
import { parseRange, type IndexRow } from '@/lib/filters';
import type { ProductCard } from '@/lib/types';

/**
 * "Find Your Match" recommendation engine.
 * Products are scored against every answer, then picked through progressively relaxed
 * constraint tiers so the shopper always receives a full set of suggestions — the
 * strongest (exact) matches first, then the closest alternatives.
 */

export type QuizAnswers = Record<string, string>;
export type QuizDefinition = { id: string | null; title: string; questions: QuizQuestion[] };
export type QuizLink = { label: string; href: string };
export type Recommendation = { ids: string[]; exactCount: number; products: ProductCard[]; links: QuizLink[] };

const DEFAULT_TITLE = 'Find Your Match';
const ANY = new Set(['any', 'not-sure', '']);

// ───────────────────────────── quiz definition ─────────────────────────────

const questionSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  layout: z.enum(['grid', 'shapes', 'list']).optional(),
  options: z
    .array(z.object({ value: z.string().min(1).max(60), label: z.string().min(1).max(120), hint: z.string().max(200).optional() }))
    .min(2)
    .max(24),
});

/** Loads the quiz from the database (admin-editable), falling back to the built-in definition. */
export const getQuizDefinition = unstable_cache(
  async (): Promise<QuizDefinition> => {
    try {
      const row = await db.recommendationQuiz.findUnique({ where: { slug: QUIZ_SLUG }, select: { id: true, title: true, questions: true, isActive: true } });
      if (row) {
        const parsed = z.array(questionSchema).min(1).max(20).safeParse(row.questions);
        return { id: row.id, title: row.title || DEFAULT_TITLE, questions: row.isActive && parsed.success ? parsed.data : QUIZ_QUESTIONS };
      }
    } catch {
      /* database unavailable — use the built-in quiz */
    }
    return { id: null, title: DEFAULT_TITLE, questions: QUIZ_QUESTIONS };
  },
  ['quiz-definition', QUIZ_SLUG],
  { tags: ['quiz'], revalidate: 3600 },
);

/** Keeps only answers to known questions with valid option values. */
export function sanitizeAnswers(questions: QuizQuestion[], raw: Record<string, unknown>): QuizAnswers {
  const out: QuizAnswers = {};
  for (const q of questions) {
    const v = raw[q.id];
    if (typeof v === 'string' && q.options.some((o) => o.value === v)) out[q.id] = v;
  }
  return out;
}

// ───────────────────────────── vocabulary mapping ─────────────────────────────

const TYPE_CATEGORIES: Record<string, string[]> = {
  engagement: ['engagement-rings'],
  band: ['wedding-bands'],
  ring: ['rings'],
  earrings: ['earrings'],
  necklace: ['necklaces', 'pendants'],
  bracelet: ['bracelets'],
};

const CATEGORY_LABELS: Record<string, string> = {
  'engagement-rings': 'Engagement Rings',
  'wedding-bands': 'Wedding Bands',
  rings: 'Rings',
  earrings: 'Earrings',
  necklaces: 'Necklaces',
  pendants: 'Pendants',
  bracelets: 'Bracelets',
};

type Affinity = { styles: string[]; collections: string[]; categories?: string[]; text?: string[] };

const OCCASIONS: Record<string, Affinity & { link?: QuizLink }> = {
  engagement: {
    styles: ['solitaire', 'halo', 'hidden-halo', 'three-stone', 'toi-et-moi'],
    collections: ['engagement', 'bridal'],
    categories: ['engagement-rings'],
    link: { label: 'The Engagement Edit', href: '/collections/engagement' },
  },
  wedding: {
    styles: ['eternity'],
    collections: ['bridal', 'wedding-gifts', 'bridal-gifts', 'eternity'],
    categories: ['wedding-bands'],
    link: { label: 'Wedding Gifts', href: '/collections/wedding-gifts' },
  },
  anniversary: {
    styles: ['anniversary', 'eternity', 'three-stone'],
    collections: ['anniversary-gifts', 'eternity', 'three-stone'],
    link: { label: 'Anniversary Gifts', href: '/collections/anniversary-gifts' },
  },
  birthday: {
    styles: ['stud', 'hoop', 'layering'],
    collections: ['birthday-gifts'],
    link: { label: 'Birthday Gifts', href: '/collections/birthday-gifts' },
  },
  milestone: {
    styles: ['tennis', 'three-stone', 'eternity'],
    collections: ['anniversary-gifts', 'tennis', 'three-stone'],
    link: { label: 'Tennis Jewelry', href: '/collections/tennis' },
  },
  everyday: {
    styles: ['stud', 'stackable', 'layering', 'bezel', 'hoop'],
    collections: ['stackable', 'birthday-gifts'],
    link: { label: 'Stackable Pieces', href: '/collections/stackable' },
  },
};

const STYLES: Record<string, Affinity & { link: QuizLink }> = {
  classic: { styles: ['solitaire', 'halo', 'eternity', 'tennis', 'stud'], collections: ['solitaire', 'eternity', 'tennis'], link: { label: 'Solitaire Collection', href: '/collections/solitaire' } },
  modern: { styles: ['modern', 'bezel'], collections: ['geometric'], text: ['east west'], link: { label: 'Geometric Collection', href: '/collections/geometric' } },
  vintage: { styles: ['vintage', 'halo'], collections: ['art-deco'], link: { label: 'Art Deco Collection', href: '/collections/art-deco' } },
  statement: {
    styles: ['cocktail', 'toi-et-moi', 'three-stone', 'bold-gold', 'tennis'],
    collections: ['toi-et-moi', 'three-stone', 'tennis'],
    link: { label: 'Tennis Collection', href: '/collections/tennis' },
  },
  delicate: { styles: ['stackable', 'layering', 'stud', 'bezel', 'hoop'], collections: ['stackable'], link: { label: 'Stackable Collection', href: '/collections/stackable' } },
};

const overlap = (a: string[], b: string[], cap = 2) => Math.min(cap, a.filter((x) => b.includes(x)).length);

// ───────────────────────────── scoring ─────────────────────────────

type Context = {
  categories: string[];
  budget: [number, number] | null; // cents
  metal: string | null;
  shape: string | null;
  style: Affinity | null;
  occasion: Affinity | null;
  recipient: string | null;
  typeChosen: boolean;
};

function contextFor(a: QuizAnswers): Context {
  const pick = (k: string) => (a[k] && !ANY.has(a[k]) ? a[k] : null);
  const budget = pick('budget');
  let range: [number, number] | null = null;
  if (budget) {
    const [min, max] = parseRange(budget);
    range = [min * 100, max === Infinity ? Infinity : max * 100];
  }
  const type = pick('type');
  return {
    categories: (type && TYPE_CATEGORIES[type]) || [],
    budget: range,
    metal: pick('metal'),
    shape: pick('shape'),
    style: (pick('style') && STYLES[a.style]) || null,
    occasion: (pick('occasion') && OCCASIONS[a.occasion]) || null,
    recipient: pick('recipient'),
    typeChosen: Boolean(type && TYPE_CATEGORIES[type]),
  };
}

const hasMetal = (r: IndexRow, metal: string) => r.metalColors.some((m) => m.split('-').includes(metal));

function affinity(r: IndexRow, aff: Affinity, wStyle: number, wColl: number) {
  let s = wStyle * overlap(r.styles, aff.styles) + wColl * overlap(r.collections, aff.collections);
  if (aff.text?.some((t) => r.text.includes(t))) s += wStyle;
  return s;
}

function score(r: IndexRow, c: Context) {
  let s = 0;
  if (c.categories.length && c.categories.includes(r.category)) s += 40;

  if (c.budget) {
    const [min, max] = c.budget;
    const p = r.fromPrice;
    if (p >= min && p <= max) {
      s += 30;
      // within the range, favour pieces that use the budget well rather than the cheapest
      if (Number.isFinite(max)) s += 6 * (1 - Math.min(1, Math.abs(p - (min + max) / 2) / Math.max(1, (max - min) / 2)));
      else s += Math.min(6, ((p - min) / Math.max(1, min)) * 6);
    } else if (p > max) {
      s -= Math.min(45, ((p - max) / Math.max(1, max)) * 45);
    } else {
      s -= Math.min(30, ((min - p) / Math.max(1, min)) * 30);
    }
  }

  if (c.metal) s += hasMetal(r, c.metal) ? 12 : -8;
  if (c.shape) s += r.shapes.includes(c.shape) ? 14 : r.shapes.length ? -4 : 0;
  if (c.style) s += affinity(r, c.style, 7, 5);
  if (c.occasion) {
    s += affinity(r, c.occasion, 3, 5);
    if (!c.typeChosen && c.occasion.categories?.includes(r.category)) s += 15;
  }
  if (c.recipient === 'proposal' && r.category === 'engagement-rings') s += 10;
  if (c.recipient === 'family' && !c.typeChosen && (r.category === 'engagement-rings' || r.category === 'wedding-bands')) s -= 15;

  s += (r.isTrending ? 2 : 0) + (r.isFeatured ? 1 : 0);
  return s;
}

// ───────────────────────────── recommend ─────────────────────────────

export async function recommendProducts(answers: QuizAnswers, limit = 8): Promise<Recommendation> {
  const index = await getCatalogIndex();
  const c = contextFor(answers);

  const inCat = (r: IndexRow) => !c.categories.length || c.categories.includes(r.category);
  const inBudget = (r: IndexRow, tol: number) => !c.budget || (r.fromPrice <= c.budget[1] * tol && r.fromPrice >= c.budget[0] / tol);
  const metalOk = (r: IndexRow) => !c.metal || hasMetal(r, c.metal);
  const shapeOk = (r: IndexRow) => !c.shape || r.shapes.includes(c.shape);

  // Strictest first. Each tier only adds products the previous tiers did not already include.
  const tiers: ((r: IndexRow) => boolean)[] = [
    (r) => inCat(r) && inBudget(r, 1) && metalOk(r) && shapeOk(r),
    (r) => inCat(r) && inBudget(r, 1) && metalOk(r),
    (r) => inCat(r) && inBudget(r, 1.25),
    (r) => inCat(r) && inBudget(r, 1.75),
    (r) => inCat(r),
    (r) => inBudget(r, 1.25),
    () => true,
  ];

  const scored = new Map(index.map((r) => [r.id, score(r, c)]));
  const byScore = (a: IndexRow, b: IndexRow) => scored.get(b.id)! - scored.get(a.id)! || a.position - b.position;

  const chosen: IndexRow[] = [];
  const seen = new Set<string>();
  let exactCount = 0;
  for (const [i, tier] of tiers.entries()) {
    if (chosen.length >= limit) break;
    const pool = index.filter((r) => !seen.has(r.id) && tier(r)).sort(byScore);
    for (const r of pool) {
      if (chosen.length >= limit) break;
      chosen.push(r);
      seen.add(r.id);
      if (i === 0) exactCount++;
    }
  }

  const ids = chosen.map((r) => r.id);
  const products = await getCardsByIds(ids);
  return { ids: products.map((p) => p.id), exactCount: Math.min(exactCount, products.length), products, links: buildLinks(answers) };
}

/** Collection links that continue the shopper's journey from their answers. */
export function buildLinks(a: QuizAnswers): QuizLink[] {
  const c = contextFor(a);
  const links: QuizLink[] = [];
  const q = new URLSearchParams();
  if (c.metal) q.set('metal', c.metal);
  if (c.shape) q.set('shape', c.shape);
  const qs = q.toString() ? `?${q.toString()}` : '';
  const refinements = [c.shape && label.shape(c.shape), c.metal && label.metal(c.metal)].filter(Boolean).join(' · ');
  for (const cat of c.categories) links.push({ label: [CATEGORY_LABELS[cat] ?? cat, refinements].filter(Boolean).join(' · '), href: `/${cat}${qs}` });
  const occasion = c.occasion ? OCCASIONS[a.occasion] : undefined;
  if (occasion?.link) links.push(occasion.link);
  const style = c.style ? STYLES[a.style] : undefined;
  if (style) links.push(style.link);
  if (c.budget && Number.isFinite(c.budget[1])) {
    const max = c.budget[1];
    if (max <= 25000) links.push({ label: 'Gifts Under $250', href: '/collections/gifts-under-250' });
    else if (max <= 50000) links.push({ label: 'Gifts Under $500', href: '/collections/gifts-under-500' });
    else if (max <= 100000) links.push({ label: 'Gifts Under $1,000', href: '/collections/gifts-under-1000' });
  }
  if (c.shape) links.push({ label: `${label.shape(c.shape)} Diamonds`, href: `/collections/shape/${c.shape}` });
  const seen = new Set<string>();
  return links.filter((l) => !seen.has(l.href) && seen.add(l.href)).slice(0, 5);
}

// ───────────────────────────── persistence ─────────────────────────────

export async function saveQuizResult({ quizId, userId, answers, ids }: { quizId: string | null; userId?: string | null; answers: QuizAnswers; ids: string[] }) {
  let qid = quizId;
  if (!qid) {
    const row = await db.recommendationQuiz.upsert({
      where: { slug: QUIZ_SLUG },
      update: {},
      create: { slug: QUIZ_SLUG, title: DEFAULT_TITLE, questions: QUIZ_QUESTIONS as unknown as Prisma.InputJsonValue },
      select: { id: true },
    });
    qid = row.id;
  }
  const data = { quizId: qid, answers: answers as Prisma.InputJsonValue, recommendedIds: ids };
  try {
    const saved = await db.recommendationAnswer.create({ data: { ...data, userId: userId ?? null }, select: { id: true } });
    return saved.id;
  } catch (err) {
    // a stale session can reference a user that no longer exists — save anonymously instead
    if (!userId) throw err;
    const saved = await db.recommendationAnswer.create({ data, select: { id: true } });
    return saved.id;
  }
}
