'use client';
import { Check, ChevronDown, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CERT_LABS, DIAMOND_CLARITIES, DIAMOND_COLORS, DIAMOND_CUTS, label } from '@/lib/catalog';
import type { DiamondData, DiamondOptionData } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { Sheet } from '@/components/ui/Sheet';
import { LooseDiamond } from '@/components/art/JewelryArt';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { diamondSummary } from './useConfiguration';

type Props = {
  open: boolean;
  onClose: () => void;
  option: DiamondOptionData;
  selected: DiamondData | null;
  settingPrice: number;
  onSelect: (d: DiamondData) => void;
};

type Q = { minCarat: number; maxCarat: number; colors: string[]; clarities: string[]; cuts: string[]; labs: string[]; minPrice: string; maxPrice: string; sort: 'price-asc' | 'price-desc' | 'carat-asc' | 'carat-desc' };

function Chips({ label: title, values, active, onToggle }: { label: string; values: readonly string[]; active: string[]; onToggle: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="label-caps mb-2 text-charcoal">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const on = active.includes(v);
          return (
            <button key={v} type="button" aria-pressed={on} onClick={() => onToggle(v)} className={cn('h-8 min-w-[40px] border px-2.5 text-[12px] transition-colors', on ? 'border-ink bg-ink text-ivory' : 'border-line bg-white hover:border-ink')}>
              {v}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CaratRange({ min, max, value, onChange }: { min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const thumb =
    'pointer-events-none absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-ivory [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-ivory';
  return (
    <fieldset>
      <legend className="label-caps mb-2 flex w-full justify-between text-charcoal">
        <span>Carat</span>
        <span className="font-normal normal-case tracking-normal text-taupe">
          {lo.toFixed(2)} – {hi.toFixed(2)} ct
        </span>
      </legend>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-stone" />
        <div className="absolute top-1/2 h-px -translate-y-1/2 bg-ink" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} step={0.05} value={lo} aria-label="Minimum carat" onChange={(e) => onChange([Math.min(Number(e.target.value), hi - 0.05), hi])} className={thumb} />
        <input type="range" min={min} max={max} step={0.05} value={hi} aria-label="Maximum carat" onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + 0.05)])} className={thumb} />
      </div>
    </fieldset>
  );
}

function Spec({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-[13px]">
      <dt className="text-taupe">{k}</dt>
      <dd className="text-right text-ink">{v}</dd>
    </div>
  );
}

export function DiamondDetail({ d }: { d: DiamondData }) {
  return (
    <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
      <div className="art-tile relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden">
        <div className="absolute inset-[8%] animate-[spin_40s_linear_infinite]">
          <LooseDiamond shape={d.shape} shadow={false} className="h-full w-full" title={diamondSummary(d)} />
        </div>
        {[
          [28, 30, 0],
          [64, 40, 1.1],
          [44, 66, 2.2],
        ].map(([x, y, delay], i) => (
          <svg key={i} viewBox="-10 -10 20 20" className="absolute h-4 w-4 animate-twinkle text-white" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} aria-hidden>
            <path d="M0-10L2-2L10 0L2 2L0 10L-2 2L-10 0L-2-2Z" fill="currentColor" />
          </svg>
        ))}
        <span className="absolute bottom-2 left-2 bg-ivory/90 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-taupe">Diamond view</span>
      </div>
      <dl>
        <Spec k="Shape" v={label.shape(d.shape)} />
        <Spec k="Carat" v={`${d.carat.toFixed(2)} ct`} />
        <Spec k="Colour" v={d.color} />
        <Spec k="Clarity" v={d.clarity} />
        <Spec k="Cut" v={d.cut} />
        <Spec k="Polish / Symmetry" v={`${d.polish} / ${d.symmetry}`} />
        <Spec k="Fluorescence" v={d.fluorescence} />
        {d.measurements && <Spec k="Measurements" v={d.measurements} />}
        {d.tablePct != null && <Spec k="Table / Depth" v={`${d.tablePct}% / ${d.depthPct}%`} />}
        {d.ratio != null && <Spec k="L/W ratio" v={d.ratio.toFixed(2)} />}
        <Spec k="Growth method" v={d.growth} />
        <Spec
          k="Certificate"
          v={
            d.certificate ? (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                {d.certificate.lab} #{d.certificate.number}
              </span>
            ) : (
              'Pending'
            )
          }
        />
        <Spec k="Diamond SKU" v={d.sku} />
      </dl>
    </div>
  );
}

export function DiamondConfigurator({ open, onClose, option, selected, settingPrice, onSelect }: Props) {
  const minC = option.minCarat ?? 0.3;
  const maxC = option.maxCarat ?? 4;
  const initial: Q = { minCarat: minC, maxCarat: maxC, colors: [], clarities: [], cuts: [], labs: [], minPrice: '', maxPrice: '', sort: 'price-asc' };
  const [q, setQ] = useState<Q>(initial);
  const [items, setItems] = useState<DiamondData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(selected?.id ?? null);
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams({ shape: option.shape ?? 'round', minCarat: String(q.minCarat), maxCarat: String(q.maxCarat), sort: q.sort, pageSize: '20' });
    if (q.colors.length) p.set('colors', q.colors.join(','));
    if (q.clarities.length) p.set('clarities', q.clarities.join(','));
    if (q.cuts.length) p.set('cuts', q.cuts.join(','));
    if (q.labs.length) p.set('labs', q.labs.join(','));
    if (q.minPrice) p.set('minPrice', String(Number(q.minPrice) * 100));
    if (q.maxPrice) p.set('maxPrice', String(Number(q.maxPrice) * 100));
    return p.toString();
  }, [q, option.shape]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/diamonds?${params}&page=1`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
          setPage(1);
          setPageCount(d.pageCount ?? 1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [params, open]);

  const more = async () => {
    setLoading(true);
    const d = await fetch(`/api/diamonds?${params}&page=${page + 1}`).then((r) => r.json());
    setItems((prev) => [...prev, ...(d.items ?? [])]);
    setPage((p) => p + 1);
    setLoading(false);
  };

  const toggle = (key: 'colors' | 'clarities' | 'cuts' | 'labs', v: string) => setQ((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  const shapeLabel = label.shape(option.shape);

  const filters = (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <CaratRange min={minC} max={maxC} value={[q.minCarat, q.maxCarat]} onChange={([a, b]) => setQ((s) => ({ ...s, minCarat: Math.round(a * 100) / 100, maxCarat: Math.round(b * 100) / 100 }))} />
      </div>
      <Chips label="Colour" values={DIAMOND_COLORS} active={q.colors} onToggle={(v) => toggle('colors', v)} />
      <Chips label="Clarity" values={DIAMOND_CLARITIES.filter((c) => c !== 'FL')} active={q.clarities} onToggle={(v) => toggle('clarities', v)} />
      <Chips label="Cut" values={DIAMOND_CUTS} active={q.cuts} onToggle={(v) => toggle('cuts', v)} />
      <Chips label="Certification" values={CERT_LABS} active={q.labs} onToggle={(v) => toggle('labs', v)} />
      <fieldset className="sm:col-span-2">
        <legend className="label-caps mb-2 text-charcoal">Diamond price</legend>
        <div className="flex items-center gap-2">
          <input inputMode="numeric" placeholder="$ Min" aria-label="Minimum diamond price" value={q.minPrice} onChange={(e) => setQ((s) => ({ ...s, minPrice: e.target.value.replace(/\D/g, '') }))} className="field h-10 py-1" />
          <span className="text-taupe">–</span>
          <input inputMode="numeric" placeholder="$ Max" aria-label="Maximum diamond price" value={q.maxPrice} onChange={(e) => setQ((s) => ({ ...s, maxPrice: e.target.value.replace(/\D/g, '') }))} className="field h-10 py-1" />
          <button type="button" onClick={() => setQ(initial)} className="ml-2 shrink-0 text-[12px] text-taupe underline underline-offset-4 hover:text-ink">
            Reset
          </button>
        </div>
      </fieldset>
    </div>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      className="max-w-[900px]"
      title={
        <span className="flex items-center gap-3">
          <ShapeIcon shape={option.shape ?? 'round'} size={28} className="text-gold" /> Select your {shapeLabel} diamond
        </span>
      }
      label="Diamond configurator"
      bodyClassName="px-5 pb-6 sm:px-7"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] text-taupe">
            Setting {formatMoney(settingPrice)} + Diamond {formatMoney(selected?.price ?? 0)} ={' '}
            <span className="font-serif text-xl text-ink">{formatMoney(settingPrice + (selected?.price ?? 0))}</span>
          </div>
          <button onClick={onClose} className="label-caps h-12 bg-ink px-8 text-ivory hover:bg-charcoal" disabled={!selected}>
            Confirm diamond
          </button>
        </div>
      }
    >
      <div className="py-5">
        <p className="text-[13px] text-taupe">
          Every diamond below is lab-grown, conflict-free and independently graded by IGI or GIA. This setting accepts {shapeLabel.toLowerCase()} diamonds from {minC.toFixed(2)} to {maxC.toFixed(2)} ct.
        </p>
        <button type="button" onClick={() => setShowFilters((v) => !v)} className="label-caps mt-4 flex items-center gap-2 sm:hidden" aria-expanded={showFilters}>
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.25} /> {showFilters ? 'Hide filters' : 'Refine diamonds'}
        </button>
        <div className={cn('mt-5 border border-line bg-white/60 p-5', !showFilters && 'hidden sm:block')}>{filters}</div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-[12px] uppercase tracking-[0.14em] text-charcoal" aria-live="polite">
            {loading ? 'Searching…' : `${total} certified diamonds`}
          </p>
          <select value={q.sort} onChange={(e) => setQ((s) => ({ ...s, sort: e.target.value as Q['sort'] }))} className="h-9 border-0 border-b border-line bg-transparent text-[13px] focus:outline-none" aria-label="Sort diamonds">
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="carat-desc">Carat: High to Low</option>
            <option value="carat-asc">Carat: Low to High</option>
          </select>
        </div>

        <div className="mt-3 hidden grid-cols-[48px_1fr_60px_70px_90px_70px_100px] gap-3 border-b border-line px-3 pb-2 text-[10px] uppercase tracking-[0.16em] text-taupe md:grid">
          <span />
          <span>Carat</span>
          <span>Colour</span>
          <span>Clarity</span>
          <span>Cut</span>
          <span>Lab</span>
          <span className="text-right">Price</span>
        </div>
        <ul className={cn('divide-y divide-line transition-opacity', loading && 'opacity-60')}>
          {items.map((d) => {
            const isSel = selected?.id === d.id;
            const isOpen = expanded === d.id;
            return (
              <li key={d.id} className={cn(isSel && 'bg-gold-pale/40')}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[48px_1fr_auto] items-center gap-3 px-3 py-3 text-left text-[13.5px] transition-colors hover:bg-white md:grid-cols-[48px_1fr_60px_70px_90px_70px_100px]"
                >
                  <span className="art-tile flex h-12 w-12 items-center justify-center">
                    <ShapeIcon shape={d.shape} size={30} className="text-taupe" />
                  </span>
                  <span>
                    <span className="font-medium text-ink">{d.carat.toFixed(2)} ct</span>
                    <span className="block text-[12px] text-taupe md:hidden">
                      {d.color} · {d.clarity} · {d.cut} · {d.certificate?.lab}
                    </span>
                  </span>
                  <span className="hidden md:block">{d.color}</span>
                  <span className="hidden md:block">{d.clarity}</span>
                  <span className="hidden md:block">{d.cut}</span>
                  <span className="hidden md:block">{d.certificate?.lab}</span>
                  <span className="flex items-center justify-end gap-2 text-right">
                    {isSel && <Check className="h-4 w-4 text-gold-deep" strokeWidth={2} aria-label="Selected" />}
                    {formatMoney(d.price)}
                    <ChevronDown className={cn('h-4 w-4 text-taupe transition-transform', isOpen && 'rotate-180')} strokeWidth={1.25} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-5 pt-1">
                    <DiamondDetail d={d} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[13px] text-taupe">
                        With this diamond: <span className="font-serif text-lg text-ink">{formatMoney(settingPrice + d.price)}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(d);
                          onClose();
                        }}
                        className={cn('label-caps h-11 px-6 transition-colors', isSel ? 'border border-ink' : 'bg-ink text-ivory hover:bg-charcoal')}
                      >
                        {isSel ? 'Selected' : 'Select this diamond'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!loading && items.length === 0 && (
          <div className="py-14 text-center">
            <p className="font-serif text-2xl">No diamonds match these filters</p>
            <button onClick={() => setQ(initial)} className="label-caps mt-4 border-b border-ink pb-0.5">
              Reset filters
            </button>
          </div>
        )}
        {page < pageCount && (
          <div className="mt-6 text-center">
            <button onClick={more} disabled={loading} className="label-caps h-11 border border-ink px-8 hover:bg-ink hover:text-ivory">
              Show more diamonds
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
