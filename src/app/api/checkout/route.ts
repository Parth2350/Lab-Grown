import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { assertSameOrigin, clientIp, errorResponse, placeOrder, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

/** Creates a PENDING order from server-side re-priced lines and opens a payment (Razorpay or demo). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const limit = rateLimit(`checkout:${clientIp(req)}`, 12, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const session = await getSession();
    const viewer = session?.user?.id ? { id: session.user.id, email: session.user.email } : null;
    const result = await placeOrder(await readJson(req), viewer);
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}
