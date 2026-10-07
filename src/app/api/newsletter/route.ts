import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/server/db';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ email: z.string().email().max(200) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  await db.newsletterSubscriber.upsert({ where: { email: parsed.data.email.toLowerCase() }, update: {}, create: { email: parsed.data.email.toLowerCase() } });
  return NextResponse.json({ ok: true });
}
