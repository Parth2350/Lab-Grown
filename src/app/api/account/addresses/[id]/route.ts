import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { addressUpdateSchema, fieldErrors } from '@/components/commerce/schemas';
import { assertSameOrigin, errorResponse, readJson } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) } as const;
  const address = await db.address.findFirst({ where: { id, userId: session.user.id } });
  if (!address) return { error: NextResponse.json({ error: 'Address not found' }, { status: 404 }) } as const;
  return { address, userId: session.user.id } as const;
}

/** Edit an address, or `{ isDefault: true }` to make it the default. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    const { id } = await params;
    const own = await owned(id);
    if ('error' in own) return own.error;
    const parsed = addressUpdateSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Please review the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
    const { isDefault, ...data } = parsed.data;

    const address = await db.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId: own.userId, NOT: { id } }, data: { isDefault: false } });
      return tx.address.update({
        where: { id },
        // A default can only be moved to another address, never simply cleared.
        data: { ...data, ...(isDefault ? { isDefault: true } : {}) },
      });
    });
    return NextResponse.json({ ok: true, address });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    const { id } = await params;
    const own = await owned(id);
    if ('error' in own) return own.error;
    await db.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (own.address.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: own.userId }, orderBy: { createdAt: 'asc' } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
