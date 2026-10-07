import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { getQuizDefinition, recommendProducts, sanitizeAnswers, saveQuizResult } from '@/lib/server/recommend';
import { quizSchema } from '@/components/content/forms/schemas';
import { badRequest, clientIp, rateLimit, readJson, tooManyRequests, validationError } from '@/components/content/server/guard';

export async function POST(req: Request) {
  const limit = rateLimit(`quiz:${clientIp(req)}`, 30, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await readJson(req);
  if (!body) return badRequest('We could not read your answers. Please try again.');
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error, 'We could not read your answers. Please try again.');

  const quiz = await getQuizDefinition();
  const answers = sanitizeAnswers(quiz.questions, parsed.data.answers);
  if (!Object.keys(answers).length) return badRequest('Please answer at least one question so we can find your matches.');

  const result = await recommendProducts(answers, 8);

  let id: string | null = null;
  try {
    const session = await getSession().catch(() => null);
    id = await saveQuizResult({ quizId: quiz.id, userId: session?.user?.id ?? null, answers, ids: result.ids });
  } catch {
    // saving is best-effort analytics — never block the shopper's results
  }

  return NextResponse.json({ ok: true, id, answers, exactCount: result.exactCount, products: result.products, links: result.links });
}
