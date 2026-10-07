import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { partnerSchema } from '@/components/content/forms/schemas';
import { badRequest, clientIp, isBot, rateLimit, readJson, serverError, tooManyRequests, validationError } from '@/components/content/server/guard';

export async function POST(req: Request) {
  const limit = rateLimit(`partner:${clientIp(req)}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await readJson(req);
  if (!body) return badRequest('We could not read your application. Please try again.');
  if (isBot(body)) return NextResponse.json({ ok: true });

  const parsed = partnerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const d = parsed.data;
    await db.partnerApplication.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone ?? null,
        country: d.country,
        company: d.company ?? null,
        website: d.website ?? null,
        socialHandle: d.socialHandle ?? null,
        audienceSize: d.audienceSize ?? null,
        experience: d.experience,
        message: d.message ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return serverError('We could not submit your application just now. Please try again in a moment.');
  }
}
