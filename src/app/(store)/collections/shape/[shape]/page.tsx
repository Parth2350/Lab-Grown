import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listProducts, LISTING_PAGE_SIZE } from '@/lib/server/catalog';
import { parseFilters } from '@/lib/filters';
import { pageMeta } from '@/lib/seo';
import { SHAPES } from '@/lib/catalog';
import { CollectionView } from '@/components/collection/CollectionView';
import { LooseDiamond } from '@/components/art/JewelryArt';

type Props = { params: Promise<{ shape: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shape } = await params;
  const s = SHAPES.find((x) => x.slug === shape);
  if (!s) return {};
  return pageMeta({
    title: `${s.label} Lab-Grown Diamond Jewelry`,
    description: `${s.blurb} Shop ${s.label.toLowerCase()} lab-grown diamond engagement rings, wedding bands, earrings and pendants — IGI & GIA certified.`,
    path: `/collections/shape/${s.slug}`,
  });
}

export default async function ShapePage({ params, searchParams }: Props) {
  const [{ shape }, sp] = await Promise.all([params, searchParams]);
  const s = SHAPES.find((x) => x.slug === shape);
  if (!s) notFound();
  const filters = parseFilters(sp);
  const listing = await listProducts({ shape: s.slug }, filters, LISTING_PAGE_SIZE, { cumulative: true });
  return (
    <CollectionView
      title={`${s.label} Diamonds`}
      eyebrow="Shop by Shape"
      description={`${s.blurb} Every ${s.label.toLowerCase()} design is set with a certified lab-grown diamond and finished by hand in our workshop.`}
      crumbs={[
        { label: 'Shapes', href: '/collections/all' },
        { label: s.label, href: `/collections/shape/${s.slug}` },
      ]}
      basePath={`/collections/shape/${s.slug}`}
      scope={{ shape: s.slug }}
      apiScope={{ shapeSlug: s.slug }}
      filters={filters}
      listing={listing}
      aside={
        <div className="art-tile hidden h-40 w-40 lg:block">
          <LooseDiamond shape={s.slug} className="h-full w-full" title={`${s.label} cut diamond`} />
        </div>
      }
    />
  );
}
