import 'server-only';
import { PaymentStatus, type Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { paging, sp, type SearchParams } from '@/lib/server/admin/list';

export const PAYMENTS_PAGE_SIZE = 25;
const PAYMENT_STATUS_VALUES = Object.values(PaymentStatus) as string[];

export function parsePaymentFilters(params: SearchParams) {
  const raw = sp(params, 'status');
  return {
    status: PAYMENT_STATUS_VALUES.includes(raw) ? (raw as PaymentStatus) : ('' as const),
    q: sp(params, 'q').slice(0, 100),
  };
}

function paymentWhere(f: ReturnType<typeof parsePaymentFilters>, ignoreStatus = false): Prisma.PaymentWhereInput {
  const and: Prisma.PaymentWhereInput[] = [];
  if (!ignoreStatus && f.status) and.push({ status: f.status });
  if (f.q) {
    and.push({
      OR: [
        { order: { number: { contains: f.q, mode: 'insensitive' } } },
        { providerOrderId: { contains: f.q, mode: 'insensitive' } },
        { providerPaymentId: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export async function listPayments(params: SearchParams) {
  const f = parsePaymentFilters(params);
  const where = paymentWhere(f);
  const { page, skip, take, pageSize } = paging(params, PAYMENTS_PAGE_SIZE);
  const [total, rows, grouped] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        provider: true,
        method: true,
        amount: true,
        status: true,
        providerOrderId: true,
        providerPaymentId: true,
        order: { select: { id: true, number: true, email: true } },
      },
    }),
    db.payment.groupBy({ by: ['status'], where: paymentWhere(f, true), _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(Object.values(PaymentStatus).map((s) => [s, 0])) as Record<PaymentStatus, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  const all = Object.values(counts).reduce((s, n) => s + n, 0);
  return { filters: f, total, page, pageSize, rows, counts, all };
}

/** All-time totals for the summary strip (one grouped query). */
export async function paymentSummary() {
  const grouped = await db.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } });
  const by = new Map(grouped.map((g) => [g.status, g]));
  return {
    capturedAmount: by.get('CAPTURED')?._sum.amount ?? 0,
    capturedCount: by.get('CAPTURED')?._count._all ?? 0,
    refundedAmount: by.get('REFUNDED')?._sum.amount ?? 0,
    refundedCount: by.get('REFUNDED')?._count._all ?? 0,
    pendingCount: by.get('PENDING')?._count._all ?? 0,
    pendingAmount: by.get('PENDING')?._sum.amount ?? 0,
    failedCount: by.get('FAILED')?._count._all ?? 0,
  };
}
