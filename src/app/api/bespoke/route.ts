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
    // details without a column of their own reach the design team as labelled lines in the notes
    const notes = [
      d.idea && `Idea: ${d.idea}`,
      d.links.length && `Reference links:\n${d.links.join('\n')}`,
      d.metalStamp && `Metal stamp: ${d.metalStamp}`,
      d.goldWeight && `Approx gold weight: ${d.goldWeight} g`,
      d.totalCarat && `Total diamond weight: ${d.totalCarat} ctw`,
      d.setting && `Setting type: ${d.setting}`,
      d.needBy && `Needed by: ${d.needBy}`,
      d.notes && `Anything else: ${d.notes}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    const row = await db.bespokeRequest.create({
      data: {
        jewelryType: d.jewelryType ?? 'Not specified',
        shape: d.shape ?? null,
        carat: d.carat ? `${d.carat} ct` : null,
        metal: d.metal ?? null,
        budget: d.budget ?? null,
        inspirationUrls: [...new Set(d.inspirationUrls)],
        notes: notes || null,
        name: d.name,
        email: d.email,
        phone: d.phone ?? null,
        country: req.headers.get('x-vercel-ip-country'),
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, reference: reference(row.id) });
  } catch {
    return serverError('We could not submit your request just now. Please try again in a moment.');
  }
}
