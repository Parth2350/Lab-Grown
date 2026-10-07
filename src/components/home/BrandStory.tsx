import { Factory, Gem, Globe, Hammer, Scale } from 'lucide-react';
import { LazyEditorialArt } from '@/components/art/LazyArt';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';

const STATS = [
  { value: site.stats.years, label: 'Years of Craftsmanship' },
  { value: site.stats.countries, label: 'Countries Served' },
  { value: site.stats.pieces, label: 'Pieces Crafted' },
  { value: site.stats.artisans, label: 'Master Artisans' },
];

const FEATURES = [
  {
    icon: Factory,
    title: 'In-House Manufacturing',
    text: 'Designed, cast, set and finished in our own workshop — never outsourced, always accountable.',
  },
  {
    icon: Hammer,
    title: 'Expert Craftsmanship',
    text: 'Master setters and polishers perfect every claw, gallery and edge by hand.',
  },
  {
    icon: Scale,
    title: 'Honest Pricing',
    text: 'Making our jewelry ourselves means no middlemen and no inflated retail mark-ups.',
  },
  {
    icon: Globe,
    title: 'Global Experience',
    text: `Trusted by clients in ${site.stats.countries} countries, with fully insured delivery to the door.`,
  },
  {
    icon: Gem,
    title: 'Finest Quality',
    text: 'Certified diamonds, solid gold and a lifetime warranty on every single piece.',
  },
];

export function BrandStory() {
  return (
    <section aria-labelledby="story-title" className="py-16 md:py-24">
      <div className="container-x grid grid-cols-1 items-center gap-10 md:gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="mx-auto w-full max-w-[560px] lg:col-span-6 lg:max-w-none">
          <figure className="art-tile-warm relative">
            <LazyEditorialArt scene="workshop" className="block aspect-[4/5] w-full" />
            <figcaption className="absolute bottom-4 left-4 bg-ivory/90 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal backdrop-blur-sm sm:bottom-6 sm:left-6">
              Our workshop · {site.contact.address.city}
            </figcaption>
          </figure>
        </Reveal>

        <div className="lg:col-span-6 xl:pl-6">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-gold" aria-hidden />
              Our Atelier
            </p>
            <h2 id="story-title" className="h-section">
              Crafted by Experts. <span className="italic text-gold-deep">Worn for Life’s Most Meaningful Moments</span>
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-charcoal/85 sm:text-base">
              <p>
                {site.name} is not a reseller. Every ring, earring and bracelet is designed, cast, set and polished under one roof — in our own fine jewelry manufacturing
                workshop in {site.contact.address.city}, where we have been perfecting our craft since {site.foundedYear}.
              </p>
              <p>
                Owning every step means we answer for every detail: the balance of a setting, the security of each claw, the mirror finish inside the band. It also means
                exceptional pieces at honest prices, because nothing is lost to middlemen along the way.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1.5">
                  <dt className="text-[10.5px] font-medium uppercase leading-snug tracking-[0.16em] text-taupe">{s.label}</dt>
                  <dd className="font-serif text-[2.5rem] font-light leading-none text-ink lg:text-[2.85rem]">{s.value}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href="/about" variant="outline" className="mt-10">
              Discover Our Story
            </ButtonLink>
          </Reveal>
        </div>
      </div>

      <div className="container-x mt-16 md:mt-20">
        <ul className="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={cn('border-b border-r border-line', i === FEATURES.length - 1 && 'sm:col-span-2 lg:col-span-1')}>
              <Reveal delay={i * 0.06} y={16} className="group flex h-full gap-4 p-5 transition-colors duration-500 hover:bg-porcelain/70 sm:block sm:p-6 lg:p-7 xl:p-8">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ivory">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.25} aria-hidden />
                </span>
                <div>
                  <h3 className="font-serif text-[1.3rem] leading-tight text-ink sm:mt-5 sm:text-[1.35rem]">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-taupe sm:mt-2">{text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
