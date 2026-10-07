'use client';
import { useEffect, useRef, useState } from 'react';
import { formatCompact, formatMoney, formatMoneyCompact, formatNumber, formatPercent } from '../format';

/**
 * Chart tokens — validated with the dataviz palette validator on the white panel surface:
 *   node validate_palette.js "#AD7A22,#3A6EA5,#C2562F" --mode light --surface "#FFFFFF"
 *   → lightness band, chroma floor, adjacent CVD ΔE ≥ 17.6, normal-vision ΔE ≥ 23.8, contrast ≥ 3:1 — ALL PASS.
 * Adjacent-pair forms only (stacks / lines / bars). Slot order is fixed: 1 antique gold, 2 sapphire, 3 garnet.
 * The admin is a light-only surface (the store has no dark theme), so a single validated mode ships.
 */
export const VIZ = {
  series: ['#AD7A22', '#3A6EA5', '#C2562F'] as const,
  surface: '#FFFFFF',
  grid: '#EEE9E0',
  axis: '#D8CFC1',
  muted: '#77706A',
  ink: '#141311',
  secondary: '#2B2925',
} as const;

export type ValueFormat = 'money' | 'number' | 'percent';

/** Full-precision value for tooltips & tables */
export function fmtValue(v: number, f: ValueFormat) {
  if (f === 'money') return formatMoney(Math.round(v));
  if (f === 'percent') return formatPercent(v);
  return formatNumber(Math.round(v * 10) / 10);
}

/** Compact value for axis ticks & direct labels */
export function fmtTick(v: number, f: ValueFormat) {
  if (f === 'money') return formatMoneyCompact(v);
  if (f === 'percent') return formatPercent(v, 0);
  return formatCompact(v);
}

function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

/** Round, human tick values from 0 to a nice max ≥ max */
export function niceTicks(max: number, count = 4, integer = false) {
  if (!(max > 0)) return [0, integer ? 1 : 1];
  let step = niceStep(max / count);
  if (integer) step = Math.max(1, Math.ceil(step));
  const top = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top + step / 1000; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

/** Measures an element's content width with ResizeObserver (0 until mounted). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      setWidth((prev) => (prev === w ? prev : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Column path: square at the baseline, 4px rounded data-end */
export function columnPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/** Approximate label width for 11px sans so y-axis gutters fit their ticks */
export function textWidth(s: string, px = 11) {
  return Math.ceil(s.length * px * 0.58);
}
