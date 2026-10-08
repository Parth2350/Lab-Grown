import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/auth';
import { clientIp, errorResponse, getReceipt, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const schema = z.object({ orderNumber: z.string().trim().regex(/^[A-Z]{3}-\d{6}$/), token: z.string().max(64).nullish() });

/** Order confirmation data — only for the owner or the browser that placed the order (receipt token). */
export async function POST(req: Request) {
  try {
    const limit = rateLimit(`receipt:${clientIp(req)}`, 30, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const session = await getSession();
    const viewer = session?.user?.id ? { id: session.user.id, email: session.user.email } : null;
    const order = await getReceipt(parsed.data.orderNumber, viewer, parsed.data.token);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}
