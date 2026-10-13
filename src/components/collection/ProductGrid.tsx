'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCard as Card } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/product/ProductCard';
import { useFilters } from './FilterContext';

type Props = {
  initial: Card[];
  total: number;
  page: number;
  pageCount: number;
  /** query string (without page) for /api/products — same scope + filters as the server render */
  apiQuery: string;
  nextHref: string | null;
};

/** Product grid with "Load more" + infinite scroll (enabled after the first manual load). */
export function ProductGrid({ initial, total, page, pageCount, apiQuery, nextHref }: Props) {
  const { pending } = useFilters();
  const [items, setItems] = useState(initial);
  const [current, setCurrent] = useState(page);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initial);
    setCurrent(page);
    setAuto(false);
  }, [initial, page]);

  const loadMore = useCallback(async () => {
    if (loading || current >= pageCount) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?${apiQuery}&page=${current + 1}`);
      const data = (await res.json()) as { products: Card[] };
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.products.filter((p) => !seen.has(p.id))];
      });
      setCurrent((c) => c + 1);
    } finally {
      setLoading(false);
    }
  }, [apiQuery, current, loading, pageCount]);

  useEffect(() => {
    if (!auto || !sentinel.current) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: '600px 0px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [auto, loadMore]);

  return (
    <div className={cn('transition-opacity duration-300', pending && 'pointer-events-none opacity-50')} aria-busy={pending || loading}>
      <ul className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-6 md:grid-cols-3 2xl:grid-cols-4">
        {items.map((p, i) => (
          <li key={p.id}>
            <ProductCard product={p} priority={i < 4} sizes="(min-width:1440px) 22vw, (min-width:768px) 28vw, 48vw" />
          </li>
        ))}
      </ul>

      <div ref={sentinel} className="mt-14 flex flex-col items-center gap-4">
        <p className="text-[14px] text-taupe" aria-live="polite">
          Showing {items.length} of {total}
        </p>
        <div className="h-px w-48 bg-line">
          <div className="h-px bg-ink transition-all duration-500" style={{ width: `${Math.min(100, (items.length / Math.max(1, total)) * 100)}%` }} />
        </div>
        {current < pageCount && nextHref && (
          <a
            href={nextHref}
            onClick={(e) => {
              e.preventDefault();
              setAuto(true);
              loadMore();
            }}
            className="label-caps mt-2 flex h-12 items-center gap-2 border border-ink px-10 transition-colors hover:bg-ink hover:text-ivory"
          >
            {loading && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
            Load more
          </a>
        )}
      </div>
    </div>
  );
}
