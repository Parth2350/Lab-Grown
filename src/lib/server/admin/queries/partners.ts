import 'server-only';
import type { ApplicationStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';

export const PARTNER_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'all'] as const;
export type PartnerTab = (typeof PARTNER_TABS)[number];

export type PartnerListFilters = {
  status: PartnerTab;
  q: string;
  skip: number;
  take: number;
};

const partnerListSelect = {
  id: true,
  createdAt: true,
  name: true,
  email: true,
  country: true,
  company: true,
  socialHandle: true,
  audienceSize: true,
  status: true,
} satisfies Prisma.PartnerApplicationSelect;

export type PartnerListRow = Prisma.PartnerApplicationGetPayload<{ select: typeof partnerListSelect }>;

function searchWhere(q: string): Prisma.PartnerApplicationWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: 'insensitive' as const };
  return { OR: [{ name: contains }, { email: contains }, { company: contains }, { country: contains }, { socialHandle: contains }] };
}

/** One page of partner applications (newest first) plus per-status counts for the tabs (counts respect search). */
export async function listPartnerApplications(filters: PartnerListFilters) {
  const base = searchWhere(filters.q);
  const where: Prisma.PartnerApplicationWhereInput = filters.status === 'all' ? base : { ...base, status: filters.status };
  const [rows, groups] = await Promise.all([
    db.partnerApplication.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: filters.skip, take: filters.take, select: partnerListSelect }),
    db.partnerApplication.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
  ]);
  const counts: Record<PartnerTab, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, all: 0 };
  for (const g of groups) {
    counts[g.status as ApplicationStatus] = g._count._all;
    counts.all += g._count._all;
  }
  return { rows, counts, total: counts[filters.status] };
}

export function getPartnerApplication(id: string) {
  return db.partnerApplication.findUnique({ where: { id } });
}
