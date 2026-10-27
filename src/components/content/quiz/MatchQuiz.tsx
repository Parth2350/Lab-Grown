'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { MATCH_BUDGETS, MATCH_CATEGORIES, MATCH_METALS, MATCH_OCCASIONS } from '@/config/quiz';
import { currencyInfo, INR_PER_USD } from '@/lib/currency';
import { catalogSrc, isCatalogMedia } from '@/lib/catalog';
import type { ProductCard as Card } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/product/ProductCard';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { postJson } from '../forms/client';

const STEPS = ['Occasion', 'What for', 'Budget', 'Your taste', 'Your matches'];
const KEY = 'tvj_match';

type Tile = { id: string; name: string; image: string };
type State = {
  step: number;
  occasion?: string;
  categories: string[];
  budget?: number;
  metal?: string;
  liked: string[];
  tiles?: Tile[];
  results?: Card[];
  saved?: boolean;
};
const START: State = { step: 0, categories: [], liked: [] };

const check = <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-gold text-ink">✓</span>;

/** The brilliancecarat.com quiz: occasion → what for → budget → taste → matches, remembered for the browser session. */
export function MatchQuiz({ categoryImages }: { categoryImages: Record<string, string | undefined> }) {
  const currency = useCurrency();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [s, setS] = useState<State>(START);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  // rupee ranges in India; elsewhere the partner's dollar ranges at its rate, as on brilliancecarat.com (Under CAD$1,057)
  const rupees = currency === 'INR';
  const budgets = rupees ? MATCH_BUDGETS.INR : MATCH_BUDGETS.USD;
  const unit = (n: number) => currencyInfo(currency).prefix + (rupees ? n.toLocaleString('en-IN') : Math.round(n * currencyInfo(currency).perUsd).toLocaleString('en-US'));
  const budgetLabel = ([min, max]: readonly [number, number | null]) => (max == null ? `${unit(min)}+` : min === 0 ? `Under ${unit(max)}` : `${unit(min)} – ${unit(max)}`);
  const paise = (n: number) => Math.round(rupees ? n * 100 : n * 100 * INR_PER_USD);

  // pick up where the shopper left off (this tab), else a signed-in shopper's saved matches
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY);
      if (stored) return setS({ ...START, ...(JSON.parse(stored) as State) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s]);
  useEffect(() => {
    if (!signedIn || s.step !== 0 || s.occasion) return;
    void fetch('/api/quiz')
      .then((r) => r.json())
      .then((j: { saved?: { products: Card[] } | null }) => {
        if (j.saved?.products.length) setS((prev) => (prev.step === 0 && !prev.occasion ? { ...START, step: 4, results: j.saved!.products, saved: true } : prev));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the session is known
  }, [signedIn]);

  const answers = (liked: string[]) => {
    const range = s.budget != null ? budgets[s.budget] : undefined;
    return { occasion: s.occasion, categories: s.categories, budget: range ? { min: paise(range[0]), max: range[1] == null ? null : paise(range[1]) } : null, metal: s.metal ?? null, liked };
  };

  const fetchStep = async <T,>(step: 'taste' | 'match', liked: string[]) => {
    setBusy(true);
    setError('');
    const res = await postJson<T>('/api/quiz', { step, ...answers(liked) });
    setBusy(false);
    if (!res.ok) setError(res.error);
    return res.ok ? res.data : null;
  };

  const toTaste = async () => {
    const data = await fetchStep<{ tiles: Tile[] }>('taste', []);
    if (data) update({ step: 3, tiles: data.tiles, liked: [] });
  };
  const toMatches = async () => {
    const data = await fetchStep<{ products: Card[] }>('match', s.liked);
    if (data) update({ step: 4, results: data.products, saved: signedIn });
  };

  // matches found before signing in are saved once the shopper is back, signed in
  useEffect(() => {
    if (signedIn && s.step === 4 && s.results && !s.saved && s.occasion) void toMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when sign-in completes
  }, [signedIn]);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const canContinue = s.step === 0 ? !!s.occasion : s.step === 1 ? s.categories.length > 0 : s.step === 2 ? s.budget != null : true;
  const next = () => (s.step === 2 ? void toTaste() : s.step === 3 ? void toMatches() : update({ step: s.step + 1 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      {/* five equal steps, bars on one line, each label centred under its bar */}
      <ol className="mx-auto mb-10 grid max-w-2xl grid-cols-5 items-start gap-1.5 sm:gap-3" aria-label="Quiz progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === s.step ? 'step' : undefined}>
            <div className={cn('h-1 rounded-full', i <= s.step ? 'bg-gold' : 'bg-line')} />
            {/* phones: smaller, tighter letters so the longest word ("Occasion") fits its fifth of the width */}
            <p className={cn('mt-2 text-center text-[10.5px] uppercase leading-snug tracking-[0.04em] sm:whitespace-nowrap sm:text-2xs sm:tracking-luxe', i === s.step ? 'text-ink' : 'text-taupe')}>{label}</p>
          </li>
        ))}
      </ol>

      {s.step === 0 && (
        <div>
          <Heading title="What's the occasion?" text="We'll tailor everything to it." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MATCH_OCCASIONS.map((o, i) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={s.occasion === o.value}
                onClick={() => setS((prev) => ({ ...prev, occasion: o.value, categories: prev.categories.length ? prev.categories : [...o.categories], step: 1 }))}
                className={cn('group relative overflow-hidden rounded-xl border text-left transition', s.occasion === o.value ? 'border-ink ring-2 ring-gold/60' : 'border-line hover:border-gold')}
              >
                <span className="relative block aspect-[4/3] bg-sand">
                  <Image src={o.image} alt="" fill priority={i < 3} sizes="(min-width:640px) 33vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                </span>
                <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <span className="block font-serif text-2xl leading-tight">{o.label}</span>
                  <span className="text-[15px] text-white/80">{o.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {s.step === 1 && (
        <div>
          <Heading title="What are you looking for?" text="Pick as many as you like." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MATCH_CATEGORIES.map((c) => {
              const on = s.categories.includes(c.slug);
              const image = categoryImages[c.slug];
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setS((prev) => ({ ...prev, categories: toggle(prev.categories, c.slug) }))}
                  className={cn('group relative overflow-hidden rounded-xl border text-left transition', on ? 'border-ink ring-2 ring-gold/60' : 'border-line hover:border-gold')}
                >
                  <span className="relative block aspect-[4/3] bg-sand">
                    {/* six fixed photos, so these are resized (catalogue photos elsewhere are served as-is) */}
                    {image && <Image src={image} alt="" fill sizes="(min-width:640px) 33vw, 50vw" className="object-cover" />}
                    {on && check}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-3.5 font-serif text-xl leading-tight text-black">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {s.step === 2 && (
        <div>
          <Heading title="What's your budget?" text="An honest range helps us match you well." />
          <div className="mx-auto grid max-w-md gap-3">
            {budgets.map((range, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={s.budget === i}
                onClick={() => update({ budget: i })}
                className={cn('rounded-xl border px-5 py-4 text-left font-serif text-xl transition', s.budget === i ? 'border-ink bg-ivory text-ink ring-2 ring-gold/50' : 'border-line text-ink hover:border-gold')}
              >
                {budgetLabel(range)}
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-md">
            <p className="mb-2 text-2xs uppercase tracking-luxe text-taupe">Preferred metal (optional)</p>
            <div className="flex flex-wrap gap-2">
              {MATCH_METALS.map((m) => (
                <button
                  key={m.slug}
                  type="button"
                  aria-pressed={s.metal === m.slug}
                  onClick={() => update({ metal: s.metal === m.slug ? undefined : m.slug })}
                  className={cn('rounded-full border px-4 py-2 text-sm transition', s.metal === m.slug ? 'border-ink bg-ink text-white' : 'border-line text-ink hover:border-gold')}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {s.step === 3 && (
        <div>
          <Heading title="Tap the ones you love" text="This teaches us your taste — pick a few that catch your eye." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(s.tiles ?? []).map((t) => {
              const on = s.liked.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={t.name}
                  onClick={() => setS((prev) => ({ ...prev, liked: toggle(prev.liked, t.id) }))}
                  className={cn('group relative overflow-hidden rounded-xl border-2 transition', on ? 'border-gold' : 'border-transparent hover:border-line')}
                >
                  <span className="relative block aspect-square bg-sand">
                    <Image src={catalogSrc(t.image)} alt={t.name} fill sizes="200px" unoptimized={isCatalogMedia(t.image)} className="object-cover" />
                  </span>
                  {on && check}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {s.step === 4 && (
        <div>
          <div className="mb-8 text-center">
            <p className="text-2xs uppercase tracking-luxe text-gold">Your matches</p>
            <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Chosen for you</h1>
            <p className="mt-2 text-taupe">
              Ranked from your taste.
              {!signedIn && (
                <>
                  {' '}
                  <Link href="/account/login?callbackUrl=/find-your-match" className="text-ink underline">
                    Sign in
                  </Link>{' '}
                  to save this.
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {(s.results ?? []).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mx-auto mt-6 max-w-md text-center text-[15px] text-danger">
          {error}
        </p>
      )}

      {s.step < 4 && (
        <div className="mx-auto mt-10 flex max-w-md items-center justify-between">
          <button type="button" disabled={s.step === 0} onClick={() => update({ step: s.step - 1 })} className="text-2xs font-semibold uppercase tracking-luxe text-taupe disabled:opacity-0">
            ← Back
          </button>
          <button
            type="button"
            disabled={!canContinue || busy}
            onClick={next}
            className="rounded-full bg-ink px-8 py-3.5 text-2xs font-semibold uppercase tracking-luxe text-white transition hover:bg-charcoal disabled:opacity-40"
          >
            {busy ? 'One moment…' : s.step === 3 ? 'See my matches →' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="mt-2 text-taupe">{text}</p>
    </div>
  );
}
