import type { ReactNode } from 'react';
import { site } from '@/config/site';
import { JewelryArt, LooseDiamond } from '@/components/art/JewelryArt';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CadWireframe, LoupeOverlay, PackagingIllustration, SketchIllustration } from '../illustrations';
import { ArtPanel } from '../ui';

type Stage = { title: string; text: string[]; facts: { label: string; value: string }[]; visual: ReactNode; tone: string };

const STAGES: Stage[] = [
  {
    title: 'Concept & Design',
    text: [
      'Every piece begins as a pencil line. Our designers sketch by hand, studying proportion from every angle — how a ring will sit beside a wedding band, how an earring will move as you turn your head, how a pendant will fall at the collarbone.',
      'Each design is then reviewed with our master jeweler for comfort and durability before it moves on. Beautiful is only the beginning; it must also be wearable every day for decades.',
    ],
    facts: [
      { label: 'Method', value: 'Hand sketches & renderings' },
      { label: 'Reviewed by', value: 'Designer & master jeweler' },
    ],
    visual: (
      <div className="absolute inset-0 p-4 sm:p-6">
        <SketchIllustration className="h-full w-full" />
      </div>
    ),
    tone: 'art-tile-warm',
  },
  {
    title: 'CAD Modeling',
    text: [
      'Approved sketches are translated into precise three-dimensional models. Our CAD specialists engineer the details you will feel rather than see — prong heights that protect the diamond, galleries that let light in, and softly rounded comfort-fit interiors.',
      'A resin prototype is printed from every new model so we can check its proportions in the hand, and on the hand, before any gold is used.',
    ],
    facts: [
      { label: 'Precision', value: 'To one hundredth of a millimetre' },
      { label: 'Prototype', value: 'High-resolution resin print' },
    ],
    visual: (
      <div className="absolute inset-0 p-4 sm:p-6">
        <CadWireframe className="h-full w-full" />
      </div>
    ),
    tone: 'bg-white',
  },
  {
    title: 'Expert Setting',
    text: [
      'Each model is cast in solid gold using the lost-wax method, then cleaned and pre-polished. It then passes to our setters, who work under microscopes to raise every claw and bead by hand, seating each diamond perfectly level and secure.',
      'Pavé and eternity pieces can hold more than a hundred diamonds, each matched for size and colour so the line of light is unbroken.',
    ],
    facts: [
      { label: 'Casting', value: 'Solid 9K, 10K, 14K & 18K gold' },
      { label: 'Training', value: 'Setters train for five years or more' },
    ],
    visual: (
      <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
        <JewelryArt spec={{ kind: 'ring', head: 'solitaire', band: 'cathedral', prongs: 6 }} shape="round" metal="white" carat={1.5} view={1} className="h-full w-full" title="Side profile of a six-claw solitaire setting" />
      </div>
    ),
    tone: 'art-tile-cool',
  },
  {
    title: 'Quality Inspection',
    text: [
      'Before a piece can be finished it must pass our inspection checklist. Every centre diamond is checked against its IGI or GIA report, settings are tested for security, and dimensions, weight and gold purity are verified.',
      'Anything that falls short returns to the bench. Nothing leaves our workshop because it is “nearly” right.',
    ],
    facts: [
      { label: 'Checklist', value: '30 points per piece' },
      { label: 'Verified', value: 'Diamond, setting, metal & size' },
    ],
    visual: (
      <div className="absolute inset-0 p-8 sm:p-12">
        <div className="relative h-full w-full">
          <LooseDiamond shape="oval" className="absolute inset-0 h-full w-full" title="An oval diamond under a jeweler's loupe" />
          <LoupeOverlay className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    ),
    tone: 'art-tile',
  },
  {
    title: 'Finishing & Polishing',
    text: [
      'Our polishers bring every surface to a mirror shine, reaching between claws and beneath galleries with fine brushes and threads. White gold receives a bright rhodium finish, and engravings are added by laser with a final hand touch.',
      'A last steam clean removes every trace of polishing compound, so the diamonds can show their full fire.',
    ],
    facts: [
      { label: 'Stages', value: 'Up to six rounds of polishing' },
      { label: 'Finishes', value: 'High polish, satin & hammered' },
    ],
    visual: (
      <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
        <JewelryArt spec={{ kind: 'band', stones: 'none', size: 'wide' }} shape="round" metal="yellow" className="h-full w-full" title="A polished solid gold band" />
      </div>
    ),
    tone: 'art-tile-warm',
  },
  {
    title: 'Luxury Packaging',
    text: [
      'Each finished piece is photographed, recorded and placed in our signature presentation box together with its grading report and care card — and a handwritten note, if it is a gift.',
      'It is then sealed in plain, discreet outer packaging and dispatched fully insured, ready to be opened at exactly the right moment.',
    ],
    facts: [
      { label: 'Includes', value: 'Grading report & care card' },
      { label: 'Delivery', value: 'Insured, signature required' },
    ],
    visual: (
      <div className="absolute inset-0 p-4 sm:p-8">
        <PackagingIllustration className="h-full w-full" />
      </div>
    ),
    tone: 'art-tile',
  },
];

export function ManufacturingHero() {
  return (
    <div className="container-x pb-14">
      <ArtPanel
        spec={{ kind: 'ring', head: 'three-stone', sides: 'pear', band: 'plain' }}
        shape="oval"
        metal="yellow"
        carat={1.5}
        tone="warm"
        className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/8]"
        inset="p-8 sm:p-12 lg:p-14"
        title="A three-stone ring in yellow gold"
        caption={
          <>
            <span>
              Made in {site.contact.address.city} since {site.foundedYear}
            </span>
            <span className="hidden sm:inline">{site.stats.artisans} artisans · one workshop</span>
          </>
        }
      />
    </div>
  );
}

export function ManufacturingBody() {
  return (
    <div>
      <div className="max-w-3xl text-[18px] leading-relaxed text-charcoal/90">
        <p>
          Most jewelry passes through many hands in many places before it reaches yours. Ours does not. Every piece at {site.name} is designed, modelled, cast, set,
          inspected and finished under one roof in {site.contact.address.city}, by a team of {site.stats.artisans} artisans — many of whom learned their craft
          from parents and grandparents who worked at the same benches.
        </p>
        <p className="mt-4">
          Keeping every step in-house means we can promise consistent quality, fair and transparent pricing, and the freedom to make any piece in your choice of
          metal, purity and diamond. Here is how it comes together.
        </p>
      </div>

      <ol className="mt-12">
        {STAGES.map((s, i) => (
          <li key={s.title} className="border-t border-line py-12 md:py-16">
            <Reveal className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className={cn('relative aspect-square overflow-hidden', s.tone, s.tone === 'bg-white' && 'border border-line', i % 2 === 1 && 'md:order-2')}>
                {s.visual}
              </div>
              <div>
                <p className="flex items-baseline gap-4">
                  <span className="font-serif text-[3rem] font-light leading-none text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span className="label-caps text-taupe">Step {i + 1} of 6</span>
                </p>
                <h2 className="mt-5 font-serif text-[2rem] font-light leading-tight">{s.title}</h2>
                {s.text.map((t) => (
                  <p key={t.slice(0, 24)} className="mt-4 text-[17px] leading-relaxed text-charcoal/90">
                    {t}
                  </p>
                ))}
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                  {s.facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-[12.5px] uppercase tracking-[0.16em] text-taupe">{f.label}</dt>
                      <dd className="mt-1 text-[16px] text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <section aria-labelledby="mf-numbers" className="border-y border-line py-12">
        <h2 id="mf-numbers" className="eyebrow font-sans mb-8">
          The workshop in numbers
        </h2>
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { v: site.stats.years, l: 'Years of craft' },
            { v: site.stats.artisans, l: 'Artisans' },
            { v: site.stats.pieces, l: 'Pieces crafted' },
            { v: site.stats.countries, l: 'Countries delivered' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col-reverse">
              <dt className="mt-2 text-[13px] uppercase tracking-[0.16em] text-taupe">{s.l}</dt>
              <dd className="font-serif text-[2.6rem] font-light leading-none">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/bespoke">Design a Bespoke Piece</ButtonLink>
        <ButtonLink href="/pages/lab-grown-diamonds" variant="outline">
          About Our Diamonds
        </ButtonLink>
      </div>
    </div>
  );
}
