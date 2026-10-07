/** Safe reader for the Order.shippingAddress / billingAddress Json snapshots (may be {} or partial). */
import type { Prisma } from '@prisma/client';

export type AddressSnapshot = {
  firstName?: string;
  lastName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

const KEYS = ['firstName', 'lastName', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'phone'] as const;

export function readAddress(value: Prisma.JsonValue | null | undefined): AddressSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const src = value as Record<string, unknown>;
  const out: AddressSnapshot = {};
  for (const key of KEYS) {
    const raw = src[key];
    const str = typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw) : '';
    if (str) out[key] = str.slice(0, 200);
  }
  return Object.keys(out).length ? out : null;
}

/** Display lines: name, street, locality, country. */
export function addressLines(a: AddressSnapshot): string[] {
  const name = [a.firstName, a.lastName].filter(Boolean).join(' ');
  const locality = [a.city, [a.state, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [name, a.line1, a.line2, locality, a.country].filter((l): l is string => !!l);
}
