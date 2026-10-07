import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';

export const MESSAGE_FILTERS = ['all', 'unread', 'read'] as const;
export type MessageFilter = (typeof MESSAGE_FILTERS)[number];

export type MessageListFilters = {
  filter: MessageFilter;
  q: string;
  skip: number;
  take: number;
};

const messageListSelect = {
  id: true,
  name: true,
  email: true,
  subject: true,
  message: true,
  isRead: true,
  createdAt: true,
} satisfies Prisma.ContactMessageSelect;

export type MessageListRow = Prisma.ContactMessageGetPayload<{ select: typeof messageListSelect }>;

function searchWhere(q: string): Prisma.ContactMessageWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: 'insensitive' as const };
  return { OR: [{ name: contains }, { email: contains }, { subject: contains }, { message: contains }] };
}

/** One page of the inbox (newest first) plus All / Unread / Read counts (counts respect search). */
export async function listMessages(filters: MessageListFilters) {
  const base = searchWhere(filters.q);
  const where: Prisma.ContactMessageWhereInput = filters.filter === 'all' ? base : { ...base, isRead: filters.filter === 'read' };
  const [rows, groups] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: filters.skip, take: filters.take, select: messageListSelect }),
    db.contactMessage.groupBy({ by: ['isRead'], where: base, _count: { _all: true } }),
  ]);
  const counts: Record<MessageFilter, number> = { all: 0, unread: 0, read: 0 };
  for (const g of groups) {
    counts[g.isRead ? 'read' : 'unread'] = g._count._all;
    counts.all += g._count._all;
  }
  return { rows, counts, total: counts[filters.filter] };
}

export function getMessage(id: string) {
  return db.contactMessage.findUnique({ where: { id } });
}

/** Unread messages across the whole inbox (ignores search) — drives "Mark all as read". */
export function countUnreadMessages() {
  return db.contactMessage.count({ where: { isRead: false } });
}
