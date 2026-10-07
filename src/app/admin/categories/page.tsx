import Link from 'next/link';
import { ExternalLink, FolderTree, Trash2 } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { deleteCategory, setCategoryActive } from '@/lib/server/admin/actions/categories';
import { listAdminCategories } from '@/lib/server/admin/queries/categories';
import { CategoryEditor, type CategoryFormValues } from '@/components/admin/categories/CategoryEditor';
import { ActionButton, ToggleAction } from '@/components/admin/forms';
import { formatNumber, formatRelative } from '@/components/admin/format';
import { Badge, EmptyState, MiniStat, PageHeader, TableWrap, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Categories', path: '/admin/categories', noIndex: true });

function seoState(c: { seoTitle: string | null; seoDescription: string | null }) {
  if (c.seoTitle && c.seoDescription) return { label: 'Complete', tone: 'success' as const, title: 'SEO title and meta description are set' };
  if (c.seoTitle || c.seoDescription) return { label: c.seoTitle ? 'Title only' : 'Description only', tone: 'warning' as const, title: 'Add both an SEO title and a meta description' };
  return { label: 'Missing', tone: 'neutral' as const, title: 'Falls back to the category name and description' };
}

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listAdminCategories();
  const nextPosition = categories.length ? Math.max(...categories.map((c) => c.position)) + 1 : 0;
  const activeCount = categories.filter((c) => c.isActive).length;
  const productTotal = categories.reduce((s, c) => s + c.productCount, 0);
  const hiddenProducts = categories.filter((c) => !c.isActive).reduce((s, c) => s + c.productCount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="The top-level departments of the store. Each category has its own page at /<slug> and drives navigation, filters and breadcrumbs. Deactivating a category hides it — and every product in it — from the storefront."
        actions={<CategoryEditor nextPosition={nextPosition} />}
      />

      {categories.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<FolderTree className="h-5 w-5" strokeWidth={1.25} />}
            title="No categories yet"
            description="Create a category before adding products — every product belongs to exactly one."
            action={<CategoryEditor nextPosition={0} />}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            <div className="bg-white px-5 py-4">
              <MiniStat label="Categories" value={formatNumber(categories.length)} />
            </div>
            <div className="bg-white px-5 py-4">
              <MiniStat label="Active" value={formatNumber(activeCount)} hint={activeCount < categories.length ? `${categories.length - activeCount} hidden` : 'All visible'} />
            </div>
            <div className="bg-white px-5 py-4">
              <MiniStat label="Products" value={formatNumber(productTotal)} />
            </div>
            <div className="bg-white px-5 py-4">
              <MiniStat label="Hidden by category" value={formatNumber(hiddenProducts)} hint="Products in inactive categories" />
            </div>
          </div>

          <TableWrap>
            <table className={table.base}>
              <thead className={table.head}>
                <tr>
                  <th className={`${table.th} w-14`}>#</th>
                  <th className={table.th}>Category</th>
                  <th className={table.thRight}>Products</th>
                  <th className={table.th}>In store</th>
                  <th className={table.th}>SEO</th>
                  <th className={table.th}>Updated</th>
                  <th className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const seo = seoState(c);
                  const values: CategoryFormValues = {
                    id: c.id,
                    slug: c.slug,
                    name: c.name,
                    description: c.description,
                    image: c.image,
                    seoTitle: c.seoTitle,
                    seoDescription: c.seoDescription,
                    position: c.position,
                    isActive: c.isActive,
                  };
                  return (
                    <tr key={c.id} className={table.row}>
                      <td className={table.tdMuted}>{c.position}</td>
                      <td className={table.td}>
                        <p className="font-medium">{c.name}</p>
                        <p className="font-mono text-[11.5px] text-taupe">/{c.slug}</p>
                      </td>
                      <td className={table.tdRight}>
                        <p>{formatNumber(c.productCount)}</p>
                        {c.productCount > 0 && (
                          <Link href={`/admin/products?category=${encodeURIComponent(c.slug)}`} className="text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
                            {c.activeProductCount < c.productCount ? `${formatNumber(c.activeProductCount)} active · ` : ''}View products
                          </Link>
                        )}
                      </td>
                      <td className={table.td}>
                        <ToggleAction checked={c.isActive} action={setCategoryActive.bind(null, c.id)} label={`${c.name} visible in store`} onLabel="Visible" offLabel="Hidden" />
                      </td>
                      <td className={table.td}>
                        <Badge tone={seo.tone} dot title={seo.title}>
                          {seo.label}
                        </Badge>
                      </td>
                      <td className={table.tdMuted}>
                        <span className="whitespace-nowrap text-xs">{formatRelative(c.updatedAt)}</span>
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-right`}>
                        {c.isActive && (
                          <a
                            href={`/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white hover:text-ink"
                            aria-label={`View ${c.name} in the store (opens in a new tab)`}
                            title="View in store"
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.4} />
                          </a>
                        )}
                        <CategoryEditor category={values} />
                        <ActionButton
                          variant="icon"
                          title={`Delete ${c.name}`}
                          icon={<Trash2 className="h-4 w-4" strokeWidth={1.4} />}
                          action={deleteCategory.bind(null, c.id)}
                          confirm={
                            c.productCount === 0
                              ? {
                                  title: `Delete ${c.name}?`,
                                  description: 'The category page will stop working and any links to it will 404. This cannot be undone.',
                                  confirmLabel: 'Delete',
                                }
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          <p className="mt-3 text-xs text-taupe">Categories with products can’t be deleted — move or delete their products first, or deactivate the category instead.</p>
        </>
      )}
    </>
  );
}
