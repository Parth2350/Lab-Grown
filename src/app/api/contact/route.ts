import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { contactSchema } from '@/components/content/forms/schemas';
import { badRequest, clientIp, isBot, rateLimit, readJson, serverError, tooManyRequests, validationError } from '@/components/content/server/guard';

export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientIp(req)}`, 6, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await readJson(req);
  if (!body) return badRequest('We could not read your message. Please try again.');
  if (isBot(body)) return NextResponse.json({ ok: true });

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { name, email, phone, subject, message } = parsed.data;
    await db.contactMessage.create({ data: { name, email, phone: phone ?? null, subject, message } });
    return NextResponse.json({ ok: true });
  } catch {
    return serverError('We could not send your message just now. Please try again, or email us directly.');
  }
}
