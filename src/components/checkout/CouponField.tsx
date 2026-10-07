'use client';
import { AnimatePresence, m } from 'framer-motion';
import { Check, Plus, Tag, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';

export type AppliedCoupon = { code: string; ok: boolean; message: string } | null;

/**
 * Promo code entry. `onApply` performs the server validation and resolves with the
 * outcome; the applied state (and any later message, e.g. minimum spend) is controlled.
 */
export function CouponField({
  applied,
  onApply,
  onRemove,
  className,
  defaultOpen,
}: {
  applied: AppliedCoupon;
  onApply: (code: string) => Promise<{ ok: boolean; message: string }>;
  onRemove: () => void;
  className?: string;
  defaultOpen?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(!!defaultOpen);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const code = value.trim();
    if (!code) {
      setMessage('Enter a promo code');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const r = await onApply(code);
      if (r.ok) setValue('');
      else setMessage(r.message);
    } catch {
      setMessage('We couldn’t check that code just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <div className={cn('border border-line bg-white px-4 py-3', className)}>
        <div className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <Tag className={cn('h-4 w-4 shrink-0', applied.ok ? 'text-success' : 'text-taupe')} strokeWidth={1.25} aria-hidden />
            <span className="font-medium uppercase tracking-[0.12em]">{applied.code}</span>
          </p>
          <button type="button" onClick={onRemove} className="flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-taupe hover:text-ink" aria-label={`Remove code ${applied.code}`}>
            <X className="h-3.5 w-3.5" strokeWidth={1.5} /> Remove
          </button>
        </div>
        <p className={cn('mt-1 flex items-center gap-1.5 text-[12px]', applied.ok ? 'text-success' : 'text-danger')} role="status" aria-live="polite">
          {applied.ok && <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
          {applied.message}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between py-1 text-[12px] uppercase tracking-[0.14em] text-charcoal hover:text-ink"
      >
        <span className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden /> Promo code
        </span>
        <Plus className={cn('h-3.5 w-3.5 transition-transform duration-300', open && 'rotate-45')} strokeWidth={1.5} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={`${id}-panel`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* Not a <form>: this field also lives inside the checkout form. */}
            <div className="flex gap-2 pt-3">
              <label htmlFor={`${id}-code`} className="sr-only">
                Promo code
              </label>
              <input
                id={`${id}-code`}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.toUpperCase());
                  setMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void submit();
                  }
                }}
                placeholder="Enter code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={40}
                aria-invalid={!!message}
                aria-describedby={message ? `${id}-msg` : undefined}
                className="field h-11 flex-1 py-0 uppercase tracking-[0.1em] placeholder:normal-case placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="label-caps h-11 shrink-0 border border-ink px-5 transition-colors hover:bg-ink hover:text-ivory disabled:opacity-50"
              >
                {busy ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" aria-label="Checking" /> : 'Apply'}
              </button>
            </div>
            <p id={`${id}-msg`} className="min-h-[1.25rem] pt-1.5 text-[12px] text-danger" role="status" aria-live="polite">
              {message}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Calls the coupon endpoint used by the bag and checkout. */
export async function validateCouponCode(code: string, subtotal: number) {
  const res = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; discount?: number; message?: string; code?: string; error?: string } | null;
  if (!json) throw new Error('coupon');
  return { ok: !!json.ok, discount: json.discount ?? 0, message: json.message ?? json.error ?? 'This code can’t be used', code: json.code ?? code.toUpperCase() };
}
