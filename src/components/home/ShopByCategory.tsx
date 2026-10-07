import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ArtSpec } from '@/components/art/JewelryArt';
import { Reveal } from '@/components/ui/Reveal';
import { countProducts } from '@/lib/server/catalog';
import { filtersToSearch, type Filters, type Scope } from '@/lib/filters';
import { cn, pluralize } from '@/lib/utils';
import { LazyJewelryArt } from '@/components/art/LazyArt';

type Tile = {
  title: string;
  /** Category landing route (scope.category) or explicit path for collections */
  path: string;
  scope: Scope;
  filters?: Partial<Filters>;
  art: ArtSpec;
  shape: string;
  metal: string;
  carat?: number;
  view?: number;
  tint: 'art-tile' | 'art-tile-warm' | 'art-tile-cool';
  layout?: 'feature' | 'wide';
  blurb?: string;
};

/** Links and counts are derived from the same scope + filters, so they can never disagree. */
const TILES: Tile[] = [
  {
    title: 'Oval Engagement Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { shape: ['oval'] },
    art: { kind: 'ring', head: 'hidden-halo', band: 'pave' },
    shape: 'oval',
    metal: 'yellow',
    carat: 2.2,
    tint: 'art-tile-warm',
    layout: 'feature',
    blurb: 'Our most-requested silhouette — elongated, luminous and endlessly flattering on the hand.',
  },
  {
    title: 'Eternity Wedding Bands',
    path: '/wedding-bands',
    scope: { category: 'wedding-bands' },
    filters: { style: ['eternity'] },
    art: { kind: 'band', stones: 'full', stoneShape: 'round' },
    shape: 'round',
    metal: 'white',
    tint: 'art-tile',
  },
  {
    title: 'Tennis Bracelets',
    path: '/bracelets',
    scope: { category: 'bracelets' },
    filters: { style: ['tennis'] },
    art: { kind: 'tennis-bracelet', stoneShape: 'round' },
    shape: 'round',
    metal: 'yellow',
    tint: 'art-tile-cool',
  },
  {
    title: 'Hidden Halo Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['hidden-halo'] },
    art: { kind: 'ring', head: 'hidden-halo', band: 'plain' },
    shape: 'pear',
    metal: 'rose',
    carat: 2,
    tint: 'art-tile-warm',
  },
  {
    title: 'Solitaire Earrings',
    path: '/earrings',
    scope: { category: 'earrings' },
    filters: { style: ['solitaire'] },
    art: { kind: 'studs' },
    shape: 'round',
    metal: 'white',
    carat: 1,
    tint: 'art-tile',
  },
  {
    title: 'Solitaire Pendants',
    path: '/pendants',
    scope: { category: 'pendants' },
    filters: { style: ['solitaire'] },
    art: { kind: 'pendant', head: 'solitaire' },
    shape: 'oval',
    metal: 'rose',
    carat: 1,
    tint: 'art-tile-cool',
  },
  {
    title: 'Three Stone Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['three-stone'] },
    art: { kind: 'ring', head: 'three-stone', sides: 'pear', band: 'plain' },
    shape: 'round',
    metal: 'yellow',
    carat: 1.5,
    tint: 'art-tile',
  },
  {
    title: 'Tennis Necklaces',
    path: '/necklaces',
    scope: { category: 'necklaces' },
    filters: { style: ['tennis'] },
    art: { kind: 'tennis-necklace', stoneShape: 'round', graduated: true },
    shape: 'round',
    metal: 'white',
    tint: 'art-tile-warm',
    layout: 'wide',
  },
  {
    title: 'Solitaire Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['solitaire'] },
    art: { kind: 'ring', head: 'solitaire', band: 'knife' },
    shape: 'round',
    metal: 'white',
    carat: 1.5,
    tint: 'art-tile-cool',
  },
  {
    title: 'Hoop Earrings',
    path: '/earrings',
    scope: { category: 'earrings' },
    filters: { style: ['hoop'] },
    art: { kind: 'hoops', size: 'medium' },
    shape: 'round',
    metal: 'yellow',
    tint: 'art-tile-warm',
  },
  {
    title: 'Toi et Moi Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['toi-et-moi'] },
    art: { kind: 'ring', head: 'toi-et-moi', second: 'pear', band: 'plain' },
    shape: 'oval',
    metal: 'rose',
    carat: 1.2,
    tint: 'art-tile',
  },
  {
    title: 'Emerald Cut Collection',
    path: '/collections/emerald-cut',
    scope: { collection: 'emerald-cut' },
    art: { kind: 'ring', head: 'solitaire', band: 'pave' },
    shape: 'emerald',
    metal: 'yellow',
    carat: 2.4,
    tint: 'art-tile-cool',
  },
];

const LAYOUT: Record<NonNullable<Tile['layout']> | 'base', string> = {
  base: 'aspect-[4/5] md:aspect-square',
  feature: 'col-span-2 aspect-[4/3] sm:aspect-[16/10] md:row-span-2 md:aspect-auto',
  wide: 'col-span-2 aspect-[16/10] md:col-span-1 md:aspect-square lg:col-span-2 lg:aspect-auto',
};

export async function ShopByCategory() {
  const counts = await Promise.all(TILES.map((t) => countProducts(t.scope, t.filters)));

  return (
    <section aria-labelledby="categories-title" className="py-16 md:py-24">
      <div className="container-x">
        <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">The Collections</p>
            <h2 id="categories-title" className="h-section">
              Shop by Category
            </h2>
          </div>
          <p className="max-w-sm text-[15px] text-taupe md:text-right">From the proposal to the anniversary and every everyday moment between — find the silhouette made for yours.</p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {TILES.map((t, i) => {
            const href = `${t.path}${filtersToSearch(t.filters ?? {})}`;
            const feature = t.layout === 'feature';
            return (
              <li key={t.title} className={cn('relative', LAYOUT[t.layout ?? 'base'])}>
                <Reveal delay={Math.min(i, 5) * 0.05} y={16} className="h-full">
                  <Link href={href} className={cn('group relative flex h-full w-full flex-col overflow-hidden', t.tint)}>
                    <span className={cn('relative block flex-1 overflow-hidden', feature && 'md:mx-[4%]')} aria-hidden>
                      <LazyJewelryArt
                        spec={t.art}
                        shape={t.shape}
                        metal={t.metal}
                        carat={t.carat ?? 1}
                        view={t.view ?? 0}
                        title={t.title}
                        className={cn(
                          'absolute transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.07] group-focus-visible:scale-[1.07]',
                          feature ? 'inset-[-2%] md:inset-[-7%]' : 'inset-[-6%] sm:inset-0 lg:inset-[3%]',
                        )}
                      />
                    </span>
                    <span className={cn('relative block px-3 pb-3.5 xs:px-4 xs:pb-4 sm:px-5 sm:pb-5', feature ? 'lg:px-8 lg:pb-8' : 'lg:px-6 lg:pb-6')}>
                      <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-taupe">{pluralize(counts[i], 'design')}</span>
                      <span className={cn('mt-1.5 block font-serif leading-[1.15] text-ink', feature ? 'text-[1.6rem] sm:text-3xl lg:text-[2.6rem]' : 'text-[1rem] xs:text-[1.1rem] sm:text-xl lg:text-[1.45rem]')}>{t.title}</span>
                      {feature && t.blurb && <span className="mt-3 hidden max-w-sm text-[14px] leading-relaxed text-charcoal/75 sm:block">{t.blurb}</span>}
                      <span className="label-caps mt-2.5 inline-flex items-center gap-2 whitespace-nowrap text-[10px] tracking-[0.08em] text-ink xs:mt-3 xs:tracking-[0.16em] sm:text-[11px]">
                        <span className="link-underline group-hover:[background-size:100%_1px]">View collection</span>
                        <ArrowRight className="hidden h-3 w-3 transition-transform duration-300 group-hover:translate-x-1 xs:block" strokeWidth={1.5} aria-hidden />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
