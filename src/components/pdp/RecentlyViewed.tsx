'use client';
import { useRecentlyViewed } from '@/store/lists';
import { useMounted } from '@/hooks/use-mounted';
import { Carousel } from '@/components/ui/Carousel';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductCard } from '@/components/product/ProductCard';

export function RecentlyViewed({ excludeId, title = 'Recently Viewed' }: { excludeId?: string; title?: string }) {
  const mounted = useMounted();
  const items = useRecentlyViewed((s) => s.items).filter((p) => p.id !== excludeId);
  if (!mounted || items.length === 0) return null;
  return (
    <section className="container-x py-16 md:py-20" aria-label={title}>
      <SectionHeading eyebrow="Your history" title={title} />
      <Carousel label={title}>
        {items.slice(0, 10).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Carousel>
    </section>
  );
}
