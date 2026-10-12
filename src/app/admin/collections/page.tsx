import Link from 'next/link';
import { ExternalLink, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { deleteCollection, setCollectionFeatured } from '@/lib/server/admin/actions/collections';
import { listAdminCollections } from '@/lib/server/admin/queries/collections';
import { ButtonLink } from '@/components/ui/Button';
import { ActionButton, ToggleAction } from '@/components/admin/forms';
import { formatNumber, formatRelative } from '@/components/admin/format';
import { Badge, EmptyState, MiniStat, PageHeader, TableWrap, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Collections', path: '/admin/collections', noIndex: true });

const iconBtn = 'inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white hover:text-ink';

export default async function CollectionsPage() {
  await requireAdmin();
  const collections = await listAdminCollections();
  const featured = collections.filter((c) => c.isFeatured).length;
  const empty = collections.filter((c) => c._count.products === 0).length;

  const newButton = (
    <ButtonLink href="/admin/collections/new" size="sm">
      <Plus className="h-4 w-4" strokeWidth={1.5} /> New collection
    </ButtonLink>
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Collections"
        description="Curated groupings that cut across categories — a product can belong to any number of collections. Each collection has a page at /collections/<slug>."
        actions={newButton}
      />

      {collections.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState icon={<Layers className="h-5 w-5" strokeWidth={1.25} />} title="No collections yet" description="Group products into stories like “Art Deco” or “Solitaire”." action={newButton} />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-px border border-line bg-line">
            <div className="bg-white px-5 py-4">
              <MiniStat label="Collections" value={formatNumber(collections.length)} />
            </div>
            <div className="bg-white px-5 py-4">
              <MiniStat label="Featured" value={formatNumber(featured)} />
            </div>
            <div className="bg-white px-5 py-4">
              <MiniStat label="Empty" value={formatNumber(empty)} hint={empty ? 'Show “no products” in the store' : 'All have products'} />
            </div>
          </div>

          <TableWrap>
            <table className={table.base}>
              <thead className={table.head}>
                <tr>
                  <th className={`${table.th} w-14`}>#</th>
                  <th className={table.th}>Collection</th>
                  <th className={table.thRight}>Products</th>
                  <th className={table.th}>Featured</th>
                  <th className={table.th}>SEO</th>
                  <th className={table.th}>Updated</th>
                  <th className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => {
                  const count = c._count.products;
                  const seoComplete = Boolean(c.seoTitle && c.seoDescription);
                  const seoPartial = Boolean(c.seoTitle || c.seoDescription);
                  return (
                    <tr key={c.id} className={table.row}>
                      <td className={table.tdMuted}>{c.position}</td>
                      <td className={table.td}>
                        <Link href={`/admin/collections/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                          {c.name}
                        </Link>
                        <p className="font-mono text-[13.5px] text-taupe">/collections/{c.slug}</p>
                      </td>
                      <td className={table.tdRight}>{count ? formatNumber(count) : <Badge tone="warning">Empty</Badge>}</td>
                      <td className={table.td}>
                        <ToggleAction checked={c.isFeatured} action={setCollectionFeatured.bind(null, c.id)} label={`${c.name} featured`} onLabel="Featured" offLabel="Standard" />
                      </td>
                      <td className={table.td}>
                        <Badge tone={seoComplete ? 'success' : seoPartial ? 'warning' : 'neutral'} dot>
                          {seoComplete ? 'Complete' : seoPartial ? 'Partial' : 'Missing'}
                        </Badge>
                      </td>
                      <td className={table.tdMuted}>
                        <span className="whitespace-nowrap text-xs">{formatRelative(c.updatedAt)}</span>
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-right`}>
                        <a href={`/collections/${c.slug}`} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label={`View ${c.name} in the store (opens in a new tab)`} title="View in store">
                          <ExternalLink className="h-4 w-4" strokeWidth={1.4} />
                        </a>
                        <Link href={`/admin/collections/${c.id}`} className={iconBtn} aria-label={`Edit ${c.name}`} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={1.4} />
                        </Link>
                        <ActionButton
                          variant="icon"
                          title={`Delete ${c.name}`}
                          icon={<Trash2 className="h-4 w-4" strokeWidth={1.4} />}
                          action={deleteCollection.bind(null, c.id)}
                          confirm={{
                            title: `Delete ${c.name}?`,
                            description: count
                              ? `Its ${formatNumber(count)} product${count === 1 ? '' : 's'} will stay in the catalog — only the grouping and its page are removed. This cannot be undone.`
                              : 'The collection page will stop working. This cannot be undone.',
                            confirmLabel: 'Delete',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </>
      )}
    </>
  );
}
