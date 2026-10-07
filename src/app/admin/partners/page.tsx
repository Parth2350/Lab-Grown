import Link from 'next/link';
import { ChevronRight, Handshake, Search } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, paging, sp, spEnum, type SearchParams } from '@/lib/server/admin/list';
import { listPartnerApplications, PARTNER_TABS, type PartnerTab } from '@/lib/server/admin/queries/partners';
import { formatDate, formatRelative } from '@/components/admin/format';
import { Button } from '@/components/ui/Button';
import { EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, StatusBadge, TableWrap, Tabs, fieldSm, table, withParams } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Partner applications', path: '/admin/partners', noIndex: true });

const PAGE_SIZE = 25;

const TAB_LABEL: Record<PartnerTab, string> = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', all: 'All' };

const EMPTY: Record<PartnerTab, { title: string; description: string }> = {
  PENDING: { title: 'All caught up', description: 'No applications are waiting for a decision.' },
  APPROVED: { title: 'No approved partners yet', description: 'Applications you approve will be listed here.' },
  REJECTED: { title: 'No rejected applications', description: 'Applications you decline are kept here for reference.' },
  all: { title: 'No applications yet', description: 'Applications submitted through the Partner page will appear here.' },
};

export default async function PartnersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = spEnum(params, 'status', PARTNER_TABS, 'PENDING');
  const q = sp(params, 'q').slice(0, 100);
  const { page, pageSize, skip, take } = paging(params, PAGE_SIZE);

  const { rows, counts, total } = await listPartnerApplications({ status, q, skip, take });
  const current = cleanParams(params);
  const clearHref = status === 'PENDING' ? '/admin/partners' : `/admin/partners?status=${status}`;

  return (
    <>
      <PageHeader title="Partner applications" description="Creators, stylists and planners applying to the partner programme. Review each application and approve or decline it." />

      <Tabs tabs={PARTNER_TABS.map((t) => ({ value: t, label: TAB_LABEL[t], count: counts[t] }))} active={status} basePath="/admin/partners" params={current} />

      <FilterBar action="/admin/partners">
        <input type="hidden" name="status" value={status} />
        <div className="w-full sm:w-72">
          <FilterLabel htmlFor="partners-q">Search</FilterLabel>
          <input id="partners-q" type="search" name="q" defaultValue={q} maxLength={100} placeholder="Name, email, company or country" className={fieldSm} />
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
                <Link href={withParams('/admin/partners', current, {})} className="text-xs text-ink underline underline-offset-4">
                  Go to the first page
                </Link>
              }
            />
          ) : q ? (
            <EmptyState icon={<Search className="h-5 w-5" strokeWidth={1.25} />} title="No applications match" description={`Nothing matches “${q}”.`} />
          ) : (
            <EmptyState
              icon={<Handshake className="h-5 w-5" strokeWidth={1.25} />}
              title={EMPTY[status].title}
              description={EMPTY[status].description}
              action={
                status !== 'all' && counts.all > 0 ? (
                  <Link href="/admin/partners?status=all" className="text-xs text-ink underline underline-offset-4">
                    View all applications
                  </Link>
                ) : undefined
              }
            />
          )}
        </div>
      ) : (
        <TableWrap>
          <table className={table.base}>
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Received</th>
                <th className={table.th}>Applicant</th>
                <th className={table.th}>Country</th>
                <th className={table.th}>Company / handle</th>
                <th className={table.th}>Audience</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const href = `/admin/partners/${r.id}`;
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
                      <p className="max-w-[240px] truncate text-xs text-taupe">{r.email}</p>
                    </td>
                    <td className={table.td}>{r.country}</td>
                    <td className={table.td}>
                      {r.company || r.socialHandle ? (
                        <>
                          {r.company && <p className="max-w-[220px] truncate">{r.company}</p>}
                          {r.socialHandle && <p className="max-w-[220px] truncate text-xs text-taupe">{r.socialHandle}</p>}
                        </>
                      ) : (
                        <span className="text-taupe">—</span>
                      )}
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>{r.audienceSize ?? <span className="text-taupe">—</span>}</td>
                    <td className={table.td}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={`${table.td} text-right`}>
                      <Link href={href} aria-label={`Open ${r.name}’s application`} className="inline-flex h-8 w-8 items-center justify-center text-taupe transition-colors hover:bg-white hover:text-ink">
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

      <Pagination page={page} pageCount={pageCount(total, pageSize)} total={total} pageSize={pageSize} basePath="/admin/partners" params={current} noun="applications" />
    </>
  );
}
