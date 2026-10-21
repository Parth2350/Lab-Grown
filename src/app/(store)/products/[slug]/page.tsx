import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Gem, Hammer, Sparkles } from 'lucide-react';
import { getProductBySlug, getRelated } from '@/lib/server/catalog';
import { db } from '@/lib/server/db';
import { pageMeta, productLd } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Carousel } from '@/components/ui/Carousel';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductExperience } from '@/components/pdp/ProductExperience';
import { packVariants } from '@/lib/variant';
import { Reviews } from '@/components/pdp/Reviews';
import { RecentlyViewed } from '@/components/pdp/RecentlyViewed';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const reviewDistribution = unstable_cache(
  async (productId: string) => {
    const rows = await db.review.groupBy({ by: ['rating'], where: { productId, status: 'APPROVED' }, _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.rating, r._count._all])) as Record<number, number>;
  },
  ['review-distribution'],
  { tags: ['products'], revalidate: 3600 },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return pageMeta({
    title: p.seoTitle ?? p.name,
    description: p.seoDescription ?? p.description,
    path: `/products/${p.slug}`,
    // without a photo, Next injects the generated opengraph-image for this route
    image: p.images.find((i) => i.kind === 'image')?.url,
  });
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [related, distribution] = await Promise.all([getRelated(p.id, 8), reviewDistribution(p.id)]);

  return (
    <>
      <div className="container-x pt-6 md:pt-8">
        <Breadcrumbs
          items={[
            { label: p.category.name, href: `/${p.category.slug}` },
            { label: p.name, href: `/products/${p.slug}` },
          ]}
        />
      </div>
      <section className="container-x mt-6 md:mt-8" aria-label="Product">
        <ProductExperience p={{ ...p, variants: [], stoneSets: [] }} packed={packVariants(p.variants, p.stoneSets)} init={{ metal: one(sp.metal), purity: one(sp.purity), shape: one(sp.shape), carat: one(sp.carat), length: one(sp.length) }} configure={one(sp.configure) === '1'} />
      </section>

      <section className="mt-20 bg-porcelain py-14 md:mt-28" aria-label="Our promise">
        <ul className="container-x grid gap-10 md:grid-cols-3">
          {[
            { icon: Hammer, title: 'Made in our own workshop', text: 'Cast, set and polished by our master jewellers — never outsourced, always inspected under 10× magnification.' },
            { icon: Gem, title: 'Certified lab-grown diamonds', text: 'Physically, chemically and optically identical to mined diamonds, graded independently by IGI or GIA.' },
            { icon: Sparkles, title: 'Cared for, for life', text: 'Lifetime warranty, complimentary cleaning and prong checks, and your first resize on us.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-5">
              <Icon className="mt-1 h-6 w-6 shrink-0 text-gold" strokeWidth={1} />
              <div>
                <p className="font-serif text-xl">{title}</p>
                <p className="mt-2 text-[16px] leading-relaxed text-taupe">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="container-x pt-16 md:pt-24" aria-label="You may also like">
          <SectionHeading eyebrow="Complete the look" title="You May Also Love" action={{ label: `Shop ${p.category.name}`, href: `/${p.category.slug}` }} />
          <Carousel label="Related products">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </Carousel>
        </section>
      )}

      <Reviews productId={p.id} productName={p.name} rating={p.rating} count={p.reviewCount} reviews={p.reviews} distribution={distribution} />
      <RecentlyViewed excludeId={p.id} />
      <JsonLd data={productLd(p)} />
    </>
  );
}
