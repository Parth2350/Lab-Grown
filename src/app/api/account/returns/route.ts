import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { RETURN_REASONS, fieldErrors, returnRequestSchema } from '@/components/commerce/schemas';
import { assertSameOrigin, createReturnRequest, errorResponse, getReturnsOverview, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    return NextResponse.json(await getReturnsOverview(session.user.id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Open a return request for one of the customer's own delivered orders (within the returns window). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const limit = rateLimit(`returns:${session.user.id}`, 10, 10 * 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = returnRequestSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Please review the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
    const reasonLabel = RETURN_REASONS.find((r) => r.id === parsed.data.reason)!.label;
    const request = await createReturnRequest(session.user.id, { orderNumber: parsed.data.orderNumber, reasonLabel, details: parsed.data.details });
    return NextResponse.json({ ok: true, request }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
