import 'server-only';
import { db } from '@/lib/server/db';
import type { NavCounts } from '@/components/admin/shell/nav';

/** Orders that still need someone to act on them */
export const OPEN_ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING'] as const;

/** Sidebar attention badges — five cheap indexed counts. */
export async function getNavCounts(): Promise<NavCounts> {
  const [orders, reviews, bespoke, partners, messages] = await Promise.all([
    db.order.count({ where: { status: { in: [...OPEN_ORDER_STATUSES] } } }),
    db.review.count({ where: { status: 'PENDING' } }),
    db.bespokeRequest.count({ where: { status: 'NEW' } }),
    db.partnerApplication.count({ where: { status: 'PENDING' } }),
    db.contactMessage.count({ where: { isRead: false } }),
  ]);
  return { orders, reviews, bespoke, partners, messages };
}
