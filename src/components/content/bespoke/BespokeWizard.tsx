'use client';
/* eslint-disable @next/next/no-img-element -- review thumbnails are local blob: URLs */
import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, HelpCircle, Pencil } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { LazyJewelryArt, LazyLooseDiamond } from '@/components/art/LazyArt';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { Button, ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { TYPE_ART } from '../art-presets';
import {
  BESPOKE_BUDGETS,
  BESPOKE_CARATS,
  BESPOKE_METALS,
  BESPOKE_SHAPES,
  BESPOKE_TYPES,
  bespokeSchema,
  firstErrors,
  labelFor,
  type FieldErrors,
} from '../forms/schemas';
import { CountryDatalist, FormAlert, Honeypot, TextareaField, TextField, focusFirstError, postJson } from '../forms/client';
import { InspirationUploader, type UploadItem } from './InspirationUploader';
import { OptionCard } from './OptionCard';

type Data = {
  jewelryType: string;
  shape: string;
  carat: string;
  metal: string;
  budget: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
};

const EMPTY: Data = { jewelryType: '', shape: '', carat: '', metal: '', budget: '', name: '', email: '', phone: '', country: '', notes: '' };

const STEPS = [
  { id: 'type', label: 'Jewelry', title: 'What would you like us to create?', subtitle: 'Choose the piece you are dreaming of — every design begins here.' },
  { id: 'shape', label: 'Shape', title: 'Choose a diamond shape', subtitle: 'Not sure yet? Our gemologists will show you a few side by side.' },
  { id: 'carat', label: 'Carat', title: 'How large should the centre diamond be?', subtitle: 'For pieces with several stones, think of the total presence you would like.' },
  { id: 'metal', label: 'Metal', title: 'Which metal speaks to you?', subtitle: 'All of our pieces are cast in solid 9K, 10K, 14K or 18K gold.' },
  { id: 'budget', label: 'Budget', title: 'What budget feels comfortable?', subtitle: 'This helps us propose the right diamond — we will never push beyond it.' },
  { id: 'inspiration', label: 'Inspiration', title: 'Share your inspiration', subtitle: 'Optional — photos, screenshots or sketches help us understand your taste.' },
  { id: 'details', label: 'Details', title: 'Tell us about you', subtitle: 'So your personal design consultant can reach you.' },
  { id: 'review', label: 'Review', title: 'Review your request', subtitle: 'Take a moment to check everything — you can edit any step.' },
] as const;

const STEP_FIELDS: Record<number, (keyof Data)[]> = {
  0: ['jewelryType'],
  1: ['shape'],
  2: ['carat'],
  3: ['metal'],
  4: ['budget'],
  6: ['name', 'email', 'phone', 'country', 'notes'],
};

const CARAT_SIZE: Record<string, number> = { 'under-1': 26, '1-1.5': 32, '1.5-2': 37, '2-3': 42, '3-plus': 48 };

function fieldStep(field: string) {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) if ((fields as string[]).includes(field)) return Number(step);
  return field === 'inspirationUrls' ? 5 : 7;
}

export function BespokeWizard() {
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const interacted = useRef(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<Data>(EMPTY);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string; name: string; email: string } | null>(null);

  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  useEffect(() => () => uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.preview)), []);

  // When a new step's heading mounts (after the exit transition), move focus to it so
  // keyboard and screen-reader users land at the start of each step. Not on first render.
  const headingRef = useCallback((el: HTMLHeadingElement | null) => {
    if (el && interacted.current) el.focus({ preventScroll: true });
  }, []);

  const revealTop = () => {
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const set = (k: keyof Data) => (v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
    setAlert('');
  };
  const bind = (k: keyof Data) => ({ name: k, value: data[k], error: errors[k], onChange: (e: { target: { value: string } }) => set(k)(e.target.value) });

  const uploading = uploads.some((u) => u.status === 'uploading');
  const uploadedUrls = uploads.filter((u) => u.status === 'done' && u.url).map((u) => u.url!);

  function validateStep(i: number): FieldErrors {
    if (i === 5) return uploading ? { form: 'Please wait for your images to finish uploading.' } : {};
    const fields = STEP_FIELDS[i];
    if (!fields) return {};
    const shape = Object.fromEntries(fields.map((f) => [f, true])) as Record<keyof Data, true>;
    const parsed = bespokeSchema.pick(shape).safeParse(data);
    return parsed.success ? {} : firstErrors(parsed.error);
  }

  function go(to: number) {
    interacted.current = true;
    setDir(to > step ? 1 : -1);
    setStep(to);
    setAlert('');
    revealTop();
  }

  function next() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setAlert(errs.form ?? '');
      focusFirstError(formRef.current, errs);
      return;
    }
    setErrors({});
    go(Math.min(step + 1, STEPS.length - 1));
  }

  async function submit() {
    if (submitting) return;
    if (uploading) {
      setAlert('Please wait for your images to finish uploading.');
      return;
    }
    const payload = { ...data, inspirationUrls: uploadedUrls };
    const parsed = bespokeSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = firstErrors(parsed.error);
      setErrors(errs);
      go(Math.min(...Object.keys(errs).map(fieldStep)));
      return;
    }
    setSubmitting(true);
    setAlert('');
    const res = await postJson<{ ok: true; reference: string }>('/api/bespoke', { ...payload, _hp: hp });
    setSubmitting(false);
    if (res.ok) {
      interacted.current = true;
      setDone({ reference: res.data.reference, name: parsed.data.name.split(' ')[0] ?? '', email: parsed.data.email });
      setTimeout(revealTop, 60);
      return;
    }
    setErrors(res.fieldErrors);
    const fields = Object.keys(res.fieldErrors);
    if (fields.length) go(Math.min(...fields.map(fieldStep)));
    // go() clears the alert, so set it afterwards
    setAlert(fields.length ? '' : res.error);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === STEPS.length - 1) void submit();
    else next();
  }

  function reset() {
    uploads.forEach((u) => URL.revokeObjectURL(u.preview));
    setUploads([]);
    setData(EMPTY);
    setErrors({});
    setDone(null);
    setDir(-1);
    setStep(0);
  }

  const current = STEPS[step]!;
  const progress = ((step + 1) / STEPS.length) * 100;

  if (done) {
    return (
      <div ref={rootRef} className="scroll-mt-32">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="border border-line bg-white px-6 py-12 sm:px-12 sm:py-16"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold text-gold">
              <Check className="h-7 w-7" strokeWidth={1.25} aria-hidden />
            </span>
            <h3 ref={headingRef} tabIndex={-1} className="mt-6 font-serif text-[2.2rem] font-light leading-tight focus:outline-none">
              Thank you{done.name ? `, ${done.name}` : ''}. Your design journey has begun.
            </h3>
            <p className="mt-4 text-[17px] leading-relaxed text-taupe">
              Your brief is now with our design studio. Your personal design consultant will be in touch at{' '}
              <span className="break-all text-ink">{done.email}</span> — please quote your reference in any message to us.
            </p>
            <div className="mx-auto mt-8 inline-flex flex-col items-center border border-line bg-porcelain px-8 py-5">
              <span className="label-caps text-taupe">Your reference</span>
              <span className="mt-1 font-serif text-3xl tracking-[0.08em]">{done.reference}</span>
            </div>
          </div>
          <ol className="mx-auto mt-12 grid max-w-4xl gap-px border border-line bg-line sm:grid-cols-3">
            {[
              { t: 'Within 1–2 business days', d: 'Your design consultant reviews your brief and contacts you to talk through ideas.' },
              { t: 'Within a week', d: 'You receive sketches, CAD renders and hand-picked diamond options with transparent pricing.' },
              { t: 'Once you approve', d: 'Our artisans craft your piece in around 3–5 weeks, then ship it fully insured.' },
            ].map((s, i) => (
              <li key={s.t} className="bg-ivory p-6">
                <span className="font-serif text-2xl text-gold">{String(i + 1).padStart(2, '0')}</span>
                <p className="label-caps mt-4 text-ink">{s.t}</p>
                <p className="mt-2 text-[16px] leading-relaxed text-taupe">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/collections/all">Explore the Collection</ButtonLink>
            <Button variant="outline" onClick={reset}>
              Start Another Design
            </Button>
          </div>
        </m.div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="scroll-mt-32 border border-line bg-white">
      {/* progress */}
      <div className="border-b border-line px-5 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 md:hidden">
          <p className="label-caps text-ink">
            Step {step + 1} of {STEPS.length}
            <span className="text-taupe"> · {current.label}</span>
          </p>
        </div>
        <ol className="hidden grid-cols-8 gap-2 md:grid" aria-label="Request steps">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'todo';
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={i >= step}
                  onClick={() => go(i)}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={cn(
                    'group flex w-full flex-col items-start gap-2 text-left disabled:cursor-default',
                    state === 'todo' ? 'text-taupe/70' : 'text-ink',
                  )}
                >
                  <span className={cn('h-px w-full transition-colors duration-500', state === 'todo' ? 'bg-line' : 'bg-ink')} />
                  <span className="flex items-center gap-1.5 text-[12.5px] font-medium uppercase tracking-[0.14em]">
                    {state === 'done' ? <Check className="h-3 w-3 text-gold" strokeWidth={2} aria-hidden /> : <span className="tabular-nums">{i + 1}</span>}
                    <span className={cn(state === 'done' && 'group-hover:underline group-hover:underline-offset-4')}>{s.label}</span>
                    {state === 'done' && <span className="sr-only">(completed — edit)</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div
          className="mt-3 h-px w-full bg-line md:hidden"
          role="progressbar"
          aria-label="Request progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${current.label}`}
        >
          <div className="h-px bg-ink transition-[width] duration-500 ease-luxe" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-12" aria-label="Bespoke design request">
        <Honeypot value={hp} onChange={setHp} />
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}: {current.title}
        </p>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <m.div
            key={current.id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -28 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 max-w-2xl">
              <h3 ref={headingRef} tabIndex={-1} className="font-serif text-[1.9rem] font-light leading-tight focus:outline-none sm:text-[2.3rem]">
                {current.title}
              </h3>
              <p className="mt-2 text-[16px] text-taupe">{current.subtitle}</p>
            </div>

            {step === 0 && (
              <Choice legend={current.title} error={errors.jewelryType} errorId="err-jewelryType">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  {BESPOKE_TYPES.map((t) => {
                    const art = TYPE_ART[t.value];
                    return (
                      <OptionCard key={t.value} name="jewelryType" value={t.value} checked={data.jewelryType === t.value} onSelect={set('jewelryType')} describedBy={errors.jewelryType ? 'err-jewelryType' : undefined}>
                        <span className="art-tile block aspect-square p-3">
                          {art ? (
                            <LazyJewelryArt spec={art.spec} shape={art.shape} metal={art.metal} carat={art.carat ?? 1} className="block h-full w-full" title={t.label} />
                          ) : (
                            <span className="relative block h-full w-full">
                              <LazyLooseDiamond shape="cushion" className="block h-full w-full opacity-80" title="A loose diamond" />
                            </span>
                          )}
                        </span>
                        <span className="px-3 py-3 text-center text-[15px] font-normal text-ink">{t.label}</span>
                      </OptionCard>
                    );
                  })}
                </div>
              </Choice>
            )}

            {step === 1 && (
              <Choice legend={current.title} error={errors.shape} errorId="err-shape">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {BESPOKE_SHAPES.map((s) => (
                    <OptionCard key={s.value} name="shape" value={s.value} checked={data.shape === s.value} onSelect={set('shape')} describedBy={errors.shape ? 'err-shape' : undefined}>
                      <span className="flex flex-col items-center gap-3 px-2 py-5">
                        {s.value === 'not-sure' ? (
                          <HelpCircle className="h-11 w-11 text-taupe" strokeWidth={0.8} aria-hidden />
                        ) : (
                          <ShapeIcon shape={s.value} size={44} className={data.shape === s.value ? 'text-gold' : 'text-charcoal'} />
                        )}
                        <span className="text-[14px] uppercase tracking-[0.12em] text-ink">{s.label}</span>
                      </span>
                    </OptionCard>
                  ))}
                </div>
              </Choice>
            )}

            {step === 2 && (
              <Choice legend={current.title} error={errors.carat} errorId="err-carat">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {BESPOKE_CARATS.map((c) => (
                    <OptionCard key={c.value} name="carat" value={c.value} checked={data.carat === c.value} onSelect={set('carat')} describedBy={errors.carat ? 'err-carat' : undefined}>
                      <span className="flex min-h-[150px] flex-col items-center justify-end gap-3 px-3 py-5 text-center">
                        <span className="flex h-14 items-end">
                          {CARAT_SIZE[c.value] ? (
                            <ShapeIcon shape={data.shape && data.shape !== 'not-sure' ? data.shape : 'round'} size={CARAT_SIZE[c.value]} className="text-charcoal" />
                          ) : (
                            <HelpCircle className="h-10 w-10 text-taupe" strokeWidth={0.8} aria-hidden />
                          )}
                        </span>
                        <span className="font-serif text-xl leading-none text-ink">{c.label}</span>
                        <span className="text-[14px] text-taupe">{c.hint}</span>
                      </span>
                    </OptionCard>
                  ))}
                </div>
              </Choice>
            )}

            {step === 3 && (
              <Choice legend={current.title} error={errors.metal} errorId="err-metal">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {BESPOKE_METALS.map((m) => (
                    <OptionCard key={m.value} name="metal" value={m.value} checked={data.metal === m.value} onSelect={set('metal')} describedBy={errors.metal ? 'err-metal' : undefined}>
                      <span className="flex items-center gap-4 px-4 py-5">
                        <span className="h-10 w-10 shrink-0 rounded-full ring-1 ring-line" style={{ background: m.swatch }} aria-hidden />
                        <span className="text-[16px] leading-snug text-ink">{m.label}</span>
                      </span>
                    </OptionCard>
                  ))}
                </div>
              </Choice>
            )}

            {step === 4 && (
              <Choice legend={current.title} error={errors.budget} errorId="err-budget">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {BESPOKE_BUDGETS.map((b) => (
                    <OptionCard key={b.value} name="budget" value={b.value} checked={data.budget === b.value} onSelect={set('budget')} describedBy={errors.budget ? 'err-budget' : undefined}>
                      <span className="flex min-h-[72px] items-center px-5 py-4 font-serif text-xl text-ink">{b.label}</span>
                    </OptionCard>
                  ))}
                </div>
              </Choice>
            )}

            {step === 5 && <InspirationUploader items={uploads} onChange={setUploads} />}

            {step === 6 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField label="Full name" required autoComplete="name" maxLength={100} {...bind('name')} />
                <TextField label="Email" type="email" inputMode="email" required autoComplete="email" maxLength={200} {...bind('email')} />
                <TextField label="Phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={32} hint="Optional — WhatsApp works too" {...bind('phone')} />
                <TextField label="Country" autoComplete="country-name" list="bespoke-countries" maxLength={80} hint="So we can quote shipping and duties" {...bind('country')} />
                <CountryDatalist id="bespoke-countries" />
                <TextareaField
                  label="Anything else we should know?"
                  rows={5}
                  maxLength={3000}
                  counter
                  className="sm:col-span-2"
                  placeholder="Ring size, an engraving, a date you are working towards, the story behind the piece…"
                  {...bind('notes')}
                />
              </div>
            )}

            {step === 7 && (
              <Review
                data={data}
                uploads={uploads.filter((u) => u.status === 'done')}
                onEdit={go}
              />
            )}
          </m.div>
        </AnimatePresence>

        <FormAlert className="mt-6">{alert}</FormAlert>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => go(step - 1)} className="h-12 px-0 sm:px-4">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Back
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={step === 5 && uploading}>
              {step === 5 ? (uploading ? 'Uploading…' : uploads.length ? 'Continue' : 'Skip This Step') : 'Continue'}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Button>
          ) : (
            <Button type="submit" size="lg" variant="gold" loading={submitting} className="w-full sm:w-auto">
              {submitting ? 'Sending Your Request…' : 'Submit Bespoke Request'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Choice({ legend, error, errorId, children }: { legend: string; error?: string; errorId: string; children: ReactNode }) {
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="sr-only">{legend}</legend>
      {children}
      {error && (
        <p id={errorId} className="mt-4 text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Review({ data, uploads, onEdit }: { data: Data; uploads: UploadItem[]; onEdit: (step: number) => void }) {
  const rows: { label: string; value: ReactNode; step: number }[] = [
    { label: 'Jewelry', value: labelFor(BESPOKE_TYPES, data.jewelryType), step: 0 },
    { label: 'Diamond shape', value: labelFor(BESPOKE_SHAPES, data.shape), step: 1 },
    { label: 'Carat', value: labelFor(BESPOKE_CARATS, data.carat), step: 2 },
    { label: 'Metal', value: labelFor(BESPOKE_METALS, data.metal), step: 3 },
    { label: 'Budget', value: labelFor(BESPOKE_BUDGETS, data.budget), step: 4 },
    {
      label: 'Inspiration',
      value: uploads.length ? (
        <span className="flex flex-wrap justify-end gap-2">
          {uploads.map((u) => (
            <img key={u.key} src={u.preview} alt={u.name} className="h-12 w-12 border border-line object-cover" />
          ))}
        </span>
      ) : (
        <span className="text-taupe">No images shared</span>
      ),
      step: 5,
    },
    {
      label: 'Your details',
      value: (
        <span className="block break-words">
          {data.name}
          <br />
          {data.email}
          {data.phone && (
            <>
              <br />
              {data.phone}
            </>
          )}
          {data.country && (
            <>
              <br />
              {data.country}
            </>
          )}
        </span>
      ),
      step: 6,
    },
    ...(data.notes ? [{ label: 'Notes', value: <span className="block whitespace-pre-line break-words text-left sm:text-right">{data.notes}</span>, step: 6 }] : []),
  ];
  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[180px_1fr_auto] sm:py-4">
          <dt className="label-caps text-taupe">{r.label}</dt>
          <dd className="col-span-2 row-start-2 text-[16px] text-ink sm:col-span-1 sm:row-start-auto sm:text-right">{r.value}</dd>
          <button
            type="button"
            onClick={() => onEdit(r.step)}
            className="col-start-2 row-start-1 inline-flex min-h-10 items-center gap-1.5 text-[13px] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-ink sm:col-start-3"
          >
            <Pencil className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            Edit<span className="sr-only"> {r.label.toLowerCase()}</span>
          </button>
        </div>
      ))}
    </dl>
  );
}
