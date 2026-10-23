import 'server-only';
import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { REVENUE_STATUSES } from './admin/queries/metrics';

/** New-account offer: a personal code for 15% off the first order, saved to the customer's account. */
export const WELCOME_PERCENT = 15;

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I to misread

export const hasOrdered = async (userId: string) => (await db.order.count({ where: { userId, status: { in: REVENUE_STATUSES } } })) > 0;

/** The customer's welcome code, issued once to customers who have not ordered yet. created: issued just now. */
export async function ensureWelcomeCoupon(userId: string): Promise<{ code: string; created: boolean } | null> {
  const existing = await db.coupon.findUnique({ where: { userId }, select: { code: true } });
  if (existing) return { code: existing.code, created: false };
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
  if (!user || user.role !== 'CUSTOMER' || (await hasOrdered(userId))) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `WELCOME15-${Array.from({ length: 5 }, () => LETTERS[randomInt(LETTERS.length)]).join('')}`;
    try {
      await db.coupon.create({
        data: { code, userId, type: 'PERCENT', value: WELCOME_PERCENT, maxUses: 1, description: `Welcome offer: ${WELCOME_PERCENT}% off the first order — ${user.email}` },
      });
      return { code, created: true };
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      // the customer got one in a parallel sign-in, or the random code was taken — look again
      const raced = await db.coupon.findUnique({ where: { userId }, select: { code: true } });
      if (raced) return { code: raced.code, created: false };
    }
  }
  return null;
}
