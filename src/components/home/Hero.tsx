import Image from 'next/image';
import { ArrowRight, Gem, ShieldCheck } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EditorialArt } from '@/components/art/EditorialArt';
import { cn } from '@/lib/utils';
import type { StoreSettings } from '@/lib/pricing';
import s from './home.module.css';

type Props = { hero: StoreSettings['hero'] };

/** Hosts next/image may optimise (mirrors images.remotePatterns); anything else is served as-is. */
const OPTIMISABLE = [/^\/(?!\/)/, /^https:\/\/res\.cloudinary\.com\//, /^https:\/\/[^/]+\.amazonaws\.com\//, /^https:\/\/[^/]+\.r2\.cloudflarestorage\.com\//, /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//];

/**
 * Full-width editorial hero. Copy comes from store settings (admin-editable) and is
 * server-rendered for a fast LCP; entrance motion is pure CSS so it runs before hydration.
 */
export function Hero({ hero }: Props) {
  const image = hero.image?.trim() || null;

  return (
    <section aria-labelledby="hero-title" className={cn('relative isolate overflow-hidden', s.heroBackdrop)}>
      {image && (
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
          <Image src={image} alt="" fill priority sizes="100vw" unoptimized={!OPTIMISABLE.some((r) => r.test(image))} className="object-cover" />
          <div className={cn('absolute inset-0 hidden lg:block', s.heroScrim)} aria-hidden />
        </div>
      )}

      <div
        className={cn(
          'container-x relative grid grid-cols-1 items-center lg:grid-cols-12 lg:gap-8',
          image ? 'lg:min-h-[min(calc(100svh-150px),820px)]' : 'lg:min-h-[min(calc(100svh-150px),860px)]',
        )}
      >
        <div className={cn('relative z-10 pb-14 pt-8 sm:pb-16 lg:col-span-5 lg:py-24', image ? 'pt-10 lg:pt-24' : 'order-2 lg:order-1')}>
          <p className={cn('eyebrow flex items-center gap-3 text-gold-deep', s.rise)} style={{ animationDelay: '80ms' }}>
            <span className="h-px w-8 bg-gold" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className={cn('mt-5 max-w-[15ch] font-serif text-[2.6rem] font-light leading-[1.04] tracking-[-0.015em] text-ink xs:text-[3rem] sm:text-[3.6rem] lg:text-[4.1rem] xl:text-[4.6rem]', s.lift)}>
            {hero.title}
          </h1>
          <p className={cn('mt-6 max-w-[34rem] text-[18px] leading-relaxed text-charcoal/80 sm:text-[19px]', s.rise)} style={{ animationDelay: '160ms' }}>
            {hero.subtitle}
          </p>
          <div className={cn('mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap', s.rise)} style={{ animationDelay: '260ms' }}>
            <ButtonLink href="/collections/all" size="lg" className="w-full sm:w-auto">
              Shop Jewelry
            </ButtonLink>
            <ButtonLink href="/engagement-rings" variant="outline" size="lg" className="group w-full bg-ivory/40 px-5 tracking-[0.12em] xs:px-9 xs:tracking-[0.18em] sm:w-auto">
              Explore Engagement Rings
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </ButtonLink>
          </div>
          <ul className={cn('mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[14px] tracking-wide text-taupe', s.rise)} style={{ animationDelay: '360ms' }}>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden />
              IGI &amp; GIA certified diamonds
            </li>
            <li className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden />
              Crafted in our own workshop
            </li>
          </ul>
        </div>

        {!image && (
          <div className={cn('relative order-1 -mx-4 sm:-mx-6 lg:order-2 lg:col-span-7 lg:mx-0 lg:-mr-6 xl:-mr-10', s.bloom)} style={{ animationDelay: '120ms' }}>
            <div className="mx-auto w-full max-w-[min(560px,46svh)] lg:max-w-none">
              <EditorialArt scene="hero" className="w-full" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
