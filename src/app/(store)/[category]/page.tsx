import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategory, listProducts, LISTING_PAGE_SIZE } from '@/lib/server/catalog';
import { parseFilters } from '@/lib/filters';
import { pageMeta } from '@/lib/seo';
import { CollectionView } from '@/components/collection/CollectionView';

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = await getCategory(category);
  if (!c) return {};
  return pageMeta({
    title: c.seoTitle ?? c.name,
    description: c.seoDescription ?? c.description,
    path: `/${c.slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const c = await getCategory(category);
  if (!c) notFound();
  const filters = parseFilters(sp);
  const listing = await listProducts({ category: c.slug }, filters, LISTING_PAGE_SIZE, { cumulative: true });
  return (
    <CollectionView
      title={c.name}
      description={c.description}
      crumbs={[{ label: c.name, href: `/${c.slug}` }]}
      basePath={`/${c.slug}`}
      scope={{ category: c.slug }}
      apiScope={{ category: c.slug }}
      filters={filters}
      listing={listing}
      category={c.name}
    />
  );
}
