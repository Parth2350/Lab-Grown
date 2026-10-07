import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { site } from '@/config/site';

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

/** Format integer cents as currency. Whole amounts drop the decimals ($1,299). */
export function formatMoney(cents: number, opts: { exact?: boolean } = {}) {
  const v = cents / 100;
  if (opts.exact || !Number.isInteger(v)) return moneyFmtCents.format(v);
  return moneyFmt.format(v);
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

/** Round cents to the nearest $10 for "retail" looking prices */
export function retailRound(cents: number) {
  return Math.round(cents / 1000) * 1000 - 100 * (cents > 5000 ? 1 : 0);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
