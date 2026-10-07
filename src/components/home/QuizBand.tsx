import { ArrowRight } from 'lucide-react';
import type { ArtSpec } from '@/components/art/JewelryArt';
import { LazyJewelryArt } from '@/components/art/LazyArt';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { QUIZ_QUESTIONS } from '@/config/quiz';
import { cn } from '@/lib/utils';

const TRIO: { spec: ArtSpec; shape: string; metal: string; carat: number; tint: string; offset: string }[] = [
  { spec: { kind: 'studs' }, shape: 'round', metal: 'white', carat: 1, tint: 'art-tile-cool', offset: 'mt-8' },
  { spec: { kind: 'ring', head: 'solitaire', band: 'pave' }, shape: 'oval', metal: 'yellow', carat: 2, tint: 'art-tile', offset: '' },
  { spec: { kind: 'pendant', head: 'halo' }, shape: 'pear', metal: 'rose', carat: 1, tint: 'art-tile-warm', offset: 'mt-8' },
];

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function QuizBand() {
  const n = QUIZ_QUESTIONS.length;
  const count = WORDS[n] ?? String(n);
  return (
    <section aria-labelledby="quiz-title" className="pt-4 md:pt-8">
      <div className="container-x">
        <Reveal className="grid grid-cols-1 items-center gap-10 overflow-hidden border border-gold/25 bg-gold-pale/45 px-5 py-10 sm:px-10 md:grid-cols-12 md:gap-8 md:py-14 lg:px-16">
          <div className="md:col-span-6 lg:col-span-5">
            <p className="eyebrow mb-3 text-gold-deep">Not sure where to begin?</p>
            <h2 id="quiz-title" className="h-section">
              Find Your Match
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-charcoal/85">
              Answer {count} quick questions about the moment, their style and your budget, and we will curate a shortlist of pieces chosen just for you.
            </p>
            <ButtonLink href="/find-your-match" size="lg" className="group mt-8 w-full sm:w-auto">
              Take the Quiz
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </ButtonLink>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:col-span-6 lg:col-span-6 lg:col-start-7" aria-hidden>
            {TRIO.map((t, i) => (
              <div key={i} className={cn('relative aspect-[4/5] overflow-hidden', t.tint, t.offset)}>
                <LazyJewelryArt spec={t.spec} shape={t.shape} metal={t.metal} carat={t.carat} className="absolute inset-0" />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
