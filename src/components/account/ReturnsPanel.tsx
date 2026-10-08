'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Label, Select, Textarea } from '@/components/ui/Field';
import { RETURN_REASONS, fieldErrors, returnRequestSchema } from '@/components/commerce/schemas';
import { StatusBadge } from '@/components/commerce/OrderParts';

type Eligible = { number: string; placedAt: string; deliveredAt: string; deadline: string; total: number; items: string[] };
type Request = { id: string; orderNumber: string; reason: string; details: string | null; status: string; createdAt: string };

export function ReturnsPanel({ eligible, requests, returnsDays, preselect }: { eligible: Eligible[]; requests: Request[]; returnsDays: number; preselect?: string | null }) {
  const router = useRouter();
  const initial = eligible.find((e) => e.number === preselect)?.number ?? eligible[0]?.number ?? '';
  const [picked, setOrderNumber] = useState(initial);
  // After a request is filed the eligible list shrinks; fall back to the first remaining order.
  const orderNumber = eligible.some((e) => e.number === picked) ? picked : (eligible[0]?.number ?? '');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preselectMissing = !!preselect && !eligible.some((e) => e.number === preselect);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = returnRequestSchema.safeParse({ orderNumber, reason, details });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/account/returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const json = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(json.fieldErrors ?? {});
        setError(json.error ?? 'We couldn’t submit your request.');
        return;
      }
      setDone(orderNumber);
      setReason('');
      setDetails('');
      router.refresh();
    } catch {
      setError('We couldn’t reach our servers. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="font-serif text-3xl font-light">Returns</h2>
        <p className="mt-1 max-w-2xl text-sm text-taupe">
          Changed your mind? You can return unworn pieces within {returnsDays} days of delivery. Once approved, we’ll arrange a fully insured collection and refund you to the original payment method after inspection.
        </p>
      </div>

      {done && (
        <p role="status" className="flex items-start gap-3 border border-success/30 bg-success/5 px-4 py-3 text-[15px] text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          Your return request for order {done} has been received. Our concierge will be in touch within one business day with next steps.
        </p>
      )}

      {preselectMissing && !done && (
        <p className="flex items-start gap-3 border border-line bg-porcelain px-4 py-3 text-[15px] text-charcoal">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
          Order {preselect} isn’t eligible for a new return — it may already have a request open, or be outside the {returnsDays}-day window.
        </p>
      )}

      <section aria-labelledby="new-return-title">
        <h3 id="new-return-title" className="font-serif text-2xl">
          Start a return
        </h3>
        {eligible.length === 0 ? (
          <div className="mt-5 flex flex-col items-center border border-line px-6 py-12 text-center">
            <RotateCcw className="h-8 w-8 text-gold" strokeWidth={1} aria-hidden />
            <p className="mt-4 font-serif text-xl">No orders are currently eligible</p>
            <p className="mt-2 max-w-md text-sm text-taupe">Delivered orders can be returned within {returnsDays} days. For anything else, our concierge is happy to help.</p>
            <Link href="/account/support" className="label-caps mt-5 border-b border-ink pb-0.5">
              Contact concierge
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-5 space-y-6">
            <fieldset>
              <legend className="mb-3 text-[13px] font-medium uppercase tracking-[0.14em] text-charcoal">Choose an order</legend>
              <div className="grid gap-3 md:grid-cols-2">
                {eligible.map((o) => {
                  const checked = orderNumber === o.number;
                  return (
                    <label
                      key={o.number}
                      className={cn('flex cursor-pointer gap-3 border p-4 transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-gold', checked ? 'border-ink bg-white' : 'border-line hover:border-stone')}
                    >
                      <input type="radio" name="order" value={o.number} checked={checked} onChange={() => setOrderNumber(o.number)} className="sr-only" />
                      <span className={cn('mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border', checked ? 'border-ink' : 'border-stone')} aria-hidden>
                        <span className={cn('h-2 w-2 rounded-full bg-ink transition-transform', checked ? 'scale-100' : 'scale-0')} />
                      </span>
                      <span className="min-w-0 text-[15px]">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-ink">{o.number}</span>
                          <span className="tabular-nums text-charcoal">{formatMoney(o.total, { exact: true })}</span>
                        </span>
                        <span className="block truncate text-taupe">{o.items.join(', ')}</span>
                        <span className="mt-1 block text-[14px] text-taupe">
                          Delivered {formatDate(o.deliveredAt)} · return by <span className="text-charcoal">{formatDate(o.deadline)}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.orderNumber && <p className="mt-2 text-xs text-danger">{errors.orderNumber}</p>}
            </fieldset>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="return-reason" required>
                  Reason
                </Label>
                <Select
                  id="return-reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setErrors((x) => ({ ...x, reason: '' }));
                  }}
                  aria-invalid={!!errors.reason}
                  aria-describedby={errors.reason ? 'return-reason-error' : undefined}
                  required
                >
                  <option value="" disabled>
                    Select a reason
                  </option>
                  {RETURN_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                {errors.reason && (
                  <p id="return-reason-error" className="mt-1.5 text-xs text-danger">
                    {errors.reason}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="return-details">Details (optional)</Label>
                <Textarea
                  id="return-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                  placeholder="Tell us a little more — if it’s a sizing issue, we may be able to resize instead."
                />
                <p className="mt-1 text-right text-[13px] text-taupe">{details.length}/1000</p>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-[15px] text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden /> {error}
              </p>
            )}
            <Button type="submit" loading={busy}>
              Submit return request
            </Button>
          </form>
        )}
      </section>

      <section aria-labelledby="requests-title" className="border-t border-line pt-10">
        <h3 id="requests-title" className="font-serif text-2xl">
          Your requests
        </h3>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-taupe">You haven’t requested any returns.</p>
        ) : (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-[16px] text-ink">
                    <Link href={`/account/orders/${r.orderNumber}`} className="underline-offset-4 hover:underline">
                      {r.orderNumber}
                    </Link>{' '}
                    <span className="text-taupe">· requested {formatDate(r.createdAt)}</span>
                  </p>
                  <p className="text-[15px] text-charcoal">{r.reason}</p>
                  {r.details && <p className="mt-1 max-w-xl text-[14.5px] text-taupe">{r.details}</p>}
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
