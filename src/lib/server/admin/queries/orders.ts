import 'server-only';
import { cache } from 'react';
import { OrderStatus, type Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { OPEN_ORDER_STATUSES } from '@/lib/server/admin/nav';
import { paging, sp, spDate, type SearchParams } from '@/lib/server/admin/list';

export const ORDERS_PAGE_SIZE = 25;
const ORDER_STATUS_VALUES = Object.values(OrderStatus) as string[];

export type OrderStatusFilter = OrderStatus | 'open' | '';

export type OrderFilters = {
  status: OrderStatusFilter;
  q: string;
  /** 'requested' → only orders with at least one open (REQUESTED) return request */
  returns: 'requested' | '';
  from?: Date;
  to?: Date;
  /** Raw yyyy-mm-dd strings (only when valid) for form defaults & links */
  fromRaw: string;
  toRaw: string;
};

export function parseOrderFilters(params: SearchParams): OrderFilters {
  const rawStatus = sp(params, 'status');
  const status: OrderStatusFilter = rawStatus === 'open' ? 'open' : ORDER_STATUS_VALUES.includes(rawStatus) ? (rawStatus as OrderStatus) : '';
  const from = spDate(params, 'from');
  const to = spDate(params, 'to', true);
  return {
    status,
    q: sp(params, 'q').slice(0, 100),
    returns: sp(params, 'returns') === 'requested' ? 'requested' : '',
    from,
    to,
    fromRaw: from ? sp(params, 'from') : '',
    toRaw: to ? sp(params, 'to') : '',
  };
}

/** Shared by the orders list, its status-tab counts and the CSV export. */
export function buildOrderWhere(params: SearchParams, opts: { ignoreStatus?: boolean } = {}): Prisma.OrderWhereInput {
  const f = parseOrderFilters(params);
  const and: Prisma.OrderWhereInput[] = [];
  if (!opts.ignoreStatus && f.status) and.push({ status: f.status === 'open' ? { in: [...OPEN_ORDER_STATUSES] } : f.status });
  if (f.q) {
    and.push({
      OR: [
        { number: { contains: f.q, mode: 'insensitive' } },
        { email: { contains: f.q, mode: 'insensitive' } },
        { customerName: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  if (f.returns === 'requested') and.push({ returns: { some: { status: 'REQUESTED' } } });
  if (f.from || f.to) and.push({ createdAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } });
  return and.length ? { AND: and } : {};
}

/** The filter keys that the list, the tabs and the export link share. */
export function orderFilterQuery(f: OrderFilters, patch: Partial<Record<'status' | 'q' | 'returns' | 'from' | 'to', string>> = {}) {
  const qs = new URLSearchParams();
  const values = { status: f.status, q: f.q, returns: f.returns, from: f.fromRaw, to: f.toRaw, ...patch };
  for (const [k, v] of Object.entries(values)) if (v) qs.set(k, v);
  return qs.toString();
}

const listSelect = {
  id: true,
  number: true,
  createdAt: true,
  customerName: true,
  email: true,
  status: true,
  total: true,
  payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
  shipments: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
  _count: { select: { returns: { where: { status: 'REQUESTED' } } } },
} satisfies Prisma.OrderSelect;

/** Sum of item quantities per order, for a page of ids (one grouped query). */
export async function itemQuantities(orderIds: string[]) {
  if (!orderIds.length) return new Map<string, number>();
  const rows = await db.orderItem.groupBy({ by: ['orderId'], where: { orderId: { in: orderIds } }, _sum: { quantity: true } });
  return new Map(rows.map((r) => [r.orderId, r._sum.quantity ?? 0]));
}

export async function listOrders(params: SearchParams) {
  const where = buildOrderWhere(params);
  const { page, skip, take, pageSize } = paging(params, ORDERS_PAGE_SIZE);
  const [total, rows, grouped] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take, select: listSelect }),
    db.order.groupBy({ by: ['status'], where: buildOrderWhere(params, { ignoreStatus: true }), _count: { _all: true } }),
  ]);
  const qty = await itemQuantities(rows.map((r) => r.id));

  const counts = Object.fromEntries(Object.values(OrderStatus).map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  const all = Object.values(counts).reduce((s, n) => s + n, 0);
  const open = OPEN_ORDER_STATUSES.reduce((s, k) => s + counts[k], 0);

  return {
    total,
    page,
    pageSize,
    counts,
    all,
    open,
    rows: rows.map((r) => ({
      id: r.id,
      number: r.number,
      createdAt: r.createdAt,
      customerName: r.customerName,
      email: r.email,
      status: r.status,
      total: r.total,
      items: qty.get(r.id) ?? 0,
      paymentStatus: r.payments[0]?.status ?? null,
      shipmentStatus: r.shipments[0]?.status ?? null,
      openReturns: r._count.returns,
    })),
  };
}

export type OrderListRow = Awaited<ReturnType<typeof listOrders>>['rows'][number];

// ───────────────────────────── detail ─────────────────────────────

/** Order + everything the detail page shows. `cache` dedupes generateMetadata + page. */
export const getOrderDetail = cache(async (id: string) =>
  db.order.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      email: true,
      phone: true,
      customerName: true,
      shippingAddress: true,
      billingAddress: true,
      deliveryMethod: true,
      currency: true,
      subtotal: true,
      discount: true,
      shipping: true,
      tax: true,
      total: true,
      couponCode: true,
      notes: true,
      adminNotes: true,
      user: { select: { id: true, name: true, role: true, _count: { select: { orders: true } } } },
      items: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          productId: true,
          name: true,
          sku: true,
          purity: true,
          metalColor: true,
          diamondSummary: true,
          ringSize: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
      payments: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, provider: true, method: true, amount: true, currency: true, status: true, providerOrderId: true, providerPaymentId: true, createdAt: true, updatedAt: true },
      },
      shipments: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, carrier: true, method: true, trackingNumber: true, status: true, shippedAt: true, deliveredAt: true, createdAt: true },
      },
      returns: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, reason: true, details: true, status: true, createdAt: true, updatedAt: true },
      },
    },
  }),
);

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;

/** How many orders this buyer has placed: by account when registered, by email for guests. */
export async function buyerOrderCount(order: Pick<OrderDetail, 'userId' | 'email' | 'user'>) {
  if (order.user) return order.user._count.orders;
  return db.order.count({ where: { userId: null, email: { equals: order.email, mode: 'insensitive' } } });
}

// ───────────────────────────── export ─────────────────────────────

export const EXPORT_MAX_ROWS = 10_000;
const EXPORT_CHUNK = 500;

const exportSelect = {
  id: true,
  number: true,
  createdAt: true,
  status: true,
  customerName: true,
  email: true,
  phone: true,
  subtotal: true,
  discount: true,
  shipping: true,
  tax: true,
  total: true,
  currency: true,
  couponCode: true,
  deliveryMethod: true,
  shippingAddress: true,
  payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
} satisfies Prisma.OrderSelect;

export type ExportOrderRow = Prisma.OrderGetPayload<{ select: typeof exportSelect }> & { items: number };

/** Keyset-paginated reads (500 at a time, newest first) capped at `max` rows. */
export async function* exportOrderChunks(params: SearchParams, max = EXPORT_MAX_ROWS): AsyncGenerator<ExportOrderRow[]> {
  const where = buildOrderWhere(params);
  let cursor: string | undefined;
  let sent = 0;
  while (sent < max) {
    const rows = await db.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: Math.min(EXPORT_CHUNK, max - sent),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: exportSelect,
    });
    if (!rows.length) return;
    const qty = await itemQuantities(rows.map((r) => r.id));
    yield rows.map((r) => ({ ...r, items: qty.get(r.id) ?? 0 }));
    sent += rows.length;
    cursor = rows[rows.length - 1].id;
    if (rows.length < EXPORT_CHUNK) return;
  }
}

export async function countOrders(params: SearchParams) {
  return db.order.count({ where: buildOrderWhere(params) });
}
