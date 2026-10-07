'use client';
import { useEffect } from 'react';
import { ArrowDown, ArrowUp, CircleAlert, Gem, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SHAPES } from '@/lib/catalog';
import { countEligibleDiamonds } from '@/lib/server/admin/actions/products';
import { cn, formatMoney } from '@/lib/utils';
import { EditorSection, ErrorText, FieldLabel, Hint, MoneyInput, chevronStyle, inputCls, selectCls, type SectionProps } from './editor-ui';
import { CLARITY_GRADES, COLOR_GRADES, SHAPE_LIST, optionErrKey, optionKey, parseFloatInput, type DiamondMode, type OptionDraft } from './shared';

export type Eligible = { status: 'idle' | 'loading' | 'done' | 'error'; count: number; cheapest: number | null };

const MODES: { value: DiamondMode; title: string; description: string }[] = [
  { value: 'NONE', title: 'None', description: 'Plain metal, or stones included in the price.' },
  { value: 'CENTER_STONE', title: 'Centre stone', description: 'Shoppers pick a certified loose diamond from inventory.' },
  { value: 'TOTAL_WEIGHT', title: 'Total-weight packages', description: 'Pre-set carat weight & quality options with a price add-on.' },
];

const cell = 'field h-9 px-2.5 py-0 text-[12.5px]';
const cellSelect = 'field h-9 cursor-pointer appearance-none py-0 pl-2.5 pr-7 text-[12.5px]';

function newOption(isDefault: boolean): OptionDraft {
  return { id: null, key: optionKey(), label: '', totalCarat: '', color: 'G', clarity: 'VS1', priceDelta: '', isDefault };
}

export function DiamondSection({ draft, update, errors, eligible, setEligible }: SectionProps & { eligible: Eligible; setEligible: (e: Eligible) => void }) {
  const mode = draft.diamondMode;
  const { shape, minCarat, maxCarat } = draft.center;

  // Live inventory check for the centre-stone range (debounced)
  useEffect(() => {
    if (mode !== 'CENTER_STONE') return;
    const min = parseFloatInput(minCarat);
    const max = parseFloatInput(maxCarat);
    if (!SHAPE_LIST.includes(shape) || min == null || max == null || max < min) {
      setEligible({ status: 'idle', count: 0, cheapest: null });
      return;
    }
    let cancelled = false;
    setEligible({ status: 'loading', count: 0, cheapest: null });
    const t = setTimeout(async () => {
      try {
        const res = await countEligibleDiamonds(shape, min, max);
        if (cancelled) return;
        if (res.ok && res.data) setEligible({ status: 'done', count: res.data.count, cheapest: res.data.cheapestPrice });
        else setEligible({ status: 'error', count: 0, cheapest: null });
      } catch {
        if (!cancelled) setEligible({ status: 'error', count: 0, cheapest: null });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mode, shape, minCarat, maxCarat, setEligible]);

  const setMode = (m: DiamondMode) =>
    update((d) => ({
      diamondMode: m,
      hasCenterStone: m === 'CENTER_STONE' ? true : d.diamondMode === 'CENTER_STONE' ? false : d.hasCenterStone,
      ...(m === 'CENTER_STONE' && !SHAPE_LIST.includes(d.center.shape) ? { center: { ...d.center, shape: d.shapes[0] ?? 'round' } } : {}),
      ...(m === 'TOTAL_WEIGHT' && d.options.length === 0 ? { options: [newOption(true)] } : {}),
    }));

  const setCenter = (patch: Partial<typeof draft.center>) => update((d) => ({ center: { ...d.center, ...patch } }));
  const setOption = (key: string, patch: Partial<OptionDraft>) => update((d) => ({ options: d.options.map((o) => (o.key === key ? { ...o, ...patch } : o)) }));
  const setDefault = (key: string) => update((d) => ({ options: d.options.map((o) => ({ ...o, isDefault: o.key === key })) }));
  const removeOption = (key: string) =>
    update((d) => {
      const next = d.options.filter((o) => o.key !== key);
      if (next.length && !next.some((o) => o.isDefault)) next[0] = { ...next[0], isDefault: true };
      return { options: next };
    });
  const moveOption = (index: number, dir: -1 | 1) =>
    update((d) => {
      const next = [...d.options];
      const j = index + dir;
      if (j < 0 || j >= next.length) return {};
      [next[index], next[j]] = [next[j], next[index]];
      return { options: next };
    });

  return (
    <EditorSection id="diamonds" title="Diamond options" description="How shoppers choose the diamonds for this piece.">
      <fieldset>
        <legend className="sr-only">Diamond option type</legend>
        <div className="grid gap-2 md:grid-cols-3">
          {MODES.map((m) => {
            const selected = mode === m.value;
            return (
              <label key={m.value} className={cn('flex cursor-pointer gap-3 border p-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-gold', selected ? 'border-ink bg-ivory' : 'border-line hover:border-stone')}>
                <input type="radio" name="diamondMode" value={m.value} checked={selected} onChange={() => setMode(m.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-ink" />
                <span>
                  <span className="block text-[13px] text-ink">{m.title}</span>
                  <span className="text-xs text-taupe">{m.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        <ErrorText msg={errors.diamondMode} />
      </fieldset>

      {mode === 'CENTER_STONE' && (
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="c-shape" required>
              Shape
            </FieldLabel>
            <select id="c-shape" value={shape} onChange={(e) => setCenter({ shape: e.target.value })} aria-invalid={errors['center.shape'] ? true : undefined} className={selectCls} style={chevronStyle}>
              {SHAPES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
            <ErrorText msg={errors['center.shape']} />
          </div>
          <div>
            <FieldLabel htmlFor="c-min" required>
              Min carat
            </FieldLabel>
            <input id="c-min" inputMode="decimal" value={minCarat} onChange={(e) => setCenter({ minCarat: e.target.value })} aria-invalid={errors['center.minCarat'] ? true : undefined} className={`${inputCls} tabular-nums`} placeholder="0.5" />
            <ErrorText msg={errors['center.minCarat']} />
          </div>
          <div>
            <FieldLabel htmlFor="c-max" required>
              Max carat
            </FieldLabel>
            <input id="c-max" inputMode="decimal" value={maxCarat} onChange={(e) => setCenter({ maxCarat: e.target.value })} aria-invalid={errors['center.maxCarat'] ? true : undefined} className={`${inputCls} tabular-nums`} placeholder="3.0" />
            <ErrorText msg={errors['center.maxCarat']} />
          </div>
          <div className="sm:col-span-3" aria-live="polite">
            {eligible.status === 'loading' && (
              <p className="flex items-center gap-2 text-[13px] text-taupe">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />
                Checking inventory…
              </p>
            )}
            {eligible.status === 'done' && eligible.count > 0 && (
              <p className="flex items-center gap-2 border border-success/25 bg-success/[0.06] px-3 py-2 text-[13px] text-success">
                <Gem className="h-4 w-4 shrink-0" strokeWidth={1.4} aria-hidden />
                {eligible.count.toLocaleString()} available diamond{eligible.count === 1 ? '' : 's'} fit this setting{eligible.cheapest != null && <> · from {formatMoney(eligible.cheapest)}</>}
              </p>
            )}
            {eligible.status === 'done' && eligible.count === 0 && (
              <p className="flex items-center gap-2 border border-[#E6CF9E] bg-[#FBF3E1] px-3 py-2 text-[13px] text-[#7A5718]">
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={1.4} aria-hidden />
                No available diamonds match — shoppers won’t be able to complete this ring. Widen the range or add stones to inventory.
              </p>
            )}
            {eligible.status === 'error' && <p className="text-[13px] text-danger">Couldn’t check diamond inventory right now.</p>}
            {eligible.status === 'idle' && <Hint>Enter a carat range to see how many loose diamonds are available.</Hint>}
          </div>
        </div>
      )}

      {mode === 'TOTAL_WEIGHT' && (
        <div className="mt-5">
          <ErrorText msg={errors.options} />
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px] tabular-nums">
              <thead className="border-b border-line bg-ivory/70">
                <tr className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                  <th scope="col" className="w-[64px] px-3 py-2 font-medium">
                    Default
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Label
                  </th>
                  <th scope="col" className="w-[96px] px-3 py-2 font-medium">
                    Total ct
                  </th>
                  <th scope="col" className="w-[84px] px-3 py-2 font-medium">
                    Colour
                  </th>
                  <th scope="col" className="w-[96px] px-3 py-2 font-medium">
                    Clarity
                  </th>
                  <th scope="col" className="w-[130px] px-3 py-2 font-medium">
                    Price add-on
                  </th>
                  <th scope="col" className="w-[104px] px-3 py-2 font-medium">
                    <span className="sr-only">Reorder or remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {draft.options.map((o, i) => {
                  const err = (f: string) => errors[optionErrKey(o.key, f)];
                  const ct = parseFloatInput(o.totalCarat);
                  const rowLabel = `package ${i + 1}`;
                  return (
                    <tr key={o.key} className="border-b border-line/70 last:border-0">
                      <td className="px-3 py-2 align-top">
                        <label className="inline-flex h-9 cursor-pointer items-center">
                          <input type="radio" name="defaultOption" checked={o.isDefault} onChange={() => setDefault(o.key)} className="h-4 w-4 accent-ink" />
                          <span className="sr-only">Make {rowLabel} the default</span>
                        </label>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`o-${o.key}-label`} className="sr-only">
                          Label for {rowLabel}
                        </label>
                        <input
                          id={`o-${o.key}-label`}
                          value={o.label}
                          maxLength={80}
                          onChange={(e) => setOption(o.key, { label: e.target.value })}
                          aria-invalid={err('label') ? true : undefined}
                          className={cell}
                          placeholder={ct != null ? `${ct.toFixed(2)} ct total weight` : 'e.g. 1.00 ct total weight'}
                        />
                        <ErrorText msg={err('label')} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`o-${o.key}-ct`} className="sr-only">
                          Total carat for {rowLabel}
                        </label>
                        <input id={`o-${o.key}-ct`} inputMode="decimal" value={o.totalCarat} onChange={(e) => setOption(o.key, { totalCarat: e.target.value })} aria-invalid={err('totalCarat') ? true : undefined} className={cell} placeholder="1.00" />
                        <ErrorText msg={err('totalCarat')} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`o-${o.key}-color`} className="sr-only">
                          Colour grade for {rowLabel}
                        </label>
                        <select id={`o-${o.key}-color`} value={o.color} onChange={(e) => setOption(o.key, { color: e.target.value })} aria-invalid={err('color') ? true : undefined} className={cellSelect} style={chevronStyle}>
                          {COLOR_GRADES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ErrorText msg={err('color')} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`o-${o.key}-clarity`} className="sr-only">
                          Clarity grade for {rowLabel}
                        </label>
                        <select id={`o-${o.key}-clarity`} value={o.clarity} onChange={(e) => setOption(o.key, { clarity: e.target.value })} aria-invalid={err('clarity') ? true : undefined} className={cellSelect} style={chevronStyle}>
                          {CLARITY_GRADES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ErrorText msg={err('clarity')} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <MoneyInput id={`o-${o.key}-price`} value={o.priceDelta} onChange={(v) => setOption(o.key, { priceDelta: v })} invalid={!!err('priceDelta')} label={`Price add-on for ${rowLabel} in dollars`} placeholder="0" />
                        <ErrorText msg={err('priceDelta')} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex h-9 items-center justify-end">
                          <button type="button" onClick={() => moveOption(i, -1)} disabled={i === 0} aria-label={`Move ${rowLabel} up`} className="inline-flex h-8 w-8 items-center justify-center text-taupe hover:text-ink disabled:opacity-30">
                            <ArrowUp className="h-4 w-4" strokeWidth={1.4} />
                          </button>
                          <button type="button" onClick={() => moveOption(i, 1)} disabled={i === draft.options.length - 1} aria-label={`Move ${rowLabel} down`} className="inline-flex h-8 w-8 items-center justify-center text-taupe hover:text-ink disabled:opacity-30">
                            <ArrowDown className="h-4 w-4" strokeWidth={1.4} />
                          </button>
                          <button type="button" onClick={() => removeOption(o.key)} aria-label={`Remove ${rowLabel}`} className="inline-flex h-8 w-8 items-center justify-center text-taupe hover:text-danger">
                            <X className="h-4 w-4" strokeWidth={1.4} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {draft.options.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-[13px] text-taupe">
                      No packages yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => update((d) => ({ options: [...d.options, newOption(d.options.length === 0)] }))} disabled={draft.options.length >= 12}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Add package
            </Button>
            <p className="text-xs text-taupe">The default package sets the product’s total carat and is pre-selected on the product page. Blank labels are generated from the carat.</p>
          </div>
        </div>
      )}
    </EditorSection>
  );
}
