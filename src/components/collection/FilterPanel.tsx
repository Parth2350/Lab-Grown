'use client';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { CARAT_RANGES } from '@/lib/catalog';
import { currencyInfo, inrPer, type Currency } from '@/lib/currency';
import { activeFilterCount, FILTER_GROUPS, parseRange, rangeLabel, type FilterKey } from '@/lib/filters';
import type { Facets } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { Sheet } from '@/components/ui/Sheet';
import { useFilters } from './FilterContext';

// Filters as on brilliancecarat.com: checkbox lists, and ranges as four buttons plus a Min–Max with Apply.

export function CheckBox({ on }: { on: boolean }) {
  return (
    <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors', on ? 'border-gold bg-gold' : 'border-stone group-hover:border-ink')}>
      {on && <Check className="h-3 w-3 text-ink" strokeWidth={2.5} />}
    </span>
  );
}

type Option = { value: string; label: string };

/** Ticks for one filter group; `limit` shows the first few with "Show all N" (All Filters), `searchable` adds a search box (Shape, Style) */
export function OptionList({ k, options, limit, searchable, className }: { k: FilterKey; options: Option[]; limit?: number; searchable?: boolean; className?: string }) {
  const { filters, toggle } = useFilters();
  const [all, setAll] = useState(false);
  const [q, setQ] = useState('');
  const found = q ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const shown = limit && !all && !q ? found.slice(0, limit) : found;
  return (
    <div className={className}>
      {searchable && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          aria-label="Search options"
          className="mb-2 h-9 w-full rounded-md border border-line bg-white px-3 text-[14px] placeholder:text-taupe/70 focus:border-ink focus:outline-none"
        />
      )}
      <ul className={cn(searchable && !limit && 'max-h-[260px] overflow-y-auto overscroll-contain pr-1')}>
        {shown.map((o) => {
          const on = filters[k].includes(o.value);
          return (
            <li key={o.value}>
              <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(k, o.value)} className="group flex w-full items-center gap-2.5 py-1.5 text-left text-[15px] text-charcoal hover:text-ink">
                <CheckBox on={on} />
                {o.label}
              </button>
            </li>
          );
        })}
        {!shown.length && <li className="py-1.5 text-[14px] text-taupe">No matches</li>}
      </ul>
      {limit && !q && found.length > limit && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 text-[13px] font-semibold text-gold-deep hover:text-ink">
          {all ? 'Show less' : `Show all ${found.length}`}
        </button>
      )}
    </div>
  );
}

// price buttons in the shopper's currency (brilliancecarat.com's $200 / $500 / $1,000 steps), stored as rupee ranges
const PRICE_STEPS: Record<Currency, [number, number, number]> = { INR: [20000, 50000, 100000], USD: [200, 500, 1000], CAD: [300, 700, 1400] };

function priceRanges(currency: Currency) {
  const rate = inrPer(currency);
  const [a, b, c] = PRICE_STEPS[currency].map((n) => Math.round(n * rate));
  return [`0-${a}`, `${a}-${b}`, `${b}-${c}`, `${c}-`];
}

/** Four range buttons (one at a time) plus a custom Min–Max with Apply — Price, Total Carat, Center Stone Carat */
export function RangePicker({ k, onDone }: { k: 'price' | 'total' | 'center'; onDone?: () => void }) {
  const { filters, set } = useFilters();
  const currency = useCurrency();
  const isPrice = k === 'price';
  // shoppers type prices in their own currency; the filter itself is in rupees
  const rate = isPrice ? inrPer(currency) : 1;
  const unit = isPrice ? currencyInfo(currency).symbol : 'ct';
  const slugs = isPrice ? priceRanges(currency) : CARAT_RANGES.map((r) => r.slug);
  const custom = filters[k].find((v) => !slugs.includes(v));
  const [min, max] = custom ? parseRange(custom) : [NaN, NaN];
  const show = (n: number) => (Number.isFinite(n) ? String(isPrice ? Math.round(n / rate) : n) : '');
  const [lo, setLo] = useState(show(min));
  const [hi, setHi] = useState(show(max));
  const clean = (v: string) => (isPrice ? v.replace(/\D/g, '') : v.replace(/[^\d.]/g, ''));
  const pick = (slug: string) => {
    set(k, filters[k].includes(slug) ? [] : [slug]);
    onDone?.();
  };
  return (
    <div>
      <ul className="grid grid-cols-2 gap-2">
        {slugs.map((s) => {
          const on = filters[k].includes(s);
          return (
            <li key={s}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => pick(s)}
                className={cn('h-8 w-full rounded-md border px-2 text-[13px] transition-colors', on ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink hover:border-ink')}
              >
                {rangeLabel(k, s, currency)}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!lo && !hi) return;
          const a = Math.max(0, Number(lo) || 0) * rate;
          const b = (Number(hi) || 0) * rate;
          const r = (n: number) => (isPrice ? Math.round(n) : Math.round(n * 100) / 100);
          set(k, [`${r(a)}-${b > a ? r(b) : ''}`]);
          onDone?.();
        }}
      >
        <div className="flex items-center gap-2">
          <input
            inputMode={isPrice ? 'numeric' : 'decimal'}
            aria-label={`Minimum ${isPrice ? 'price' : 'carat'}`}
            placeholder={`Min ${unit}`}
            value={lo}
            onChange={(e) => setLo(clean(e.target.value))}
            className="h-9 w-full min-w-0 rounded-md border border-line bg-white px-3 text-[14px] placeholder:text-taupe/70 focus:border-ink focus:outline-none"
          />
          <span className="text-taupe">–</span>
          <input
            inputMode={isPrice ? 'numeric' : 'decimal'}
            aria-label={`Maximum ${isPrice ? 'price' : 'carat'}`}
            placeholder={`Max ${unit}`}
            value={hi}
            onChange={(e) => setHi(clean(e.target.value))}
            className="h-9 w-full min-w-0 rounded-md border border-line bg-white px-3 text-[14px] placeholder:text-taupe/70 focus:border-ink focus:outline-none"
          />
        </div>
        <button type="submit" className="mt-2 h-8 w-full rounded-md bg-ink text-[13px] font-semibold text-ivory transition-colors hover:bg-charcoal">
          Apply
        </button>
      </form>
    </div>
  );
}

/** Options for a facet group, without empties (the server already drops values no product in scope carries) */
export const optionsFor = (facets: Facets, k: FilterKey): Option[] => (facets[k] ?? []).map((o) => ({ value: o.value, label: o.label }));

const LIMITS: Partial<Record<FilterKey, number>> = { shape: 8, setting: 8, style: 6, collection: 6 };

/** "All Filters" — every filter group in one panel (desktop button and the phone's Filters bar open it) */
export function AllFilters({ open, onClose, facets }: { open: boolean; onClose: () => void; facets: Facets }) {
  const { filters, clearAll, pending } = useFilters();
  const n = activeFilterCount(filters);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      title="All Filters"
      bodyClassName="px-5 sm:px-7"
      footer={
        <button type="button" onClick={onClose} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink text-[15px] font-semibold text-ivory">
          {pending && <span className="h-3 w-3 animate-spin rounded-full border border-ivory border-t-transparent" />}
          Show results
        </button>
      }
    >
      <div className="flex items-center justify-between pb-2 pt-5">
        <p className="text-[17px] font-semibold text-ink">Filters</p>
        {n > 0 && (
          <button type="button" onClick={clearAll} className="text-[14px] font-semibold text-gold-deep hover:text-ink">
            Clear all ({n})
          </button>
        )}
      </div>
      {FILTER_GROUPS.map((g) => {
        const ranged = g.key === 'price' || g.key === 'total' || g.key === 'center';
        const options = optionsFor(facets, g.key);
        if (!ranged && !options.length) return null;
        if ((g.key === 'total' || g.key === 'center') && !options.length) return null;
        return (
          <section key={g.key} className="border-b border-line py-5 last:border-0" aria-label={g.title}>
            <h3 className="mb-3 font-sans text-[15px] font-semibold text-ink">{g.title}</h3>
            {ranged ? <RangePicker k={g.key as 'price' | 'total' | 'center'} key={filters[g.key].join(',')} /> : <OptionList k={g.key} options={options} limit={LIMITS[g.key]} />}
          </section>
        );
      })}
    </Sheet>
  );
}
