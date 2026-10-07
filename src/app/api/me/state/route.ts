import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { stateSchema } from '@/components/commerce/schemas';
import { assertSameOrigin, errorResponse, getUserState, readJson, saveUserState } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Sign in required' }, { status: 401 });

/** Signed-in shopper's saved bag (re-priced), wishlist and compare list. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();
    return NextResponse.json(await getUserState(session.user.id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Replaces the saved state with the merged client payload (unknown / inactive ids are dropped). */
export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();
    const parsed = stateSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const saved = await saveUserState(session.user.id, parsed.data);
    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    return errorResponse(e);
  }
}
