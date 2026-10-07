import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import { label } from '@/lib/catalog';
import { requireAdmin } from '@/lib/server/auth';
import { ANALYTICS_RANGES, getAnalytics, type AnalyticsRange } from '@/lib/server/admin/queries/analytics';
import { spEnum, type SearchParams } from '@/lib/server/admin/list';
import { BarList } from '@/components/admin/charts/BarList';
import { ChartCard, StatTile } from '@/components/admin/charts/ChartCard';
import { TimeChart } from '@/components/admin/charts/TimeChart';
import { enumLabel, formatDate, formatMoney, formatNumber, formatPercent } from '@/components/admin/format';
import { Badge, EmptyState, PageHeader, TableWrap, table } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

export const metadata = pageMeta({ title: 'Analytics', path: '/admin/analytics', noIndex: true });

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const range = spEnum(params, 'range', ANALYTICS_RANGES.map((r) => r.value) as AnalyticsRange[], '12m');
  const a = await getAnalytics(range);
  const s = a.summary;
  const labels = a.buckets.map((b) => b.label);
  const titles = a.buckets.map((b) => b.title);
  const rangeLabel = ANALYTICS_RANGES.find((r) => r.value === range)!.label;
  const statusTotal = a.statuses.reduce((sum, x) => sum + x.count, 0);

  return (
    <>
      <PageHeader title="Analytics" description={`Sales and customer reporting since ${formatDate(a.since)}. Revenue counts paid orders that were not cancelled or refunded; product, category and metal figures use merchandise value before order discounts.`} />

      {/* One filter row above everything it scopes */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe" id="range-label">
          Period
        </span>
        <div className="inline-flex border border-line bg-white" role="group" aria-labelledby="range-label">
          {ANALYTICS_RANGES.map((r) => (
            <Link
              key={r.value}
              href={r.value === '12m' ? '/admin/analytics' : `/admin/analytics?range=${r.value}`}
              aria-current={r.value === range ? 'true' : undefined}
              className={cn('px-3.5 py-1.5 text-[12.5px] transition-colors', r.value === range ? 'bg-ink text-ivory' : 'text-charcoal hover:bg-porcelain')}
            >
              Last {r.label}
            </Link>
          ))}
        </div>
      </div>

      <section aria-label="Period summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Revenue" value={formatMoney(s.revenue)} hint={`Last ${rangeLabel}`} />
        <StatTile label="Paid orders" value={formatNumber(s.orders)} />
        <StatTile label="Avg. order value" value={formatMoney(s.aov)} />
        <StatTile label="Units sold" value={formatNumber(s.units)} />
        <StatTile label="Discounts given" value={formatMoney(s.discount)} hint={s.revenue ? `${formatPercent(s.discount / (s.revenue + s.discount))} of gross` : undefined} />
        <StatTile label="Repeat buyers" value={formatPercent(s.repeatRate)} hint={`of ${formatNumber(s.buyers)} buyers in period`} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Revenue by month" subtitle={formatMoney(s.revenue)} table={{ columns: ['Month', 'Revenue', 'Orders'], rows: titles.map((t, i) => [t, formatMoney(a.revenue[i]), a.orders[i]]), alignRight: [1, 2] }}>
          <TimeChart kind="column" labels={labels} titles={titles} series={[{ key: 'revenue', label: 'Revenue', values: a.revenue }]} format="money" ariaLabel="Revenue by month" />
        </ChartCard>
        <ChartCard title="Paid orders by month" subtitle={`${formatNumber(s.orders)} orders`} table={{ columns: ['Month', 'Orders'], rows: titles.map((t, i) => [t, a.orders[i]]), alignRight: [1] }}>
          <TimeChart kind="column" labels={labels} titles={titles} series={[{ key: 'orders', label: 'Orders', values: a.orders }]} format="number" integer ariaLabel="Paid orders by month" />
        </ChartCard>
        <ChartCard title="Average order value" subtitle="Revenue ÷ paid orders, per month" table={{ columns: ['Month', 'AOV'], rows: titles.map((t, i) => [t, a.orders[i] ? formatMoney(a.aov[i]) : '—']), alignRight: [1] }}>
          <TimeChart kind="line" labels={labels} titles={titles} series={[{ key: 'aov', label: 'Average order value', values: a.aov }]} format="money" ariaLabel="Average order value by month" />
        </ChartCard>
        <ChartCard
          title="New vs returning customers"
          subtitle="Distinct buyers per month · first paid order vs repeat"
          table={{ columns: ['Month', 'New', 'Returning'], rows: titles.map((t, i) => [t, a.newCustomers[i], a.returningCustomers[i]]), alignRight: [1, 2] }}
        >
          <TimeChart
            kind="column"
            labels={labels}
            titles={titles}
            series={[
              { key: 'new', label: 'New customers', values: a.newCustomers },
              { key: 'returning', label: 'Returning customers', values: a.returningCustomers },
            ]}
            format="number"
            integer
            ariaLabel="New versus returning customers by month"
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Sales by category" subtitle={`${formatMoney(a.merchandise)} merchandise`} table={{ columns: ['Category', 'Units', 'Revenue'], rows: a.categories.map((c) => [c.label, c.units, formatMoney(c.revenue)]), alignRight: [1, 2] }}>
          <BarList ariaLabel="Sales by category" format="money" items={a.categories.map((c) => ({ key: c.key, label: c.label, value: c.revenue, hint: `${formatNumber(c.units)} units` }))} />
        </ChartCard>
        <ChartCard title="Sales by metal colour" subtitle="From order line items" table={{ columns: ['Metal', 'Units', 'Revenue'], rows: a.metals.map((m) => [label.metal(m.key), m.units, formatMoney(m.revenue)]), alignRight: [1, 2] }}>
          <BarList ariaLabel="Sales by metal colour" format="money" items={a.metals.map((m) => ({ key: m.key, label: label.metal(m.key), value: m.revenue, hint: `${formatNumber(m.units)} units` }))} />
        </ChartCard>
        <ChartCard title="Sales by purity" subtitle="From order line items" table={{ columns: ['Purity', 'Units', 'Revenue'], rows: a.purities.map((p) => [p.label, p.units, formatMoney(p.revenue)]), alignRight: [1, 2] }}>
          <BarList ariaLabel="Sales by gold purity" format="money" items={a.purities.map((p) => ({ key: p.key, label: `${p.label} gold`, value: p.revenue, hint: `${formatNumber(p.units)} units` }))} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Order status distribution" subtitle={`All ${formatNumber(statusTotal)} orders placed in the period`} table={{ columns: ['Status', 'Orders', 'Value'], rows: a.statuses.map((x) => [enumLabel(x.status), x.count, formatMoney(x.total)]), alignRight: [1, 2] }}>
          <BarList ariaLabel="Orders by status" format="number" items={a.statuses.map((x) => ({ key: x.status, label: enumLabel(x.status), value: x.count, href: `/admin/orders?status=${x.status}`, hint: formatMoney(x.total) }))} />
        </ChartCard>

        <section className="border border-line bg-white">
          <header className="px-5 pt-4">
            <h2 className="font-sans text-[13px] font-medium tracking-normal text-ink">Coupon usage</h2>
            <p className="mt-0.5 text-xs text-taupe">Paid orders that redeemed a code in the period</p>
          </header>
          {a.coupons.length === 0 ? (
            <EmptyState title="No coupons redeemed" description="No paid order used a discount code in this period." />
          ) : (
            <div className="overflow-x-auto px-5 pb-4 pt-3">
              <table className="w-full min-w-[480px] text-left text-[12.5px] tabular-nums">
                <thead>
                  <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.14em] text-taupe">
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 pr-3 text-right font-medium">Orders</th>
                    <th className="py-2 pr-3 text-right font-medium">Discount</th>
                    <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                    <th className="py-2 font-medium">Lifetime uses</th>
                  </tr>
                </thead>
                <tbody>
                  {a.coupons.map((c) => (
                    <tr key={c.code} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-3">
                        <Link href="/admin/coupons" className="font-medium tracking-wider underline-offset-4 hover:underline">
                          {c.code}
                        </Link>
                        {c.type && <span className="ml-2 text-xs text-taupe">{c.type === 'PERCENT' ? `${c.value}%` : formatMoney(c.value ?? 0)}</span>}
                        {c.isActive === false && (
                          <Badge className="ml-2" tone="neutral">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">{formatNumber(c.orders)}</td>
                      <td className="py-2 pr-3 text-right">{formatMoney(c.discount)}</td>
                      <td className="py-2 pr-3 text-right">{formatMoney(c.revenue)}</td>
                      <td className="py-2 text-taupe">{c.usedCount != null ? `${formatNumber(c.usedCount)}${c.maxUses ? ` / ${formatNumber(c.maxUses)}` : ''}` : 'Deleted code'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="mt-4">
        <h2 className="mb-2 font-sans text-[13px] font-medium tracking-normal text-ink">Top products</h2>
        {a.topProducts.length === 0 ? (
          <div className="border border-line bg-white">
            <EmptyState title="No sales in this period" />
          </div>
        ) : (
          <TableWrap>
            <table className={table.base}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>#</th>
                  <th className={table.th}>Product</th>
                  <th className={table.thRight}>Units</th>
                  <th className={table.thRight}>Orders</th>
                  <th className={table.thRight}>Revenue</th>
                  <th className={table.th}>Share of merchandise</th>
                </tr>
              </thead>
              <tbody>
                {a.topProducts.map((p, i) => {
                  const share = a.merchandise ? p.revenue / a.merchandise : 0;
                  return (
                    <tr key={p.productId ?? p.name} className={table.row}>
                      <td className={table.tdMuted}>{i + 1}</td>
                      <td className={table.td}>
                        {p.productId ? (
                          <Link href={`/admin/products/${p.productId}`} className="underline-offset-4 hover:underline">
                            {p.name}
                          </Link>
                        ) : (
                          <span>
                            {p.name} <span className="text-xs text-taupe">(deleted)</span>
                          </span>
                        )}
                      </td>
                      <td className={table.tdRight}>{formatNumber(p.units)}</td>
                      <td className={table.tdRight}>{formatNumber(p.orders)}</td>
                      <td className={table.tdRight}>{formatMoney(p.revenue)}</td>
                      <td className={table.td}>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 bg-gold-pale" aria-hidden>
                            <div className="h-full bg-[#AD7A22]" style={{ width: `${Math.min(100, share * 100)}%` }} />
                          </div>
                          <span className="text-xs text-taupe">{formatPercent(share)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>
    </>
  );
}
