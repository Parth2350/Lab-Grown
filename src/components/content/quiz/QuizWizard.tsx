'use client';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeft, ArrowRight, HelpCircle, Pencil, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { QuizOption, QuizQuestion } from '@/config/quiz';
import { JewelryArt } from '@/components/art/JewelryArt';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { ProductCard } from '@/components/product/ProductCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { METAL_COLORS } from '@/lib/catalog';
import type { ProductCard as Card } from '@/lib/types';
import { cn } from '@/lib/utils';
import { QUIZ_TYPE_ART } from '../art-presets';
import { FormAlert, postJson } from '../forms/client';

type Answers = Record<string, string>;
type Result = { id: string | null; answers: Answers; exactCount: number; products: Card[]; links: { label: string; href: string }[] };
type Phase = 'intro' | 'question' | 'loading' | 'results';

const STORAGE_KEY = 'find-your-match:v1';
const SHORT_LABELS: Record<string, string> = { recipient: 'For', occasion: 'Occasion', metal: 'Metal', shape: 'Shape', budget: 'Budget', style: 'Style', type: 'Piece' };
const ease = [0.22, 1, 0.36, 1] as const;

function readStored(): { answers: Answers; result: Result } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { answers?: Answers; result?: Result };
    return v.answers && v.result?.products ? { answers: v.answers, result: v.result } : null;
  } catch {
    return null;
  }
}

export function QuizWizard({ questions }: { questions: QuizQuestion[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  // Restore a previous result for this browser tab (e.g. after viewing a product and coming back).
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setAnswers(stored.answers);
      setResult(stored.result);
      setPhase('results');
    }
    return () => clearTimeout(advanceTimer.current);
  }, []);

  // Headings take focus as they mount (after each transition) once the shopper has interacted,
  // so keyboard and screen-reader users always start at the new question.
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el && interacted.current) el.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!interacted.current) return;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < -40) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [phase, index]);

  const question = questions[index];

  const submit = useCallback(async (final: Answers) => {
    setPhase('loading');
    setError('');
    const started = Date.now();
    const res = await postJson<Result & { ok: true }>('/api/quiz', { answers: final });
    // a short, deliberate pause makes the curation feel considered rather than instant
    const wait = Math.max(0, 900 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    if (res.ok) {
      const r: Result = { id: res.data.id, answers: res.data.answers, exactCount: res.data.exactCount, products: res.data.products, links: res.data.links };
      setResult(r);
      setPhase('results');
      setEditing(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: final, result: r }));
      } catch {
        /* storage unavailable — results still show */
      }
    } else {
      setError(res.error);
      setPhase('question');
    }
  }, []);

  function choose(q: QuizQuestion, opt: QuizOption) {
    interacted.current = true;
    const next = { ...answers, [q.id]: opt.value };
    setAnswers(next);
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (editing || index === questions.length - 1) void submit(next);
      else {
        setDir(1);
        setIndex((i) => i + 1);
      }
    }, 280);
  }

  function start() {
    interacted.current = true;
    setDir(1);
    setIndex(0);
    setEditing(false);
    setPhase('question');
  }

  function back() {
    interacted.current = true;
    clearTimeout(advanceTimer.current);
    if (editing) {
      setEditing(false);
      setPhase('results');
      return;
    }
    if (index === 0) {
      setPhase('intro');
      return;
    }
    setDir(-1);
    setIndex((i) => i - 1);
  }

  function edit(qIndex: number) {
    interacted.current = true;
    setEditing(true);
    setDir(-1);
    setIndex(qIndex);
    setPhase('question');
  }

  function retake() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAnswers({});
    setResult(null);
    start();
  }

  const progress = phase === 'results' || phase === 'loading' ? 100 : ((index + (answers[question?.id ?? ''] ? 1 : 0)) / questions.length) * 100;

  return (
    <div ref={rootRef} className="scroll-mt-32">
      <p className="sr-only" aria-live="polite">
        {phase === 'question' && question ? `Question ${index + 1} of ${questions.length}: ${question.title}` : phase === 'loading' ? 'Finding your matches…' : phase === 'results' ? 'Your matches are ready.' : ''}
      </p>

      {phase === 'intro' && (
        <m.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="grid overflow-hidden border border-line bg-white lg:grid-cols-2"
          aria-labelledby="quiz-intro-title"
        >
          <div className="art-tile-warm relative grid min-h-[300px] grid-cols-3 items-center gap-2 p-6 sm:min-h-[380px] sm:p-10">
            {(['engagement', 'earrings', 'necklace'] as const).map((k, i) => {
              const a = QUIZ_TYPE_ART[k]!;
              return (
                <m.div
                  key={k}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: i === 1 ? -18 : 0 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease }}
                  className="aspect-square"
                >
                  <JewelryArt spec={a.spec} shape={a.shape} metal={['yellow', 'white', 'rose'][i]} carat={a.carat ?? 1} className="h-full w-full" />
                </m.div>
              );
            })}
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="eyebrow mb-4">{questions.length} questions · about a minute</p>
            <h2 id="quiz-intro-title" ref={headingRef} tabIndex={-1} className="font-serif text-[2.4rem] font-light leading-[1.05] focus:outline-none sm:text-[3rem]">
              Let us help you find the one
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-taupe">
              Tell us who you are shopping for, what you love and what feels right for your budget. We will curate a short edit of pieces chosen just for you.
            </p>
            <div className="mt-9">
              <Button size="lg" onClick={start} className="w-full sm:w-auto">
                Begin the Quiz
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Button>
            </div>
          </div>
        </m.section>
      )}

      {(phase === 'question' || phase === 'loading') && question && (
        <section className="border border-line bg-white" aria-labelledby="quiz-question-title">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-8">
            <button type="button" onClick={back} disabled={phase === 'loading'} className="label-caps -ml-2 inline-flex min-h-10 items-center gap-2 px-2 text-taupe transition-colors hover:text-ink disabled:opacity-40">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              {editing ? 'Results' : 'Back'}
            </button>
            <p className="label-caps tabular-nums text-taupe">
              {phase === 'loading' ? 'Curating' : `${index + 1} / ${questions.length}`}
            </p>
          </div>
          <div
            className="h-[2px] w-full bg-porcelain"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <m.div className="h-full bg-gold" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease }} />
          </div>

          <div className="relative min-h-[460px] overflow-hidden px-4 py-10 sm:px-8 sm:py-14 lg:px-16">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              {phase === 'loading' ? (
                <m.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="relative h-24 w-24">
                    <m.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
                      <ShapeIcon shape={answers.shape && answers.shape !== 'any' ? answers.shape : 'round'} size={96} className="text-gold" />
                    </m.div>
                  </div>
                  <p className="mt-8 font-serif text-3xl font-light">Curating your matches…</p>
                  <p className="mt-2 text-[16px] text-taupe">Weighing style, metal and budget across every design.</p>
                </m.div>
              ) : (
                <m.div
                  key={question.id}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 36 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -36 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <div className="mx-auto mb-10 max-w-2xl text-center">
                    <h2 id="quiz-question-title" ref={headingRef} tabIndex={-1} className="font-serif text-[2rem] font-light leading-tight focus:outline-none sm:text-[2.6rem]">
                      {question.title}
                    </h2>
                    {question.subtitle && <p className="mt-3 text-[17px] text-taupe">{question.subtitle}</p>}
                  </div>
                  <Options question={question} value={answers[question.id]} onChoose={(o) => choose(question, o)} />
                  <FormAlert className="mx-auto mt-8 max-w-xl">{error}</FormAlert>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {phase === 'results' && result && (
        <Results result={result} questions={questions} answers={answers} onEdit={edit} onRetake={retake} headingRef={headingRef} />
      )}
    </div>
  );
}

// ───────────────────────────── options ─────────────────────────────

function OptionButton({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group relative flex h-full w-full flex-col items-center justify-center border bg-white text-center transition-[border-color,box-shadow,background-color] duration-300 ease-luxe',
        selected ? 'border-ink shadow-[inset_0_0_0_1px_#141311]' : 'border-line hover:border-ink/60 hover:bg-ivory',
        className,
      )}
    >
      {children}
    </button>
  );
}

const METAL_SWATCH: Record<string, string> = Object.fromEntries(METAL_COLORS.map((m) => [m.slug, m.swatch]));

function Options({ question, value, onChoose }: { question: QuizQuestion; value?: string; onChoose: (o: QuizOption) => void }) {
  const opts = question.options;

  if (question.layout === 'shapes' || question.id === 'shape') {
    return (
      <ul className="mx-auto grid max-w-4xl grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
        {opts.map((o) => (
          <li key={o.value}>
            <OptionButton selected={value === o.value} onClick={() => onChoose(o)} className="gap-3 px-2 py-5">
              {o.value === 'any' ? (
                <HelpCircle className="h-10 w-10 text-taupe" strokeWidth={0.8} aria-hidden />
              ) : (
                <ShapeIcon shape={o.value} size={42} className={cn('transition-colors', value === o.value ? 'text-gold' : 'text-charcoal group-hover:text-gold')} />
              )}
              <span className="text-[13px] uppercase tracking-[0.14em] text-ink">{o.label}</span>
            </OptionButton>
          </li>
        ))}
      </ul>
    );
  }

  if (question.id === 'type') {
    return (
      <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
        {opts.map((o) => {
          const a = QUIZ_TYPE_ART[o.value];
          return (
            <li key={o.value}>
              <OptionButton selected={value === o.value} onClick={() => onChoose(o)} className="overflow-hidden">
                {a && (
                  <span className="art-tile block aspect-[4/3] w-full p-3">
                    <JewelryArt spec={a.spec} shape={a.shape} metal={a.metal} carat={a.carat ?? 1} className="h-full w-full transition-transform duration-700 ease-luxe group-hover:scale-105" />
                  </span>
                )}
                <span className="px-3 py-4 text-[16px] text-ink">{o.label}</span>
              </OptionButton>
            </li>
          );
        })}
      </ul>
    );
  }

  if (question.id === 'metal') {
    return (
      <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
        {opts.map((o) => (
          <li key={o.value}>
            <OptionButton selected={value === o.value} onClick={() => onChoose(o)} className="gap-4 px-4 py-8">
              <span
                className="h-14 w-14 rounded-full ring-1 ring-line transition-transform duration-500 ease-luxe group-hover:scale-105"
                style={{ background: METAL_SWATCH[o.value] ?? 'conic-gradient(from 45deg,#E9CB80,#D6D9DC,#E8AE97,#E9CB80)' }}
                aria-hidden
              />
              <span className="text-[16px] text-ink">{o.label}</span>
            </OptionButton>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn('mx-auto grid max-w-3xl gap-3', opts.length > 4 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}>
      {opts.map((o) => (
        <li key={o.value}>
          <OptionButton selected={value === o.value} onClick={() => onChoose(o)} className="min-h-[88px] px-5 py-5">
            <span className="font-serif text-[1.35rem] leading-tight text-ink">{o.label}</span>
            {o.hint && <span className="mt-1.5 text-[14.5px] text-taupe">{o.hint}</span>}
          </OptionButton>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────────── results ─────────────────────────────

function Results({
  result,
  questions,
  answers,
  onEdit,
  onRetake,
  headingRef,
}: {
  result: Result;
  questions: QuizQuestion[];
  answers: Answers;
  onEdit: (i: number) => void;
  onRetake: () => void;
  headingRef: (el: HTMLHeadingElement | null) => void;
}) {
  const summary = questions
    .map((q, i) => ({ q, i, opt: q.options.find((o) => o.value === answers[q.id]) }))
    .filter((s) => s.opt);
  const alternatives = result.products.length - result.exactCount;

  return (
    <m.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} aria-labelledby="quiz-results-title">
      <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-3">Curated for you</p>
          <h2 id="quiz-results-title" ref={headingRef} tabIndex={-1} className="h-section focus:outline-none">
            Your Perfect Matches
          </h2>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-taupe">
            {result.exactCount >= result.products.length
              ? 'Every piece below matches all of your answers. Save your favourites to your wishlist, or compare them side by side.'
              : result.exactCount > 0
                ? `${result.exactCount} ${result.exactCount === 1 ? 'piece matches' : 'pieces match'} every answer — we have added ${alternatives} close ${alternatives === 1 ? 'alternative' : 'alternatives'} we think you will love.`
                : 'Nothing matched every answer exactly, so we have chosen the closest pieces in our collection. Our concierge can also create something bespoke.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
          <Button variant="outline" onClick={onRetake}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Retake Quiz
          </Button>
          <ButtonLink href="/contact" variant="ghost">
            Ask a Concierge
          </ButtonLink>
        </div>
      </div>

      <div className="mt-8">
        <p className="label-caps mb-4 text-taupe" id="quiz-answers-label">
          Your answers <span className="normal-case tracking-normal text-taupe/80">— select any to change it</span>
        </p>
        <ul className="flex flex-wrap gap-2" aria-labelledby="quiz-answers-label">
          {summary.map(({ q, i, opt }) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="group inline-flex min-h-10 items-center gap-2 border border-line bg-white px-4 py-2 text-[15px] transition-colors hover:border-ink"
              >
                <span className="text-taupe">{SHORT_LABELS[q.id] ?? q.title}:</span>
                <span className="text-ink">{opt!.label}</span>
                <Pencil className="h-3 w-3 text-taupe transition-colors group-hover:text-ink" strokeWidth={1.5} aria-hidden />
                <span className="sr-only">— change answer</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {result.products.length > 0 ? (
        <ul className="mt-12 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {result.products.map((p, i) => (
            <m.li key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.06, ease }}>
              <ProductCard product={p} priority={i < 4} />
            </m.li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 border border-line bg-white p-8 text-center text-taupe">
          We could not find pieces for those answers right now. Please <Link href="/contact" className="underline underline-offset-4">contact our concierge</Link> for a personal
          recommendation.
        </p>
      )}

      {result.links.length > 0 && (
        <nav aria-label="Continue exploring" className="mt-16 border-t border-line pt-10">
          <p className="eyebrow mb-5">Continue exploring</p>
          <ul className="flex flex-wrap gap-3">
            {result.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group inline-flex min-h-11 items-center gap-2 border border-ink/80 px-5 text-[13px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-ivory">
                  {l.label}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </m.section>
  );
}
