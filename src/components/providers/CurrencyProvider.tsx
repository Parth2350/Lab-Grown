'use client';
import { createContext, useCallback, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENCIES, CURRENCY_COOKIE, type Currency } from '@/lib/currency';
import { formatMoney, localizeRupees } from '@/lib/utils';

const CurrencyContext = createContext<Currency>('INR');

/** The visitor's display currency, decided on the server (cookie, else country) so the first render is already right. */
export function CurrencyProvider({ currency, children }: { currency: Currency; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

/** formatMoney in the shopper's currency */
export function useFormatMoney() {
  const currency = useCurrency();
  return useCallback((cents: number, opts: { exact?: boolean } = {}) => formatMoney(cents, { ...opts, currency }), [currency]);
}

/** Rupee figures written into copy, in the shopper's currency */
export function useLocalize() {
  const currency = useCurrency();
  return useCallback((text: string) => localizeRupees(text, currency), [currency]);
}

/** Footer location / currency switch: remembered for a year, the page re-renders in the new currency. */
export function CurrencySwitcher({ className }: { className?: string }) {
  const currency = useCurrency();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className={className}>
      <span className="sr-only">Location and currency</span>
      <select
        value={currency}
        disabled={pending}
        onChange={(e) => {
          document.cookie = `${CURRENCY_COOKIE}=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          start(() => router.refresh());
        }}
        className="cursor-pointer appearance-none border border-white/15 bg-transparent py-1.5 pl-3 pr-8 text-[13px] text-ivory/80 transition-colors hover:border-white/40 focus:outline-none disabled:opacity-60"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%23d8cfc1' stroke-width='1.4'%3E%3Cpath d='M1 1l4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code} className="text-ink">
            {c.country} ({c.symbol} {c.code})
          </option>
        ))}
      </select>
    </label>
  );
}
