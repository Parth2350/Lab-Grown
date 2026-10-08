import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Chart frame: title + subtitle, the chart, and a "View as table" twin (the WCAG-clean equivalent
 * of every chart — tooltips enhance, they never gate).
 */
export function ChartCard({
  title,
  subtitle,
  children,
  table,
  actions,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  table?: { columns: string[]; rows: (string | number)[][]; alignRight?: number[] };
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col border border-line bg-white', className)}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h2 className="font-sans text-[15px] font-medium tracking-normal text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-taupe">{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div className="flex-1 px-5 pb-3 pt-4">{children}</div>
      {table && table.rows.length > 0 && (
        <details className="group border-t border-line">
          <summary className="cursor-pointer select-none px-5 py-2 text-[13px] font-medium uppercase tracking-[0.14em] text-taupe transition-colors hover:text-ink">
            <span className="group-open:hidden">View as table</span>
            <span className="hidden group-open:inline">Hide table</span>
          </summary>
          <div className="max-h-72 overflow-auto px-5 pb-4">
            <table className="w-full text-left text-[14px] tabular-nums">
              <thead>
                <tr className="border-b border-line text-taupe">
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn('py-1.5 pr-3 font-medium', table.alignRight?.includes(i) && 'text-right')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-line/60 last:border-0">
                    {r.map((cell, ci) => (
                      <td key={ci} className={cn('py-1.5 pr-3 text-charcoal', table.alignRight?.includes(ci) && 'text-right')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

/**
 * Stat tile: label · value · optional delta vs a named period · optional trend.
 * Delta colour = direction × whether up is good, always paired with an arrow icon + text.
 */
export function StatTile({
  label,
  value,
  delta,
  hint,
  href,
  trend,
  tone,
}: {
  label: string;
  value: ReactNode;
  delta?: { value: number; label: string; upIsGood?: boolean; format?: 'percent' | 'points' };
  hint?: ReactNode;
  href?: string;
  trend?: ReactNode;
  tone?: 'warning' | 'danger';
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-taupe">{label}</p>
        {href && <ArrowRight className="h-3.5 w-3.5 text-stone transition-colors group-hover:text-ink" strokeWidth={1.5} aria-hidden />}
      </div>
      <p className={cn('mt-2 font-sans text-[1.65rem] font-normal leading-none text-ink', tone === 'danger' && 'text-danger', tone === 'warning' && 'text-[#7A5718]')}>{value}</p>
      {delta && Number.isFinite(delta.value) && <Delta {...delta} />}
      {hint && <p className="mt-1.5 text-xs text-taupe">{hint}</p>}
      {trend && <div className="mt-2">{trend}</div>}
    </>
  );
  const cls = 'group block border border-line bg-white px-4 py-4 transition-colors';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:border-stone')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Delta({ value, label, upIsGood = true, format = 'percent' }: { value: number; label: string; upIsGood?: boolean; format?: 'percent' | 'points' }) {
  const flat = Math.abs(value) < 0.0005;
  const up = value > 0;
  const good = flat ? null : up === upIsGood;
  const Icon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
  const text = format === 'points' ? `${up ? '+' : ''}${(value * 100).toFixed(1)} pts` : `${up ? '+' : ''}${(value * 100).toFixed(1)}%`;
  return (
    <p className="mt-2 flex items-center gap-1 text-xs">
      <span className={cn('inline-flex items-center gap-0.5 font-medium', good == null ? 'text-taupe' : good ? 'text-success' : 'text-danger')}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        {flat ? 'No change' : text}
      </span>
      <span className="text-taupe">{label}</span>
    </p>
  );
}
