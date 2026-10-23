import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { lastMatch, matchProducts, saveMatch, tasteTiles } from '@/lib/server/recommend';
import { MATCH_CATEGORIES, MATCH_METALS, MATCH_OCCASIONS } from '@/config/quiz';
import { matchSchema } from '@/components/content/forms/schemas';
import { badRequest, clientIp, rateLimit, readJson, tooManyRequests, validationError } from '@/components/content/server/guard';

const CATEGORIES = new Set<string>(MATCH_CATEGORIES.map((c) => c.slug));
const METALS = new Set<string>(MATCH_METALS.map((m) => m.slug));
const OCCASIONS = new Set<string>(MATCH_OCCASIONS.map((o) => o.value));

/** Find Your Match: the taste step's pieces, or the ranked matches (saved to the account when signed in) */
export async function POST(req: Request) {
  const limit = rateLimit(`quiz:${clientIp(req)}`, 60, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await readJson(req);
  if (!body) return badRequest('We could not read your answers. Please try again.');
  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error, 'We could not read your answers. Please try again.');

  const { step, occasion, categories, budget, metal, liked } = parsed.data;
  const answers = {
    occasion: occasion && OCCASIONS.has(occasion) ? occasion : undefined,
    categories: categories.filter((c) => CATEGORIES.has(c)),
    budget: budget && (budget.max == null || budget.max > budget.min) ? budget : null,
    metal: metal && METALS.has(metal) ? metal : null,
    liked,
  };

  if (step === 'taste') return NextResponse.json({ ok: true, tiles: await tasteTiles(answers) });

  const result = await matchProducts(answers);
  const session = await getSession().catch(() => null);
  try {
    await saveMatch(session?.user?.id ?? null, answers, result.ids);
  } catch {
    // saving is best-effort — never block the shopper's matches
  }
  return NextResponse.json({ ok: true, products: result.products });
}

/** A signed-in shopper's saved matches, so they come back on any device */
export async function GET() {
  const session = await getSession().catch(() => null);
  const saved = session?.user?.id ? await lastMatch(session.user.id) : null;
  return NextResponse.json({ ok: true, saved });
}
