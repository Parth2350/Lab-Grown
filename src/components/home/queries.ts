import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/server/db';

export type HomeReview = {
  id: string;
  authorName: string;
  location: string | null;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
  product: { name: string; slug: string };
};

export type HomeReviews = { reviews: HomeReview[]; average: number; count: number };

/** Recent approved five-star reviews (one per product, for variety) plus the store-wide average. */
export const getHomeReviews = unstable_cache(
  async (limit = 8): Promise<HomeReviews> => {
    try {
      const [rows, agg] = await Promise.all([
        db.review.findMany({
          where: { status: 'APPROVED', rating: 5, product: { isActive: true } },
          orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
          take: 60,
          select: {
            id: true,
            authorName: true,
            location: true,
            title: true,
            body: true,
            isVerified: true,
            createdAt: true,
            product: { select: { name: true, slug: true } },
          },
        }),
        db.review.aggregate({ where: { status: 'APPROVED' }, _avg: { rating: true }, _count: { _all: true } }),
      ]);
      const seen = new Set<string>();
      const reviews: HomeReview[] = [];
      for (const r of rows) {
        if (seen.has(r.product.slug) || r.body.trim().length < 40) continue;
        seen.add(r.product.slug);
        reviews.push({ ...r, createdAt: r.createdAt.toISOString() });
        if (reviews.length >= limit) break;
      }
      return { reviews, average: agg._avg.rating ?? 0, count: agg._count._all };
    } catch {
      return { reviews: [], average: 0, count: 0 };
    }
  },
  ['home-reviews'],
  { tags: ['reviews', 'products'], revalidate: 3600 },
);
