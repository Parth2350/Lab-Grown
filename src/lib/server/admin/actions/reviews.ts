'use server';
import 'server-only';
import { z } from 'zod';
import { ReviewStatus, type Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { ActionError, adminAction, ok, parse, revalidateAdmin, zCuid } from '../action';
import type { ActionResult } from '../types';

const statusSchema = z.nativeEnum(ReviewStatus, { errorMap: () => ({ message: 'Choose a valid review status' }) });
const idsSchema = z
  .array(zCuid)
  .min(1, 'Select at least one review')
  .max(100, 'You can update up to 100 reviews at a time')
  .transform((ids) => [...new Set(ids)]);

const PAST: Record<ReviewStatus, string> = { APPROVED: 'approved', REJECTED: 'rejected', PENDING: 'moved back to pending' };

/**
 * Recompute the denormalised `rating` (average of APPROVED ratings, 1 decimal, 0 if none) and
 * `reviewCount` (number of APPROVED reviews) for every affected product — one grouped aggregate.
 */
async function recomputeProductRatings(tx: Prisma.TransactionClient, productIds: string[]) {
  const ids = [...new Set(productIds)];
  if (!ids.length) return;
  const stats = await tx.review.groupBy({
    by: ['productId'],
    where: { productId: { in: ids }, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const byProduct = new Map(stats.map((s) => [s.productId, s]));
  for (const productId of ids) {
    const s = byProduct.get(productId);
    const reviewCount = s?._count._all ?? 0;
    const rating = reviewCount ? Math.round((s?._avg.rating ?? 0) * 10) / 10 : 0;
    await tx.product.updateMany({ where: { id: productId }, data: { rating, reviewCount } });
  }
}

async function afterReviewChange() {
  await revalidateCatalog();
  revalidateAdmin();
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<ActionResult> {
  return adminAction(async () => {
    const reviewId = parse(zCuid, id);
    const next = parse(statusSchema, status);
    const review = await db.$transaction(async (tx) => {
      const row = await tx.review.update({ where: { id: reviewId }, data: { status: next }, select: { productId: true, authorName: true } });
      await recomputeProductRatings(tx, [row.productId]);
      return row;
    });
    await afterReviewChange();
    return ok(`Review by ${review.authorName} ${PAST[next]}`);
  });
}

export async function bulkSetReviewStatus(ids: string[], status: ReviewStatus): Promise<ActionResult> {
  return adminAction(async () => {
    const reviewIds = parse(idsSchema, ids);
    const next = parse(statusSchema, status);
    const count = await db.$transaction(async (tx) => {
      const rows = await tx.review.findMany({ where: { id: { in: reviewIds } }, select: { productId: true } });
      if (!rows.length) throw new ActionError('Those reviews no longer exist — they may have been deleted.');
      const res = await tx.review.updateMany({ where: { id: { in: reviewIds } }, data: { status: next } });
      await recomputeProductRatings(
        tx,
        rows.map((r) => r.productId),
      );
      return res.count;
    });
    await afterReviewChange();
    return ok(`${count} review${count === 1 ? '' : 's'} ${PAST[next]}`);
  });
}

export async function deleteReview(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const reviewId = parse(zCuid, id);
    const review = await db.$transaction(async (tx) => {
      const row = await tx.review.delete({ where: { id: reviewId }, select: { productId: true, authorName: true } });
      await recomputeProductRatings(tx, [row.productId]);
      return row;
    });
    await afterReviewChange();
    return ok(`Review by ${review.authorName} deleted`);
  });
}
