'use client';
import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChartTooltip } from './Tooltip';
import { VIZ, columnPath, fmtTick, fmtValue, niceTicks, textWidth, useWidth, type ValueFormat } from './core';

export type TimeSeries = { key: string; label: string; values: number[] };

type Props = {
  /** Short x labels ("Mar", "12 May") */
  labels: string[];
  /** Tooltip titles ("March 2026 · month to date") — defaults to labels */
  titles?: string[];
  /** One series → single column/line; several + kind="column" → stacked columns (legend shown) */
  series: TimeSeries[];
  kind: 'line' | 'column';
  format: ValueFormat;
  height?: number;
  integer?: boolean;
  ariaLabel: string;
};

const PAD = { top: 22, right: 14, bottom: 26 };

/**
 * Time-series chart: single-series line (area wash) or columns, or stacked columns for 2–3
 * series. One y-axis (never dual). Crosshair/hover + keyboard (← →) tooltip listing every series.
 */
export function TimeChart({ labels, titles, series, kind, format, height = 240, integer, ariaLabel }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const n = labels.length;
  const stacked = kind === 'column' && series.length > 1;

  const totals = useMemo(() => labels.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0)), [labels, series]);
  const max = stacked ? Math.max(0, ...totals) : Math.max(0, ...series.flatMap((s) => s.values));
  const ticks = niceTicks(max, 4, integer || format === 'number');
  const top = ticks[ticks.length - 1] || 1;
  const left = Math.max(...ticks.map((t) => textWidth(fmtTick(t, format)))) + 12;

  const plotW = Math.max(0, width - left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const band = n ? plotW / n : 0;
  const xMid = (i: number) => left + band * (i + 0.5);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  // label thinning so x labels never collide
  const maxLabelW = Math.max(...labels.map((l) => textWidth(l, 10.5)), 1) + 8;
  const stride = Math.max(1, Math.ceil(maxLabelW / Math.max(band, 1)));

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left) / Math.max(band, 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((a) => {
        const cur = a ?? n - 1;
        return Math.min(n - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)));
      });
    } else if (e.key === 'Escape') setActive(null);
  };

  // selective direct labels: the extreme and the latest value (columns) / the end value (line)
  const single = series[0]?.values ?? [];
  const maxIdx = single.length ? single.indexOf(Math.max(...single)) : -1;
  const lastIdx = n - 1;
  const labelIdx = new Set<number>(kind === 'line' ? [lastIdx] : stacked ? [] : Math.abs(maxIdx - lastIdx) <= 1 ? [maxIdx] : [maxIdx, lastIdx]);

  const barW = Math.max(2, Math.min(24, band * 0.62));

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-charcoal" aria-label="Legend">
          {series.map((s, si) => (
            <li key={s.key} className="flex items-center gap-1.5">
              {kind === 'line' ? <span className="h-0.5 w-3.5" style={{ background: VIZ.series[si] }} aria-hidden /> : <span className="h-2.5 w-2.5" style={{ background: VIZ.series[si] }} aria-hidden />}
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={ref}
        className="relative outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${ariaLabel}. Use left and right arrow keys to read values.`}
        onKeyDown={onKey}
        onFocus={() => setActive((a) => a ?? lastIdx)}
        onBlur={() => setActive(null)}
      >
        {width > 0 && n > 0 && (
          <svg width={width} height={height} className="block overflow-visible" aria-hidden>
            {/* grid + y ticks */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.axis : VIZ.grid} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={VIZ.muted} className="tabular-nums">
                  {fmtTick(t, format)}
                </text>
              </g>
            ))}
            {/* x labels */}
            {labels.map((l, i) =>
              (n - 1 - i) % stride === 0 ? (
                <text key={i} x={xMid(i)} y={height - 8} textAnchor="middle" fontSize={10.5} fill={active === i ? VIZ.ink : VIZ.muted}>
                  {l}
                </text>
              ) : null,
            )}

            {kind === 'column' &&
              labels.map((_, i) => {
                let acc = 0;
                return (
                  <g key={i} opacity={active == null || active === i ? 1 : 0.55}>
                    {series.map((s, si) => {
                      const v = s.values[i] ?? 0;
                      if (v <= 0) return null;
                      const y0 = y(acc);
                      acc += v;
                      const y1 = y(acc);
                      const isTop = si === series.length - 1 || series.slice(si + 1).every((x) => (x.values[i] ?? 0) <= 0);
                      // 2px surface gap between stacked segments
                      const h = Math.max(0, y0 - y1 - (si > 0 ? 2 : 0));
                      const x = xMid(i) - barW / 2;
                      return isTop ? (
                        <path key={s.key} d={columnPath(x, y1, barW, h, 4)} fill={VIZ.series[si]} />
                      ) : (
                        <rect key={s.key} x={x} y={y1} width={barW} height={h} fill={VIZ.series[si]} />
                      );
                    })}
                    {labelIdx.has(i) && (single[i] ?? 0) > 0 && (
                      <text x={xMid(i)} y={y(single[i]) - 6} textAnchor="middle" fontSize={11} fill={VIZ.secondary} className="tabular-nums">
                        {fmtTick(single[i], format)}
                      </text>
                    )}
                  </g>
                );
              })}

            {kind === 'line' &&
              series.map((s, si) => {
                const pts = s.values.map((v, i) => [xMid(i), y(v)] as const);
                const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join('');
                const area = `${d}L${pts[pts.length - 1][0]},${y(0)}L${pts[0][0]},${y(0)}Z`;
                return (
                  <g key={s.key}>
                    {series.length === 1 && <path d={area} fill={VIZ.series[si]} opacity={0.1} />}
                    <path d={d} fill="none" stroke={VIZ.series[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {/* end marker + end label */}
                    <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={4} fill={VIZ.series[si]} stroke={VIZ.surface} strokeWidth={2} />
                    {si === 0 && series.length === 1 && (
                      <text x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] - 10} textAnchor="end" fontSize={11} fill={VIZ.secondary} className="tabular-nums">
                        {fmtTick(s.values[s.values.length - 1] ?? 0, format)}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* crosshair + active markers (line) */}
            {active != null && kind === 'line' && (
              <g>
                <line x1={xMid(active)} x2={xMid(active)} y1={PAD.top} y2={y(0)} stroke={VIZ.axis} strokeWidth={1} shapeRendering="crispEdges" />
                {series.map((s, si) => (
                  <circle key={s.key} cx={xMid(active)} cy={y(s.values[active] ?? 0)} r={4.5} fill={VIZ.series[si]} stroke={VIZ.surface} strokeWidth={2} />
                ))}
              </g>
            )}

            {/* hit layer: the whole x-slot is the target */}
            <rect
              x={left}
              y={PAD.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setActive(null)}
              style={{ touchAction: 'pan-y' }}
            />
          </svg>
        )}
        {active != null && width > 0 && (
          <ChartTooltip
            x={xMid(active)}
            y={Math.min(...series.map((s) => y(stacked ? totals[active] : s.values[active] ?? 0))) - 10}
            containerWidth={width}
            title={titles?.[active] ?? labels[active]}
            rows={[
              ...series.map((s, si) => ({ key: s.key, color: VIZ.series[si], label: s.label, value: fmtValue(s.values[active] ?? 0, format), shape: kind === 'column' ? ('rect' as const) : ('line' as const) })),
              ...(stacked ? [{ key: '__total', label: 'Total', value: fmtValue(totals[active], format) }] : []),
            ]}
          />
        )}
      </div>
    </div>
  );
}
