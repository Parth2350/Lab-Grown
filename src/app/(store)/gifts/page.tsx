import Link from 'next/link';
import { ArrowRight, Gift, PenLine, RefreshCcw, ShieldCheck } from 'lucide-react';
import { VIRTUAL_COLLECTIONS } from '@/config/navigation';
import { site } from '@/config/site';
import { countProducts, getProductsWhere } from '@/lib/server/catalog';
import { pageMeta } from '@/lib/seo';
import { localizeRupees, pluralize } from '@/lib/utils';
import { getCurrency } from '@/lib/server/currency';
import type { ProductCard as Card } from '@/lib/types';
import { type ArtSpec } from '@/components/art/JewelryArt';
import { LazyJewelryArt } from '@/components/art/LazyArt';
import { ProductCard } from '@/components/product/ProductCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { Reveal } from '@/components/ui/Reveal';
import { QUIZ_TYPE_ART } from '@/components/content/art-presets';

export const revalidate = 3600;

export const metadata = pageMeta({
  title: 'Gift Guide',
  description: `Natural and lab-grown diamond gifts for every occasion and budget — under ₹25,000, ₹50,000 and ₹1,00,000, plus anniversary, birthday, wedding and personalised jewelry. Beautifully wrapped by ${site.name}.`,
  path: '/gifts',
});

type Tile = { slug: string; title: string; blurb: string; art: { spec: ArtSpec; shape: string; metal: string; carat?: number }; tone: string; scope: { maxPrice?: number; collection?: string } };

const vc = (slug: string) => VIRTUAL_COLLECTIONS[slug]!;

const PRICE_TILES: Tile[] = [
  {
    slug: 'gifts-under-25000',
    title: vc('gifts-under-25000').title,
    blurb: 'Petite studs, dainty pendants and stacking rings.',
    art: { spec: { kind: 'studs', head: 'bezel' }, shape: 'round', metal: 'yellow', carat: 0.5 },
    tone: 'art-tile-warm',
    scope: { maxPrice: vc('gifts-under-25000').maxPrice },
  },
  {
    slug: 'gifts-under-50000',
    title: vc('gifts-under-50000').title,
    blurb: 'Solitaire pendants, huggies and halo studs.',
    art: { spec: { kind: 'pendant', head: 'solitaire' }, shape: 'pear', metal: 'rose', carat: 0.75 },
    tone: 'art-tile',
    scope: { maxPrice: vc('gifts-under-50000').maxPrice },
  },
  {
    slug: 'gifts-under-100000',
    title: vc('gifts-under-100000').title,
    blurb: 'Hoops, eternity bands and statement drops.',
    art: { spec: { kind: 'hoops', size: 'medium' }, shape: 'round', metal: 'white' },
    tone: 'art-tile-cool',
    scope: { maxPrice: vc('gifts-under-100000').maxPrice },
  },
];

const OCCASION_TILES: Tile[] = [
  {
    slug: 'anniversary-gifts',
    title: 'Anniversary Gifts',
    blurb: 'Eternity bands and three-stone pieces for every year together.',
    art: { spec: { kind: 'band', stones: 'full', stoneShape: 'round' }, shape: 'round', metal: 'yellow' },
    tone: 'art-tile-warm',
    scope: { collection: 'anniversary-gifts' },
  },
  {
    slug: 'birthday-gifts',
    title: 'Birthday Gifts',
    blurb: 'Sparkle they will reach for every single day.',
    art: { spec: { kind: 'studs', head: 'halo' }, shape: 'round', metal: 'rose' },
    tone: 'art-tile',
    scope: { collection: 'birthday-gifts' },
  },
  {
    slug: 'wedding-gifts',
    title: 'Wedding Gifts',
    blurb: 'For the couple, the bride and the bridal party.',
    art: { spec: { kind: 'pendant', head: 'three-stone' }, shape: 'round', metal: 'white' },
    tone: 'art-tile-cool',
    scope: { collection: 'wedding-gifts' },
  },
  {
    slug: 'bridal-gifts',
    title: 'Bridal Gifts',
    blurb: 'Something new to wear down the aisle — and long after.',
    art: { spec: { kind: 'drops', head: 'halo' }, shape: 'pear', metal: 'white' },
    tone: 'art-tile',
    scope: { collection: 'bridal-gifts' },
  },
  {
    slug: 'personalized-jewelry',
    title: 'Personalized Jewelry',
    blurb: 'Engravable pieces for initials, dates and secret messages.',
    art: { spec: { kind: 'signet' }, shape: 'round', metal: 'yellow' },
    tone: 'art-tile-warm',
    scope: { collection: 'personalized-jewelry' },
  },
];

const SERVICES = [
  { icon: Gift, t: 'Complimentary gift wrapping', d: 'Every piece arrives in our signature box, ribboned and ready to give.' },
  { icon: PenLine, t: 'A handwritten note', d: 'Share your message when you order on WhatsApp and we will write it by hand.' },
  { icon: ShieldCheck, t: 'Insured, discreet delivery', d: 'Fully insured and shipped in plain outer packaging — no spoilers.' },
  { icon: RefreshCcw, t: 'Easy exchanges', d: 'Wrong size or style? Exchange within 30 days, with free insured returns.' },
];

function CategoryTile({ tile, count, priority, tall }: { tile: Tile; count: number; priority?: boolean; tall?: boolean }) {
  return (
    <Link href={`/collections/${tile.slug}`} className="group block" prefetch={priority ? true : undefined}>
      <div className={`${tile.tone} relative overflow-hidden ${tall ? 'aspect-[4/3] sm:aspect-[4/5]' : 'aspect-square'}`}>
        <div className="absolute inset-0 p-8 transition-transform duration-700 ease-luxe group-hover:scale-[1.04] sm:p-10">
          <LazyJewelryArt spec={tile.art.spec} shape={tile.art.shape} metal={tile.art.metal} carat={tile.art.carat ?? 1} className="block h-full w-full" title={tile.title} />
        </div>
        <span className="absolute left-4 top-4 bg-ivory/90 px-2.5 py-1 text-[12px] uppercase tracking-[0.16em] text-charcoal">{pluralize(count, 'piece')}</span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-[1.45rem] leading-tight">{tile.title}</h3>
          <p className="mt-1 text-[15.5px] leading-snug text-taupe">{tile.blurb}</p>
        </div>
        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-ink transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.25} aria-hidden />
      </div>
    </Link>
  );
}

function ProductRail({ id, eyebrow, title, subtitle, products, href }: { id: string; eyebrow: string; title: string; subtitle: string; products: Card[]; href: string }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={`${id}-title`} className="container-x py-12 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 id={`${id}-title`} className="h-section">
            {title}
          </h2>
          <p className="mt-3 text-[17px] text-taupe">{subtitle}</p>
        </div>
        <Link href={href} className="label-caps group inline-flex min-h-10 shrink-0 items-center gap-2 text-ink">
          <span className="link-underline pb-0.5">Shop all</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
        </Link>
      </div>
      <Carousel label={title}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Carousel>
    </section>
  );
}

export default async function GiftsPage() {
  const tiles = [...PRICE_TILES, ...OCCASION_TILES];
  const [counts, under500, anniversary, everyday, currency] = await Promise.all([
    Promise.all(tiles.map((t) => countProducts(t.scope))),
    getProductsWhere({ maxPrice: 5000000 }, {}, 10, 'featured'),
    getProductsWhere({ collection: 'anniversary-gifts' }, {}, 10, 'featured'),
    getProductsWhere({ maxPrice: 10000000 }, { style: ['stud', 'hoop', 'drop', 'layering'] }, 10, 'featured'),
    getCurrency(),
  ]);
  const countFor = (slug: string) => counts[tiles.findIndex((t) => t.slug === slug)] ?? 0;
  const quizArt = QUIZ_TYPE_ART.earrings!;

  return (
    <>
      {/* ───────── hero ───────── */}
      <section className="container-x pb-12 pt-8 md:pb-16 md:pt-12">
        <Breadcrumbs items={[{ label: 'Gifts', href: '/gifts' }]} />
        <div className="mt-10 grid items-end gap-8 md:mt-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">The Gift Guide</p>
            <h1 className="h-display text-balance">Gifts they will treasure for a lifetime</h1>
          </div>
          <div className="lg:col-span-5 lg:pb-3">
            <p className="max-w-md text-[18px] leading-relaxed text-taupe">
              Certified natural and lab-grown diamonds in solid gold, beautifully wrapped and delivered fully insured. Find the perfect piece by budget or by occasion.
            </p>
            <Link href="/find-your-match" className="label-caps group mt-6 inline-flex min-h-10 items-center gap-2 text-ink">
              <span className="link-underline pb-0.5">Not sure? Take the gift quiz</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── by price ───────── */}
      <section aria-labelledby="by-price-title" className="container-x pb-16 md:pb-24">
        <h2 id="by-price-title" className="eyebrow font-sans mb-6 border-t border-line pt-6">
          Shop by budget
        </h2>
        <ul className="grid gap-x-4 gap-y-10 sm:grid-cols-3 lg:gap-x-6">
          {PRICE_TILES.map((t, i) => (
            <li key={t.slug}>
              <Reveal delay={i * 0.08}>
                <CategoryTile tile={{ ...t, title: localizeRupees(t.title, currency) }} count={countFor(t.slug)} tall priority />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── by occasion ───────── */}
      <section aria-labelledby="by-occasion-title" className="bg-porcelain py-16 md:py-24">
        <div className="container-x">
          <div className="mb-10 max-w-2xl md:mb-12">
            <p className="eyebrow mb-3">Shop by occasion</p>
            <h2 id="by-occasion-title" className="h-section">
              For every moment worth marking
            </h2>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-5">
            {OCCASION_TILES.map((t, i) => (
              <li key={t.slug}>
                <Reveal delay={i * 0.06}>
                  <CategoryTile tile={t} count={countFor(t.slug)} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProductRail
        id="under-500"
        eyebrow="Most gifted"
        title={localizeRupees('Favourites under ₹50,000', currency)}
        subtitle="Small in price, never in meaning."
        products={under500}
        href="/collections/gifts-under-50000"
      />
      <ProductRail
        id="anniversary"
        eyebrow="Celebrate together"
        title="Anniversary icons"
        subtitle="Pieces that say “still you, always you”."
        products={anniversary}
        href="/collections/anniversary-gifts"
      />
      <ProductRail
        id="everyday"
        eyebrow="Everyday sparkle"
        title="Studs, hoops & layers"
        subtitle="Easy to choose, impossible to take off."
        products={everyday}
        href="/earrings"
      />

      {/* ───────── services ───────── */}
      <section aria-labelledby="services-title" className="mt-8 border-y border-line bg-white">
        <div className="container-x py-14 md:py-16">
          <h2 id="services-title" className="eyebrow font-sans mb-10 text-center">
            {site.name} gifting service
          </h2>
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex flex-col items-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-gold">
                  <Icon className="h-5 w-5" strokeWidth={1} aria-hidden />
                </span>
                <h3 className="mt-5 font-serif text-xl">{t}</h3>
                <p className="mt-2 max-w-[260px] text-[16px] leading-relaxed text-taupe">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── quiz ───────── */}
      <section aria-labelledby="gift-quiz-title" className="container-x py-16 md:py-24">
        <div className="grid overflow-hidden border border-line bg-white md:grid-cols-2">
          <div className="art-tile-warm relative aspect-[4/3] md:aspect-auto md:min-h-[380px]">
            <div className="absolute inset-0 p-10 sm:p-14">
              <LazyJewelryArt spec={quizArt.spec} shape={quizArt.shape} metal="rose" className="block h-full w-full" title="Diamond hoop earrings" />
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="eyebrow mb-4">Find Your Match</p>
            <h2 id="gift-quiz-title" className="h-section text-balance">
              Not sure what they would love?
            </h2>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-taupe">
              Answer a few quick questions about them — their style, the occasion and your budget — and we will curate a short edit of perfect gifts.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/find-your-match" size="lg">
                Take the Quiz
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline" size="lg">
                Ask a Concierge
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
