import { ArrowRight } from 'lucide-react';
import { LazyEditorialArt } from '@/components/art/LazyArt';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

const STEPS = [
  {
    title: 'Share Your Vision',
    text: 'A sketch, a photograph, an heirloom or simply a feeling — a dedicated designer listens first and asks the right questions.',
  },
  {
    title: 'Custom Design & Selection',
    text: 'Review detailed renders, then hand-select your certified diamond and metal with expert guidance at every turn.',
  },
  {
    title: 'Expert Craftsmanship & Precision',
    text: 'Once approved, your design is cast, set and finished by hand in our own workshop, with updates along the way.',
  },
  {
    title: 'Your Dream Jewelry, Made For You',
    text: 'Delivered fully insured with its certificate — one of one, and entirely yours.',
  },
];

export function Bespoke() {
  return (
    <section aria-labelledby="bespoke-title" className="relative overflow-hidden bg-ink py-16 text-ivory md:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(60% 70% at 78% 40%, rgba(168,131,74,0.16) 0%, rgba(20,19,17,0) 70%)' }}
        aria-hidden
      />
      <div className="container-x relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-3 text-gold-light">
              <span className="h-px w-8 bg-gold-light" aria-hidden />
              The Bespoke Atelier
            </p>
            <h2 id="bespoke-title" className="h-section text-ivory">
              Create Your Dream Jewelry
            </h2>
            <p className="mt-3 font-serif text-[1.5rem] font-light italic leading-snug text-gold-light sm:text-[1.75rem]">Bespoke Jewelry, Made Just For You</p>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ivory/70 sm:text-base">
              Some pieces cannot be found — only imagined. Our bespoke atelier turns your story into a one-of-a-kind jewel, guided by the same designers and master
              craftspeople who make every piece we sell.
            </p>
          </Reveal>

          <ol className="mt-10 border-t border-white/10">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-b border-white/10">
                <Reveal delay={i * 0.06} y={12} className="grid grid-cols-[2.75rem_1fr] gap-2 py-5">
                  <span className="pt-0.5 font-serif text-xl leading-none text-gold-light">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-serif text-[1.3rem] leading-tight text-ivory">{step.title}</h3>
                    <p className="mt-1.5 text-[16px] leading-relaxed text-ivory/60">{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <ButtonLink href="/bespoke" variant="light" size="lg" className="group mt-10 w-full px-5 tracking-[0.12em] xs:px-9 xs:tracking-[0.18em] sm:w-auto">
            Start Your Bespoke Journey
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
          </ButtonLink>
        </div>

        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="relative mx-auto max-w-[620px] border border-white/10 p-4 sm:p-8">
            <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-gold-light/70" aria-hidden />
            <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-gold-light/70" aria-hidden />
            <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-gold-light/70" aria-hidden />
            <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-gold-light/70" aria-hidden />
            <LazyEditorialArt scene="bespoke" className="block aspect-[520/560] w-full" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
