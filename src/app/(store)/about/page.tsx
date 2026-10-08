import type { ReactNode } from 'react';
import { Award, Gem, RefreshCcw, ShieldCheck } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { GlobeIllustration } from '@/components/content/illustrations';
import { ArrowLink, ArtPanel, CtaBand } from '@/components/content/ui';

export const metadata = pageMeta({
  title: 'Our Story',
  description: `The story of ${site.name}: a family fine jewelry workshop crafting certified lab-grown diamond jewelry by hand since ${site.foundedYear}.`,
  path: '/about',
});

const city = site.contact.address.city;

function Chapter({
  id,
  number,
  eyebrow,
  title,
  children,
  art,
  reverse,
  link,
}: {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  art: ReactNode;
  reverse?: boolean;
  link?: { href: string; label: string };
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="container-x py-14 md:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal className={cn('lg:col-span-7', reverse && 'lg:order-2')}>{art}</Reveal>
        <Reveal delay={0.1} className={cn('lg:col-span-5', reverse && 'lg:order-1')}>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="font-serif text-lg tracking-normal text-gold-deep">{number}</span>
            <span aria-hidden className="h-px w-8 bg-stone" />
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="h-section text-balance">
            {title}
          </h2>
          <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-charcoal/90 md:text-[18px]">{children}</div>
          {link && <ArrowLink href={link.href} className="mt-6">{link.label}</ArrowLink>}
        </Reveal>
      </div>
    </section>
  );
}

const VALUES = [
  { t: 'Craft over haste', d: 'We would rather take an extra day at the bench than send out a piece that is almost right.' },
  { t: 'Radical transparency', d: 'Independent grading, honest pricing and clear policies — no fine print, no inflated “original” prices.' },
  { t: 'Considered sourcing', d: 'Lab-grown diamonds with traceable origins, and solid gold from refiners we know and trust.' },
  { t: 'Made for life', d: 'Designed to be worn every day and backed by a lifetime warranty, because heirlooms should last.' },
];

const PROMISES = [
  { icon: Gem, t: 'IGI & GIA certified', d: 'Every centre diamond is independently graded and its report travels with your jewelry.' },
  { icon: ShieldCheck, t: 'Hallmarked solid gold', d: 'Cast in 9K to 18K gold, with purity independently verified and stamped.' },
  { icon: Award, t: 'Lifetime warranty', d: 'Manufacturing defects covered for life, with complimentary cleaning and inspection.' },
  { icon: RefreshCcw, t: '30-day returns', d: 'Complimentary, insured returns and exchanges if a piece is not quite right.' },
];

export default function AboutPage() {
  const stats = [
    { v: site.stats.years, l: 'Years at the bench' },
    { v: site.stats.countries, l: 'Countries delivered' },
    { v: site.stats.pieces, l: 'Pieces handcrafted' },
    { v: site.stats.artisans, l: 'Artisans in our workshop' },
  ];

  return (
    <>
      {/* ───────── hero ───────── */}
      <section className="container-x pb-14 pt-8 md:pt-12">
        <Breadcrumbs items={[{ label: 'Our Story', href: '/about' }]} />
        <div className="mt-10 grid items-end gap-10 md:mt-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6 lg:pb-10">
            <p className="eyebrow mb-4">
              Est. {site.foundedYear} · {city}
            </p>
            <h1 className="h-display text-balance">Fine jewelry, made by the hands that design it</h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-taupe md:text-[19px]">
              {site.name} is a family workshop of designers, setters and polishers who believe the most meaningful jewelry should be made with care, sold with
              honesty and worn for a lifetime.
            </p>
          </div>
          <div className="lg:col-span-6">
            <ArtPanel
              spec={{ kind: 'ring', head: 'hidden-halo', band: 'pave' }}
              shape="oval"
              metal="yellow"
              carat={2}
              tone="warm"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
              inset="p-10 sm:p-14"
              title="An oval hidden halo engagement ring in yellow gold"
              caption={<span>Designed &amp; made in {city}</span>}
            />
          </div>
        </div>
      </section>

      <Chapter
        id="our-story"
        number="01"
        eyebrow="Our Story"
        title="It began with a single bench"
        art={
          <ArtPanel
            spec={{ kind: 'ring', head: 'solitaire', band: 'plain', prongs: 6 }}
            shape="round"
            metal="white"
            carat={1.5}
            view={1}
            tone="cool"
            className="aspect-[4/3]"
            title="The profile of a six-claw solitaire ring"
          />
        }
      >
        <p>
          In {site.foundedYear}, our founders opened a small workshop in the heart of {city}&apos;s historic jewelry quarter. For years we crafted engagement rings
          and fine jewelry for other houses, quietly earning a reputation for settings that were cleaner, stronger and more precisely finished than most.
        </p>
        <p>
          When lab-grown diamonds reached true gem quality, we saw a chance to do something we had long wanted to: offer exceptional diamonds and genuine
          craftsmanship directly to the people who wear them, without the layers of mark-up in between. {site.name} was born from that idea.
        </p>
      </Chapter>

      <Chapter
        id="craftsmanship"
        number="02"
        eyebrow="Our Craftsmanship"
        title="Details you can feel"
        reverse
        link={{ href: '/pages/manufacturing', label: 'Our six-step process' }}
        art={
          <ArtPanel
            spec={{ kind: 'band', stones: 'full', stoneShape: 'emerald' }}
            shape="emerald"
            metal="yellow"
            tone="warm"
            className="aspect-[4/3]"
            title="An emerald-cut eternity band"
          />
        }
      >
        <p>
          Great jewelry reveals itself slowly: a band that is comfortable from the first day, claws that hold a diamond securely without hiding it, a gallery
          that lets light pour in from the side. These are the details our artisans obsess over.
        </p>
        <p>
          Every diamond is set by hand under the microscope, and every piece is polished in up to six stages before it is allowed to leave the bench.
        </p>
      </Chapter>

      {/* ───────── workshop ───────── */}
      <section id="workshop" aria-labelledby="workshop-title" className="bg-porcelain py-16 md:py-24">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow mb-4 flex items-center gap-3">
                <span className="font-serif text-lg tracking-normal text-gold-deep">03</span>
                <span aria-hidden className="h-px w-8 bg-stone" />
                Our Workshop
              </p>
              <h2 id="workshop-title" className="h-section text-balance">
                One roof, {site.stats.artisans} artisans, every step
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-charcoal/90 md:text-[18px]">
                Design, CAD modelling, casting, setting, inspection and finishing all happen in our own workshop. Nothing is outsourced, which means we answer for
                every piece — and can make almost any design in your choice of metal, purity and diamond.
              </p>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7">
              {[
                { spec: { kind: 'pendant' as const, head: 'bezel' as const }, shape: 'round', metal: 'rose', label: 'Bezel setting' },
                { spec: { kind: 'studs' as const, head: 'halo' as const }, shape: 'round', metal: 'white', label: 'Halo studs' },
                { spec: { kind: 'tennis-bracelet' as const, stoneShape: 'round' }, shape: 'round', metal: 'yellow', label: 'Tennis line' },
                { spec: { kind: 'drops' as const, head: 'halo' as const }, shape: 'pear', metal: 'yellow', label: 'Pear drops' },
              ].map((a, i) => (
                <Reveal key={a.label} delay={i * 0.08}>
                  <ArtPanel spec={a.spec} shape={a.shape} metal={a.metal} className="aspect-square" inset="p-5 sm:p-8" caption={<span>{a.label}</span>} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Chapter
        id="diamonds"
        number="04"
        eyebrow="Our Diamonds"
        title="Real diamonds, grown with intention"
        link={{ href: '/pages/lab-grown-diamonds', label: 'The lab-grown diamond guide' }}
        art={<ArtPanel loose shape="cushion" tone="cool" className="aspect-[4/3]" inset="p-12 sm:p-20" title="A cushion-cut lab-grown diamond" />}
      >
        <p>
          Our diamonds are grown, not mined — chemically, physically and optically identical to diamonds from the earth, with an origin we can trace for every
          stone. Our gemologists hand-select each one for its cut, colour and clarity before it is ever offered to you.
        </p>
        <p>The result is a diamond you can feel wonderful about, at a price that leaves room for the setting, the size — or the honeymoon.</p>
      </Chapter>

      {/* ───────── values ───────── */}
      <section id="values" aria-labelledby="values-title" className="container-x py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="font-serif text-lg tracking-normal text-gold-deep">05</span>
            <span aria-hidden className="h-px w-8 bg-stone" />
            Our Values
          </p>
          <h2 id="values-title" className="h-section">
            What we will always stand for
          </h2>
        </div>
        <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <li key={v.t} className="bg-ivory p-7 sm:p-8">
              <Reveal delay={i * 0.06}>
                <p className="font-serif text-xl italic text-gold">{['i', 'ii', 'iii', 'iv'][i]}.</p>
                <h3 className="mt-6 font-serif text-[1.6rem] leading-tight">{v.t}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-taupe">{v.d}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── quality ───────── */}
      <section id="quality" aria-labelledby="quality-title" className="border-y border-line bg-white py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-serif text-lg tracking-normal text-gold-deep">06</span>
              <span aria-hidden className="h-px w-8 bg-stone" />
              Quality &amp; Certification
            </p>
            <h2 id="quality-title" className="h-section">
              Proof, not promises
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-taupe">
              Independent grading and clear guarantees mean you never have to take our word for it.
            </p>
            <ArrowLink href="/pages/warranty" className="mt-6">
              Our lifetime warranty
            </ArrowLink>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
            {PROMISES.map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-5 border-t border-line pt-6">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-gold" strokeWidth={1} aria-hidden />
                <div>
                  <h3 className="font-serif text-xl">{t}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-taupe">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── global reach ───────── */}
      <section id="global-reach" aria-labelledby="reach-title" className="container-x py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="order-2 lg:order-1 lg:col-span-6">
            <GlobeIllustration className="mx-auto w-full max-w-[520px]" />
          </Reveal>
          <div className="order-1 lg:order-2 lg:col-span-6">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="font-serif text-lg tracking-normal text-gold-deep">07</span>
              <span aria-hidden className="h-px w-8 bg-stone" />
              Global Reach
            </p>
            <h2 id="reach-title" className="h-section text-balance">
              From {city} to the world
            </h2>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-charcoal/90 md:text-[18px]">
              Today our jewelry is worn in more than {site.stats.countries.replace('+', '')} countries. Every piece still begins on the same benches — and every
              one travels to its new home fully insured.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8">
              {stats.map((s) => (
                <div key={s.l} className="flex flex-col-reverse">
                  <dt className="mt-2 text-[13px] uppercase tracking-[0.16em] text-taupe">{s.l}</dt>
                  <dd className="font-serif text-[2.6rem] font-light leading-none sm:text-[3.2rem]">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <CtaBand
        tone="ink"
        eyebrow="Begin your story"
        title="Let us make something that is entirely yours"
        text="Explore our collections, or work one-to-one with our designers to create a bespoke piece."
      >
        <ButtonLink href="/bespoke" variant="light" size="lg">
          Start a Bespoke Design
        </ButtonLink>
        <ButtonLink href="/collections/all" size="lg" className="border-ivory/40 bg-transparent text-ivory hover:bg-ivory hover:text-ink">
          Explore the Collection
        </ButtonLink>
      </CtaBand>
    </>
  );
}
