/**
 * Display currency. Prices are stored in rupees (paise); visitors in the United States see US dollars
 * at the catalogue's rate, everyone else rupees. Shoppers can switch in the footer (saved in a cookie).
 */
import { CATALOG_INR_PER_USD } from './catalog-generated';

export const CURRENCIES = [
  { code: 'INR', country: 'India', symbol: '₹' },
  { code: 'USD', country: 'United States', symbol: '$' },
] as const;
export type Currency = (typeof CURRENCIES)[number]['code'];

export const CURRENCY_COOKIE = 'tvj-currency';
export const INR_PER_USD = CATALOG_INR_PER_USD;

export const isCurrency = (v: unknown): v is Currency => v === 'INR' || v === 'USD';

/** Rupees by default; dollars for visitors in the United States */
export const currencyForCountry = (country?: string | null): Currency => (country?.toUpperCase() === 'US' ? 'USD' : 'INR');
