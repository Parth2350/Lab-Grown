import Link from 'next/link';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { SHAPES } from '@/lib/catalog';
import { countProducts } from '@/lib/server/catalog';
import { cn, pluralize } from '@/lib/utils';
import { LazyLooseDiamond } from '@/components/art/LazyArt';

/**
 * "Start With the Stone": ten diamond silhouettes. On hover the fine line drawing
 * resolves into a faceted stone (CSS only). Horizontal snap-scroll on small screens.
 */
export async function ShopByShape() {
  const counts = await Promise.all(SHAPES.map((s) => countProducts({ shape: s.slug })));

  return (
    <section aria-labelledby="shapes-title" className="border-y border-line bg-porcelain/70 py-16 md:py-24">
      <div className="container-x">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="eyebrow mb-3">Shop by Diamond Shape</p>
          <h2 id="shapes-title" className="h-section">
            Start With the Stone
          </h2>
          <p className="mt-4 text-[17px] text-taupe">
            Every piece begins with a single diamond. Choose the silhouette that speaks to you, and we will show you every design made to hold it.
          </p>
        </div>

        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-10 lg:gap-0 lg:overflow-visible lg:border-y lg:border-line lg:px-0 lg:py-0">
          {SHAPES.map((shape, i) => (
            <li key={shape.slug} className={cn('w-[27%] shrink-0 snap-start xs:w-[23%] sm:w-[19%] md:w-[15.5%] lg:w-auto', i > 0 && 'lg:border-l lg:border-line')}>
              <Link
                href={`/collections/shape/${shape.slug}`}
                className="group flex h-full flex-col items-center border border-line bg-ivory px-2 pb-5 pt-6 text-center transition-colors duration-500 hover:bg-white focus-visible:bg-white lg:border-0 lg:bg-transparent lg:pb-8 lg:pt-10"
              >
                <span className="relative flex h-[72px] w-[72px] items-center justify-center xl:h-[84px] xl:w-[84px]" aria-hidden>
                  <span className="absolute inset-0 scale-75 rounded-full bg-gold-pale/0 transition-all duration-700 ease-luxe group-hover:scale-100 group-hover:bg-gold-pale/70" />
                  <ShapeIcon
                    shape={shape.slug}
                    size={52}
                    strokeWidth={0.9}
                    className="relative text-charcoal/75 transition-all duration-500 ease-luxe group-hover:text-gold lg:group-hover:scale-90 lg:group-hover:opacity-0"
                  />
                  <LazyLooseDiamond
                    shape={shape.slug}
                    className="absolute inset-[-14%] hidden scale-75 opacity-0 transition-all duration-700 ease-luxe group-hover:scale-100 group-hover:opacity-100 lg:block"
                  />
                </span>
                <span className="mt-4 font-serif text-[1.15rem] leading-tight text-ink">
                  <span className="link-underline group-hover:[background-size:100%_1px]">{shape.label}</span>
                </span>
                <span className="mt-1 text-[13px] tracking-wide text-taupe transition-colors group-hover:text-gold-deep">{pluralize(counts[i], 'design')}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
