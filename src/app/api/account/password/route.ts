import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { changePasswordSchema, fieldErrors } from '@/components/commerce/schemas';
import { assertSameOrigin, errorResponse, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

/** Change (or, for social sign-in accounts, set) the account password. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const limit = rateLimit(`password:${session.user.id}`, 6, 10 * 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = changePasswordSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Please review the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    if (user.passwordHash) {
      const ok = parsed.data.currentPassword && (await bcrypt.compare(parsed.data.currentPassword, user.passwordHash));
      if (!ok) return NextResponse.json({ error: 'Your current password is incorrect.', fieldErrors: { currentPassword: 'Incorrect password' } }, { status: 400 });
      if (await bcrypt.compare(parsed.data.newPassword, user.passwordHash))
        return NextResponse.json({ error: 'Choose a password you have not used here before.', fieldErrors: { newPassword: 'Choose a new password' } }, { status: 400 });
    }
    await db.user.update({ where: { id: session.user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
