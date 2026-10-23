import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { CURRENCY_COOKIE, currencyForCountry, isCurrency, type Currency } from '@/lib/currency';

/** This request's display currency: the shopper's choice (footer switch), else their country (Vercel geo header). */
export const getCurrency = cache(async (): Promise<Currency> => {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isCurrency(chosen)) return chosen;
  return currencyForCountry((await headers()).get('x-vercel-ip-country'));
});
