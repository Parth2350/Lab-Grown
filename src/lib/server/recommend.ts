import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from './db';
import { getCardsByIds, getCatalogIndex } from './catalog';
import { MATCH_CATEGORIES, QUIZ_SLUG } from '@/config/quiz';
import type { IndexRow } from '@/lib/filters';
import type { ProductCard } from '@/lib/types';

/**
 * "Find Your Match". The shopper's categories, budget and metal narrow the catalogue; the pieces they tap on the
 * taste step then rank what remains, most similar first. The optional metal, then the budget, are relaxed rather
 * than come back with too few pieces.
 */

/** budget in paise */
export type MatchAnswers = { occasion?: string; categories: string[]; budget?: { min: number; max: number | null } | null; metal?: string | null; liked: string[] };
export type TasteTile = { id: string; name: string; image: string };

const CATEGORIES = new Set<string>(MATCH_CATEGORIES.map((c) => c.slug));

async function candidates(a: MatchAnswers, need: number) {
  const rows = (await getCatalogIndex()).filter((r) => (a.categories.length ? a.categories.includes(r.category) : CATEGORIES.has(r.category))).sort((x, y) => x.position - y.position);
  const inBudget = (r: IndexRow) => !a.budget || (r.fromPrice >= a.budget.min && (a.budget.max == null || r.fromPrice <= a.budget.max));
  const inMetal = (r: IndexRow) => !a.metal || r.metalColors.includes(a.metal);
  for (const keep of [(r: IndexRow) => inBudget(r) && inMetal(r), inBudget]) {
    const hit = rows.filter(keep);
    if (hit.length >= need) return hit;
  }
  return rows;
}

/** The photo in the shopper's metal, else the first one */
const photo = (c: ProductCard, metal?: string | null) => {
  const photos = c.images.filter((i) => i.kind === 'image');
  return (photos.find((i) => i.metalColor === metal) ?? photos[0])?.url;
};

/** 12 varied pieces to tap: the chosen categories take turns, and near-duplicates (same style and shape) wait until last */
export async function tasteTiles(a: MatchAnswers, count = 12): Promise<TasteTile[]> {
  const seen: Record<string, number> = {};
  const turns = (await candidates(a, count)).map((r) => ({ r, turn: (seen[r.category] = (seen[r.category] ?? -1) + 1) })).sort((x, y) => x.turn - y.turn).map((x) => x.r);
  const look = (r: IndexRow) => `${r.category}|${r.styles[0] ?? ''}|${r.shapes[0] ?? ''}`;
  const looks = new Set<string>();
  const picked: IndexRow[] = [];
  for (const r of turns) {
    if (picked.length < count && !looks.has(look(r))) {
      looks.add(look(r));
      picked.push(r);
    }
  }
  for (const r of turns) if (picked.length < count && !picked.includes(r)) picked.push(r);
  const cards = await getCardsByIds(picked.map((r) => r.id));
  return cards.flatMap((c) => {
    const image = photo(c, a.metal);
    return image ? [{ id: c.id, name: c.name, image }] : [];
  });
}

const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x)).length;

function similarity(r: IndexRow, liked: IndexRow) {
  const price = Math.abs(Math.log(Math.max(r.fromPrice, 1) / Math.max(liked.fromPrice, 1)));
  return (
    (r.id === liked.id ? 5 : 0) +
    (r.category === liked.category ? 2 : 0) +
    overlap(r.styles, liked.styles) * 3 +
    overlap(r.shapes, liked.shapes) * 2 +
    overlap(r.metalColors, liked.metalColors) +
    (r.settingType && r.settingType === liked.settingType ? 1 : 0) +
    Math.max(0, 2 - price * 2)
  );
}

/** The matches, ranked by how much each piece resembles the ones the shopper tapped */
export async function matchProducts(a: MatchAnswers, count = 20): Promise<{ ids: string[]; products: ProductCard[] }> {
  const rows = await candidates(a, count);
  const index = new Map((await getCatalogIndex()).map((r) => [r.id, r]));
  const liked = a.liked.map((id) => index.get(id)).filter((r): r is IndexRow => !!r);
  const score = new Map(rows.map((r) => [r.id, liked.reduce((s, l) => s + similarity(r, l), 0)]));
  const ids = (liked.length ? [...rows].sort((x, y) => score.get(y.id)! - score.get(x.id)! || x.position - y.position) : rows).slice(0, count).map((r) => r.id);
  return { ids, products: await getCardsByIds(ids) };
}

// ───────────────────────────── saved matches ─────────────────────────────

export async function saveMatch(userId: string | null, answers: MatchAnswers, ids: string[]) {
  const quiz = await db.recommendationQuiz.upsert({ where: { slug: QUIZ_SLUG }, update: {}, create: { slug: QUIZ_SLUG, title: 'Find Your Match', questions: [] }, select: { id: true } });
  const data = { quizId: quiz.id, answers: answers as unknown as Prisma.InputJsonValue, recommendedIds: ids };
  try {
    await db.recommendationAnswer.create({ data: { ...data, userId } });
  } catch (err) {
    // a stale session can reference a user that no longer exists — save anonymously instead
    if (!userId) throw err;
    await db.recommendationAnswer.create({ data });
  }
}

/** A signed-in shopper's latest matches */
export async function lastMatch(userId: string) {
  const row = await db.recommendationAnswer.findFirst({ where: { userId, quiz: { slug: QUIZ_SLUG } }, orderBy: { createdAt: 'desc' }, select: { answers: true, recommendedIds: true } });
  if (!row || !row.recommendedIds.length) return null;
  return { answers: row.answers as unknown as MatchAnswers, products: await getCardsByIds(row.recommendedIds) };
}
