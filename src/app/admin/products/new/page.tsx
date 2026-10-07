import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { getProductEditorOptions } from '@/lib/server/admin/queries/products';
import { readStoreSettings } from '@/lib/server/admin/settings';
import { ProductEditor } from '@/components/admin/products/ProductEditor';
import { emptyDraft } from '@/components/admin/products/shared';
import { PageHeader } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'New product', path: '/admin/products/new', noIndex: true });

export default async function NewProductPage() {
  await requireAdmin();
  const [options, settings] = await Promise.all([getProductEditorOptions(), readStoreSettings()]);

  return (
    <>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        eyebrow="Catalog"
        title="New product"
        description="Set up the basics, metals and pricing, then save to unlock photo uploads. Variants are created for every metal × purity you offer."
      />
      <ProductEditor productId={null} initial={emptyDraft()} meta={null} media={[]} options={options} lowStock={settings.lowStockThreshold} />
    </>
  );
}
