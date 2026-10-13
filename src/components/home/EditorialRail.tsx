import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ArtSpec } from '@/components/art/JewelryArt';
import { LazyJewelryArt } from '@/components/art/LazyArt';
import { Carousel, RailSkeleton } from '@/components/ui/Carousel';
import { LazyMount } from '@/components/ui/LazyMount';
import { ProductCard } from '@/components/product/ProductCard';
import type { ProductCard as Card } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  art: { spec: ArtSpec; shape: string; metal: string; carat?: number };
  products: Card[];
  tint?: 'art-tile' | 'art-tile-warm' | 'art-tile-cool';
};

/** A curated edit: an editorial panel beside a product carousel. */
export function EditorialRail({ id, eyebrow, title, text, href, cta, art, products, tint = 'art-tile-warm' }: Props) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={id} className="py-16 md:py-24">
      <div className="container-x grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className={cn('relative flex flex-col overflow-hidden lg:col-span-4', tint)}>
          <div className="relative mx-auto aspect-[16/10] w-full max-w-md sm:aspect-[2/1] lg:aspect-square lg:max-w-none" aria-hidden>
            <LazyJewelryArt spec={art.spec} shape={art.shape} metal={art.metal} carat={art.carat ?? 1} className="absolute inset-[4%]" />
          </div>
          <div className="relative mt-auto p-6 pt-0 sm:p-8 sm:pt-0">
            <p className="eyebrow mb-3 text-gold-deep">{eyebrow}</p>
            <h2 id={id} className="font-serif text-[2rem] font-light leading-[1.08] text-ink sm:text-[2.4rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-sm text-[16.5px] leading-relaxed text-charcoal/80">{text}</p>
            <Link href={href} className="label-caps group mt-6 inline-flex items-center gap-2 text-ink">
              <span className="link-underline group-hover:[background-size:100%_1px]">{cta}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-8 lg:self-center">
          <LazyMount className="block" rootMargin="300px" fallback={<RailSkeleton itemClassName="w-[88%] sm:w-[46%] md:w-[31%] lg:w-[47%] xl:w-[31.2%]" count={3} />}>
            <Carousel label={title} itemClassName="w-[88%] sm:w-[46%] md:w-[31%] lg:w-[47%] xl:w-[31.2%]">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} sizes="(min-width:1200px) 20vw, (min-width:1024px) 30vw, (min-width:768px) 31vw, (min-width:420px) 46vw, 72vw" />
              ))}
            </Carousel>
          </LazyMount>
        </div>
      </div>
    </section>
  );
}
