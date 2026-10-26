'use client';
import Link from 'next/link';
import { ArrowUpDown, Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SORT_OPTIONS, type SortSlug } from '@/lib/catalog';
import { FILTER_KEYS, filtersToSearch, rangeLabel, type FilterKey } from '@/lib/filters';
import type { Facets } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { Sheet } from '@/components/ui/Sheet';
import { useFilters } from './FilterContext';
import { AllFilters, OptionList, optionsFor, RangePicker } from './FilterPanel';

// The listing toolbar as on brilliancecarat.com: search, a row of filter dropdowns and "All Filters" on desktop;
// on phones a Sort | Filters bar along the bottom.

export function CollectionSearch({ className, placeholder = 'Try “2ct oval halo”, a shape, or a SKU' }: { className?: string; placeholder?: string }) {
  const { filters, navigate } = useFilters();
  const [q, setQ] = useState(filters.q);
  useEffect(() => setQ(filters.q), [filters.q]);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ q: q.trim() });
      }}
      className={cn('relative', className)}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} />
      <label htmlFor="collection-search" className="sr-only">
        Search these designs
      </label>
      <input
        id="collection-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-9 text-[15px] text-ink placeholder:text-taupe/70 focus:border-ink focus:outline-none"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            navigate({ q: '' });
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-taupe hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
    </form>
  );
}

function SortList({ onDone, big }: { onDone: () => void; big?: boolean }) {
  const { filters, navigate } = useFilters();
  return (
    <ul role="listbox" aria-label="Sort by">
      {SORT_OPTIONS.map((o) => {
        const on = filters.sort === o.slug;
        return (
          <li key={o.slug}>
            <button
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => {
                navigate({ sort: o.slug as SortSlug });
                onDone();
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-md text-left transition-colors',
                big ? 'px-4 py-3.5 text-[17px]' : 'px-3 py-2 text-[14.5px]',
                on ? 'bg-ink text-ivory' : 'text-ink hover:bg-porcelain',
              )}
            >
              {o.label}
              {on && <Check className="h-4 w-4" strokeWidth={2} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type Menu = { id: string; label: string; count: number; width: string; body: ReactNode };

/** Desktop: Metal · Stamp · Shape · Style · Price · Total Carat · Sort dropdowns and the All Filters panel */
export function FilterBar({ facets }: { facets: Facets }) {
  const { filters } = useFilters();
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const close = () => setOpen(null);

  // a click anywhere else, or Esc, closes the open dropdown
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !bar.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const list = (k: FilterKey, searchable?: boolean) => <OptionList k={k} options={optionsFor(facets, k)} searchable={searchable} />;
  const menus: Menu[] = [
    { id: 'metal', label: 'Metal', count: filters.metal.length, width: 'w-64', body: list('metal') },
    { id: 'purity', label: 'Stamp', count: filters.purity.length, width: 'w-64', body: list('purity') },
    { id: 'shape', label: 'Shape', count: filters.shape.length, width: 'w-64', body: list('shape', true) },
    { id: 'style', label: 'Style', count: filters.style.length, width: 'w-64', body: list('style', true) },
    { id: 'price', label: 'Price', count: filters.price.length, width: 'w-72', body: <RangePicker k="price" key={filters.price.join(',')} onDone={close} /> },
    { id: 'total', label: 'Total Carat', count: filters.total.length, width: 'w-72', body: <RangePicker k="total" key={filters.total.join(',')} onDone={close} /> },
  ].filter((m) => m.id === 'price' || optionsFor(facets, m.id as FilterKey).length || m.count);
  const sortLabel = SORT_OPTIONS.find((o) => o.slug === filters.sort)?.label ?? 'Featured';

  const button = (id: string, label: ReactNode, count = 0) => (
    <button
      type="button"
      aria-expanded={open === id}
      onClick={() => setOpen(open === id ? null : id)}
      className={cn(
        'flex h-10 items-center gap-2 whitespace-nowrap rounded-md border px-3.5 text-[14.5px] font-medium transition-colors',
        count ? 'border-ink bg-ink text-ivory' : open === id ? 'border-gold bg-white text-ink' : 'border-line bg-white text-ink hover:border-ink',
      )}
    >
      {label}
      {count > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded bg-gold px-1 text-[11.5px] font-semibold text-ink">{count}</span>}
      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open === id && 'rotate-180')} strokeWidth={2} />
    </button>
  );

  return (
    <div ref={bar} className="hidden lg:contents">
      {menus.map((m) => (
        <div key={m.id} className="relative">
          {button(m.id, m.label, m.count)}
          {open === m.id && <div className={cn('absolute left-0 top-full z-40 mt-2 rounded-xl border border-line bg-white p-3 shadow-lift', m.width)}>{m.body}</div>}
        </div>
      ))}
      <div className="relative">
        {button('sort', `Sort: ${sortLabel}`)}
        {open === 'sort' && (
          <div className="absolute left-0 top-full z-40 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-lift">
            <SortList onDone={close} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen(null);
          setAll(true);
        }}
        className="flex h-10 items-center gap-2 rounded-md border-2 border-ink bg-white px-4 text-[14.5px] font-semibold text-ink transition-colors hover:bg-ink hover:text-ivory"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} /> All Filters
      </button>
      <AllFilters open={all} onClose={() => setAll(false)} facets={facets} />
    </div>
  );
}

/** Phones and tablets: Sort | Filters along the bottom while the products are on screen */
export function PhoneBar({ facets }: { facets: Facets }) {
  const { filters } = useFilters();
  const [sort, setSort] = useState(false);
  const [all, setAll] = useState(false);
  const n = FILTER_KEYS.reduce((sum, k) => sum + filters[k].length, 0);
  return (
    <>
      <div className="sticky bottom-0 z-30 grid grid-cols-2 border-t border-line bg-white lg:hidden">
        <button type="button" onClick={() => setSort(true)} className="flex h-14 items-center justify-center gap-2 border-r border-line text-[16px] font-semibold text-ink">
          <ArrowUpDown className="h-4 w-4" strokeWidth={1.75} /> Sort
        </button>
        <button type="button" onClick={() => setAll(true)} className="flex h-14 items-center justify-center gap-2 text-[16px] font-semibold text-ink">
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} /> Filters
          {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded bg-gold px-1 text-[12px] text-ink">{n}</span>}
        </button>
      </div>
      <Sheet open={sort} onClose={() => setSort(false)} side="bottom" title="Sort by" bodyClassName="px-4 pb-6 pt-3">
        <SortList onDone={() => setSort(false)} big />
      </Sheet>
      <AllFilters open={all} onClose={() => setAll(false)} facets={facets} />
    </>
  );
}

const CHIP_TITLES: Record<FilterKey, string> = {
  price: 'Price',
  metal: 'Metal',
  purity: 'Stamp',
  shape: 'Shape',
  center: 'Center Carat',
  total: 'Total Carat',
  setting: 'Setting',
  style: 'Style',
  collection: 'Collection',
};

/** "Category: Engagement Rings ×  Shape: Oval ×  Clear all" — the category chip opens the same filters across all jewelry */
export function ActiveChips({ category, className }: { category?: string; className?: string }) {
  const { filters, toggle, clearAll, navigate } = useFilters();
  const currency = useCurrency();
  const chips = FILTER_KEYS.flatMap((k) => filters[k].map((v) => ({ k, v })));
  if (!chips.length && !filters.q && !category) return null;
  const chip = 'flex h-8 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[14px] text-ink transition-colors hover:border-ink';
  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Active filters">
      {category && (
        <li>
          <Link href={`/collections/all${filtersToSearch({ ...filters, page: 1 })}`} scroll={false} className={chip} aria-label={`Remove category ${category}`}>
            Category: {category} <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </li>
      )}
      {filters.q && (
        <li>
          <button type="button" onClick={() => navigate({ q: '' })} className={chip} aria-label="Remove search">
            Search: “{filters.q}” <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </li>
      )}
      {chips.map(({ k, v }) => (
        <li key={`${k}-${v}`}>
          <button type="button" onClick={() => toggle(k, v)} className={chip} aria-label={`Remove filter ${CHIP_TITLES[k]}: ${rangeLabel(k, v, currency)}`}>
            {CHIP_TITLES[k]}: {rangeLabel(k, v, currency)} <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </li>
      ))}
      {(chips.length > 0 || filters.q) && (
        <li>
          <button type="button" onClick={clearAll} className="ml-1 text-[14px] font-semibold text-gold-deep hover:text-ink">
            Clear all
          </button>
        </li>
      )}
    </ul>
  );
}
