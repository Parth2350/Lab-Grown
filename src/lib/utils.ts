import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { site } from '@/config/site';
import { INR_PER_USD, type Currency } from './currency';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const moneyFmt = new Intl.NumberFormat(site.locale, {
  style: 'currency',
  currency: site.currency,
  maximumFractionDigits: 0,
});
const moneyFmtCents = new Intl.NumberFormat(site.locale, {
  style: 'currency',
  currency: site.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdFmtCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Format integer minor units (paise) as currency. Whole amounts drop the decimals (₹1,29,900).
 * currency 'USD' shows the dollar equivalent (whole dollars, or cents with exact) — see lib/currency.
 */
export function formatMoney(cents: number, opts: { exact?: boolean; currency?: Currency } = {}) {
  if (opts.currency === 'USD') {
    const usd = cents / 100 / INR_PER_USD;
    return opts.exact ? usdFmtCents.format(usd) : usdFmt.format(Math.round(usd));
  }
  const v = cents / 100;
  if (opts.exact || !Number.isInteger(v)) return moneyFmtCents.format(v);
  return moneyFmt.format(v);
}

/** Rupee amounts written into copy ("Gifts Under ₹25,000") in the shopper's currency, rounded up to a tidy figure ("$260") so "under" stays true. */
export function localizeRupees(text: string, currency: Currency) {
  if (currency !== 'USD') return text;
  return text.replace(/₹\s?([\d,]+)/g, (_, n: string) => {
    const usd = Number(n.replace(/,/g, '')) / INR_PER_USD;
    const step = 10 ** Math.max(0, Math.floor(Math.log10(usd)) - 1);
    return usdFmt.format(Math.ceil(usd / step) * step);
  });
}

export function formatCarat(ct?: number | null) {
  if (ct == null) return '';
  return `${ct.toFixed(2)} ct`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function absoluteUrl(path = '/') {
  return `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(site.locale, opts).format(new Date(d));
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString(site.locale)} ${n === 1 ? one : many}`;
}

/** Round to the nearest ₹100 for "retail" looking prices */
export function retailRound(paise: number) {
  return Math.round(paise / 10000) * 10000;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
