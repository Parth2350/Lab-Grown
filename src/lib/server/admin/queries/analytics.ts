import 'server-only';
import { db } from '@/lib/server/db';
import { REVENUE_STATUSES, buyerStats, monthBuckets, monthStart, newVsReturningByMonth, revenueByMonth, salesByCategory, salesByItemField, topProducts } from './metrics';

export const ANALYTICS_RANGES = [
  { value: '3m', label: '3 months', months: 3 },
  { value: '6m', label: '6 months', months: 6 },
  { value: '12m', label: '12 months', months: 12 },
] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]['value'];

export async function getAnalytics(range: AnalyticsRange) {
  const now = new Date();
  const months = ANALYTICS_RANGES.find((r) => r.value === range)?.months ?? 12;
  const buckets = monthBuckets(months, now);
  const since = monthStart(months - 1, now);

  const [monthly, nvr, categories, metals, purities, top, statusGroups, couponGroups, coupons, buyers, totals] = await Promise.all([
    revenueByMonth(since),
    newVsReturningByMonth(since),
    salesByCategory(since),
    salesByItemField('metalColor', since),
    salesByItemField('purity', since),
    topProducts(since, 10),
    db.order.groupBy({ by: ['status'], where: { createdAt: { gte: since } }, _count: { _all: true }, _sum: { total: true } }),
    db.order.groupBy({
      by: ['couponCode'],
      where: { createdAt: { gte: since }, couponCode: { not: null }, status: { in: REVENUE_STATUSES } },
      _count: { _all: true },
      _sum: { discount: true, total: true },
      orderBy: { _count: { couponCode: 'desc' } },
    }),
    db.coupon.findMany({ select: { code: true, type: true, value: true, usedCount: true, maxUses: true, isActive: true } }),
    buyerStats(since),
    db.order.aggregate({ where: { createdAt: { gte: since }, status: { in: REVENUE_STATUSES } }, _sum: { total: true, discount: true }, _count: true }),
  ]);

  const series = buckets.map((b) => monthly.get(b.key) ?? { key: b.key, revenue: 0, orders: 0, discount: 0, units: 0 });
  const merchandise = categories.reduce((s, c) => s + c.revenue, 0);
  const couponBy = new Map(coupons.map((c) => [c.code, c]));
  const revenue = totals._sum.total ?? 0;
  const orders = totals._count;

  return {
    since,
    buckets,
    summary: {
      revenue,
      orders,
      aov: orders ? Math.round(revenue / orders) : 0,
      units: series.reduce((s, m) => s + m.units, 0),
      discount: totals._sum.discount ?? 0,
      buyers: buyers.buyers,
      repeatRate: buyers.buyers ? buyers.returning / buyers.buyers : 0,
    },
    revenue: series.map((m) => m.revenue),
    orders: series.map((m) => m.orders),
    aov: series.map((m) => (m.orders ? Math.round(m.revenue / m.orders) : 0)),
    newCustomers: buckets.map((b) => nvr.get(b.key)?.newCustomers ?? 0),
    returningCustomers: buckets.map((b) => nvr.get(b.key)?.returning ?? 0),
    categories,
    metals,
    purities,
    merchandise,
    topProducts: top,
    statuses: statusGroups.map((g) => ({ status: g.status, count: g._count._all, total: g._sum.total ?? 0 })).sort((a, b) => b.count - a.count),
    coupons: couponGroups.map((g) => {
      const c = g.couponCode ? couponBy.get(g.couponCode) : undefined;
      return {
        code: g.couponCode ?? '—',
        orders: g._count._all,
        discount: g._sum.discount ?? 0,
        revenue: g._sum.total ?? 0,
        type: c?.type ?? null,
        value: c?.value ?? null,
        usedCount: c?.usedCount ?? null,
        maxUses: c?.maxUses ?? null,
        isActive: c?.isActive ?? null,
      };
    }),
  };
}
