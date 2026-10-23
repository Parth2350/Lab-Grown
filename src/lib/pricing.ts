/**
 * Pricing & totals — pure functions shared by the client (live estimates) and the
 * server (authoritative order totals). All values are integer paise (₹1 = 100).
 */

import { formatMoney } from './utils';

export type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  eta: string;
  price: number;
};

export type StoreSettings = {
  announcements: string[];
  taxRate: number; // e.g. 0.03
  taxLabel: string;
  shippingMethods: ShippingMethod[];
  returnsDays: number;
  /** video (landscape, desktop) / videoMobile (portrait, phones): a film that fills the first screen; the image is its poster */
  hero: { eyebrow: string; title: string; subtitle: string; image?: string | null; video?: string | null; videoMobile?: string | null };
  popularSearches: string[];
  lowStockThreshold: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  announcements: [
    'IGI & GIA Certified',
    'Made in Our Own Workshop',
    'Free Insured Worldwide Shipping',
    '30-Day Easy Returns',
    'Natural & Lab-Grown Diamonds',
    'Lifetime Warranty on Every Piece',
  ],
  taxRate: 0.03,
  taxLabel: 'GST',
  shippingMethods: [
    { id: 'standard', label: 'Insured Standard', description: 'Fully insured, signature on delivery', eta: '7–10 business days', price: 0 },
    { id: 'express', label: 'Insured Express', description: 'Priority handling & tracking', eta: '3–5 business days', price: 150000 },
    { id: 'priority', label: 'Priority Overnight', description: 'Major metros only', eta: '1–2 business days', price: 300000 },
  ],
  returnsDays: 30,
  hero: {
    eyebrow: 'Natural & Lab-Grown Diamond Fine Jewelry',
    title: 'Jewelry Made for the Moments That Matter',
    subtitle:
      'Discover beautifully crafted natural and lab-grown diamond jewelry designed to celebrate your most meaningful moments.',
    image: null,
    video: null,
    videoMobile: '/videos/hero.mp4',
  },
  popularSearches: ['2ct oval halo', 'round solitaire', 'diamond earrings', 'tennis bracelet', 'emerald cut', 'eternity band'],
  lowStockThreshold: 3,
};

export function unitPrice(parts: { variantPrice: number; diamondPrice?: number | null; optionDelta?: number | null }) {
  return parts.variantPrice + (parts.diamondPrice ?? 0) + (parts.optionDelta ?? 0);
}

export type CouponLike = {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minSubtotal: number;
  maxUses?: number | null;
  usedCount?: number;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  isActive?: boolean;
};

export function evaluateCoupon(coupon: CouponLike | null | undefined, subtotal: number, now = new Date()) {
  if (!coupon) return { ok: false as const, discount: 0, message: 'Coupon not found' };
  if (coupon.isActive === false) return { ok: false as const, discount: 0, message: 'This code is no longer active' };
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { ok: false as const, discount: 0, message: 'This code is not active yet' };
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return { ok: false as const, discount: 0, message: 'This code has expired' };
  if (coupon.maxUses != null && (coupon.usedCount ?? 0) >= coupon.maxUses)
    return { ok: false as const, discount: 0, message: 'This code has reached its usage limit' };
  if (subtotal < coupon.minSubtotal)
    return {
      ok: false as const,
      discount: 0,
      message: `Spend ${formatMoney(coupon.minSubtotal)} or more to use this code`,
    };
  const raw = coupon.type === 'PERCENT' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const discount = Math.min(subtotal, Math.max(0, raw));
  return {
    ok: true as const,
    discount,
    message: coupon.type === 'PERCENT' ? `${coupon.value}% off applied` : 'Discount applied',
  };
}

export type TotalsInput = {
  lines: { unitPrice: number; quantity: number }[];
  shippingPrice?: number;
  discount?: number;
  taxRate: number;
};

export function computeTotals({ lines, shippingPrice = 0, discount = 0, taxRate }: TotalsInput) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const d = Math.min(subtotal, Math.max(0, discount));
  const taxable = subtotal - d;
  const tax = Math.round(taxable * taxRate);
  const shipping = lines.length ? shippingPrice : 0;
  const total = taxable + tax + shipping;
  return { subtotal, discount: d, shipping, tax, total };
}
