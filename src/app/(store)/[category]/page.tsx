import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategory, listProducts } from '@/lib/server/catalog';
import { parseFilters } from '@/lib/filters';
import { pageMeta } from '@/lib/seo';
import { CollectionView } from '@/components/collection/CollectionView';

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const SHAPE_STRIP = new Set(['engagement-rings', 'wedding-bands', 'rings', 'earrings', 'pendants']);

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
  const listing = await listProducts({ category: c.slug }, filters, 24, { cumulative: true });
  return (
    <CollectionView
      title={c.name}
      eyebrow="Lab-Grown Diamond"
      description={c.description}
      crumbs={[{ label: c.name, href: `/${c.slug}` }]}
      basePath={`/${c.slug}`}
      scope={{ category: c.slug }}
      apiScope={{ category: c.slug }}
      filters={filters}
      listing={listing}
      showShapes={SHAPE_STRIP.has(c.slug)}
    />
  );
}
