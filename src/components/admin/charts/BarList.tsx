'use client';
import Link from 'next/link';
import { useState } from 'react';
import { VIZ, fmtTick, fmtValue, type ValueFormat } from './core';

export type BarItem = { key: string; label: string; value: number; href?: string; hint?: string };

/**
 * Horizontal bars for nominal categories (one series → one hue, sorted by value).
 * Value sits at the bar tip; hover/focus adds share-of-total and an optional hint.
 */
export function BarList({ items, format, ariaLabel, emptyLabel = 'No data for this period', max: maxProp }: { items: BarItem[]; format: ValueFormat; ariaLabel: string; emptyLabel?: string; max?: number }) {
  const [active, setActive] = useState<string | null>(null);
  const total = items.reduce((s, i) => s + i.value, 0);
  const max = maxProp ?? Math.max(0, ...items.map((i) => i.value));
  if (!items.length || max <= 0) return <p className="py-8 text-center text-[15px] text-taupe">{emptyLabel}</p>;
  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {items.map((item) => {
        const pct = max > 0 ? item.value / max : 0;
        const share = total > 0 ? item.value / total : 0;
        const isActive = active === item.key;
        const label = item.href ? (
          <Link href={item.href} className="truncate text-charcoal underline-offset-4 hover:text-ink hover:underline">
            {item.label}
          </Link>
        ) : (
          <span className="truncate text-charcoal">{item.label}</span>
        );
        return (
          <li
            key={item.key}
            className="group grid grid-cols-[minmax(84px,34%)_1fr] items-center gap-3 text-[14.5px] outline-none"
            tabIndex={0}
            aria-label={`${item.label}: ${fmtValue(item.value, format)}, ${(share * 100).toFixed(1)}% of total${item.hint ? `, ${item.hint}` : ''}`}
            onPointerEnter={() => setActive(item.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(item.key)}
            onBlur={() => setActive(null)}
          >
            <div className="flex min-w-0 items-center">{label}</div>
            <div className="relative flex min-w-0 items-center gap-2">
              <div
                className="h-3.5 shrink-0 rounded-r-[4px] transition-opacity"
                style={{ width: `calc((100% - 76px) * ${pct})`, minWidth: item.value > 0 ? 2 : 0, background: VIZ.series[0], opacity: active && !isActive ? 0.55 : 1 }}
              />
              <span className="shrink-0 tabular-nums text-ink">{fmtTick(item.value, format)}</span>
              {isActive && (
                <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 whitespace-nowrap border border-line bg-white px-2.5 py-1.5 text-[13.5px] shadow-soft" role="presentation">
                  <span className="font-medium tabular-nums text-ink">{fmtValue(item.value, format)}</span>
                  <span className="text-taupe"> · {(share * 100).toFixed(1)}% of total</span>
                  {item.hint && <span className="text-taupe"> · {item.hint}</span>}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
