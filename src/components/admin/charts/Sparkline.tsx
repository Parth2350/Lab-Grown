'use client';
import { VIZ, useWidth } from './core';

/** 12-point trend in the de-emphasis hue with the current period in the accent. Decorative (values live in the tile). */
export function Sparkline({ values, height = 28 }: { values: number[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => [pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1), pad + (height - pad * 2) * (1 - (v - min) / span)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('');
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} style={{ height }} aria-hidden>
      {width > 0 && values.length > 1 && (
        <svg width={width} height={height} className="block overflow-visible">
          <path d={d} fill="none" stroke={VIZ.axis} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          {last && <circle cx={last[0]} cy={last[1]} r={3.5} fill={VIZ.series[0]} stroke={VIZ.surface} strokeWidth={2} />}
        </svg>
      )}
    </div>
  );
}
