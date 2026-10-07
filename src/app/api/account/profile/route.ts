import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { fieldErrors, profileSchema } from '@/components/commerce/schemas';
import { assertSameOrigin, errorResponse, readJson } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

/** Update the signed-in customer's name and phone. */
export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const parsed = profileSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Please review the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone },
      select: { name: true, phone: true, email: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return errorResponse(e);
  }
}
