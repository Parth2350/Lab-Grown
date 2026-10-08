import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/auth';
import { assertSameOrigin, clientIp, errorResponse, finalizeDemo, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const schema = z.object({ orderNumber: z.string().trim().regex(/^[A-Z]{3}-\d{6}$/), token: z.string().max(64).nullish() });

/** Test-mode payment confirmation. Disabled automatically when Razorpay keys are configured. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const limit = rateLimit(`demo:${clientIp(req)}`, 20, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    const session = await getSession();
    const viewer = session?.user?.id ? { id: session.user.id, email: session.user.email } : null;
    const result = await finalizeDemo(parsed.data.orderNumber, { viewer, token: parsed.data.token });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
