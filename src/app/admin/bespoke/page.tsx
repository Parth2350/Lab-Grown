import Link from 'next/link';
import { ChevronRight, ImageIcon, Search, Sparkles } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, paging, sp, spEnum, type SearchParams } from '@/lib/server/admin/list';
import { listBespokeRequests } from '@/lib/server/admin/queries/bespoke';
import { BESPOKE_STATUSES, BESPOKE_STATUS_LABEL } from '@/components/admin/bespoke/status';
import { formatDate, formatRelative } from '@/components/admin/format';
import { Button } from '@/components/ui/Button';
import { EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, StatusBadge, TableWrap, Tabs, fieldSm, table, withParams } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Bespoke requests', path: '/admin/bespoke', noIndex: true });

const PAGE_SIZE = 25;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function BespokeRequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = spEnum(params, 'status', BESPOKE_STATUSES);
  const q = sp(params, 'q').slice(0, 100);
  const { page, pageSize, skip, take } = paging(params, PAGE_SIZE);

  const { rows, counts, all, total } = await listBespokeRequests({ status, q, skip, take });
  const current = cleanParams(params);
  const tabs = [{ value: '', label: 'All', count: all }, ...BESPOKE_STATUSES.map((s) => ({ value: s, label: s === 'CLOSED' ? 'Closed' : BESPOKE_STATUS_LABEL[s], count: counts.get(s) ?? 0 }))];
  const clearHref = status ? `/admin/bespoke?status=${status}` : '/admin/bespoke';

  return (
    <>
      <PageHeader title="Bespoke requests" description="Custom commissions submitted through the Bespoke page. Move each request through the pipeline from first review to completion." />

      <Tabs tabs={tabs} active={status ?? ''} basePath="/admin/bespoke" params={current} />

      <FilterBar action="/admin/bespoke">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="w-full sm:w-72">
          <FilterLabel htmlFor="bespoke-q">Search</FilterLabel>
          <input id="bespoke-q" type="search" name="q" defaultValue={q} maxLength={100} placeholder="Name, email or jewelry type" className={fieldSm} />
        </div>
        <Button type="submit" size="sm" variant="outline">
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          Search
        </Button>
        {q && (
          <Link href={clearHref} className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
            Clear search
          </Link>
        )}
      </FilterBar>

      {rows.length === 0 ? (
        <div className="border border-line bg-white">
          {total > 0 ? (
            <EmptyState
              title="Nothing on this page"
              description="This page is past the end of the list."
              action={
                <Link href={withParams('/admin/bespoke', current, {})} className="text-xs text-ink underline underline-offset-4">
                  Go to the first page
                </Link>
              }
            />
          ) : q ? (
            <EmptyState icon={<Search className="h-5 w-5" strokeWidth={1.25} />} title="No requests match" description={`Nothing matches “${q}”. Try a name, email address or jewelry type.`} />
          ) : (
            <EmptyState
              icon={<Sparkles className="h-5 w-5" strokeWidth={1.25} />}
              title={status ? `No ${BESPOKE_STATUS_LABEL[status].toLowerCase()} requests` : 'No bespoke requests yet'}
              description={status ? 'Requests move here as you update their status.' : 'Requests submitted through the Bespoke page will appear here.'}
            />
          )}
        </div>
      ) : (
        <TableWrap>
          <table className={table.base}>
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Received</th>
                <th className={table.th}>Client</th>
                <th className={table.th}>Piece</th>
                <th className={table.th}>Shape · Carat · Metal</th>
                <th className={table.th}>Budget</th>
                <th className={table.th}>
                  <span className="sr-only">Inspiration images</span>
                  <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </th>
                <th className={table.th}>Status</th>
                <th className={table.th}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const href = `/admin/bespoke/${r.id}`;
                const specs = [r.shape && capitalize(r.shape), r.carat, r.metal].filter(Boolean);
                return (
                  <tr key={r.id} className={table.row}>
                    <td className={`${table.td} whitespace-nowrap`}>
                      <p>{formatDate(r.createdAt)}</p>
                      <p className="text-xs text-taupe">{formatRelative(r.createdAt)}</p>
                    </td>
                    <td className={table.td}>
                      <Link href={href} className="font-medium text-ink underline-offset-4 hover:underline">
                        {r.name}
                      </Link>
                      <p className="max-w-[220px] truncate text-xs text-taupe">{r.email}</p>
                    </td>
                    <td className={table.td}>{r.jewelryType}</td>
                    <td className={table.td}>
                      {specs.length ? specs.join(' · ') : <span className="text-taupe">—</span>}
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>{r.budget ?? <span className="text-taupe">—</span>}</td>
                    <td className={table.tdMuted}>
                      {r.inspirationUrls.length ? (
                        <span className="inline-flex items-center gap-1 text-charcoal" title={`${r.inspirationUrls.length} inspiration image${r.inspirationUrls.length === 1 ? '' : 's'}`}>
                          <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                          {r.inspirationUrls.length}
                          <span className="sr-only"> inspiration images</span>
                        </span>
                      ) : (
                        <span aria-label="No inspiration images">—</span>
                      )}
                    </td>
                    <td className={table.td}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={`${table.td} text-right`}>
                      <Link href={href} aria-label={`Open ${r.name}’s request`} className="inline-flex h-8 w-8 items-center justify-center text-taupe transition-colors hover:bg-white hover:text-ink">
                        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}

      <Pagination page={page} pageCount={pageCount(total, pageSize)} total={total} pageSize={pageSize} basePath="/admin/bespoke" params={current} noun="requests" />
    </>
  );
}
