import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Boxes, CircleCheck, Clock, Handshake, Inbox, PackageX, RotateCcw, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { getDashboardData } from '@/lib/server/admin/queries/dashboard';
import { ButtonLink } from '@/components/ui/Button';
import { BarList } from '@/components/admin/charts/BarList';
import { ChartCard, StatTile } from '@/components/admin/charts/ChartCard';
import { Sparkline } from '@/components/admin/charts/Sparkline';
import { TimeChart } from '@/components/admin/charts/TimeChart';
import { formatCompact, formatDate, formatMoney, formatNumber, formatPercent, formatRelative } from '@/components/admin/format';
import { PageHeader, StatusBadge, TableWrap, table } from '@/components/admin/ui';

export const metadata = { ...pageMeta({ title: 'Dashboard', path: '/admin', noIndex: true }), title: { absolute: `Dashboard · ${site.name} Admin` } };

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const d = await getDashboardData();
  const k = d.kpis;
  const monthDelta = k.lastMonthToDate > 0 ? (k.monthRevenue - k.lastMonthToDate) / k.lastMonthToDate : NaN;
  const revenueTotal12 = d.revenueSeries.reduce((s, v) => s + v, 0);
  const ordersTotal12w = d.ordersSeries.reduce((s, v) => s + v, 0);

  const attention: { key: string; icon: ReactNode; label: string; count: number; href: string; tone?: 'danger' }[] = [
    { key: 'fulfil', icon: <ShoppingBag className="h-4 w-4" strokeWidth={1.4} />, label: 'Paid orders waiting more than 3 days without a shipment', count: d.attention.staleFulfilment, href: '/admin/orders?status=open', tone: 'danger' as const },
    { key: 'payment', icon: <Clock className="h-4 w-4" strokeWidth={1.4} />, label: 'Orders awaiting payment for over 2 days', count: d.attention.stalePayment, href: '/admin/orders?status=PENDING' },
    { key: 'returns', icon: <RotateCcw className="h-4 w-4" strokeWidth={1.4} />, label: 'Return requests to review', count: d.attention.openReturns, href: '/admin/orders?returns=requested' },
    { key: 'reviews', icon: <Star className="h-4 w-4" strokeWidth={1.4} />, label: 'Reviews awaiting moderation', count: d.attention.pendingReviews, href: '/admin/reviews?status=PENDING' },
    { key: 'bespoke', icon: <Sparkles className="h-4 w-4" strokeWidth={1.4} />, label: 'New bespoke requests', count: d.attention.newBespoke, href: '/admin/bespoke?status=NEW' },
    { key: 'partners', icon: <Handshake className="h-4 w-4" strokeWidth={1.4} />, label: 'Partner applications to review', count: d.attention.pendingPartners, href: '/admin/partners?status=PENDING' },
    { key: 'messages', icon: <Inbox className="h-4 w-4" strokeWidth={1.4} />, label: 'Unread customer messages', count: d.attention.unreadMessages, href: '/admin/messages?filter=unread' },
    { key: 'out', icon: <PackageX className="h-4 w-4" strokeWidth={1.4} />, label: 'Variants out of stock', count: d.attention.outOfStockVariants, href: '/admin/inventory?stock=out', tone: 'danger' as const },
    { key: 'low', icon: <Boxes className="h-4 w-4" strokeWidth={1.4} />, label: `Variants at or below ${d.threshold} in stock`, count: d.attention.lowStockVariants, href: '/admin/inventory?stock=low' },
  ].filter((a) => a.count > 0);

  return (
    <>
      <PageHeader
        eyebrow={formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        title={`${greeting()}${user.name ? `, ${user.name}` : ''}`}
        description="Store performance at a glance. Revenue counts paid orders that have not been cancelled or refunded."
        actions={
          <ButtonLink href="/admin/analytics" size="sm" variant="outline">
            Full analytics <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </ButtonLink>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total sales" value={formatMoney(k.totalSales)} hint={`${formatNumber(k.paidOrders)} paid orders, all time`} trend={<Sparkline values={d.revenueSeries} />} />
        <StatTile
          label="Monthly revenue"
          value={formatMoney(k.monthRevenue)}
          delta={Number.isFinite(monthDelta) ? { value: monthDelta, label: 'vs same days last month' } : undefined}
          hint={`Last month: ${formatMoney(k.lastMonthRevenue)}`}
        />
        <StatTile label="Today’s orders" value={formatNumber(k.todayOrders)} hint={`${formatMoney(k.todayRevenue)} paid today`} href="/admin/orders" />
        <StatTile label="Average order value" value={formatMoney(k.aov)} hint="Across all paid orders" />
        <StatTile
          label="Pending orders"
          value={formatNumber(k.openTotal)}
          hint={`${formatNumber(k.awaitingPayment)} awaiting payment · ${formatNumber(k.toFulfil)} to fulfil`}
          href="/admin/orders?status=open"
          tone={k.openTotal > 0 ? 'warning' : undefined}
        />
        <StatTile label="Total customers" value={formatNumber(k.customers)} hint={`+${formatNumber(k.customersThisMonth)} new this month`} href="/admin/customers" />
        <StatTile label="Returning customers" value={formatPercent(k.returningRate)} hint={`${formatNumber(k.returningBuyers)} of ${formatNumber(k.buyers)} buyers ordered 2+ times`} />
        <StatTile
          label="Low stock products"
          value={formatNumber(k.lowStockProducts)}
          hint={`${formatNumber(k.lowStockVariants)} variants ≤ ${d.threshold} · ${formatNumber(k.outOfStockVariants)} sold out`}
          href="/admin/inventory?stock=low"
          tone={k.lowStockProducts > 0 ? 'danger' : undefined}
        />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Revenue · last 12 months"
          subtitle={`${formatMoney(revenueTotal12)} from paid orders`}
          table={{ columns: ['Month', 'Revenue'], rows: d.months.map((m, i) => [m.title, formatMoney(d.revenueSeries[i])]), alignRight: [1] }}
        >
          <TimeChart kind="column" labels={d.months.map((m) => m.label)} titles={d.months.map((m) => m.title)} series={[{ key: 'revenue', label: 'Revenue', values: d.revenueSeries }]} format="money" ariaLabel="Monthly revenue, last 12 months" height={250} />
        </ChartCard>
        <ChartCard
          title="Orders · last 12 weeks"
          subtitle={`${formatNumber(ordersTotal12w)} orders placed (all statuses)`}
          table={{ columns: ['Week', 'Orders'], rows: d.weeks.map((w, i) => [w.title, d.ordersSeries[i]]), alignRight: [1] }}
        >
          <TimeChart kind="line" labels={d.weeks.map((w) => w.label)} titles={d.weeks.map((w) => w.title)} series={[{ key: 'orders', label: 'Orders', values: d.ordersSeries }]} format="number" integer ariaLabel="Orders placed per week, last 12 weeks" height={250} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Top products by revenue"
          subtitle="Last 12 months · merchandise value before discounts"
          table={{ columns: ['Product', 'Units', 'Revenue'], rows: d.topProducts.map((p) => [p.name, p.units, formatMoney(p.revenue)]), alignRight: [1, 2] }}
        >
          <BarList
            ariaLabel="Top products by revenue"
            format="money"
            items={d.topProducts.map((p) => ({ key: p.productId ?? p.name, label: p.name, value: p.revenue, href: p.productId ? `/admin/products/${p.productId}` : undefined, hint: `${formatNumber(p.units)} sold` }))}
          />
        </ChartCard>
        <ChartCard
          title="Sales by category"
          subtitle="Last 12 months · merchandise value"
          table={{ columns: ['Category', 'Units', 'Revenue'], rows: d.categories.map((c) => [c.label, c.units, formatMoney(c.revenue)]), alignRight: [1, 2] }}
        >
          <BarList
            ariaLabel="Sales by category"
            format="money"
            items={d.categories.map((c) => ({ key: c.key, label: c.label, value: c.revenue, href: c.key !== 'unassigned' ? `/admin/products?category=${c.key}` : undefined, hint: `${formatNumber(c.units)} units` }))}
          />
        </ChartCard>
        <ChartCard
          className="lg:col-span-2 xl:col-span-1"
          title="New customers"
          subtitle={`Account sign-ups per month · ${formatNumber(d.signupSeries.reduce((s, v) => s + v, 0))} in 12 months`}
          table={{ columns: ['Month', 'Sign-ups'], rows: d.months.map((m, i) => [m.title, d.signupSeries[i]]), alignRight: [1] }}
        >
          <TimeChart kind="column" labels={d.months.map((m) => m.label)} titles={d.months.map((m) => m.title)} series={[{ key: 'signups', label: 'Sign-ups', values: d.signupSeries }]} format="number" integer ariaLabel="New customer sign-ups per month" height={220} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-sans text-[13px] font-medium tracking-normal text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
              All orders
            </Link>
          </div>
          <TableWrap>
            <table className={table.base}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Order</th>
                  <th className={table.th}>Customer</th>
                  <th className={table.th}>Placed</th>
                  <th className={table.thRight}>Items</th>
                  <th className={table.thRight}>Total</th>
                  <th className={table.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o.id} className={table.row}>
                    <td className={table.td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className={table.td}>
                      <p className="max-w-[220px] truncate">{o.customerName}</p>
                      <p className="max-w-[220px] truncate text-xs text-taupe">{o.email}</p>
                    </td>
                    <td className={table.tdMuted} title={o.createdAt.toISOString()}>
                      {formatRelative(o.createdAt)}
                    </td>
                    <td className={table.tdRight}>{o._count.items}</td>
                    <td className={table.tdRight}>{formatMoney(o.total)}</td>
                    <td className={table.td}>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </section>

        <section aria-labelledby="attention-title">
          <h2 id="attention-title" className="mb-2 font-sans text-[13px] font-medium tracking-normal text-ink">
            Needs attention
          </h2>
          <div className="border border-line bg-white">
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-6 text-[13px] text-success">
                <CircleCheck className="h-5 w-5" strokeWidth={1.4} aria-hidden />
                All caught up — nothing needs your attention.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {attention.map((a) => (
                  <li key={a.key}>
                    <Link href={a.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ivory">
                      <span className={a.tone === 'danger' ? 'text-danger' : 'text-gold-deep'} aria-hidden>
                        {a.icon}
                      </span>
                      <span className="flex-1 text-[13px] text-charcoal group-hover:text-ink">{a.label}</span>
                      <span className={`min-w-7 px-1.5 text-center text-[12px] font-medium tabular-nums leading-6 ${a.tone === 'danger' ? 'bg-danger/[0.08] text-danger' : 'bg-gold-pale text-gold-deep'}`}>
                        {formatCompact(a.count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
