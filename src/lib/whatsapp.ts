/**
 * WhatsApp ordering: orders are placed by chatting with the store, so the bag and the
 * product page open WhatsApp with a ready-written message listing what the shopper chose.
 * (WhatsApp formatting: *bold*, one line per detail.)
 */
import { site } from '@/config/site';
import { label } from '@/lib/catalog';
import { formatMoney } from '@/lib/utils';
import type { CartLine } from '@/store/cart';

export function whatsappUrl(text: string) {
  return `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export type EnquiryItem = {
  name: string;
  slug: string;
  sku?: string | null;
  purity: string;
  metalColor: string;
  /** e.g. "1.60 ct Round · G · VVS1 · Ideal" */
  diamond?: string | null;
  /** total-weight option, e.g. "1.50 ct total weight" */
  option?: string | null;
  /** catalogue options, e.g. "Oval · 2.08 ct centre · 2.63 ctw" */
  details?: string | null;
  shape?: string | null;
  /** chosen carat / chain length (catalogue products) — carried in the product link */
  carat?: number | null;
  length?: string | null;
  ringSize?: string | null;
  requiresSize?: boolean;
  engraving?: string | null;
  quantity: number;
  /** price of one piece, in paise */
  unitPrice: number;
  /** shown after the price, e.g. "setting only" */
  priceNote?: string | null;
};

function productLink(origin: string, it: EnquiryItem) {
  const q = new URLSearchParams({ metal: it.metalColor, purity: it.purity });
  if ((it.diamond || it.details) && it.shape) q.set('shape', it.shape);
  if (it.carat) q.set('carat', String(it.carat));
  if (it.length) q.set('length', it.length);
  return `${origin.replace(/\/$/, '')}/products/${it.slug}?${q.toString()}`;
}

function itemLines(origin: string, it: EnquiryItem, indent = '') {
  const lines = [`${indent}Metal: ${it.purity} ${label.metal(it.metalColor)}`];
  if (it.diamond) lines.push(`${indent}Diamond: ${it.diamond}`);
  if (it.option) lines.push(`${indent}Diamonds: ${it.option}`);
  if (it.details) lines.push(`${indent}Options: ${it.details}`);
  if (it.ringSize) lines.push(`${indent}Ring size: ${it.ringSize}`);
  else if (it.requiresSize) lines.push(`${indent}Ring size: not chosen yet`);
  if (it.engraving) lines.push(`${indent}Engraving: "${it.engraving}"`);
  lines.push(`${indent}Quantity: ${it.quantity}`);
  const note = it.priceNote ? ` (${it.priceNote})` : '';
  lines.push(`${indent}Price: ${formatMoney(it.unitPrice)}${it.quantity > 1 ? ` each, ${formatMoney(it.unitPrice * it.quantity)} for ${it.quantity}` : ''}${note}`);
  if (it.sku) lines.push(`${indent}SKU: ${it.sku}`);
  lines.push(`${indent}${productLink(origin, it)}`);
  return lines;
}

/** Message for one product, as configured on its page. */
export function productEnquiry(origin: string, it: EnquiryItem) {
  return [`Hello ${site.name}! I would like to order this piece:`, '', `*${it.name}*`, ...itemLines(origin, it), '', 'Please confirm availability and the next steps. Thank you!'].join('\n');
}

/** A bag line as an enquiry item. */
export function lineItem(l: CartLine): EnquiryItem {
  return {
    name: l.name,
    slug: l.slug,
    sku: l.sku,
    purity: l.purity,
    metalColor: l.metalColor,
    diamond: l.diamond?.summary ?? null,
    option: l.option?.label ?? null,
    details: l.details ?? null,
    shape: l.diamond?.shape ?? l.shape,
    carat: l.details ? l.carat : null,
    ringSize: l.ringSize ?? null,
    engraving: l.engraving ?? null,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
  };
}

/** Message for everything in the bag, with the totals shown to the shopper. */
export function bagEnquiry(
  origin: string,
  items: EnquiryItem[],
  totals: { subtotal: number; discount?: number; shipping: number; tax: number; total: number },
  extra: { taxLabel: string; taxRate: number; couponCode?: string | null },
) {
  const lines = [`Hello ${site.name}! I would like to order ${items.length === 1 ? 'this piece' : `these ${items.length} pieces`} from my bag:`, ''];
  items.forEach((it, i) => {
    lines.push(`${i + 1}. *${it.name}*`, ...itemLines(origin, it, '   '), '');
  });
  lines.push(`Subtotal: ${formatMoney(totals.subtotal)}`);
  if (totals.discount) lines.push(`Discount${extra.couponCode ? ` (${extra.couponCode})` : ''}: −${formatMoney(totals.discount)}`);
  lines.push(`Shipping: ${totals.shipping ? formatMoney(totals.shipping) : 'Complimentary'}`);
  lines.push(`${extra.taxLabel} (${Math.round(extra.taxRate * 1000) / 10}%): ${formatMoney(totals.tax, { exact: true })}`);
  lines.push(`*Total: ${formatMoney(totals.total, { exact: true })}*`, '', 'Please confirm availability and the next steps. Thank you!');
  return lines.join('\n');
}
