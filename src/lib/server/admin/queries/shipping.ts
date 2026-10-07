import 'server-only';
import { ShipmentStatus, type OrderStatus, type Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { paging, sp, type SearchParams } from '@/lib/server/admin/list';
import { SHIPPED_SHIPMENT_STATUSES } from '@/components/admin/orders/status';

export const SHIPMENTS_PAGE_SIZE = 25;
const SHIPMENT_STATUS_VALUES = Object.values(ShipmentStatus) as string[];

/**
 * shippedAt / deliveredAt bookkeeping shared by every shipment mutation:
 *  - shippedAt is stamped the first time the parcel leaves (IN_TRANSIT / OUT_FOR_DELIVERY / DELIVERED)
 *    and cleared if it is moved back to PENDING / PACKED;
 *  - deliveredAt is stamped on DELIVERED and cleared when moved back (RETURNED keeps it as history).
 */
export function shipmentTimestamps(prev: { shippedAt: Date | null; deliveredAt: Date | null } | null, status: ShipmentStatus, now = new Date()) {
  let shippedAt = prev?.shippedAt ?? null;
  let deliveredAt = prev?.deliveredAt ?? null;
  if (SHIPPED_SHIPMENT_STATUSES.includes(status)) shippedAt ??= now;
  else if (status === 'PENDING' || status === 'PACKED') shippedAt = null;
  if (status === 'DELIVERED') deliveredAt ??= now;
  else if (status !== 'RETURNED') deliveredAt = null;
  return { shippedAt, deliveredAt };
}

/**
 * Moves the order forward when its parcel moves (never backwards):
 * in transit → SHIPPED (from PAID/PROCESSING), delivered → DELIVERED (from PAID/PROCESSING/SHIPPED).
 * Returns the new order status when it changed.
 */
export async function advanceOrderForShipment(tx: Prisma.TransactionClient, orderId: string, status: ShipmentStatus): Promise<OrderStatus | null> {
  const target: OrderStatus | null = status === 'DELIVERED' ? 'DELIVERED' : status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY' ? 'SHIPPED' : null;
  if (!target) return null;
  const from: OrderStatus[] = target === 'DELIVERED' ? ['PAID', 'PROCESSING', 'SHIPPED'] : ['PAID', 'PROCESSING'];
  const res = await tx.order.updateMany({ where: { id: orderId, status: { in: from } }, data: { status: target } });
  return res.count ? target : null;
}

export function parseShipmentFilters(params: SearchParams) {
  const raw = sp(params, 'status');
  return {
    status: SHIPMENT_STATUS_VALUES.includes(raw) ? (raw as ShipmentStatus) : ('' as const),
    q: sp(params, 'q').slice(0, 100),
  };
}

function shipmentWhere(f: ReturnType<typeof parseShipmentFilters>, ignoreStatus = false): Prisma.ShipmentWhereInput {
  const and: Prisma.ShipmentWhereInput[] = [];
  if (!ignoreStatus && f.status) and.push({ status: f.status });
  if (f.q) {
    and.push({
      OR: [
        { trackingNumber: { contains: f.q, mode: 'insensitive' } },
        { carrier: { contains: f.q, mode: 'insensitive' } },
        { order: { number: { contains: f.q, mode: 'insensitive' } } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export async function listShipments(params: SearchParams) {
  const f = parseShipmentFilters(params);
  const where = shipmentWhere(f);
  const { page, skip, take, pageSize } = paging(params, SHIPMENTS_PAGE_SIZE);
  const [total, rows, grouped] = await Promise.all([
    db.shipment.count({ where }),
    db.shipment.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      select: {
        id: true,
        carrier: true,
        method: true,
        trackingNumber: true,
        status: true,
        shippedAt: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        order: { select: { id: true, number: true, customerName: true, status: true } },
      },
    }),
    db.shipment.groupBy({ by: ['status'], where: shipmentWhere(f, true), _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(Object.values(ShipmentStatus).map((s) => [s, 0])) as Record<ShipmentStatus, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  const all = Object.values(counts).reduce((s, n) => s + n, 0);
  return { filters: f, total, page, pageSize, rows, counts, all };
}

/** How many orders reference each delivery method id (for the "remove method" warning). */
export async function deliveryMethodUsage() {
  const rows = await db.order.groupBy({ by: ['deliveryMethod'], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.deliveryMethod, r._count._all])) as Record<string, number>;
}
