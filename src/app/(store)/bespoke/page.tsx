import Image from 'next/image';
import { Gem, Gift, MessageSquareText, PenTool } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/ui/Reveal';
import { getProductsWhere } from '@/lib/server/catalog';
import { BespokeBrief, type CollectionPiece } from '@/components/content/bespoke/BespokeBrief';
import { FaqSection, type Faq } from '@/components/content/FaqSection';
import { ArtPanel, NumberedSteps } from '@/components/content/ui';

export const metadata = pageMeta({
  title: 'Bespoke Design',
  description: `Create a one-of-a-kind engagement ring or fine jewelry piece with the designers and master jewelers at ${site.name}. Share your vision and start your bespoke request today.`,
  path: '/bespoke',
});

const STEPS = [
  {
    title: 'Share Your Vision',
    text: 'Tell us about the piece you imagine — the style, the diamond, the story behind it. Inspiration images are always welcome.',
    icon: <MessageSquareText className="h-5 w-5" strokeWidth={1} aria-hidden />,
  },
  {
    title: 'Custom Design & Selection',
    text: 'Your designer prepares sketches and detailed CAD renders, and our gemologists hand-select certified diamonds to match.',
    icon: <PenTool className="h-5 w-5" strokeWidth={1} aria-hidden />,
  },
  {
    title: 'Expert Craftsmanship & Precision',
    text: 'Once you approve, our master jewelers cast, set and finish your piece by hand in our own workshop.',
    icon: <Gem className="h-5 w-5" strokeWidth={1} aria-hidden />,
  },
  {
    title: 'Your Dream Jewelry, Made For You',
    text: 'Inspected, polished and presented in our signature box, your piece arrives fully insured — ready for its moment.',
    icon: <Gift className="h-5 w-5" strokeWidth={1} aria-hidden />,
  },
];

const SHOWCASE = [
  {
    title: 'The oval halo',
    text: 'An oval centre stone framed by a halo of diamonds, on a slender pavé band in yellow gold.',
    image: '/images/bespoke/showcase-1.webp',
    alt: 'An oval halo engagement ring in yellow gold, worn on the hand',
  },
  {
    title: 'An emerald cocktail ring',
    text: 'A deep green emerald ringed by tiers of diamonds in yellow gold — a statement piece for evenings out.',
    image: '/images/bespoke/showcase-2.webp',
    alt: 'An oval emerald ring with layered diamond halos in yellow gold, worn on the hand',
  },
  {
    title: 'Chandelier pear drops',
    text: 'Pear-shaped drop earrings with layered halos of diamonds, made to be worn with pearls.',
    image: '/images/bespoke/showcase-3.webp',
    alt: 'Pear-shaped chandelier drop earrings worn with a pearl necklace',
  },
  {
    title: 'A floral bridal set',
    text: 'A diamond collar of scrolling links with an emerald-accented flower pendant, and a halo ring to match.',
    image: '/images/bespoke/showcase-4.webp',
    alt: 'A diamond necklace with a flower pendant set with emeralds, and a matching halo ring',
  },
];

const FAQS: Faq[] = [
  {
    q: 'How much does a bespoke piece cost?',
    a: 'The price depends mainly on the diamond and the amount of gold. Many of our commissions begin at around ₹1,00,000, and we always design to the budget you share with us. Your proposal is itemised, so you can see exactly where your money goes.',
  },
  {
    q: 'Is there a charge for the design consultation?',
    a: 'No. Your consultation, sketches and first CAD renders are complimentary and carry no obligation. We ask for a 30% deposit only when you approve your final design and are ready for us to begin.',
  },
  {
    q: 'How long does it take?',
    a: 'Most commissions take 4–6 weeks from first conversation to delivery — about a week for design and diamond selection, then 3–5 weeks in our workshop. If you have a date in mind, tell us and we will plan around it.',
  },
  {
    q: 'Can you use my own diamond or heirloom gold?',
    a: 'Often, yes. We inspect heirloom diamonds before resetting them to make sure they are sound. Old gold can sometimes be refined and reused; our jewelers will advise on what is possible for your piece.',
  },
  {
    q: 'Will I see my design before it is made?',
    a: 'Always. You review photorealistic CAD renders from several angles and can request changes. For rings, we can also send a resin model so you can check the proportions on your hand.',
  },
  {
    q: 'Does a bespoke piece include certification and a warranty?',
    a: 'Yes. Centre diamonds are graded by IGI or GIA, and every bespoke piece is covered by our lifetime manufacturing warranty and complimentary lifetime care.',
  },
];

/** the categories the brief's "Inspired by our collection" panel draws on */
const BRIEF_CATEGORIES = ['engagement-rings', 'wedding-bands', 'necklaces', 'pendants', 'earrings', 'bracelets'];
/** the catalogue's 300 px thumbnail of a photo — the panel's tiles are small */
const thumb = (url: string) => url.replace('webassests.s3.us-east-1.amazonaws.com/images/zoom/', 'webassests.s3.us-east-1.amazonaws.com/images/thumb/');

export default async function BespokePage() {
  const lists = await Promise.all(BRIEF_CATEGORIES.map((c) => getProductsWhere({ category: c }, {}, 6)));
  const collection: Record<string, CollectionPiece[]> = Object.fromEntries(
    BRIEF_CATEGORIES.map((c, i) => [
      c,
      lists[i].flatMap((p) => {
        const image = p.images.find((m) => m.kind === 'image')?.url;
        return image ? [{ slug: p.slug, name: p.name, image: thumb(image), price: p.fromPrice }] : [];
      }),
    ]),
  );
  return (
    <>
      {/* ───────── hero ───────── */}
      <section className="container-x pb-16 pt-8 md:pb-24 md:pt-12">
        <Breadcrumbs items={[{ label: 'Bespoke Design', href: '/bespoke' }]} />
        <div className="mt-10 grid items-center gap-10 md:mt-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-4">Bespoke Design</p>
            <h1 className="h-display text-balance">Your idea, made by hand</h1>
            <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-taupe md:text-[19px]">
              Work one-to-one with our designers and master jewelers to create an engagement ring or fine jewelry piece that exists nowhere else — crafted in
              our own workshop with certified natural or lab-grown diamonds.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#start" size="lg">
                Start Your Design
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="outline" size="lg">
                How It Works
              </ButtonLink>
            </div>
            <ul className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-6 text-[14px] leading-snug text-taupe">
              <li>
                <span className="block font-serif text-2xl text-ink">Free</span>consultation &amp; CAD
              </li>
              <li>
                <span className="block font-serif text-2xl text-ink">4–6</span>weeks to delivery
              </li>
              <li>
                <span className="block font-serif text-2xl text-ink">For life</span>warranty &amp; care
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-5 grid-rows-[auto_auto] gap-3 sm:gap-4 lg:col-span-7">
            <Reveal className="col-span-3 row-span-2">
              <ArtPanel
                spec={{ kind: 'ring', head: 'toi-et-moi', second: 'oval', band: 'plain' }}
                shape="pear"
                metal="yellow"
                carat={1.5}
                tone="warm"
                className="aspect-[3/4] h-full"
                inset="p-6 sm:p-10"
                title="A toi et moi ring with pear and oval diamonds"
                caption={<span>Toi et moi · pear &amp; oval</span>}
              />
            </Reveal>
            <Reveal delay={0.1} className="col-span-2">
              <ArtPanel spec={{ kind: 'ring', head: 'double-halo', band: 'pave' }} shape="asscher" metal="white" carat={2} tone="cool" className="aspect-square" inset="p-4 sm:p-6" title="An asscher double halo ring" />
            </Reveal>
            <Reveal delay={0.2} className="col-span-2">
              <ArtPanel spec={{ kind: 'pendant', head: 'bezel' }} shape="emerald" metal="rose" className="aspect-square" inset="p-4 sm:p-6" title="An emerald-cut bezel pendant" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section id="how-it-works" aria-labelledby="how-title" className="container-x scroll-mt-32 pb-16 md:pb-24">
        <div className="mb-10 max-w-2xl md:mb-14">
          <p className="eyebrow mb-3">The Process</p>
          <h2 id="how-title" className="h-section">
            How bespoke works
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-taupe">Four considered steps, guided from start to finish by your personal design consultant.</p>
        </div>
        <NumberedSteps steps={STEPS} />
      </section>

      {/* ───────── showcase ───────── */}
      <section aria-labelledby="showcase-title" className="bg-porcelain py-16 md:py-24">
        <div className="container-x">
          <div className="mb-10 max-w-2xl md:mb-14">
            <p className="eyebrow mb-3">From the atelier</p>
            <h2 id="showcase-title" className="h-section">
              Designs we have brought to life
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-taupe">A few examples of the kinds of commissions our designers create.</p>
          </div>
          <ul className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
            {SHOWCASE.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 0.08}>
                  <Image src={s.image} alt={s.alt} width={600} height={600} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="aspect-square w-full bg-white object-cover" />
                  <h3 className="mt-5 font-serif text-[1.5rem] leading-tight">{s.title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-taupe">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── inquiry: the brief, as on brilliancecarat.com ───────── */}
      <section id="start" aria-labelledby="start-title" className="scroll-mt-24 border-y border-line bg-porcelain py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-2xs font-semibold uppercase tracking-luxe text-gold">Tell us your idea</p>
            <h2 id="start-title" className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink sm:text-[2.15rem]">
              Start your bespoke piece
            </h2>
            <span className="mx-auto mt-4 block h-px w-12 bg-gold" />
            <p className="mt-4 text-sm leading-relaxed text-taupe">Two quick minutes. Most fields are optional — share only what you know, add a reference, and we’ll take it from there.</p>
          </div>
          <BespokeBrief collection={collection} />
        </div>
      </section>

      <FaqSection items={FAQS} title="Bespoke, answered" intro={<>Anything else? Our design team is always happy to talk it through.</>} />
    </>
  );
}
