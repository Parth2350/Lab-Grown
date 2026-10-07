import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { bespokeSchema } from '@/components/content/forms/schemas';
import { badRequest, clientIp, isBot, rateLimit, readJson, serverError, tooManyRequests, validationError } from '@/components/content/server/guard';

/** Short, human-friendly reference derived from the request id. */
function reference(id: string) {
  return `BSP-${id.slice(-6).toUpperCase()}`;
}

export async function POST(req: Request) {
  const limit = rateLimit(`bespoke:${clientIp(req)}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await readJson(req);
  if (!body) return badRequest('We could not read your request. Please try again.');
  if (isBot(body)) return NextResponse.json({ ok: true, reference: reference('000000') });

  const parsed = bespokeSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const d = parsed.data;
    const row = await db.bespokeRequest.create({
      data: {
        jewelryType: d.jewelryType,
        shape: d.shape,
        carat: d.carat,
        metal: d.metal,
        budget: d.budget,
        inspirationUrls: [...new Set(d.inspirationUrls)],
        notes: d.notes ?? null,
        name: d.name,
        email: d.email,
        phone: d.phone ?? null,
        country: d.country ?? null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, reference: reference(row.id) });
  } catch {
    return serverError('We could not submit your request just now. Please try again in a moment.');
  }
}
