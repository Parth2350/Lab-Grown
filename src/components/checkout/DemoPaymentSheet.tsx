'use client';
import { AlertCircle, FlaskConical, Lock } from 'lucide-react';
import { useState } from 'react';
import { site } from '@/config/site';
import { formatMoney } from '@/lib/utils';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

/**
 * Test-mode payment step shown when Razorpay keys are not configured. Clearly labelled:
 * confirming marks the order paid without charging anyone.
 */
export function DemoPaymentSheet({
  open,
  orderNumber,
  token,
  amount,
  paymentLabel,
  onCancel,
  onPaid,
}: {
  open: boolean;
  orderNumber: string;
  token: string;
  amount: number;
  paymentLabel: string;
  onCancel: () => void;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, token }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'We couldn’t confirm this payment.');
      onPaid();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={busy ? () => {} : onCancel} side="center" className="top-[10vh] max-w-lg" label="Demo payment" bodyClassName="px-6 py-8 sm:px-10 sm:py-10">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold-pale/50">
          <FlaskConical className="h-5 w-5 text-gold-deep" strokeWidth={1.25} aria-hidden />
        </span>
        <p className="eyebrow mt-5 text-gold-deep">Demo payment — no real charge</p>
        <h2 className="mt-2 font-serif text-3xl font-light">Confirm test payment</h2>
        <p className="mx-auto mt-3 max-w-sm text-[15.5px] leading-relaxed text-taupe">
          This store is running in test mode because live Razorpay keys aren’t configured. Confirming will mark your order as paid so you can preview the full journey — nothing is charged.
        </p>
      </div>

      <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-taupe">Order</dt>
          <dd className="font-medium tracking-wide">{orderNumber}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-taupe">Method</dt>
          <dd>{paymentLabel} · simulated</dd>
        </div>
        <div className="flex items-baseline justify-between py-3">
          <dt className="text-taupe">Amount</dt>
          <dd className="font-serif text-2xl tabular-nums">{formatMoney(amount, { exact: true })}</dd>
        </div>
      </dl>

      {error && (
        <p role="alert" className="mt-5 flex items-start gap-2 text-[15px] text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden /> {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <Button size="lg" onClick={confirm} loading={busy} data-autofocus>
          {!busy && <Lock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />} Confirm Demo Payment
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}
