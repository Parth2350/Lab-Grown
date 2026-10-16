import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, type SearchParams } from '@/lib/server/admin/list';
import { listPayments, paymentSummary } from '@/lib/server/admin/queries/payments';
import { buttonClass } from '@/components/ui/Button';
import { PAYMENT_STATUSES } from '@/components/admin/orders/status';
import { Ref } from '@/components/admin/orders/OrderParts';
import { enumLabel, formatDate, formatDateTime, formatMoney, formatNumber } from '@/components/admin/format';
import { EmptyState, FilterBar, FilterLabel, MiniStat, PageHeader, Pagination, Panel, StatusBadge, TableWrap, Tabs, fieldSm, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Payments', path: '/admin/payments', noIndex: true });

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const [data, summary] = await Promise.all([listPayments(params), paymentSummary()]);
  const current = cleanParams(params);
  const { filters } = data;

  const tabs = [{ value: '', label: 'All', count: data.all }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: enumLabel(s), count: data.counts[s] }))];

  return (
    <>
      <PageHeader title="Payments" description="Every payment attempt across all orders, as reported by the payment provider. Refunds recorded here do not move money — issue them in the provider dashboard." />

      <Panel className="mb-6" bodyClassName="grid grid-cols-2 gap-5 p-5 md:grid-cols-4">
        <MiniStat label="Captured" value={formatMoney(summary.capturedAmount)} hint={`${formatNumber(summary.capturedCount)} payment${summary.capturedCount === 1 ? '' : 's'} · all time`} />
        <MiniStat label="Refunded" value={formatMoney(summary.refundedAmount)} hint={`${formatNumber(summary.refundedCount)} payment${summary.refundedCount === 1 ? '' : 's'}`} />
        <MiniStat label="Pending" value={formatNumber(summary.pendingCount)} hint={`${formatMoney(summary.pendingAmount)} awaiting confirmation`} />
        <MiniStat label="Failed" value={formatNumber(summary.failedCount)} hint="Declined or abandoned attempts" />
      </Panel>

      <Tabs tabs={tabs} active={filters.status} basePath="/admin/payments" params={current} />

      <FilterBar action="/admin/payments">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <div className="min-w-[220px] flex-1 sm:max-w-sm">
          <FilterLabel htmlFor="payments-q">Search</FilterLabel>
          <input id="payments-q" name="q" type="search" defaultValue={filters.q} placeholder="Order number or provider reference" className={fieldSm} maxLength={100} />
        </div>
        <button type="submit" className={buttonClass('primary', 'sm')}>
          Search
        </button>
        {filters.q && (
          <Link
            href={filters.status ? `/admin/payments?status=${filters.status}` : '/admin/payments'}
            className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline"
          >
            Clear search
          </Link>
        )}
      </FilterBar>

      {data.rows.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<CreditCard className="h-5 w-5" strokeWidth={1.25} />}
            title={filters.q || filters.status ? 'No matching payments' : 'No payments yet'}
            description={filters.q || filters.status ? 'Try another search or status.' : 'Online payment attempts appear here.'}
          />
        </div>
      ) : (
        <TableWrap>
          <table className={`${table.base} min-w-[900px]`}>
            <caption className="sr-only">Payments, newest first</caption>
            <thead className={table.head}>
              <tr>
                <th scope="col" className={table.th}>Date</th>
                <th scope="col" className={table.th}>Order</th>
                <th scope="col" className={table.th}>Customer</th>
                <th scope="col" className={table.th}>Provider</th>
                <th scope="col" className={table.th}>Method</th>
                <th scope="col" className={table.thRight}>Amount</th>
                <th scope="col" className={table.th}>Status</th>
                <th scope="col" className={table.th}>Provider order</th>
                <th scope="col" className={table.th}>Provider payment</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((p) => (
                <tr key={p.id} className={table.row}>
                  <td className={table.tdMuted}>
                    <time dateTime={p.createdAt.toISOString()} title={formatDateTime(p.createdAt)} className="whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </time>
                  </td>
                  <td className={table.td}>
                    <Link href={`/admin/orders/${p.order.id}`} className="font-medium underline-offset-4 hover:underline">
                      {p.order.number}
                    </Link>
                  </td>
                  <td className={table.td}>
                    <span className="block max-w-[200px] truncate" title={p.order.email}>
                      {p.order.email}
                    </span>
                  </td>
                  <td className={`${table.td} capitalize`}>{p.provider}</td>
                  <td className={table.tdMuted}>{p.method ? <span className="capitalize">{p.method}</span> : '—'}</td>
                  <td className={table.tdRight}>{formatMoney(p.amount, { exact: true })}</td>
                  <td className={table.td}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className={table.td}>
                    <Ref value={p.providerOrderId} />
                  </td>
                  <td className={table.td}>
                    <Ref value={p.providerPaymentId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <Pagination page={data.page} pageCount={pageCount(data.total, data.pageSize)} total={data.total} pageSize={data.pageSize} basePath="/admin/payments" params={current} noun="payments" />
    </>
  );
}
