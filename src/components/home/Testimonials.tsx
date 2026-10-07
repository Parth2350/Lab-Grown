import Link from 'next/link';
import { BadgeCheck, Quote } from 'lucide-react';
import { Carousel } from '@/components/ui/Carousel';
import { Stars } from '@/components/ui/Stars';
import { site } from '@/config/site';
import { pluralize } from '@/lib/utils';
import { getHomeReviews } from './queries';

export async function Testimonials() {
  const { reviews, average, count } = await getHomeReviews(8);
  if (!reviews.length) return null;

  return (
    <section aria-labelledby="reviews-title" className="border-t border-line py-16 md:py-24">
      <div className="container-x">
        <div className="mb-8 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Client Stories</p>
            <h2 id="reviews-title" className="h-section">
              Loved Around the World
            </h2>
          </div>
          {count > 0 && (
            <div className="flex items-center gap-4">
              <span className="font-serif text-[2.75rem] font-light leading-none text-ink">{average.toFixed(1)}</span>
              <div>
                <Stars rating={average} size={13} />
                <p className="mt-1 text-[12px] text-taupe">
                  Average from {pluralize(count, 'review')} of {site.name} pieces
                </p>
              </div>
            </div>
          )}
        </div>

        <Carousel label="Client reviews" itemClassName="w-[86%] xs:w-[70%] sm:w-[48%] lg:w-[31.8%]">
          {reviews.map((r) => (
            <figure key={r.id} className="relative flex h-full flex-col border border-line bg-white/60 p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <Stars rating={5} size={12} />
                <Quote className="h-6 w-6 text-gold-light" strokeWidth={1} aria-hidden />
              </div>
              <blockquote className="mt-5 flex-1">
                <p className="font-serif text-[1.3rem] leading-snug text-ink">{r.title}</p>
                <p className="mt-3 line-clamp-5 text-[14px] leading-relaxed text-charcoal/80">{r.body}</p>
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-[13px] font-normal text-ink">
                  {r.authorName}
                  {r.isVerified && (
                    <>
                      <BadgeCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden />
                      <span className="sr-only">(verified buyer)</span>
                    </>
                  )}
                  {r.location && <span className="font-light text-taupe">· {r.location}</span>}
                </p>
                <p className="mt-1 text-[12px] text-taupe">
                  On the{' '}
                  <Link href={`/products/${r.product.slug}`} className="text-charcoal underline decoration-line underline-offset-4 transition-colors hover:text-gold-deep hover:decoration-gold">
                    {r.product.name}
                  </Link>
                </p>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
