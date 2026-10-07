import 'server-only';
import type { Prisma, ReviewStatus } from '@prisma/client';
import { db } from '@/lib/server/db';

export const REVIEW_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'all'] as const;
export type ReviewTab = (typeof REVIEW_TABS)[number];

export type ReviewListFilters = {
  status: ReviewTab;
  q: string;
  rating?: number;
  skip: number;
  take: number;
};

const reviewListSelect = {
  id: true,
  rating: true,
  title: true,
  body: true,
  authorName: true,
  location: true,
  isVerified: true,
  status: true,
  createdAt: true,
  productId: true,
  product: { select: { name: true, slug: true } },
} satisfies Prisma.ReviewSelect;

export type ReviewListRow = Prisma.ReviewGetPayload<{ select: typeof reviewListSelect }>;

/** Search + rating filter shared by the list and the tab counts (status is applied separately). */
function filterWhere({ q, rating }: Pick<ReviewListFilters, 'q' | 'rating'>): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {};
  if (rating) where.rating = rating;
  if (q) {
    const contains = { contains: q, mode: 'insensitive' as const };
    where.OR = [{ authorName: contains }, { title: contains }, { body: contains }, { location: contains }, { product: { name: contains } }];
  }
  return where;
}

/** One page of reviews (newest first) plus per-status counts for the tabs (counts respect search/rating). */
export async function listReviews(filters: ReviewListFilters) {
  const base = filterWhere(filters);
  const where: Prisma.ReviewWhereInput = filters.status === 'all' ? base : { ...base, status: filters.status };
  const [rows, groups] = await Promise.all([
    db.review.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: filters.skip, take: filters.take, select: reviewListSelect }),
    db.review.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
  ]);
  const counts: Record<ReviewTab, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, all: 0 };
  for (const g of groups) {
    counts[g.status as ReviewStatus] = g._count._all;
    counts.all += g._count._all;
  }
  return { rows, counts, total: counts[filters.status] };
}
