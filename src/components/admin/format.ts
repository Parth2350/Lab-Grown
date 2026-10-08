/** Client-safe formatting helpers for the admin. Money is always integer cents. */
import { site } from '@/config/site';

export { formatMoney, formatDate } from '@/lib/utils';

const num = new Intl.NumberFormat(site.locale);
const compactNum = new Intl.NumberFormat(site.locale, { notation: 'compact', maximumFractionDigits: 1 });
const compactMoneyFmt = new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency, notation: 'compact', maximumFractionDigits: 1 });
const moneyNoCents = new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency, maximumFractionDigits: 0 });

export function formatNumber(n: number) {
  return num.format(n);
}

export function formatCompact(n: number) {
  return Math.abs(n) < 10_000 ? num.format(Math.round(n)) : compactNum.format(n);
}

/** ₹1.2Cr / ₹48.5L / ₹940 — for chart axes & stat tiles */
export function formatMoneyCompact(cents: number) {
  const v = cents / 100;
  return Math.abs(v) < 10_000 ? moneyNoCents.format(Math.round(v)) : compactMoneyFmt.format(v);
}

export function formatPercent(ratio: number, digits = 1) {
  if (!Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits).replace(/\.0+$/, '')}%`;
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat(site.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
}

/** "3 min ago", "yesterday", "12 Mar" */
export function formatRelative(d: Date | string, now = Date.now()) {
  const t = new Date(d).getTime();
  const diff = Math.round((now - t) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 172800) return 'yesterday';
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} days ago`;
  return new Intl.DateTimeFormat(site.locale, { day: 'numeric', month: 'short', year: new Date(d).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' }).format(new Date(d));
}

/** cents → "1299.00" for <input> default values */
export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace(/\.00$/, '');
}

/** "PROCESSING" → "Processing", "IN_TRANSIT" → "In transit" */
export function enumLabel(s: string) {
  const lower = s.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** yyyy-mm-dd for <input type="date"> */
export function toDateInput(d: Date | string | null | undefined) {
  if (!d) return '';
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}
