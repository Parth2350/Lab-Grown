'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  /** Tailwind width classes for each slide */
  itemClassName?: string;
  className?: string;
  label?: string;
};

/** Native scroll-snap carousel — touch friendly, keyboard accessible, no layout shift. */
export function Carousel({ children, itemClassName = 'w-[72%] xs:w-[46%] md:w-[31%] xl:w-[23.5%]', className, label = 'Carousel' }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrow =
    'absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-ivory/95 text-ink shadow-soft transition-all duration-300 hover:bg-ink hover:text-ivory lg:flex';

  return (
    <div className={cn('relative', className)} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:gap-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {Children.map(children, (child, i) => (
          <div key={i} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => go(-1)} aria-label="Previous" className={cn(arrow, '-left-5', edge.start && 'pointer-events-none opacity-0')}>
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next" className={cn(arrow, '-right-5', edge.end && 'pointer-events-none opacity-0')}>
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Same footprint as a row of product cards — the placeholder for a deferred carousel. */
export function RailSkeleton({ itemClassName = 'w-[72%] xs:w-[46%] md:w-[31%] xl:w-[23.5%]', count = 4 }: { itemClassName?: string; count?: number }) {
  return (
    <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2 sm:-mx-6 sm:px-6 md:gap-6 lg:mx-0 lg:px-0" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('shrink-0', itemClassName)}>
          <div className="art-tile aspect-square" />
          <div className="h-[190px]" />
        </div>
      ))}
    </div>
  );
}
