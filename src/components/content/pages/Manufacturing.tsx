import Image from 'next/image';
import { site } from '@/config/site';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { PhotoPanel } from '../ui';

type Stage = { title: string; text: string[]; facts: { label: string; value: string }[]; image: string; alt: string };

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
    image: '/images/home/process-1.webp',
    alt: 'A designer drawing ring sketches with measurements at a desk',
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
    image: '/images/home/process-2.webp',
    alt: 'A ring being modelled in 3D design software',
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
    image: '/images/home/process-3.webp',
    alt: 'A jeweller holding a ring in tweezers with a fine torch at the bench',
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
    image: '/images/home/process-4.webp',
    alt: 'A diamond being weighed on a precision scale beside a tray of rings',
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
    image: '/images/home/process-5.webp',
    alt: 'A craftsman filing and finishing a ring by hand',
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
    image: '/images/home/process-6.webp',
    alt: 'A gold solitaire ring in a navy velvet box beside its gift box',
  },
];

export function ManufacturingHero() {
  return (
    <div className="container-x pb-14">
      <PhotoPanel
        src="/images/manufacturing/hero.webp"
        alt="A three-stone engagement ring with an oval and two pear diamonds in yellow gold on the workshop bench"
        priority
        className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/8]"
        position="object-[70%_60%]"
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
              <div className={cn('relative aspect-[4/3] overflow-hidden bg-porcelain', i % 2 === 1 && 'md:order-2')}>
                <Image src={s.image} alt={s.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
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
