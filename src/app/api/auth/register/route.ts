import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { fieldErrors, registerSchema } from '@/components/commerce/schemas';
import { assertSameOrigin, clientIp, errorResponse, rateLimit, readJson, tooMany, verifyReceiptToken } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const schema = registerSchema.extend({
  /** Optional: attach the guest order just placed in this browser (proved by its receipt token). */
  claim: z.object({ orderNumber: z.string().regex(/^[A-Z]{3}-\d{6}$/), token: z.string().max(64) }).nullish(),
});

const exists = () =>
  NextResponse.json({ error: 'An account with this email already exists. Sign in instead.', fieldErrors: { email: 'This email is already registered' } }, { status: 409 });

/** Create a customer account (the client signs in with the same credentials right after). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const limit = rateLimit(`register:${clientIp(req)}`, 8, 10 * 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Please review the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
    const { name, email, password, claim } = parsed.data;

    if (await db.user.findUnique({ where: { email }, select: { id: true } })) return exists();

    let user: { id: string };
    try {
      user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: 'CUSTOMER' }, select: { id: true } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return exists();
      throw e;
    }

    let claimed: string | null = null;
    if (claim && verifyReceiptToken(claim.orderNumber, claim.token)) {
      const r = await db.order.updateMany({ where: { number: claim.orderNumber, userId: null }, data: { userId: user.id } });
      if (r.count) claimed = claim.orderNumber;
    }
    return NextResponse.json({ ok: true, claimed }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
