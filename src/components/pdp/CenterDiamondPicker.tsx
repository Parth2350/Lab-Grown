'use client';
import { Check, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SHAPES, label } from '@/lib/catalog';
import type { DiamondData, DiamondOptionData } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { DiamondConfigurator } from './DiamondConfigurator';

/** Carat sizes shoppers think in; each covers stones up to the next size. */
const SIZES = [0.3, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
const sizeOf = (ct: number) => [...SIZES].reverse().find((s) => ct >= s - 1e-6) ?? SIZES[0];
const sizeTop = (s: number) => (SIZES[SIZES.indexOf(s) + 1] ?? 5) - 0.01;

const TIERS = [
  { id: 1, name: 'Good', blurb: 'Eye-clean, near-colourless. Best value.', grades: 'H colour or SI clarity' },
  { id: 2, name: 'Better', blurb: 'Very white and very clean. Most popular.', grades: 'F–G colour · VS clarity or higher' },
  { id: 3, name: 'Best', blurb: 'Colourless and virtually flawless.', grades: 'D–E colour · VVS clarity or higher' },
];
const colorScore = (c: string) => (c === 'D' || c === 'E' ? 3 : c === 'F' || c === 'G' ? 2 : 1);
const clarityScore = (c: string) => (['FL', 'IF', 'VVS1', 'VVS2'].includes(c) ? 3 : c === 'VS1' || c === 'VS2' ? 2 : 1);
const tierOf = (d: DiamondData) => Math.min(colorScore(d.color), clarityScore(d.clarity));

/** cheapest diamond of a size + quality tier */
const pick = (list: DiamondData[], size: number, tier: number) =>
  list.filter((d) => sizeOf(d.carat) === size && tierOf(d) === tier).sort((a, b) => a.price - b.price)[0] ?? null;

/** closest available size, then closest available tier */
function choose(list: DiamondData[], size: number, tier: number) {
  const sizes = [...new Set(list.map((d) => sizeOf(d.carat)))];
  if (!sizes.length) return null;
  const s = sizes.reduce((best, x) => (Math.abs(x - size) < Math.abs(best - size) ? x : best));
  for (const t of [1, 2, 3].sort((a, b) => Math.abs(a - tier) - Math.abs(b - tier) || b - a)) {
    const d = pick(list, s, t);
    if (d) return { size: s, tier: t, d };
  }
  return null;
}

type Props = {
  option: DiamondOptionData;
  shape: string;
  onShape: (s: string) => void;
  diamond: DiamondData | null;
  onDiamond: (d: DiamondData | null) => void;
  settingPrice: number;
  defaultCarat: number;
  scrollIntoView?: boolean;
};

export function CenterDiamondPicker({ option, shape, onShape, diamond, onDiamond, settingPrice, defaultCarat, scrollIntoView }: Props) {
  const minC = option.minCarat ?? 0.3;
  const maxC = option.maxCarat ?? 4.5;
  const [lists, setLists] = useState<Record<string, DiamondData[]>>({});
  const [size, setSize] = useState(sizeOf(diamond?.carat ?? defaultCarat));
  const [tier, setTier] = useState(diamond ? tierOf(diamond) : 2);
  const [browse, setBrowse] = useState(false);
  const want = useRef<{ size: number; tier: number } | null>(diamond ? null : { size, tier });
  const root = useRef<HTMLDivElement>(null);
  const list = lists[shape];

  useEffect(() => {
    if (scrollIntoView) root.current?.scrollIntoView({ block: 'center' });
  }, [scrollIntoView]);

  // load every certified diamond of this shape that fits the setting (once per shape)
  useEffect(() => {
    if (lists[shape]) return;
    const ctrl = new AbortController();
    fetch(`/api/diamonds?shape=${shape}&minCarat=${minC}&maxCarat=${maxC}&sort=price-asc&pageSize=200`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setLists((m) => ({ ...m, [shape]: d.items ?? [] })))
      .catch(() => {
        if (!ctrl.signal.aborted) setLists((m) => ({ ...m, [shape]: [] }));
      });
    return () => ctrl.abort();
  }, [shape, lists, minC, maxC]);

  // after a shape change, pick the closest match to what the shopper had
  useEffect(() => {
    if (!list || !want.current) return;
    const r = choose(list, want.current.size, want.current.tier);
    want.current = null;
    if (r) {
      setSize(r.size);
      setTier(r.tier);
    }
    onDiamond(r?.d ?? null);
  }, [list, onDiamond]);

  const chooseShape = (s: string) => {
    if (s === shape) return;
    want.current = { size, tier };
    onDiamond(null);
    onShape(s);
  };
  const chooseSize = (s: number) => {
    const r = list && choose(list, s, tier);
    if (!r) return;
    setSize(r.size);
    setTier(r.tier);
    onDiamond(r.d);
  };
  const chooseTier = (t: number) => {
    const d = list && pick(list, size, t);
    if (!d) return;
    setTier(t);
    onDiamond(d);
  };

  const sizes = list ? [...new Set(list.map((d) => sizeOf(d.carat)))].sort((a, b) => a - b) : [];
  const shapeLabel = label.shape(shape);

  return (
    <div ref={root} className="mt-8 border border-line bg-white p-4 sm:p-5">
      <p className="font-serif text-2xl leading-tight">Choose your centre diamond</p>
      <p className="mt-1 text-[14px] text-taupe">Every diamond is lab-grown and independently certified by IGI or GIA.</p>

      {/* 1 · shape */}
      <fieldset className="mt-5">
        <legend className="label-caps mb-3">
          1 · Shape: <span className="font-normal normal-case tracking-normal text-taupe">{shapeLabel}</span>
        </legend>
        <div className="grid grid-cols-5 gap-1.5">
          {SHAPES.map((s) => {
            const on = s.slug === shape;
            return (
              <button
                key={s.slug}
                type="button"
                aria-pressed={on}
                onClick={() => chooseShape(s.slug)}
                className={cn('flex flex-col items-center gap-1 border px-0.5 py-2 text-[12px] transition-colors', on ? 'border-ink bg-ivory text-ink' : 'border-line text-taupe hover:border-ink hover:text-ink')}
              >
                <ShapeIcon shape={s.slug} size={26} className={on ? 'text-gold' : 'text-charcoal/70'} />
                {s.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {!list ? (
        <p className="mt-6 animate-pulse text-[15px] text-taupe" aria-live="polite">
          Finding {shapeLabel.toLowerCase()} diamonds…
        </p>
      ) : !sizes.length ? (
        <p className="mt-6 bg-porcelain p-4 text-[15px] text-charcoal" aria-live="polite">
          No {shapeLabel.toLowerCase()} diamonds are available for this setting right now — please choose another shape.
        </p>
      ) : (
        <>
          {/* 2 · carat */}
          <fieldset className="mt-6">
            <legend className="label-caps mb-3">
              2 · Carat size: <span className="font-normal normal-case tracking-normal text-taupe">{size} ct</span>
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === size}
                  onClick={() => chooseSize(s)}
                  className={cn('h-10 min-w-[64px] border px-3 text-[15px] transition-colors', s === size ? 'border-ink bg-ink text-ivory' : 'border-line hover:border-ink')}
                >
                  {s} ct
                </button>
              ))}
            </div>
            <p className="mt-2 text-[14px] text-taupe">
              Diamonds from {size.toFixed(2)} to {sizeTop(size).toFixed(2)} ct. Bigger carat = bigger, more visible stone.
            </p>
          </fieldset>

          {/* 3 · quality */}
          <fieldset className="mt-6">
            <legend className="label-caps mb-3">3 · Quality</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {TIERS.map((t) => {
                const d = pick(list, size, t.id);
                const on = !!diamond && tierOf(diamond) === t.id && sizeOf(diamond.carat) === size;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    disabled={!d}
                    onClick={() => chooseTier(t.id)}
                    className={cn(
                      'relative flex flex-col border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                      on ? 'border-ink bg-ivory' : 'border-line enabled:hover:border-ink',
                    )}
                  >
                    {on && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-gold-deep" strokeWidth={2} aria-hidden />}
                    <span className="font-serif text-xl leading-none text-ink">{t.name}</span>
                    <span className="mt-1.5 text-[14px] leading-snug text-charcoal">{t.blurb}</span>
                    <span className="mt-1 text-[13px] leading-snug text-taupe">{t.grades}</span>
                    <span className="mt-2 text-[16px] text-ink">{d ? formatMoney(settingPrice + d.price) : `Not available in ${size} ct`}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* result */}
          {diamond && (
            <div className="mt-5 flex items-start gap-3 bg-gold-pale/40 p-3">
              <span className="art-tile flex h-12 w-12 shrink-0 items-center justify-center">
                <ShapeIcon shape={diamond.shape} size={30} className="text-gold" />
              </span>
              <div className="min-w-0 text-[15px]">
                <p className="text-ink">
                  Your diamond: {diamond.carat.toFixed(2)} ct {label.shape(diamond.shape)} · Colour {diamond.color} · Clarity {diamond.clarity} · {diamond.cut} cut
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-taupe">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} /> {diamond.certificate?.lab} certified #{diamond.certificate?.number} · Diamond {formatMoney(diamond.price)}
                </p>
              </div>
            </div>
          )}

          <button type="button" onClick={() => setBrowse(true)} className="mt-4 text-[14px] text-taupe underline underline-offset-4 hover:text-ink">
            Prefer to pick an exact stone? Browse all {list.length} {shapeLabel.toLowerCase()} diamonds
          </button>
          <DiamondConfigurator
            open={browse}
            onClose={() => setBrowse(false)}
            option={{ ...option, shape }}
            selected={diamond}
            settingPrice={settingPrice}
            onSelect={(d) => {
              setSize(sizeOf(d.carat));
              setTier(tierOf(d));
              onDiamond(d);
            }}
          />
        </>
      )}
    </div>
  );
}
