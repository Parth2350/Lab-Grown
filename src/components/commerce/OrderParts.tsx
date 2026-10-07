/** Presentational order pieces shared by the confirmation page (client) and account pages (server). */
import { site } from '@/config/site';
import { cn, formatDate, formatMoney } from '@/lib/utils';

export type AddressLike = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export function AddressBlock({ address, className }: { address: AddressLike; className?: string }) {
  if (!address?.line1) return <p className={cn('text-sm text-taupe', className)}>No address on file</p>;
  return (
    <address className={cn('text-[13.5px] not-italic leading-relaxed text-charcoal', className)}>
      <span className="block text-ink">
        {address.firstName} {address.lastName}
      </span>
      {address.line1}
      {address.line2 ? (
        <>
          <br />
          {address.line2}
        </>
      ) : null}
      <br />
      {address.city}, {address.state} {address.postalCode}
      <br />
      {address.country}
      {address.phone ? <span className="mt-1 block text-taupe">{address.phone}</span> : null}
    </address>
  );
}

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Credit / Debit Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
  paylater: 'Pay Later',
};

export function paymentLabel(p?: { provider: string; method: string | null } | null) {
  if (!p) return 'Not yet paid';
  if (p.provider === 'demo') return p.method ? `${METHOD_LABELS[p.method] ?? p.method} · demo payment (no charge)` : 'Demo payment (no charge)';
  return p.method ? `${METHOD_LABELS[p.method] ?? p.method} via Razorpay` : 'Razorpay';
}

export function OrderTotals({
  order,
  className,
}: {
  order: { subtotal: number; discount: number; shipping: number; tax: number; total: number; couponCode: string | null };
  className?: string;
}) {
  return (
    <dl className={cn('space-y-2.5 text-sm', className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-taupe">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(order.subtotal, { exact: true })}</dd>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between gap-4 text-success">
          <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
          <dd className="tabular-nums">−{formatMoney(order.discount, { exact: true })}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-taupe">Shipping</dt>
        <dd className="tabular-nums">{order.shipping ? formatMoney(order.shipping, { exact: true }) : 'Complimentary'}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-taupe">Taxes</dt>
        <dd className="tabular-nums">{formatMoney(order.tax, { exact: true })}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <dt className="font-serif text-xl">Total</dt>
        <dd className="text-lg tabular-nums">
          <span className="mr-1.5 text-[11px] uppercase tracking-[0.14em] text-taupe">{site.currency}</span>
          {formatMoney(order.total, { exact: true })}
        </dd>
      </div>
    </dl>
  );
}

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) added++;
  }
  return d;
}

/** "7–10 business days" → "Oct 14 – Oct 17" counted from `from` (null when the ETA isn't numeric). */
export function estimateArrival(eta: string | null | undefined, from: Date | string) {
  const m = eta?.match(/(\d+)\s*[–-]\s*(\d+)/) ?? eta?.match(/(\d+)/);
  if (!m) return null;
  const lo = Number(m[1]);
  const hi = Number(m[2] ?? m[1]);
  const start = addBusinessDays(new Date(from), lo);
  const end = addBusinessDays(new Date(from), hi);
  const f = (d: Date) => formatDate(d, { month: 'short', day: 'numeric' });
  return lo === hi ? f(start) : `${f(start)} – ${f(end)}`;
}

export const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-stone text-taupe',
  PAID: 'border-gold/50 text-gold-deep bg-gold-pale/40',
  PROCESSING: 'border-gold/50 text-gold-deep bg-gold-pale/40',
  SHIPPED: 'border-ink/30 text-ink bg-porcelain',
  DELIVERED: 'border-success/40 text-success bg-success/5',
  CANCELLED: 'border-danger/30 text-danger bg-danger/5',
  REFUNDED: 'border-stone text-charcoal bg-porcelain',
  // Return requests
  REQUESTED: 'border-gold/50 text-gold-deep bg-gold-pale/40',
  APPROVED: 'border-ink/30 text-ink bg-porcelain',
  RECEIVED: 'border-ink/30 text-ink bg-porcelain',
  REJECTED: 'border-danger/30 text-danger bg-danger/5',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Confirmed',
  PROCESSING: 'In the workshop',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  RECEIVED: 'Received',
  REJECTED: 'Declined',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap border px-2 py-1 text-[10px] font-medium uppercase leading-none tracking-[0.14em]', STATUS_STYLES[status] ?? 'border-line text-taupe', className)}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
