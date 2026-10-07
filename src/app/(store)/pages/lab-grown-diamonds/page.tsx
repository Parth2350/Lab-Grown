import Link from 'next/link';
import type { ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { site } from '@/config/site';
import { SHAPES } from '@/lib/catalog';
import { pageMeta } from '@/lib/seo';
import { LooseDiamond } from '@/components/art/JewelryArt';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { FaqSection, type Faq } from '@/components/content/FaqSection';
import { CaratScale, ClarityScale, ColorScale, CutDiagram, CvdIllustration, HphtIllustration } from '@/components/content/illustrations';
import { CtaBand, TextLink } from '@/components/content/ui';

const TITLE = 'Lab-Grown Diamonds: The Complete Guide';
const DESCRIPTION =
  'What lab-grown diamonds are, how they are grown with CVD and HPHT, the 4Cs, IGI and GIA certification, and how they compare with mined diamonds.';

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: '/pages/lab-grown-diamonds', type: 'article' });

const SECTIONS = [
  { id: 'what-they-are', label: 'What they are' },
  { id: 'how-they-are-grown', label: 'How they are grown' },
  { id: 'four-cs', label: 'The 4Cs' },
  { id: 'certification', label: 'Certification' },
  { id: 'comparison', label: 'Lab-grown vs mined' },
  { id: 'responsibility', label: 'Responsibility & value' },
  { id: 'faq', label: 'FAQ' },
];

const FAQS: Faq[] = [
  {
    q: 'Are lab-grown diamonds real diamonds?',
    a: 'Yes. They are made of the same pure carbon, arranged in the same cubic crystal structure, as diamonds formed in the earth. They are not simulants like cubic zirconia or moissanite, which are entirely different materials.',
  },
  {
    q: 'Can a jeweler tell a lab-grown diamond from a mined one?',
    a: 'Not by eye, and not with a standard jeweler’s loupe. Telling them apart requires specialist laboratory instruments that detect tiny differences in growth patterns and trace elements. That is why every centre diamond comes with an independent grading report stating its origin.',
  },
  {
    q: 'Will a lab-grown diamond last forever?',
    a: 'A lab-grown diamond scores 10 on the Mohs hardness scale, exactly like a mined diamond. It will not cloud, fade or lose its sparkle, and with sensible care it can be worn every day for generations.',
  },
  {
    q: 'Why do lab-grown diamonds cost less?',
    a: 'Growing a diamond takes weeks rather than billions of years, and its journey to you is far shorter, with no mining and fewer intermediaries. The diamond itself is no less beautiful or durable — you simply pay less for the same size and quality.',
  },
  {
    q: 'Do lab-grown diamonds hold their value?',
    a: 'Fine jewelry of any kind rarely resells for its original retail price, and the resale market for lab-grown diamonds is still developing. We encourage you to choose a diamond for its beauty and meaning rather than as a financial investment.',
  },
  {
    q: 'Is a CVD diamond better than an HPHT diamond?',
    a: 'Neither method is inherently better. Both produce genuine diamonds, and the finished stone is judged on its own cut, colour, clarity and carat. Many CVD diamonds also receive a post-growth treatment to refine their colour, which is disclosed on the grading report.',
  },
  {
    q: 'Should I choose an IGI or a GIA report?',
    a: 'Both are independent, internationally respected laboratories. IGI grades the majority of lab-grown diamonds sold worldwide and provides full 4Cs grading, while GIA issues its own laboratory-grown diamond reports. Either way, the report verifies exactly what you are buying.',
  },
  {
    q: 'Are lab-grown diamonds a responsible choice?',
    a: 'They require no mining and their origin is fully traceable, which many people value. Growing diamonds does use significant energy, so we work with established growers who disclose how and where every stone is produced.',
  },
];

const COMPARISON: { label: string; lab: string; mined: string; same?: boolean }[] = [
  { label: 'Chemical composition', lab: 'Pure carbon (C)', mined: 'Pure carbon (C)', same: true },
  { label: 'Crystal structure', lab: 'Cubic', mined: 'Cubic', same: true },
  { label: 'Hardness (Mohs)', lab: '10', mined: '10', same: true },
  { label: 'Refractive index', lab: '2.42', mined: '2.42', same: true },
  { label: 'Brilliance & fire', lab: 'Identical when equally well cut', mined: 'Identical when equally well cut', same: true },
  { label: 'Graded on the 4Cs', lab: 'Yes — by IGI or GIA', mined: 'Yes — by IGI or GIA', same: true },
  { label: 'Origin', lab: 'Grown in weeks under controlled conditions', mined: 'Formed over billions of years, then mined' },
  { label: 'Traceability', lab: 'Known grower and growth method', mined: 'Often passes through many hands' },
  { label: 'Mining required', lab: 'None', mined: 'Large-scale extraction' },
  { label: 'Price for the same size & quality', lab: 'Considerably lower', mined: 'Higher' },
];

export default function LabGrownDiamondsPage() {
  return (
    <>
      {/* ───────── hero ───────── */}
      <section className="container-x pb-12 pt-8 md:pt-12">
        <Breadcrumbs items={[{ label: 'Lab-Grown Diamonds', href: '/pages/lab-grown-diamonds' }]} />
        <div className="mt-10 grid items-center gap-10 md:mt-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-4">The Diamond Guide</p>
            <h1 className="h-display text-balance">Lab-grown diamonds, beautifully explained</h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-taupe md:text-[17px]">
              Every {site.name} diamond is a real diamond — grown rather than mined, graded by independent laboratories, and cut to bring out every flash of light.
              Here is everything you need to choose yours with confidence.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/engagement-rings">Shop Engagement Rings</ButtonLink>
              <ButtonLink href="/collections/all" variant="outline">
                Explore All Jewelry
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="art-tile-cool relative aspect-square overflow-hidden sm:aspect-[5/4]">
              <div className="absolute inset-0 p-10 sm:p-16">
                <LooseDiamond shape="round" className="h-full w-full" title="A round brilliant lab-grown diamond" />
              </div>
              <p className="absolute bottom-4 left-4 text-[10.5px] uppercase tracking-[0.16em] text-taupe sm:bottom-6 sm:left-6">Round brilliant · 57 facets</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── in-page navigation ───────── */}
      <nav aria-label="Guide sections" className="sticky top-[60px] z-20 border-y border-line bg-ivory/95 backdrop-blur-md xl:top-[108px]">
        <ul className="container-x no-scrollbar flex gap-6 overflow-x-auto py-3">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="label-caps inline-flex min-h-10 items-center text-taupe transition-colors hover:text-ink">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ───────── what they are ───────── */}
      <section id="what-they-are" aria-labelledby="what-title" className="container-x scroll-mt-40 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3">01 · The Essentials</p>
            <h2 id="what-title" className="h-section">
              What is a lab-grown diamond?
            </h2>
          </div>
          <div className="space-y-5 text-[16px] leading-relaxed text-charcoal/90 lg:col-span-7">
            <p>
              A lab-grown diamond is a diamond in every scientific sense: carbon atoms locked into the same rigid cubic lattice that gives a mined diamond its
              hardness and its fire. The difference is where it forms. Instead of billions of years under the earth&apos;s crust, it grows over a few weeks inside
              specialist equipment that recreates — with remarkable precision — the conditions in which diamonds are born.
            </p>
            <p>
              Once grown, each rough crystal is cut and polished by hand, just like any fine diamond, then sent to an independent laboratory for grading. The
              result is a stone that no jeweler can distinguish from a mined diamond without advanced testing equipment.
            </p>
          </div>
        </div>
        <dl className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-3">
          {[
            { k: 'Composition', v: 'Pure carbon', d: 'The same element, in the same crystal structure, as every natural diamond.' },
            { k: 'Hardness', v: '10 Mohs', d: 'The hardest material on earth — resistant to scratches from everyday wear.' },
            { k: 'Refractive index', v: '2.42', d: 'The optical property behind a diamond’s brilliance, fire and sparkle.' },
          ].map((x) => (
            <div key={x.k} className="flex flex-col bg-ivory p-8">
              <dt className="label-caps text-taupe">{x.k}</dt>
              <dd className="mt-3 font-serif text-[2.4rem] font-light leading-none">{x.v}</dd>
              <dd className="mt-3 text-[14px] leading-relaxed text-taupe">{x.d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ───────── how they are grown ───────── */}
      <section id="how-they-are-grown" aria-labelledby="grown-title" className="scroll-mt-40 bg-porcelain py-16 md:py-24">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">02 · The Science</p>
            <h2 id="grown-title" className="h-section">
              Two ways to grow a diamond
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-taupe">
              Every lab-grown diamond starts with a tiny slice of existing diamond, called a seed. Growers use one of two proven methods to build new diamond
              crystal upon it, atom by atom.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {[
              {
                key: 'cvd',
                abbr: 'CVD',
                name: 'Chemical Vapour Deposition',
                art: <CvdIllustration className="h-full w-full" />,
                text: 'Diamond seeds are placed in a sealed vacuum chamber filled with a carbon-rich gas, usually methane and hydrogen. Microwaves heat the gas into a glowing plasma, freeing carbon atoms that settle onto the seeds and build the crystal up in fine layers over several weeks.',
                facts: ['Growth in thin, even layers', 'Excellent clarity potential', 'Typically 3–6 weeks per crystal'],
              },
              {
                key: 'hpht',
                abbr: 'HPHT',
                name: 'High Pressure, High Temperature',
                art: <HphtIllustration className="h-full w-full" />,
                text: 'A press recreates the crushing force and intense heat found deep within the earth. Carbon dissolves in a molten metal solvent and crystallises onto the diamond seed, growing a single crystal from the centre outwards.',
                facts: ['Mirrors natural formation', 'Often exceptionally colourless', 'Grows in days to weeks'],
              },
            ].map((m, i) => (
              <Reveal key={m.key} delay={i * 0.1} className="flex h-full flex-col border border-line bg-ivory">
                <div className="aspect-[9/7] border-b border-line bg-white p-6 sm:p-10">{m.art}</div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="font-serif text-[2.2rem] font-light leading-none text-gold">{m.abbr}</p>
                  <h3 className="mt-2 font-serif text-2xl">{m.name}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-charcoal/90">{m.text}</p>
                  <ul className="mt-6 space-y-2 border-t border-line pt-5">
                    {m.facts.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[14px] text-charcoal">
                        <Check className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { t: 'Physically identical', d: 'The same hardness, density and thermal conductivity — durable enough for a lifetime of everyday wear.' },
              { t: 'Chemically identical', d: 'Pure carbon in a cubic crystal lattice. Not a coating, a composite or a simulant — a diamond, through and through.' },
              { t: 'Optically identical', d: 'The same refraction and dispersion, so a well-cut lab-grown diamond shows the same brilliance, fire and scintillation.' },
            ].map((x) => (
              <div key={x.t} className="border-t border-ink pt-5">
                <h3 className="font-serif text-xl">{x.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-taupe">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 4Cs ───────── */}
      <section id="four-cs" aria-labelledby="fourcs-title" className="container-x scroll-mt-40 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">03 · Quality</p>
          <h2 id="fourcs-title" className="h-section">
            The 4Cs, made simple
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-taupe">
            Lab-grown diamonds are graded on exactly the same scales as mined diamonds. Understanding the 4Cs helps you decide where to prioritise — and where you
            can save without seeing a difference.
          </p>
        </div>

        <div className="mt-14 space-y-16 md:space-y-24">
          <FourC n="Cut" eyebrow="The most important C" title="Cut: where the sparkle comes from">
            <p>
              Cut describes how well a diamond&apos;s facets are angled and proportioned to return light to your eye. It has the greatest influence on beauty: a
              superbly cut diamond can look larger and brighter than a heavier stone cut poorly. Every centre diamond we set is graded Very Good, Excellent or Ideal for cut.
            </p>
            <CutDiagram className="mt-8 border border-line" />
          </FourC>

          <FourC n="Colour" eyebrow="D to Z" title="Colour: the absence of tint">
            <p>
              Diamond colour is graded from D (completely colourless) down the alphabet as a faint warmth increases. Differences between neighbouring grades are
              almost impossible to see once a diamond is set. Our centre diamonds are D to H — colourless to near-colourless.
            </p>
            <ColorScale className="mt-8" />
          </FourC>

          <FourC n="Clarity" eyebrow="FL to I3" title="Clarity: nature’s fingerprints">
            <p>
              Clarity grades the tiny internal features, called inclusions, that form as a diamond grows. Most are invisible without 10x magnification. Our centre
              diamonds range from Flawless to SI1, and our gemologists confirm that every one is eye-clean.
            </p>
            <ClarityScale className="mt-8 border border-line" />
          </FourC>

          <FourC n="Carat" eyebrow="Weight, not size" title="Carat: the weight of the stone">
            <p>
              One carat weighs 0.2 grams. Carat measures weight rather than visible size, so two diamonds of the same weight can face up differently depending on
              their cut and shape. Below is the approximate diameter of well-cut round diamonds.
            </p>
            <CaratScale className="mt-10 border-t border-line pt-10" />
          </FourC>
        </div>

        <div className="mt-20 border-t border-line pt-14">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="eyebrow mb-3">And a fifth consideration</p>
              <h3 className="font-serif text-[2rem] font-light leading-tight">Ten shapes, one standard</h3>
            </div>
            <p className="max-w-md text-[14px] text-taupe">Shape is a matter of personal taste. Explore pieces by the shape you love.</p>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
            {SHAPES.map((s) => (
              <li key={s.slug}>
                <Link href={`/collections/shape/${s.slug}`} className="group flex h-full flex-col items-center bg-ivory px-4 py-8 text-center transition-colors hover:bg-white">
                  <ShapeIcon shape={s.slug} size={52} className="text-charcoal transition-colors duration-300 group-hover:text-gold" />
                  <span className="label-caps mt-4 text-ink">{s.label}</span>
                  <span className="mt-2 text-[12.5px] leading-snug text-taupe">{s.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── certification ───────── */}
      <section id="certification" aria-labelledby="cert-title" className="scroll-mt-40 border-y border-line bg-white py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-3">04 · Trust</p>
            <h2 id="cert-title" className="h-section">
              Independently certified by IGI &amp; GIA
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-charcoal/90">
              Every {site.name} centre diamond is accompanied by a grading report from the International Gemological Institute (IGI) or the Gemological Institute of
              America (GIA) — two of the world&apos;s most respected independent laboratories. The report confirms that your diamond is laboratory-grown and records
              its measurements and quality in detail, so you know exactly what you are buying.
            </p>
            <h3 className="mt-10 font-serif text-2xl">How to verify your report</h3>
            <ol className="mt-5 space-y-4">
              {[
                'Find the report number printed on your grading report — it also appears in your order confirmation.',
                'Look closely at the diamond’s girdle (its outer edge) under a jeweler’s loupe: most graded stones carry the same number in a microscopic laser inscription.',
                'Visit the laboratory’s official website — igi.org or gia.edu — and enter the number in its report-check service.',
                'Confirm that the shape, carat weight, colour, clarity and measurements match your report and your diamond.',
              ].map((t, i) => (
                <li key={t} className="flex gap-4 text-[15px] leading-relaxed text-charcoal/90">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold font-serif text-gold">{i + 1}</span>
                  <span className="pt-1">{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-6">
            <figure className="border border-line bg-ivory p-6 sm:p-10">
              <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                <div>
                  <p className="label-caps text-taupe">Laboratory-Grown Diamond Report</p>
                  <p className="mt-2 font-serif text-2xl">Sample report</p>
                </div>
                <span className="h-16 w-16 shrink-0">
                  <ShapeIcon shape="oval" size={64} className="text-gold" />
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 text-[13px]">
                {[
                  ['Shape & cutting style', 'Oval brilliant'],
                  ['Carat weight', '1.52 ct'],
                  ['Colour grade', 'E'],
                  ['Clarity grade', 'VVS2'],
                  ['Polish', 'Excellent'],
                  ['Symmetry', 'Excellent'],
                  ['Fluorescence', 'None'],
                  ['Growth method', 'CVD'],
                  ['Measurements', '9.12 × 6.48 × 4.01 mm'],
                  ['Inscription', 'Report number on girdle'],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-line py-3">
                    <dt className="text-[10.5px] uppercase tracking-[0.14em] text-taupe">{k}</dt>
                    <dd className="mt-1 text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <figcaption className="mt-5 text-[12px] leading-relaxed text-taupe">
                An illustrative example of the information found on a grading report. Your diamond&apos;s own report accompanies your jewelry.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────── comparison ───────── */}
      <section id="comparison" aria-labelledby="compare-title" className="container-x scroll-mt-40 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">05 · Side by Side</p>
          <h2 id="compare-title" className="h-section">
            Lab-grown vs mined diamonds
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-taupe">The same diamond in every way you can see and feel. The differences lie in where it comes from — and what it costs.</p>
        </div>
        <div className="mt-10 overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <caption className="sr-only">Comparison of lab-grown and mined diamonds</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-[32%] px-5 py-4 text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Property
                </th>
                <th scope="col" className="bg-porcelain px-5 py-4 text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
                  Lab-grown diamond
                </th>
                <th scope="col" className="px-5 py-4 text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Mined diamond
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPARISON.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-5 py-4 align-top font-normal text-charcoal">
                    {r.label}
                  </th>
                  <td className="bg-porcelain/60 px-5 py-4 align-top text-ink">
                    <span className="flex items-start gap-2">
                      {r.same ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden /> : <span className="w-4 shrink-0" aria-hidden />}
                      {r.lab}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-charcoal/80">
                    <span className="flex items-start gap-2">
                      {r.same ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-taupe" strokeWidth={1.5} aria-hidden /> : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-stone" strokeWidth={1.5} aria-hidden />}
                      {r.mined}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────── responsibility & value ───────── */}
      <section id="responsibility" aria-labelledby="resp-title" className="scroll-mt-40 bg-ink py-16 text-ivory md:py-24">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-gold-light">06 · A Considered Choice</p>
            <h2 id="resp-title" className="h-section text-ivory">
              Responsibility &amp; value, without compromise
            </h2>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {[
              {
                t: 'No mining',
                d: 'Lab-grown diamonds require no excavation of land or riverbeds. We work with established growers who disclose how and where every stone is produced, so each diamond’s origin is known.',
              },
              {
                t: 'A shorter journey',
                d: 'From grower to cutter to our own workshop, our diamonds pass through far fewer hands. That transparency is reflected in the price you pay — and in the certainty of where your diamond began.',
              },
              {
                t: 'More diamond for your budget',
                d: 'Because lab-grown diamonds cost considerably less than mined diamonds of the same quality, you can choose a larger stone, a finer grade or a more elaborate setting for the same investment.',
              },
            ].map((x) => (
              <div key={x.t} className="border-t border-white/20 pt-6">
                <h3 className="font-serif text-2xl text-ivory">{x.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ivory/70">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 max-w-2xl text-[14px] leading-relaxed text-ivory/60">
            Every piece is then made by our own artisans — read about our{' '}
            <Link href="/pages/manufacturing" className="text-ivory underline decoration-white/40 underline-offset-4 hover:decoration-ivory">
              six-step manufacturing process
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection
        items={FAQS}
        title="Your questions, answered"
        intro={
          <>
            More answers about orders, shipping and sizing are in our <TextLink href="/pages/faq">full FAQ</TextLink>.
          </>
        }
        className="scroll-mt-40"
      />

      <CtaBand
        eyebrow="Find your diamond"
        title="Ready to choose yours?"
        text="Explore engagement rings set with certified lab-grown diamonds, or browse every design in our collection."
      >
        <ButtonLink href="/engagement-rings" size="lg">
          Shop Engagement Rings
        </ButtonLink>
        <ButtonLink href="/collections/all" variant="outline" size="lg">
          Explore All Jewelry
        </ButtonLink>
      </CtaBand>
    </>
  );
}

function FourC({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <Reveal className="grid gap-8 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-4">
        <p className="font-serif text-[4.5rem] font-light leading-none text-gold/80" aria-hidden>
          {n}
        </p>
        <p className="eyebrow mt-4">{eyebrow}</p>
        <h3 className="mt-3 font-serif text-[1.9rem] font-light leading-tight">{title}</h3>
      </div>
      <div className="text-[15px] leading-relaxed text-charcoal/90 lg:col-span-8">{children}</div>
    </Reveal>
  );
}
