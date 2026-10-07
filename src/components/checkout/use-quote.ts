'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart, type CartLine } from '@/store/cart';

export type QuoteIssue = { index: number; key: string; code: string; message: string };
export type CouponResult = { ok: boolean; discount: number; message: string; code: string };
export type Quote = {
  lines: { key: string; index: number; unitPrice: number; quantity: number }[];
  issues: QuoteIssue[];
  coupon: CouponResult | null;
  deliveryMethod: string | null;
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number };
};

export const toLineInput = (l: CartLine) => ({
  productId: l.productId,
  variantId: l.variantId,
  diamondId: l.diamond?.id ?? null,
  diamondOptionId: l.option?.id ?? null,
  ringSize: l.ringSize ?? null,
  quantity: l.quantity,
});

/**
 * Live, server-authoritative pricing for the current bag. Optionally writes refreshed
 * unit prices back into the persisted cart so every surface shows current prices.
 */
export function useQuote({
  lines,
  couponCode,
  deliveryMethod,
  enabled,
  refreshPrices = true,
}: {
  lines: CartLine[];
  couponCode?: string | null;
  deliveryMethod?: string | null;
  enabled: boolean;
  refreshPrices?: boolean;
}) {
  const [state, setState] = useState<{ quote: Quote; keys: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keys = lines.map((l) => `${l.key}*${l.quantity}`).join(',');
  // Prices are deliberately excluded so refreshed prices don't trigger another round-trip.
  const body = JSON.stringify({ lines: lines.map(toLineInput), couponCode: couponCode || null, deliveryMethod: deliveryMethod || null });
  const seq = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const id = ++seq.current;
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/checkout/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: ctrl.signal });
        if (!res.ok) throw new Error('quote');
        const q = (await res.json()) as Quote;
        if (id !== seq.current) return;
        setState({ quote: q, keys });
        setError(null);
        if (refreshPrices) {
          const current = useCart.getState().lines;
          if (current.map((l) => `${l.key}*${l.quantity}`).join(',') !== keys) return;
          let changed = false;
          const next = current.map((l, i) => {
            const fresh = q.lines.find((x) => x.index === i);
            if (fresh && fresh.unitPrice !== l.unitPrice) {
              changed = true;
              return { ...l, unitPrice: fresh.unitPrice };
            }
            return l;
          });
          if (changed) useCart.getState().replace(next);
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError' && id === seq.current) setError('We couldn’t refresh live prices — totals shown are estimates.');
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [body, enabled, keys, refreshPrices]);

  const current = enabled && state && state.keys === keys ? state.quote : null;

  const issuesByKey = useMemo(() => {
    const map = new Map<string, QuoteIssue>();
    if (!current) return map;
    for (const i of current.issues) {
      const line = lines[i.index];
      if (line && !map.has(line.key)) map.set(line.key, i);
    }
    return map;
  }, [current, lines]);

  /** `quote` matches the current bag exactly; `last` is the latest response (use to avoid flicker while refreshing). */
  return { quote: current, last: enabled ? (state?.quote ?? null) : null, loading, error, issuesByKey };
}
