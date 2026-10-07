import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollection, listProducts } from '@/lib/server/catalog';
import { parseFilters, type Scope } from '@/lib/filters';
import { pageMeta } from '@/lib/seo';
import { SHAPES } from '@/lib/catalog';
import { VIRTUAL_COLLECTIONS } from '@/config/navigation';
import { CollectionView } from '@/components/collection/CollectionView';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

type Resolved = {
  title: string;
  description: string | null;
  scope: Scope;
  apiScope: Record<string, string>;
  eyebrow: string;
  canonical: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

async function resolve(slug: string): Promise<Resolved | null> {
  const virtual = VIRTUAL_COLLECTIONS[slug];
  if (virtual) {
    return {
      title: virtual.title,
      description: virtual.description,
      scope: { maxPrice: virtual.maxPrice, minPrice: virtual.minPrice },
      apiScope: { collectionSlug: slug },
      eyebrow: slug.startsWith('gifts') ? 'Gifts' : 'Collection',
      canonical: `/collections/${slug}`,
    };
  }
  const c = await getCollection(slug);
  if (c) {
    return {
      title: c.name,
      description: c.description,
      scope: { collection: c.slug },
      apiScope: { collectionSlug: c.slug },
      eyebrow: slug.endsWith('gifts') || slug.includes('personalized') ? 'Gifts' : 'Collection',
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
      canonical: `/collections/${slug}`,
    };
  }
  const shape = SHAPES.find((s) => s.slug === slug);
  if (shape) {
    return {
      title: `${shape.label} Collection`,
      description: `${shape.blurb} Explore every ${shape.label.toLowerCase()} lab-grown diamond design — engagement rings, bands, earrings, pendants and more.`,
      scope: { shape: shape.slug },
      apiScope: { shapeSlug: shape.slug },
      eyebrow: 'Shop by Shape',
      canonical: `/collections/shape/${shape.slug}`,
    };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return {};
  return pageMeta({ title: r.seoTitle ?? r.title, description: r.seoDescription ?? r.description, path: r.canonical });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const r = await resolve(slug);
  if (!r) notFound();
  const filters = parseFilters(sp);
  const listing = await listProducts(r.scope, filters, 24, { cumulative: true });
  return (
    <CollectionView
      title={r.title}
      eyebrow={r.eyebrow}
      description={r.description}
      crumbs={[
        { label: 'Collections', href: '/collections/all' },
        { label: r.title, href: `/collections/${slug}` },
      ]}
      basePath={`/collections/${slug}`}
      scope={r.scope}
      apiScope={r.apiScope}
      filters={filters}
      listing={listing}
      showShapes
    />
  );
}
