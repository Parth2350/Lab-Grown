import { BadgeCheck } from 'lucide-react';
import type { ReviewData } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Stars } from '@/components/ui/Stars';
import { ReviewForm } from './ReviewForm';

type Props = {
  productId: string;
  productName: string;
  rating: number;
  count: number;
  reviews: ReviewData[];
  distribution: Record<number, number>;
};

export function Reviews({ productId, productName, rating, count, reviews, distribution }: Props) {
  return (
    <section id="reviews" className="container-x scroll-mt-32 py-16 md:py-24" aria-labelledby="reviews-title">
      <div className="grid gap-12 lg:grid-cols-[340px_1fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-3">Client Reviews</p>
          <h2 id="reviews-title" className="h-section">
            {count ? 'Loved & Treasured' : 'Be the first to review'}
          </h2>
          {count > 0 && (
            <div className="mt-6">
              <div className="flex items-end gap-3">
                <span className="font-serif text-5xl font-light leading-none">{rating.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars rating={rating} size={14} />
                  <p className="mt-1 text-[12px] text-taupe">Based on {count} reviews</p>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = distribution[star] ?? 0;
                  return (
                    <li key={star} className="flex items-center gap-3 text-[12px] text-taupe">
                      <span className="w-10">{star} star</span>
                      <span className="h-1 flex-1 bg-line">
                        <span className="block h-1 bg-gold" style={{ width: `${count ? (n / count) * 100 : 0}%` }} />
                      </span>
                      <span className="w-6 text-right">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <ReviewForm productId={productId} productName={productName} />
        </div>
        <div>
          {reviews.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Stars rating={r.rating} />
                    <time className="text-[12px] text-taupe" dateTime={r.createdAt}>
                      {formatDate(r.createdAt)}
                    </time>
                  </div>
                  <h3 className="mt-3 font-serif text-xl">{r.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-charcoal">{r.body}</p>
                  <p className="mt-3 flex items-center gap-2 text-[12px] text-taupe">
                    {r.authorName}
                    {r.location && <span>· {r.location}</span>}
                    {r.isVerified && (
                      <span className="flex items-center gap-1 text-success">
                        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-line p-10 text-center text-taupe">
              <p className="font-serif text-2xl text-ink">No reviews yet</p>
              <p className="mt-2 text-sm">Own this piece? We would love to hear what you think.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
