import type { Metadata } from 'next';
import { listProducts } from '@/lib/server/catalog';
import { parseFilters } from '@/lib/filters';
import { pageMeta } from '@/lib/seo';
import { CollectionView } from '@/components/collection/CollectionView';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const term = Array.isArray(q) ? q[0] : q;
  return pageMeta({
    title: term ? `Search: ${term}` : 'Search',
    description: 'Search lab-grown diamond jewelry by shape, style, carat weight or SKU.',
    path: '/search',
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const listing = await listProducts({}, filters, 24, { cumulative: true });
  return (
    <CollectionView
      title={filters.q ? `“${filters.q}”` : 'Search our jewelry'}
      eyebrow={filters.q ? 'Search results' : 'Search'}
      description={
        filters.q
          ? 'Smart search understands carat weights, shapes, styles and SKUs — refine further with the filters below.'
          : 'Search by shape, style, carat weight or SKU.'
      }
      crumbs={[{ label: 'Search', href: '/search' }]}
      basePath="/search"
      scope={{}}
      apiScope={{}}
      filters={filters}
      listing={listing}
      showShapes
    />
  );
}
