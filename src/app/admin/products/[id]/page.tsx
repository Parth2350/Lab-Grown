import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { deleteProduct, duplicateProduct } from '@/lib/server/admin/actions/products';
import { getProductEditorData, getProductEditorOptions } from '@/lib/server/admin/queries/products';
import { readStoreSettings } from '@/lib/server/admin/settings';
import { formatDate, formatRelative } from '@/components/admin/format';
import { ProductActions } from '@/components/admin/products/ProductActions';
import { ProductEditor } from '@/components/admin/products/ProductEditor';
import { ActiveBadge, PageHeader } from '@/components/admin/ui';

type Props = { params: Promise<{ id: string }> };

const validId = (id: string) => /^[a-z0-9]{1,64}$/i.test(id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireAdmin();
  const { id } = await params;
  const p = validId(id) ? await db.product.findUnique({ where: { id }, select: { name: true } }) : null;
  return pageMeta({ title: p ? `Edit ${p.name}` : 'Product not found', path: `/admin/products/${id}`, noIndex: true });
}

export default async function EditProductPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!validId(id)) notFound();
  const [data, options, settings] = await Promise.all([getProductEditorData(id), getProductEditorOptions(), readStoreSettings()]);
  if (!data) notFound();
  const { meta } = data;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        eyebrow={
          <span className="inline-flex items-center gap-2">
            Product <ActiveBadge active={meta.isActive} on="Live" off="Hidden" />
          </span>
        }
        title={meta.name}
        description={
          <>
            <span className="font-mono text-[12px]">{data.draft.sku}</span> · Created {formatDate(meta.createdAt)} · Last saved {formatRelative(meta.updatedAt)}
          </>
        }
        actions={<ProductActions layout="header" id={meta.id} slug={meta.slug} name={meta.name} isActive={meta.isActive} duplicate={duplicateProduct.bind(null, meta.id)} remove={deleteProduct.bind(null, meta.id)} />}
      />
      <ProductEditor key={meta.id} productId={meta.id} initial={data.draft} meta={meta} media={data.media} options={options} lowStock={settings.lowStockThreshold} />
    </>
  );
}
