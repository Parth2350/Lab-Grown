import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { addressSchema, fieldErrors } from '@/components/commerce/schemas';
import { assertSameOrigin, errorResponse, readJson } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const MAX_ADDRESSES = 20;
const createSchema = addressSchema.extend({ isDefault: z.boolean().optional() });

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const addresses = await db.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
    return NextResponse.json({ addresses }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const userId = session.user.id;
    const parsed = createSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Please review the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }, { status: 400 });

    const count = await db.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) return NextResponse.json({ error: `You can save up to ${MAX_ADDRESSES} addresses.` }, { status: 409 });
    const { isDefault, ...data } = parsed.data;
    const makeDefault = count === 0 || !!isDefault;

    const address = await db.$transaction(async (tx) => {
      if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({ data: { ...data, userId, isDefault: makeDefault } });
    });
    return NextResponse.json({ ok: true, address }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
