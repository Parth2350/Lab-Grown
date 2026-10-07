'use client';
import type { ReactNode } from 'react';

export type TooltipRow = { key: string; color?: string; label: string; value: string; shape?: 'line' | 'rect' };

/**
 * Chart tooltip — values lead (strong), labels follow (secondary); series keyed with a short
 * stroke of the series colour. Positioned inside the chart's relative container and kept within it.
 */
export function ChartTooltip({ x, y, containerWidth, title, rows, footer }: { x: number; y: number; containerWidth: number; title: string; rows: TooltipRow[]; footer?: ReactNode }) {
  const w = 188;
  const left = Math.max(0, Math.min(containerWidth - w, x - w / 2));
  return (
    <div
      className="pointer-events-none absolute z-10 border border-line bg-white px-3 py-2 text-left shadow-soft"
      style={{ left, top: Math.max(0, y), width: w, transform: 'translateY(-100%)' }}
      role="presentation"
    >
      <p className="mb-1 text-[11px] text-taupe">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-[12px]">
            {r.color && (r.shape === 'rect' ? <span className="h-2 w-2 shrink-0" style={{ background: r.color }} aria-hidden /> : <span className="h-0.5 w-3 shrink-0" style={{ background: r.color }} aria-hidden />)}
            <span className="font-medium tabular-nums text-ink">{r.value}</span>
            <span className="min-w-0 truncate text-taupe">{r.label}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-1 border-t border-line pt-1 text-[11px] text-taupe">{footer}</div>}
    </div>
  );
}
