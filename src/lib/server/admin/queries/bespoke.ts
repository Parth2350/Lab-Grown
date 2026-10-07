import 'server-only';
import type { Prisma, RequestStatus } from '@prisma/client';
import { db } from '@/lib/server/db';

export type BespokeListFilters = {
  status?: RequestStatus;
  q: string;
  skip: number;
  take: number;
};

const bespokeListSelect = {
  id: true,
  createdAt: true,
  name: true,
  email: true,
  jewelryType: true,
  shape: true,
  carat: true,
  metal: true,
  budget: true,
  inspirationUrls: true,
  status: true,
} satisfies Prisma.BespokeRequestSelect;

export type BespokeListRow = Prisma.BespokeRequestGetPayload<{ select: typeof bespokeListSelect }>;

function searchWhere(q: string): Prisma.BespokeRequestWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: 'insensitive' as const };
  return { OR: [{ name: contains }, { email: contains }, { jewelryType: contains }] };
}

/** One page of bespoke requests (newest first) plus per-status counts for the tabs (counts respect search). */
export async function listBespokeRequests(filters: BespokeListFilters) {
  const base = searchWhere(filters.q);
  const where: Prisma.BespokeRequestWhereInput = filters.status ? { ...base, status: filters.status } : base;
  const [rows, groups] = await Promise.all([
    db.bespokeRequest.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: filters.skip, take: filters.take, select: bespokeListSelect }),
    db.bespokeRequest.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
  ]);
  const counts = new Map<RequestStatus, number>(groups.map((g) => [g.status, g._count._all]));
  const all = groups.reduce((s, g) => s + g._count._all, 0);
  return { rows, counts, all, total: filters.status ? counts.get(filters.status) ?? 0 : all };
}

export function getBespokeRequest(id: string) {
  return db.bespokeRequest.findUnique({ where: { id } });
}
