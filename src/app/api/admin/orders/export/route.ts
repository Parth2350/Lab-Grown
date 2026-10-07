import { NextResponse, type NextRequest } from 'next/server';
import { assertAdmin, getSession } from '@/lib/server/auth';
import { readStoreSettings } from '@/lib/server/admin/settings';
import type { SearchParams } from '@/lib/server/admin/list';
import { EXPORT_MAX_ROWS, countOrders, exportOrderChunks, type ExportOrderRow } from '@/lib/server/admin/queries/orders';
import { readAddress } from '@/components/admin/orders/address';

export const dynamic = 'force-dynamic';

const HEADER = [
  'Order number',
  'Created at',
  'Status',
  'Customer name',
  'Email',
  'Phone',
  'Items',
  'Subtotal',
  'Discount',
  'Shipping',
  'Tax',
  'Total',
  'Currency',
  'Coupon',
  'Delivery method',
  'Payment status',
  'Shipping country',
  'Shipping city',
];

/** RFC 4180 quoting + spreadsheet formula-injection guard for free-text cells. */
function textCell(value: string | null | undefined) {
  let v = (value ?? '').replace(/\r\n?/g, '\n');
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

function toLine(o: ExportOrderRow, methodLabel: (id: string) => string) {
  const addr = readAddress(o.shippingAddress);
  return [
    textCell(o.number),
    o.createdAt.toISOString(),
    o.status,
    textCell(o.customerName),
    textCell(o.email),
    textCell(o.phone),
    String(o.items),
    dollars(o.subtotal),
    dollars(o.discount),
    dollars(o.shipping),
    dollars(o.tax),
    dollars(o.total),
    textCell(o.currency),
    textCell(o.couponCode),
    textCell(methodLabel(o.deliveryMethod)),
    o.payments[0]?.status ?? '',
    textCell(addr?.country),
    textCell(addr?.city),
  ].join(',');
}

function searchParamsOf(req: NextRequest): SearchParams {
  const out: SearchParams = {};
  const sp = req.nextUrl.searchParams;
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    const session = await getSession().catch(() => null);
    return session?.user
      ? NextResponse.json({ error: 'Administrator access required' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
      : NextResponse.json({ error: 'Sign in required' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const params = searchParamsOf(req);
  const [settings, total] = await Promise.all([readStoreSettings(), countOrders(params)]);
  const labels = new Map(settings.shippingMethods.map((m) => [m.id, m.label]));
  const methodLabel = (id: string) => labels.get(id) ?? id;

  const encoder = new TextEncoder();
  const chunks = exportOrderChunks(params, EXPORT_MAX_ROWS);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // BOM so Excel opens UTF-8 names correctly
      controller.enqueue(encoder.encode(`﻿${HEADER.join(',')}\r\n`));
    },
    async pull(controller) {
      try {
        const next = await chunks.next();
        if (next.done) return controller.close();
        controller.enqueue(encoder.encode(next.value.map((o) => `${toLine(o, methodLabel)}\r\n`).join('')));
      } catch (e) {
        console.error('[orders export]', e);
        controller.error(e);
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });

  const day = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${day}.csv"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Export-Total': String(total),
      'X-Export-Truncated': total > EXPORT_MAX_ROWS ? 'true' : 'false',
    },
  });
}
