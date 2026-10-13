'use client';
import { Clock } from 'lucide-react';
import { useMounted } from '@/hooks/use-mounted';
import { useRecentlyViewed } from '@/store/lists';
import { ProductCard } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { pluralize } from '@/lib/utils';

export function RecentlyViewed() {
  const mounted = useMounted();
  const items = useRecentlyViewed((s) => s.items);
  const clear = useRecentlyViewed((s) => s.clear);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-light">Recently viewed</h2>
          <p className="mt-1 text-sm text-taupe">{mounted && items.length ? `${pluralize(items.length, 'piece')} you’ve looked at on this device` : 'Pieces you browse will appear here.'}</p>
        </div>
        {mounted && items.length > 0 && (
          <button type="button" onClick={clear} className="text-[14px] uppercase tracking-[0.14em] text-taupe underline-offset-4 hover:text-ink hover:underline">
            Clear history
          </button>
        )}
      </div>
      {!mounted ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square animate-pulse bg-porcelain" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center border border-line px-6 py-16 text-center">
          <Clock className="h-8 w-8 text-gold" strokeWidth={1} aria-hidden />
          <p className="mt-4 font-serif text-2xl">Nothing here yet</p>
          <p className="mt-2 max-w-sm text-sm text-taupe">Explore the collection and the pieces you view will be kept here for easy reference.</p>
          <ButtonLink href="/collections/all" variant="outline" className="mt-6">
            Explore the Collection
          </ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-12 lg:gap-x-6 xl:grid-cols-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} sizes="(min-width:1280px) 25vw, 50vw" />
          ))}
        </div>
      )}
    </div>
  );
}
