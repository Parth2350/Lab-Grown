import Link from 'next/link';
import { Users } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, type SearchParams } from '@/lib/server/admin/list';
import { listCustomers } from '@/lib/server/admin/queries/customers';
import { buttonClass } from '@/components/ui/Button';
import { AutoSubmitSelect } from '@/components/admin/forms';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/components/admin/format';
import { EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, StatusBadge, TableWrap, Tabs, fieldSm, selectChevron, selectSm, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Customers', path: '/admin/customers', noIndex: true });

const SORT_LABEL = { newest: 'Newest first', spent: 'Most spent', orders: 'Most orders' } as const;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const data = await listCustomers(params);
  const current = cleanParams(params);
  const { filters } = data;

  const tabs = [
    { value: '', label: 'All', count: data.roleCounts.all },
    { value: 'CUSTOMER', label: 'Customers', count: data.roleCounts.CUSTOMER },
    { value: 'ADMIN', label: 'Admins', count: data.roleCounts.ADMIN },
  ];

  return (
    <>
      <PageHeader title="Customers" description="Registered accounts with their order history. Spend counts paid, processing, shipped and delivered orders." />

      <Tabs tabs={tabs} active={filters.role} basePath="/admin/customers" params={current} param="role" />

      <FilterBar action="/admin/customers">
        {filters.role && <input type="hidden" name="role" value={filters.role} />}
        <div className="min-w-[220px] flex-1 sm:max-w-sm">
          <FilterLabel htmlFor="customers-q">Search</FilterLabel>
          <input id="customers-q" name="q" type="search" defaultValue={filters.q} placeholder="Name, email or phone" className={fieldSm} maxLength={100} />
        </div>
        <div>
          <FilterLabel htmlFor="customers-sort">Sort</FilterLabel>
          <AutoSubmitSelect id="customers-sort" name="sort" defaultValue={filters.sort} className={`${selectSm} w-44`} style={selectChevron}>
            {Object.entries(SORT_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <button type="submit" className={buttonClass('primary', 'sm')}>
          Search
        </button>
        {filters.q && (
          <Link
            href={`/admin/customers${filters.role || filters.sort !== 'newest' ? `?${new URLSearchParams({ ...(filters.role ? { role: filters.role } : {}), ...(filters.sort !== 'newest' ? { sort: filters.sort } : {}) })}` : ''}`}
            className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline"
          >
            Clear search
          </Link>
        )}
      </FilterBar>

      {data.rows.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<Users className="h-5 w-5" strokeWidth={1.25} />}
            title={filters.q || filters.role ? 'No matching customers' : 'No customers yet'}
            description={filters.q || filters.role ? 'Try another name, email or phone number.' : 'Customers appear here once they create an account.'}
          />
        </div>
      ) : (
        <TableWrap>
          <table className={table.base}>
            <caption className="sr-only">Customers sorted by {SORT_LABEL[filters.sort].toLowerCase()}</caption>
            <thead className={table.head}>
              <tr>
                <th scope="col" className={table.th}>Customer</th>
                <th scope="col" className={table.thRight} aria-sort={filters.sort === 'orders' ? 'descending' : undefined}>
                  Orders
                </th>
                <th scope="col" className={table.thRight} aria-sort={filters.sort === 'spent' ? 'descending' : undefined}>
                  Total spend
                </th>
                <th scope="col" className={table.th}>Last order</th>
                <th scope="col" className={table.th} aria-sort={filters.sort === 'newest' ? 'descending' : undefined}>
                  Joined
                </th>
                <th scope="col" className={table.th}>Role</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((c) => (
                <tr key={c.id} className={table.row}>
                  <td className={table.td}>
                    <Link href={`/admin/customers/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                      {c.name || c.email}
                    </Link>
                    <p className="max-w-[260px] truncate text-xs text-taupe">{c.name ? c.email : c.phone ?? ''}</p>
                  </td>
                  <td className={table.tdRight}>{formatNumber(c.orders)}</td>
                  <td className={table.tdRight}>{c.spend ? formatMoney(c.spend) : <span className="text-taupe">—</span>}</td>
                  <td className={table.tdMuted}>
                    {c.lastOrderAt ? (
                      <time dateTime={c.lastOrderAt.toISOString()} title={formatDateTime(c.lastOrderAt)} className="whitespace-nowrap">
                        {formatDate(c.lastOrderAt)}
                      </time>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={table.tdMuted}>
                    <time dateTime={c.createdAt.toISOString()} className="whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </time>
                  </td>
                  <td className={table.td}>
                    <StatusBadge status={c.role} label={c.role === 'ADMIN' ? 'Admin' : 'Customer'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <Pagination page={data.page} pageCount={pageCount(data.total, data.pageSize)} total={data.total} pageSize={data.pageSize} basePath="/admin/customers" params={current} noun="customers" />
    </>
  );
}
