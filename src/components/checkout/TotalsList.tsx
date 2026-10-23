'use client';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';
import { useFormatMoney } from '@/components/providers/CurrencyProvider';

type Totals = { subtotal: number; discount: number; shipping: number; tax: number; total: number };

export function taxPercent(rate: number) {
  return `${Math.round(rate * 1000) / 10}%`;
}

/** Subtotal → discount → shipping → taxes → total, announced politely to screen readers. */
export function TotalsList({
  totals,
  couponCode,
  taxLabel,
  taxRate,
  shippingLabel = 'Shipping',
  shippingNote,
  loading,
  className,
  totalLabel = 'Total',
}: {
  totals: Totals;
  couponCode?: string | null;
  taxLabel: string;
  taxRate: number;
  shippingLabel?: string;
  shippingNote?: string;
  loading?: boolean;
  className?: string;
  totalLabel?: string;
}) {
  const formatMoney = useFormatMoney();
  return (
    <dl className={cn('space-y-2.5 text-sm', loading && 'opacity-70 transition-opacity', className)} aria-busy={loading || undefined}>
      <div className="flex justify-between gap-4">
        <dt className="text-taupe">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(totals.subtotal, { exact: true })}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between gap-4 text-success">
          <dt>
            Discount{couponCode ? <span className="ml-1.5 border border-success/30 px-1.5 py-0.5 text-[12px] font-medium uppercase tracking-[0.14em]">{couponCode}</span> : null}
          </dt>
          <dd className="tabular-nums">−{formatMoney(totals.discount, { exact: true })}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-taupe">
          {shippingLabel}
          {shippingNote && <span className="block text-[13.5px] text-taupe/80">{shippingNote}</span>}
        </dt>
        <dd className="tabular-nums">{totals.shipping ? formatMoney(totals.shipping, { exact: true }) : 'Complimentary'}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-taupe">
          {taxLabel} ({taxPercent(taxRate)})
        </dt>
        <dd className="tabular-nums">{formatMoney(totals.tax, { exact: true })}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4" aria-live="polite" aria-atomic="true">
        <dt className="font-serif text-xl">{totalLabel}</dt>
        <dd className="text-lg font-normal tabular-nums">
          <span className="mr-1.5 text-[13px] uppercase tracking-[0.14em] text-taupe">{site.currency}</span>
          {formatMoney(totals.total, { exact: true })}
        </dd>
      </div>
    </dl>
  );
}
