import { Check, X } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const FLOW = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'PAID', label: 'Payment confirmed' },
  { status: 'PROCESSING', label: 'In the workshop' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
] as const;

/** PENDING → PAID → PROCESSING → SHIPPED → DELIVERED, with terminal cancelled/refunded states. */
export function OrderTimeline({
  status,
  dates,
}: {
  status: string;
  dates: Partial<Record<(typeof FLOW)[number]['status'], string | null>>;
}) {
  const terminal = status === 'CANCELLED' || status === 'REFUNDED';
  const current = terminal ? (status === 'REFUNDED' ? 1 : 0) : Math.max(0, FLOW.findIndex((s) => s.status === status));

  return (
    <div>
      <ol className="grid grid-cols-1 gap-0 sm:grid-cols-5" aria-label="Order progress">
        {FLOW.map((s, i) => {
          const done = i <= current;
          const isCurrent = i === current && !terminal;
          const date = dates[s.status];
          return (
            <li key={s.status} className="relative flex gap-4 pb-6 last:pb-0 sm:block sm:pb-0 sm:pr-4" aria-current={isCurrent ? 'step' : undefined}>
              {/* connector */}
              {i < FLOW.length - 1 && (
                <span
                  className={cn('absolute left-[11px] top-6 h-[calc(100%-24px)] w-px sm:left-6 sm:top-[11px] sm:h-px sm:w-[calc(100%-24px)]', i < current ? 'bg-ink' : 'bg-line')}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  done ? 'border-ink bg-ink text-ivory' : 'border-stone bg-ivory text-taupe',
                  isCurrent && 'ring-4 ring-gold-pale',
                )}
                aria-hidden
              >
                {done ? <Check className="h-3 w-3" strokeWidth={2} /> : i + 1}
              </span>
              <div className="sm:mt-3">
                <p className={cn('text-[13px]', done ? 'text-ink' : 'text-taupe')}>{s.label}</p>
                {date && done && <p className="text-[12px] text-taupe">{formatDate(date, { month: 'short', day: 'numeric' })}</p>}
                <span className="sr-only">{done ? (isCurrent ? '(current)' : '(complete)') : '(upcoming)'}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {terminal && (
        <p className="mt-6 flex items-center gap-2 border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {status === 'CANCELLED' ? 'This order was cancelled. No payment was taken, or it has been released.' : 'This order has been refunded to the original payment method.'}
        </p>
      )}
    </div>
  );
}
