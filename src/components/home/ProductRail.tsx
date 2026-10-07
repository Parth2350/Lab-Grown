import { Carousel, RailSkeleton } from '@/components/ui/Carousel';
import { LazyMount } from '@/components/ui/LazyMount';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductCard } from '@/components/product/ProductCard';
import type { ProductCard as Card } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href: string;
  actionLabel?: string;
  products: Card[];
  className?: string;
};

export const RAIL_SIZES = '(min-width:1200px) 23vw, (min-width:768px) 31vw, (min-width:420px) 46vw, 72vw';

/** Section heading + scroll-snap carousel of product cards. Renders nothing when empty. */
export function ProductRail({ eyebrow, title, subtitle, href, actionLabel = 'See All', products, className }: Props) {
  if (!products.length) return null;
  return (
    <section aria-label={title} className={cn('py-16 md:py-24', className)}>
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} action={{ label: actionLabel, href }} />
        {/* cards mount as the rail nears the viewport — keeps the homepage DOM and hydration light */}
        <LazyMount className="block" rootMargin="300px" fallback={<RailSkeleton />}>
          <Carousel label={title}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} sizes={RAIL_SIZES} />
            ))}
          </Carousel>
        </LazyMount>
      </div>
    </section>
  );
}
