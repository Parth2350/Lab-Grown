import Link from 'next/link';
import { Carousel } from '@/components/ui/Carousel';
import { ProductMedia } from '@/components/product/ProductMedia';
import { getProductsWhere } from '@/lib/server/catalog';
import { filtersToSearch, type Filters, type Scope } from '@/lib/filters';

type Tile = {
  title: string;
  /** Category landing route (scope.category) or explicit path for collections */
  path: string;
  scope: Scope;
  filters?: Partial<Filters>;
  /** the diamond shape the tile's photo must show (defaults to its shape filter) */
  shape?: string;
};

/** Each tile links to the same scope + filters it takes its picture from. */
const TILES: Tile[] = [
  {
    title: 'Oval Engagement Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { shape: ['oval'] },
  },
  {
    title: 'Eternity Wedding Bands',
    path: '/wedding-bands',
    scope: { category: 'wedding-bands' },
    filters: { style: ['eternity'] },
  },
  {
    title: 'Tennis Bracelets',
    path: '/bracelets',
    scope: { category: 'bracelets' },
    filters: { style: ['tennis'] },
  },
  {
    title: 'Hidden Halo Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['hidden-halo'] },
  },
  {
    title: 'Solitaire Earrings',
    path: '/earrings',
    scope: { category: 'earrings' },
    filters: { style: ['solitaire'] },
  },
  {
    title: 'Solitaire Pendants',
    path: '/pendants',
    scope: { category: 'pendants' },
    filters: { style: ['solitaire'] },
  },
  {
    title: 'Three Stone Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['three-stone'] },
  },
  {
    title: 'Tennis Necklaces',
    path: '/necklaces',
    scope: { category: 'necklaces' },
    filters: { style: ['tennis'] },
  },
  {
    title: 'Solitaire Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['solitaire'] },
  },
  {
    title: 'Hoop Earrings',
    path: '/earrings',
    scope: { category: 'earrings' },
    filters: { style: ['hoop'] },
  },
  {
    title: 'Toi et Moi Rings',
    path: '/engagement-rings',
    scope: { category: 'engagement-rings' },
    filters: { style: ['toi-et-moi'] },
  },
  {
    title: 'Emerald Cut Collection',
    path: '/collections/emerald-cut',
    scope: { collection: 'emerald-cut' },
    shape: 'emerald',
  },
];

export async function ShopByCategory() {
  // every tile shows a real photograph: the first product it leads to — for shape tiles, the first whose own photos show that shape
  const shapeOf = (t: Tile) => t.shape ?? t.filters?.shape?.[0];
  const firsts = await Promise.all(TILES.map((t) => getProductsWhere(t.scope, t.filters ?? {}, shapeOf(t) ? 24 : 1)));
  const tiles = TILES.map((t, i) => ({ ...t, product: firsts[i].find((p) => p.shapes[0] === shapeOf(t)) ?? firsts[i][0] })).filter((t) => t.product);

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
          <p className="max-w-sm text-[17px] text-taupe md:text-right">From the proposal to the anniversary and every everyday moment between — find the silhouette made for yours.</p>
        </div>

        <Carousel label="Shop by category" itemClassName="w-[42%] xs:w-[36%] sm:w-[27%] md:w-[22%] lg:w-[18%] xl:w-[15.2%]">
          {tiles.map(({ title, path, filters, product: p }) => (
            <Link key={title} href={`${path}${filtersToSearch(filters ?? {})}`} className="group block text-center">
              <span className="relative block aspect-square overflow-hidden rounded-md border border-line bg-white transition-shadow duration-500 group-hover:shadow-soft">
                <span className="absolute inset-0 transition-transform duration-700 ease-luxe group-hover:scale-105">
                  <ProductMedia
                    name={title}
                    art={p.art}
                    images={p.images}
                    metal={p.defaultMetalColor}
                    shape={p.shapes[0]}
                    carat={p.centerCarat ?? p.totalCarat}
                    sizes="(min-width:1200px) 15vw, (min-width:640px) 27vw, 42vw"
                  />
                </span>
              </span>
              <span className="mt-3 block font-serif text-[1.05rem] leading-tight text-ink transition-colors group-hover:text-gold-deep sm:text-lg">{title}</span>
            </Link>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
