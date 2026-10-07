import 'server-only';
import { db } from '@/lib/server/db';
import { readStoreSettings } from '../settings';
import { OPEN_ORDER_STATUSES } from '../nav';
import { REVENUE_STATUSES, buyerStats, monthBuckets, monthStart, ordersByWeek, revenueByMonth, salesByCategory, signupsByMonth, topProducts, weekBuckets } from './metrics';

const DAY = 86_400_000;

export async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const months = monthBuckets(12, now);
  const weeks = weekBuckets(12, now);
  const since12 = monthStart(11, now);
  const settings = await readStoreSettings();
  const threshold = settings.lowStockThreshold;
  const lowWhere = { isActive: true, stock: { lte: threshold }, product: { isActive: true } };

  const [
    sales,
    todayOrders,
    todayRevenue,
    customers,
    customersThisMonth,
    openGroups,
    lowStockProducts,
    lowStockVariants,
    outOfStockVariants,
    buyers,
    monthly,
    weekly,
    signups,
    top,
    categories,
    recentOrders,
    pendingReviews,
    newBespoke,
    pendingPartners,
    unreadMessages,
    staleFulfilment,
    stalePayment,
    openReturns,
  ] = await Promise.all([
    db.order.aggregate({ where: { status: { in: REVENUE_STATUSES } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.aggregate({ where: { createdAt: { gte: todayStart }, status: { in: REVENUE_STATUSES } }, _sum: { total: true } }),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: monthStart(0, now) } } }),
    db.order.groupBy({ by: ['status'], where: { status: { in: [...OPEN_ORDER_STATUSES] } }, _count: { _all: true } }),
    db.productVariant.groupBy({ by: ['productId'], where: lowWhere }),
    db.productVariant.count({ where: lowWhere }),
    db.productVariant.count({ where: { isActive: true, stock: { lte: 0 }, product: { isActive: true } } }),
    buyerStats(null),
    revenueByMonth(since12),
    ordersByWeek(weeks[0].start),
    signupsByMonth(since12),
    topProducts(since12, 6),
    salesByCategory(since12),
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, number: true, customerName: true, email: true, total: true, status: true, createdAt: true, _count: { select: { items: true } } },
    }),
    db.review.count({ where: { status: 'PENDING' } }),
    db.bespokeRequest.count({ where: { status: 'NEW' } }),
    db.partnerApplication.count({ where: { status: 'PENDING' } }),
    db.contactMessage.count({ where: { isRead: false } }),
    db.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] }, createdAt: { lt: new Date(now.getTime() - 3 * DAY) }, shipments: { none: {} } } }),
    db.order.count({ where: { status: 'PENDING', createdAt: { lt: new Date(now.getTime() - 2 * DAY) } } }),
    db.returnRequest.count({ where: { status: 'REQUESTED' } }),
  ]);

  const open = Object.fromEntries(openGroups.map((g) => [g.status, g._count._all])) as Partial<Record<string, number>>;
  const openTotal = openGroups.reduce((s, g) => s + g._count._all, 0);
  const totalSales = sales._sum.total ?? 0;
  const paidOrders = sales._count;

  const monthSeries = months.map((b) => monthly.get(b.key) ?? { key: b.key, revenue: 0, orders: 0, discount: 0, units: 0 });
  const thisMonth = monthSeries[monthSeries.length - 1];
  const lastMonth = monthSeries[monthSeries.length - 2];
  // Like-for-like: compare month-to-date with the same number of days last month
  const dayOfMonth = now.getUTCDate();
  const lastMonthToDate = await db.order.aggregate({
    where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: monthStart(1, now), lt: new Date(monthStart(1, now).getTime() + dayOfMonth * DAY) } },
    _sum: { total: true },
  });

  return {
    threshold,
    kpis: {
      totalSales,
      paidOrders,
      todayOrders,
      todayRevenue: todayRevenue._sum.total ?? 0,
      customers,
      customersThisMonth,
      openTotal,
      awaitingPayment: open.PENDING ?? 0,
      toFulfil: (open.PAID ?? 0) + (open.PROCESSING ?? 0),
      lowStockProducts: lowStockProducts.length,
      lowStockVariants,
      outOfStockVariants,
      returningRate: buyers.buyers ? buyers.returning / buyers.buyers : 0,
      returningBuyers: buyers.returning,
      buyers: buyers.buyers,
      aov: paidOrders ? Math.round(totalSales / paidOrders) : 0,
      monthRevenue: thisMonth.revenue,
      lastMonthRevenue: lastMonth.revenue,
      lastMonthToDate: lastMonthToDate._sum.total ?? 0,
    },
    months,
    revenueSeries: monthSeries.map((m) => m.revenue),
    weeks,
    ordersSeries: weeks.map((w) => weekly.get(w.key)?.placed ?? 0),
    signupSeries: months.map((b) => signups.get(b.key) ?? 0),
    topProducts: top,
    categories,
    recentOrders,
    attention: { pendingReviews, newBespoke, pendingPartners, unreadMessages, staleFulfilment, stalePayment, openReturns, outOfStockVariants, lowStockVariants },
  };
}
