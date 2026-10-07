import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { nextCollectionPosition } from '@/lib/server/admin/queries/collections';
import { CollectionForm } from '@/components/admin/collections/CollectionForm';
import { PageHeader } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'New collection', path: '/admin/collections/new', noIndex: true });

export default async function NewCollectionPage() {
  await requireAdmin();
  const nextPosition = await nextCollectionPosition();
  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="New collection"
        description="Create the collection first — you can add products to it on the next screen."
        back={{ href: '/admin/collections', label: 'Collections' }}
      />
      <div className="max-w-3xl">
        <CollectionForm nextPosition={nextPosition} />
      </div>
    </>
  );
}
