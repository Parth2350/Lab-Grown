import Link from 'next/link';
import { Download, ShoppingBag, Undo2, X } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, type SearchParams } from '@/lib/server/admin/list';
import { listOrders, orderFilterQuery, parseOrderFilters } from '@/lib/server/admin/queries/orders';
import { buttonClass } from '@/components/ui/Button';
import { ORDER_STATUSES } from '@/components/admin/orders/status';
import { enumLabel, formatDate, formatDateTime, formatMoney, formatNumber } from '@/components/admin/format';
import { Badge, EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, StatusBadge, TableWrap, Tabs, fieldSm, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Orders', path: '/admin/orders', noIndex: true });

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseOrderFilters(params);
  const data = await listOrders(params);
  const current = cleanParams(params);
  const exportQs = orderFilterQuery(filters);
  const hasSearch = !!(filters.q || filters.fromRaw || filters.toRaw);
  const clearSearchHref = `/admin/orders${orderFilterQuery(filters, { q: '', from: '', to: '' }) ? `?${orderFilterQuery(filters, { q: '', from: '', to: '' })}` : ''}`;
  const clearReturnsQs = orderFilterQuery(filters, { returns: '' });

  const tabs = [
    { value: '', label: 'All', count: data.all },
    { value: 'open', label: 'Open', count: data.open },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: enumLabel(s), count: data.counts[s] })),
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order placed in the store. Open orders (pending, paid, processing) still need attention."
        actions={
          <a href={`/api/admin/orders/export${exportQs ? `?${exportQs}` : ''}`} className={buttonClass('outline', 'sm')} download>
            <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Export CSV
          </a>
        }
      />

      <Tabs tabs={tabs} active={filters.status} basePath="/admin/orders" params={current} />

      <FilterBar action="/admin/orders">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        {filters.returns && <input type="hidden" name="returns" value={filters.returns} />}
        <div className="min-w-[220px] flex-1 sm:max-w-sm">
          <FilterLabel htmlFor="orders-q">Search</FilterLabel>
          <input id="orders-q" name="q" type="search" defaultValue={filters.q} placeholder="Order number, email or name" className={fieldSm} maxLength={100} />
        </div>
        <div>
          <FilterLabel htmlFor="orders-from">From</FilterLabel>
          <input id="orders-from" name="from" type="date" defaultValue={filters.fromRaw} className={fieldSm} />
        </div>
        <div>
          <FilterLabel htmlFor="orders-to">To</FilterLabel>
          <input id="orders-to" name="to" type="date" defaultValue={filters.toRaw} className={fieldSm} />
        </div>
        <button type="submit" className={buttonClass('primary', 'sm')}>
          Apply
        </button>
        {hasSearch && (
          <Link href={clearSearchHref} className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
            Clear filters
          </Link>
        )}
      </FilterBar>

      {filters.returns === 'requested' && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border border-[#E6CF9E] bg-[#FBF3E1] px-3 py-2 text-[14.5px] text-[#7A5718]" role="status">
          <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          Showing orders with open return requests
          <span aria-hidden>·</span>
          <Link href={`/admin/orders${clearReturnsQs ? `?${clearReturnsQs}` : ''}`} className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline">
            <X className="h-3 w-3" strokeWidth={2} aria-hidden /> Clear
          </Link>
        </div>
      )}

      {data.rows.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" strokeWidth={1.25} />}
            title={hasSearch || filters.status || filters.returns ? 'No matching orders' : 'No orders yet'}
            description={hasSearch || filters.status || filters.returns ? 'Try a different search, status or date range.' : 'Orders placed at checkout will appear here.'}
            action={
              hasSearch || filters.status || filters.returns ? (
                <Link href="/admin/orders" className={buttonClass('outline', 'sm')}>
                  Show all orders
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <TableWrap>
          <table className={table.base}>
            <caption className="sr-only">Orders, newest first</caption>
            <thead className={table.head}>
              <tr>
                <th scope="col" className={table.th}>Order</th>
                <th scope="col" className={table.th}>Date</th>
                <th scope="col" className={table.th}>Customer</th>
                <th scope="col" className={table.thRight}>Items</th>
                <th scope="col" className={table.thRight}>Total</th>
                <th scope="col" className={table.th}>Payment</th>
                <th scope="col" className={table.th}>Fulfilment</th>
                <th scope="col" className={table.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((o) => (
                <tr key={o.id} className={table.row}>
                  <td className={table.td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink underline-offset-4 hover:underline">
                      {o.number}
                    </Link>
                    {o.openReturns > 0 && (
                      <Badge tone="warning" className="ml-2" title={`${o.openReturns} open return request${o.openReturns === 1 ? '' : 's'}`}>
                        Return requested
                      </Badge>
                    )}
                  </td>
                  <td className={table.tdMuted}>
                    <time dateTime={o.createdAt.toISOString()} title={formatDateTime(o.createdAt)} className="whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </time>
                  </td>
                  <td className={table.td}>
                    <p className="max-w-[220px] truncate">{o.customerName}</p>
                    <p className="max-w-[220px] truncate text-xs text-taupe">{o.email}</p>
                  </td>
                  <td className={table.tdRight}>{formatNumber(o.items)}</td>
                  <td className={table.tdRight}>{formatMoney(o.total, { exact: true })}</td>
                  <td className={table.td}>{o.paymentStatus ? <StatusBadge status={o.paymentStatus} /> : <span className="text-taupe">—</span>}</td>
                  <td className={table.td}>{o.shipmentStatus ? <StatusBadge status={o.shipmentStatus} /> : <span className="text-taupe">—</span>}</td>
                  <td className={table.td}>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <Pagination page={data.page} pageCount={pageCount(data.total, data.pageSize)} total={data.total} pageSize={data.pageSize} basePath="/admin/orders" params={current} noun="orders" />
    </>
  );
}
