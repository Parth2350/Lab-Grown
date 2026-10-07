/** Server-safe presentational pieces for the order detail page. */
import type { ReactNode } from 'react';
import type { Prisma } from '@prisma/client';
import { cn } from '@/lib/utils';
import { formatDateTime } from '../format';
import { addressLines, readAddress } from './address';

export function AddressBlock({ value, empty = 'No address on file' }: { value: Prisma.JsonValue | null | undefined; empty?: string }) {
  const a = readAddress(value);
  if (!a) return <p className="text-[13px] text-taupe">{empty}</p>;
  const lines = addressLines(a);
  return (
    <address className="text-[13px] not-italic leading-relaxed text-ink">
      {lines.map((l, i) => (
        <span key={i} className={cn('block', i === 0 && 'font-medium')}>
          {l}
        </span>
      ))}
      {a.phone && (
        <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="mt-1 block text-charcoal underline-offset-4 hover:underline">
          {a.phone}
        </a>
      )}
    </address>
  );
}

export type TimelineEvent = { at: Date; title: ReactNode; detail?: ReactNode; tone?: 'default' | 'success' | 'danger' | 'gold' };

const DOT: Record<NonNullable<TimelineEvent['tone']>, string> = {
  default: 'border-stone bg-white',
  success: 'border-success bg-success',
  danger: 'border-danger bg-danger',
  gold: 'border-gold bg-gold',
};

export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {sorted.map((e, i) => (
        <li key={i} className="relative">
          <span className={cn('absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border', DOT[e.tone ?? 'default'])} aria-hidden />
          <p className="text-[13px] text-ink">{e.title}</p>
          <p className="text-xs text-taupe">
            <time dateTime={e.at.toISOString()}>{formatDateTime(e.at)}</time>
            {e.detail && <> · {e.detail}</>}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Monospace provider reference, truncated with the full value in a tooltip. */
export function Ref({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className="text-taupe">—</span>;
  return (
    <span title={value} className={cn('inline-block max-w-[160px] truncate align-bottom font-mono text-[11.5px] text-charcoal', className)}>
      {value}
    </span>
  );
}
