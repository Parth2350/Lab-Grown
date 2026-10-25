import type { Metadata } from 'next';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { getProductsWhere, getTrending } from '@/lib/server/catalog';
import { getSettings } from '@/lib/server/settings';
import { getCurrency } from '@/lib/server/currency';
import { localizeRupees } from '@/lib/utils';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Hero } from '@/components/home/Hero';
import { ProductRail } from '@/components/home/ProductRail';
import { ShopByCategory } from '@/components/home/ShopByCategory';
import { ShopByShape } from '@/components/home/ShopByShape';
import { BrandStory } from '@/components/home/BrandStory';
import { EditorialRail } from '@/components/home/EditorialRail';
import { LabGrownEducation } from '@/components/home/LabGrownEducation';
import { ProcessStory } from '@/components/home/ProcessStory';
import { Bespoke } from '@/components/home/Bespoke';
import { PartnerProgram } from '@/components/home/PartnerProgram';
import { Testimonials } from '@/components/home/Testimonials';

const homeTitle = `${site.name} — ${site.tagline}`;

export const metadata: Metadata = {
  ...pageMeta({ title: homeTitle, description: site.description, path: '/' }),
  // bypass the "%s | Brand" template from the root layout
  title: { absolute: homeTitle },
};

export const revalidate = 3600;

export default async function HomePage() {
  const [settings, trending, yellowRings, earrings] = await Promise.all([
    getSettings(),
    getTrending(8),
    getProductsWhere({ category: 'engagement-rings', maxPrice: 25000000 }, { metal: ['yellow'] }, 8, 'price-asc'),
    getProductsWhere({ category: 'earrings' }, { style: ['solitaire', 'hoops'] }, 8),
  ]);

  return (
    <>
      <Hero hero={settings.hero} />
      {/* the brand-promise strip runs on the homepage only, directly below the hero film */}
      <AnnouncementBar messages={settings.announcements} />

      <ProductRail eyebrow="Most Loved" title="Trending Now" subtitle="Discover pieces everyone is loving." href="/collections/all" products={trending} />

      <ShopByCategory />

      <ShopByShape />

      <BrandStory />

      <ProductRail
        eyebrow="The Golden Edit"
        title={localizeRupees('Yellow Gold Engagement Rings Under ₹2,50,000', await getCurrency())}
        subtitle="Warm, timeless and thoughtfully priced — certified diamonds set in solid yellow gold."
        href="/engagement-rings?metal=yellow&price=0-250000"
        products={yellowRings}
        className="pb-8 md:pb-12"
      />

      <EditorialRail
        id="earring-edit"
        eyebrow="The Earring Edit"
        title="Diamond Studs & Hoops"
        text="The pieces you reach for every single day — matched solitaire studs and hand-set pavé hoops that move effortlessly from desk to dinner."
        href="/earrings?style=solitaire,hoops"
        cta="Shop Studs & Hoops"
        image={{ src: '/images/home/earring-edit.webp', alt: 'A diamond solitaire stud and a pavé diamond hoop in yellow gold, worn together' }}
        products={earrings}
      />

      <LabGrownEducation />

      <ProcessStory />

      <Bespoke />

      <PartnerProgram />

      <Testimonials />
    </>
  );
}
