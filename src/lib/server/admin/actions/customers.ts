'use server';
import 'server-only';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { ActionError, adminAction, ok, parse, revalidateAdmin, zCuid } from '../action';
import type { ActionResult } from '../types';

/**
 * Promote / demote a user. Refuses to change the signed-in admin's own role and to remove the
 * last remaining administrator (checked inside a serializable transaction).
 * JWT sessions carry the role, so the change applies from the user's next sign-in.
 */
export async function setCustomerRole(userId: string, role: Role): Promise<ActionResult> {
  return adminAction(async (admin) => {
    const id = parse(zCuid, userId);
    const next = parse(z.nativeEnum(Role, { errorMap: () => ({ message: 'Choose a valid role' }) }), role);
    if (id === admin.id) throw new ActionError('You cannot change your own role. Ask another administrator.');

    const user = await db.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({ where: { id }, select: { id: true, role: true, email: true, name: true } });
        if (!target) throw new ActionError('This user no longer exists.');
        if (target.role === next) throw new ActionError(`${target.name ?? target.email} is already ${next === 'ADMIN' ? 'an administrator' : 'a customer'}.`);
        if (target.role === 'ADMIN' && next !== 'ADMIN') {
          const admins = await tx.user.count({ where: { role: 'ADMIN' } });
          if (admins <= 1) throw new ActionError('This is the last administrator — promote someone else first.');
        }
        return tx.user.update({ where: { id }, data: { role: next }, select: { name: true, email: true, role: true } });
      },
      { isolationLevel: 'Serializable' },
    );

    revalidateAdmin();
    const who = user.name ?? user.email;
    return ok(user.role === 'ADMIN' ? `${who} is now an administrator (from their next sign-in).` : `${who} is now a customer (from their next sign-in).`);
  });
}
