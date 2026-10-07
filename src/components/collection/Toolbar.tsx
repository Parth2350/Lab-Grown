'use client';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SORT_OPTIONS, type SortSlug } from '@/lib/catalog';
import { activeFilterCount, FILTER_KEYS, rangeLabel } from '@/lib/filters';
import type { Facets } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/Sheet';
import { useFilters } from './FilterContext';
import { FilterPanel } from './FilterPanel';

export function CollectionSearch({ placeholder = 'Try ‘2ct oval halo’, a shape, or a SKU' }: { placeholder?: string }) {
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
      className="relative w-full max-w-md"
    >
      <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" strokeWidth={1.25} />
      <label htmlFor="collection-search" className="sr-only">
        Search this collection
      </label>
      <input
        id="collection-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border-b border-line bg-transparent pl-7 pr-8 text-[14px] text-ink placeholder:text-taupe/70 focus:border-ink focus:outline-none"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            navigate({ q: '' });
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-taupe hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={1.25} />
        </button>
      )}
    </form>
  );
}

export function SortSelect({ className }: { className?: string }) {
  const { filters, navigate } = useFilters();
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <span className="label-caps hidden text-taupe sm:inline">Sort</span>
      <select
        value={filters.sort}
        onChange={(e) => navigate({ sort: e.target.value as SortSlug })}
        className="h-10 cursor-pointer border-0 border-b border-line bg-transparent pr-6 text-[13px] text-ink focus:border-ink focus:outline-none"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActiveChips() {
  const { filters, toggle, clearAll, navigate } = useFilters();
  const chips = FILTER_KEYS.flatMap((k) => filters[k].map((v) => ({ k, v })));
  if (!chips.length && !filters.q) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {filters.q && (
        <li>
          <button onClick={() => navigate({ q: '' })} className="flex h-8 items-center gap-2 border border-ink/20 bg-white px-3 text-[12px] hover:border-ink">
            “{filters.q}” <X className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </li>
      )}
      {chips.map(({ k, v }) => (
        <li key={`${k}-${v}`}>
          <button onClick={() => toggle(k, v)} className="flex h-8 items-center gap-2 border border-ink/20 bg-white px-3 text-[12px] hover:border-ink" aria-label={`Remove filter ${rangeLabel(k, v)}`}>
            {rangeLabel(k, v)} <X className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </li>
      ))}
      {chips.length > 0 && (
        <li>
          <button onClick={clearAll} className="ml-1 text-[12px] text-taupe underline underline-offset-4 hover:text-ink">
            Clear all
          </button>
        </li>
      )}
    </ul>
  );
}

export function MobileFilters({ facets, total }: { facets: Facets; total: number }) {
  const { filters, clearAll, pending } = useFilters();
  const [open, setOpen] = useState(false);
  const n = activeFilterCount(filters);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label-caps flex h-10 items-center gap-2 border border-ink/30 px-4 transition-colors hover:border-ink lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.25} /> Filters {n > 0 && <span className="text-gold-deep">({n})</span>}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Filter"
        bodyClassName="px-5"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button onClick={clearAll} className="label-caps h-12 border border-ink/30">
              Clear all
            </button>
            <button onClick={() => setOpen(false)} className="label-caps flex h-12 items-center justify-center gap-2 bg-ink text-ivory">
              {pending && <span className="h-3 w-3 animate-spin rounded-full border border-ivory border-t-transparent" />}
              Show {total} {total === 1 ? 'result' : 'results'}
            </button>
          </div>
        }
      >
        <FilterPanel facets={facets} />
      </Sheet>
    </>
  );
}
