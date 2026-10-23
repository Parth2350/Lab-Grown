'use client';
import { Check, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { METAL_COLORS, PRICE_RANGES } from '@/lib/catalog';
import { currencyInfo, inrPer } from '@/lib/currency';
import { FILTER_GROUPS, parseRange, rangeLabel, type FilterKey } from '@/lib/filters';
import type { Facets } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useFilters } from './FilterContext';

function Group({ title, active, defaultOpen, children }: { title: string; active: number; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen || active > 0);
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left">
        <span className="label-caps flex items-center gap-2 text-ink">
          {title}
          {active > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[11px] text-ivory">{active}</span>}
        </span>
        {open ? <Minus className="h-3.5 w-3.5 text-taupe" strokeWidth={1.25} /> : <Plus className="h-3.5 w-3.5 text-taupe" strokeWidth={1.25} />}
      </button>
      <div className={cn('grid transition-all duration-500 ease-luxe', open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function PriceInputs() {
  const { filters, set } = useFilters();
  const currency = useCurrency();
  // the price filter is always in rupees; shoppers type amounts in their own currency
  const rate = inrPer(currency);
  const symbol = currencyInfo(currency).prefix;
  const custom = filters.price.find((p) => !PRICE_RANGES.some((r) => r.slug === p));
  const [min, max] = custom ? parseRange(custom) : [NaN, NaN];
  const [lo, setLo] = useState(Number.isFinite(min) ? String(Math.round(min / rate)) : '');
  const [hi, setHi] = useState(Number.isFinite(max) ? String(Math.round(max / rate)) : '');
  return (
    <form
      className="mt-4 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const a = Math.round(Math.max(0, Number(lo) || 0) * rate);
        const b = Math.round((Number(hi) || 0) * rate);
        if (!lo && !hi) return;
        set('price', [`${a}-${b > a ? b : ''}`]);
      }}
    >
      <label className="sr-only" htmlFor="price-min">
        Minimum price
      </label>
      <input id="price-min" inputMode="numeric" placeholder={`${symbol} Min`} value={lo} onChange={(e) => setLo(e.target.value.replace(/\D/g, ''))} className="field h-9 px-3 py-1 text-[15px]" />
      <span className="text-taupe">–</span>
      <label className="sr-only" htmlFor="price-max">
        Maximum price
      </label>
      <input id="price-max" inputMode="numeric" placeholder={`${symbol} Max`} value={hi} onChange={(e) => setHi(e.target.value.replace(/\D/g, ''))} className="field h-9 px-3 py-1 text-[15px]" />
      <button type="submit" className="label-caps h-9 shrink-0 border border-ink px-3 transition-colors hover:bg-ink hover:text-ivory">
        Go
      </button>
    </form>
  );
}

export function FilterPanel({ facets, className }: { facets: Facets; className?: string }) {
  const { filters, toggle } = useFilters();
  const currency = useCurrency();

  return (
    <div className={className}>
      {FILTER_GROUPS.map((g, gi) => {
        const options = facets[g.key] ?? [];
        if (!options.length && g.key !== 'price') return null;
        const active = filters[g.key].length;
        const isOn = (v: string) => filters[g.key].includes(v);

        if (g.key === 'shape') {
          return (
            <Group key={g.key} title={g.title} active={active} defaultOpen={gi < 4}>
              <ul className="grid grid-cols-3 gap-1.5">
                {options.map((o) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => toggle('shape', o.value)}
                      aria-pressed={isOn(o.value)}
                      disabled={!o.count && !isOn(o.value)}
                      className={cn(
                        'flex w-full flex-col items-center gap-1 border px-1 py-2.5 text-[13px] transition-colors disabled:opacity-30',
                        isOn(o.value) ? 'border-ink bg-white text-ink' : 'border-line text-taupe hover:border-stone hover:text-ink',
                      )}
                    >
                      <ShapeIcon shape={o.value} size={26} className={isOn(o.value) ? 'text-gold' : ''} />
                      <span>
                        {o.label} <span className="text-stone">({o.count})</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Group>
          );
        }

        if (g.key === 'purity') {
          return (
            <Group key={g.key} title={g.title} active={active} defaultOpen={gi < 4}>
              <ul className="flex flex-wrap gap-1.5">
                {options.map((o) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => toggle('purity', o.value)}
                      aria-pressed={isOn(o.value)}
                      className={cn('h-9 min-w-[52px] border px-3 text-[14px] transition-colors', isOn(o.value) ? 'border-ink bg-ink text-ivory' : 'border-line hover:border-ink')}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            </Group>
          );
        }

        return (
          <Group key={g.key} title={g.title} active={active} defaultOpen={gi < 4}>
            <ul className="space-y-1">
              {options.map((o) => {
                const swatch = g.key === 'metal' ? METAL_COLORS.find((m) => m.slug === o.value)?.swatch : undefined;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isOn(o.value)}
                      onClick={() => toggle(g.key as FilterKey, o.value)}
                      disabled={!o.count && !isOn(o.value)}
                      className="group flex w-full items-center gap-3 py-1.5 text-left text-[15.5px] text-charcoal transition-colors hover:text-ink disabled:opacity-40"
                    >
                      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center border transition-colors', isOn(o.value) ? 'border-ink bg-ink' : 'border-stone group-hover:border-ink')}>
                        {isOn(o.value) && <Check className="h-3 w-3 text-ivory" strokeWidth={2} />}
                      </span>
                      {swatch && <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-line" style={{ background: swatch }} />}
                      <span className="flex-1">{g.key === 'price' ? rangeLabel('price', o.value, currency) : o.label}</span>
                      <span className="text-[13px] text-taupe">{o.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {g.key === 'price' && <PriceInputs key={filters.price.join(',')} />}
          </Group>
        );
      })}
    </div>
  );
}
