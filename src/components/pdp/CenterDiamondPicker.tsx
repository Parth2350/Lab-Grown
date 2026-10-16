'use client';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SHAPES, label } from '@/lib/catalog';
import type { DiamondData, DiamondOptionData } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { DiamondConfigurator } from './DiamondConfigurator';
import { OptionGroup, optionBtn } from './Options';

/** Carat sizes shoppers think in; each covers stones up to the next size. */
const SIZES = [0.3, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
const sizeOf = (ct: number) => [...SIZES].reverse().find((s) => ct >= s - 1e-6) ?? SIZES[0];

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
  const currentTier = diamond && sizeOf(diamond.carat) === size ? TIERS.find((t) => t.id === tierOf(diamond)) : null;

  // three cells of the product options grid: shape, centre carat, then quality across the full width
  return (
    <>
      <div ref={root}>
        <OptionGroup label="Shape" value={shapeLabel}>
          {SHAPES.map((s) => (
            <button key={s.slug} type="button" title={s.label} aria-label={s.label} aria-pressed={s.slug === shape} onClick={() => chooseShape(s.slug)} className={optionBtn(s.slug === shape)}>
              <ShapeIcon shape={s.slug} size={24} className={s.slug === shape ? 'text-ink' : 'text-charcoal/70'} />
            </button>
          ))}
        </OptionGroup>
      </div>

      <OptionGroup label="Center Carat" value={diamond ? `${diamond.carat.toFixed(2)} ct` : undefined}>
        {!list ? (
          <p className="animate-pulse text-[15px] text-taupe" aria-live="polite">
            Finding {shapeLabel.toLowerCase()} diamonds…
          </p>
        ) : !sizes.length ? (
          <p className="text-[15px] text-charcoal" aria-live="polite">
            No {shapeLabel.toLowerCase()} diamonds are available for this setting right now — please choose another shape.
          </p>
        ) : (
          sizes.map((s) => (
            <button key={s} type="button" aria-pressed={s === size} onClick={() => chooseSize(s)} className={optionBtn(s === size)}>
              <span className="text-sm font-medium leading-none">{s}</span>
            </button>
          ))
        )}
      </OptionGroup>

      {list && sizes.length > 0 && (
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <OptionGroup label="Diamond Quality" value={currentTier?.name}>
            {TIERS.map((t) => {
              const d = pick(list, size, t.id);
              return (
                <button key={t.id} type="button" aria-pressed={currentTier?.id === t.id} disabled={!d} onClick={() => chooseTier(t.id)} className={cn(optionBtn(currentTier?.id === t.id), 'min-w-[6.5rem] gap-1.5')}>
                  <span className="text-sm font-medium leading-none">{t.name}</span>
                  <span className="text-[13px] leading-none text-taupe">{d ? formatMoney(settingPrice + d.price) : 'Unavailable'}</span>
                </button>
              );
            })}
          </OptionGroup>
          {currentTier && (
            <p className="mt-2 text-[14px] text-taupe">
              {currentTier.blurb} {currentTier.grades}.
            </p>
          )}

          {diamond && (
            <p className="mt-3 flex items-start gap-2 text-[14px] text-charcoal">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
              <span>
                Your diamond: {diamond.carat.toFixed(2)} ct {shapeLabel} · {diamond.color} · {diamond.clarity} · {diamond.cut} cut
                {diamond.certificate && ` · ${diamond.certificate.lab} #${diamond.certificate.number}`}
              </span>
            </p>
          )}
          <button type="button" onClick={() => setBrowse(true)} className="mt-2 text-[14px] text-taupe underline underline-offset-4 hover:text-ink">
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
        </div>
      )}
    </>
  );
}
