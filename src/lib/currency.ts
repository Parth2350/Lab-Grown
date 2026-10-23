/**
 * Display currency. Prices are stored in rupees (paise). Visitors in the United States see US dollars and in Canada
 * Canadian dollars, at the partner's published rates (so prices match the partner's own); everyone else sees rupees.
 * Shoppers can switch in the footer (saved in a cookie).
 */
import { CATALOG_CAD_PER_USD, CATALOG_INR_PER_USD } from './catalog-generated';

/** prefix: written before amounts; perUsd: units per US dollar */
export const CURRENCIES = [
  { code: 'INR', country: 'India', symbol: '₹', prefix: '₹', perUsd: CATALOG_INR_PER_USD },
  { code: 'USD', country: 'United States', symbol: '$', prefix: '$', perUsd: 1 },
  { code: 'CAD', country: 'Canada', symbol: 'C$', prefix: 'CAD$', perUsd: CATALOG_CAD_PER_USD },
] as const;
export type Currency = (typeof CURRENCIES)[number]['code'];

export const CURRENCY_COOKIE = 'tvj-currency';
export const INR_PER_USD = CATALOG_INR_PER_USD;

export const currencyInfo = (code: Currency) => CURRENCIES.find((c) => c.code === code)!;
/** Rupees in one unit of the currency */
export const inrPer = (code: Currency) => INR_PER_USD / currencyInfo(code).perUsd;

export const isCurrency = (v: unknown): v is Currency => CURRENCIES.some((c) => c.code === v);

const BY_COUNTRY: Record<string, Currency> = { US: 'USD', CA: 'CAD' };
/** Rupees by default; US dollars in the United States, Canadian dollars in Canada */
export const currencyForCountry = (country?: string | null): Currency => BY_COUNTRY[country?.toUpperCase() ?? ''] ?? 'INR';
