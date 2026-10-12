import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, PackageOpen, Trash2, X } from 'lucide-react';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { cn } from '@/lib/utils';
import { deleteCollection, removeProductFromCollection } from '@/lib/server/admin/actions/collections';
import { getAdminCollection } from '@/lib/server/admin/queries/collections';
import { CollectionForm } from '@/components/admin/collections/CollectionForm';
import { CollectionProductPicker } from '@/components/admin/collections/CollectionProductPicker';
import { ProductThumb } from '@/components/admin/collections/ProductThumb';
import { ActionButton } from '@/components/admin/forms';
import { formatDate, formatNumber } from '@/components/admin/format';
import { ActiveBadge, EmptyState, PageHeader, Panel, table } from '@/components/admin/ui';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await db.collection.findUnique({ where: { id }, select: { name: true } });
  return pageMeta({ title: c ? `${c.name} · Collection` : 'Collection', path: `/admin/collections/${id}`, noIndex: true });
}

export default async function CollectionDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const collection = await getAdminCollection(id);
  if (!collection) notFound();

  const count = collection.products.length;
  const activeCount = collection.products.filter((p) => p.isActive).length;

  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title={collection.name}
        description={
          <>
            {formatNumber(count)} product{count === 1 ? '' : 's'}
            {activeCount < count ? ` (${formatNumber(activeCount)} visible)` : ''} · created {formatDate(collection.createdAt)}
          </>
        }
        back={{ href: '/admin/collections', label: 'Collections' }}
        actions={
          <>
            <a
              href={`/collections/${collection.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 border border-line bg-white px-4 text-[13px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              View in store
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <ActionButton
              variant="outline"
              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
              action={deleteCollection.bind(null, collection.id)}
              redirectTo="/admin/collections"
              className="border-danger/60 text-danger hover:border-danger hover:bg-danger hover:text-white"
              confirm={{
                title: `Delete ${collection.name}?`,
                description: count
                  ? `Its ${formatNumber(count)} product${count === 1 ? '' : 's'} will stay in the catalog — only the grouping and its page are removed. This cannot be undone.`
                  : 'The collection page will stop working. This cannot be undone.',
                confirmLabel: 'Delete collection',
              }}
            >
              Delete
            </ActionButton>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <CollectionForm
          collection={{
            id: collection.id,
            slug: collection.slug,
            name: collection.name,
            description: collection.description,
            image: collection.image,
            seoTitle: collection.seoTitle,
            seoDescription: collection.seoDescription,
            position: collection.position,
            isFeatured: collection.isFeatured,
          }}
        />

        <div className="space-y-5">
          <Panel title={`In this collection · ${formatNumber(count)}`} description="Products appear on the collection page in the store’s default sort order." bodyClassName="p-0">
            {count === 0 ? (
              <EmptyState icon={<PackageOpen className="h-5 w-5" strokeWidth={1.25} />} title="No products yet" description="Use the search below to add products to this collection." className="py-10" />
            ) : (
              <div className="max-h-[560px] overflow-auto">
                <table className={cn(table.base, 'min-w-[560px]')}>
                  <thead className={cn(table.head, 'sticky top-0 z-[1] bg-ivory')}>
                    <tr>
                      <th className={table.th}>Product</th>
                      <th className={table.th}>Category</th>
                      <th className={table.th}>Status</th>
                      <th className={table.th}>
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {collection.products.map((p) => (
                      <tr key={p.id} className={table.row}>
                        <td className={cn(table.td, 'py-2')}>
                          <div className="flex items-center gap-3">
                            <ProductThumb product={p} size={44} />
                            <div className="min-w-0">
                              <Link href={`/admin/products/${p.id}`} className="block max-w-[260px] truncate underline-offset-4 hover:underline">
                                {p.name}
                              </Link>
                              <p className="font-mono text-[13.5px] text-taupe">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className={table.tdMuted}>{p.categoryName}</td>
                        <td className={table.td}>
                          <ActiveBadge active={p.isActive} />
                        </td>
                        <td className={cn(table.td, 'text-right')}>
                          <ActionButton
                            variant="text"
                            icon={<X className="h-3.5 w-3.5" strokeWidth={1.5} />}
                            action={removeProductFromCollection.bind(null, collection.id, p.id)}
                            title={`Remove ${p.name} from ${collection.name}`}
                          >
                            Remove
                          </ActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Add products">
            <CollectionProductPicker collectionId={collection.id} collectionName={collection.name} memberCount={count} />
          </Panel>
        </div>
      </div>
    </>
  );
}
