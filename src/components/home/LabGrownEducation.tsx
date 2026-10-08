import { ArrowRight, BadgeCheck, Diamond, HandCoins, Leaf, Sparkles } from 'lucide-react';
import { LazyLooseDiamond } from '@/components/art/LazyArt';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Certified Authenticity',
    text: 'Every centre diamond is independently graded by IGI or GIA, with its report number laser-inscribed on the girdle.',
  },
  {
    icon: Sparkles,
    title: 'Exceptional Beauty',
    text: 'Cut to ideal proportions for brilliance and fire, then hand-selected for colour and clarity by eye — not just on paper.',
  },
  {
    icon: Leaf,
    title: 'Responsibly Created',
    text: 'Grown above ground from pure carbon, with full traceability from growth chamber to finished piece.',
  },
  {
    icon: HandCoins,
    title: 'Better Value',
    text: 'Pay for the diamond, not its scarcity: the same budget buys a larger, finer stone than its mined equivalent.',
  },
  {
    icon: Diamond,
    title: 'Identical in Every Way',
    text: 'Chemically, physically and optically the same as a mined diamond. Only the origin is different.',
  },
];

const FACTS = [
  { value: 'C', label: 'Pure carbon', pos: 'left-4 top-4 sm:left-6 sm:top-6' },
  { value: '10', label: 'Mohs hardness', pos: 'right-4 top-4 text-right sm:right-6 sm:top-6' },
  { value: '2.42', label: 'Refractive index', pos: 'bottom-4 left-4 sm:bottom-6 sm:left-6' },
  { value: 'IGI · GIA', label: 'Independently graded', pos: 'bottom-4 right-4 text-right sm:bottom-6 sm:right-6' },
];

export function LabGrownEducation() {
  return (
    <section aria-labelledby="labgrown-title" className="bg-porcelain py-16 md:py-24">
      <div className="container-x">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6 xl:col-span-5">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-gold" aria-hidden />
              The Lab-Grown Difference
            </p>
            <h2 id="labgrown-title" className="h-section">
              Why Choose Lab-Grown Diamonds?
            </h2>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-charcoal/85 sm:text-base">
              A lab-grown diamond is a real diamond — the same crystal of carbon, formed under the same intense heat and pressure, simply grown in a controlled environment
              rather than mined from the earth. The result is a stone with all of the brilliance and none of the compromise.
            </p>
            <ButtonLink href="/pages/lab-grown-diamonds" variant="primary" className="group mt-9 w-full px-5 tracking-[0.12em] xs:px-7 xs:tracking-[0.18em] sm:w-auto">
              Learn More About Diamonds
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </ButtonLink>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-6 xl:col-span-6 xl:col-start-7">
            <figure className="art-tile-cool relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" aria-hidden>
                <g fill="none" stroke="#A8834A" strokeWidth="0.6" opacity="0.45">
                  <circle cx="200" cy="196" r="150" strokeDasharray="1 5" />
                  <circle cx="200" cy="196" r="118" />
                  <path d="M60 60L118 114M340 60L282 114M60 340L118 282M340 340L282 282" />
                </g>
              </svg>
              <div className="absolute inset-[16%]">
                <LazyLooseDiamond shape="oval" title="An oval lab-grown diamond" className="block h-full w-full" />
              </div>
              {FACTS.map((f) => (
                <div key={f.label} className={cn('absolute', f.pos)}>
                  <p className="font-serif text-xl leading-none text-ink sm:text-2xl">{f.value}</p>
                  <p className="mt-1.5 text-[11.5px] font-medium uppercase tracking-[0.18em] text-taupe sm:text-[12px]">{f.label}</p>
                </div>
              ))}
            </figure>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:mt-20 lg:grid-cols-5 lg:gap-5">
          {REASONS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={cn(i === REASONS.length - 1 && 'sm:col-span-2 lg:col-span-1')}>
              <Reveal delay={i * 0.06} y={16} className="group flex h-full gap-4 border border-line bg-ivory p-5 transition-colors duration-500 hover:border-gold/50 sm:block sm:p-6 lg:p-7">
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-gold transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5" strokeWidth={1} aria-hidden />
                <div>
                  <h3 className="font-serif text-[1.3rem] leading-tight text-ink sm:mt-6 sm:text-[1.35rem]">{title}</h3>
                  <p className="mt-1.5 text-[16px] leading-relaxed text-taupe sm:mt-2.5">{text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
