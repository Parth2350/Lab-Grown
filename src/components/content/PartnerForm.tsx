'use client';
import { AnimatePresence, m } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AUDIENCE_SIZES, PARTNER_TYPES, firstErrors, partnerSchema, type FieldErrors } from './forms/schemas';
import { CountryDatalist, FormAlert, Honeypot, SelectField, TextareaField, TextField, focusFirstError, postJson } from './forms/client';

type Values = {
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  website: string;
  socialHandle: string;
  audienceSize: string;
  experience: string;
  message: string;
  consent: boolean;
};

const EMPTY: Values = { name: '', email: '', phone: '', country: '', company: '', website: '', socialHandle: '', audienceSize: '', experience: '', message: '', consent: false };

export function PartnerForm({ brand }: { brand: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [firstName, setFirstName] = useState('');

  const bind = (k: Exclude<keyof Values, 'consent'>) => ({
    name: k,
    value: values[k],
    error: errors[k],
    onChange: (e: { target: { value: string } }) => {
      const v = e.target.value;
      setValues((s) => ({ ...s, [k]: v }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: '' }));
    },
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    setAlert('');
    const parsed = partnerSchema.safeParse(values);
    if (!parsed.success) {
      const errs = firstErrors(parsed.error);
      setErrors(errs);
      focusFirstError(formRef.current, errs);
      return;
    }
    setStatus('submitting');
    const res = await postJson<{ ok: true }>('/api/partner', { ...values, _hp: hp });
    if (res.ok) {
      setFirstName(parsed.data.name.split(' ')[0] ?? '');
      setValues(EMPTY);
      setErrors({});
      setStatus('sent');
      formRef.current?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setStatus('idle');
    setErrors(res.fieldErrors);
    setAlert(res.error);
    focusFirstError(formRef.current, res.fieldErrors);
  }

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">
        {status === 'submitting' ? 'Submitting your application…' : status === 'sent' ? 'Your application has been received.' : ''}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {status === 'sent' ? (
          <m.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="border border-line bg-white px-6 py-12 text-center sm:px-12 sm:py-16"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold">
              <Check className="h-6 w-6" strokeWidth={1.25} aria-hidden />
            </span>
            <h3 className="mt-6 font-serif text-3xl font-light">Application received{firstName ? `, ${firstName}` : ''}</h3>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-taupe">
              Thank you for your interest in partnering with {brand}. Our partnerships team reviews every application personally and will be in touch within five
              business days.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/collections/all" variant="primary">
                Explore the Collection
              </ButtonLink>
              <Button variant="outline" onClick={() => setStatus('idle')}>
                Submit another application
              </Button>
            </div>
          </m.div>
        ) : (
          <m.form
            key="form"
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
            aria-label="Partner program application"
          >
            <Honeypot value={hp} onChange={setHp} />
            <fieldset className="grid gap-6 sm:grid-cols-2">
              <legend className="sr-only">About you</legend>
              <p className="label-caps -mt-2 text-taupe sm:col-span-2" aria-hidden>
                About you
              </p>
              <TextField label="Full name" required autoComplete="name" maxLength={100} {...bind('name')} />
              <TextField label="Email" type="email" inputMode="email" required autoComplete="email" maxLength={200} {...bind('email')} />
              <TextField label="Phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={32} hint="Optional — include your country code" {...bind('phone')} />
              <TextField label="Country" required autoComplete="country-name" list="partner-countries" maxLength={80} {...bind('country')} />
              <CountryDatalist id="partner-countries" />
            </fieldset>

            <fieldset className="mt-10 grid gap-6 border-t border-line pt-10 sm:grid-cols-2">
              <legend className="sr-only">Your business and audience</legend>
              <p className="label-caps -mt-2 text-taupe sm:col-span-2" aria-hidden>
                Your business &amp; audience
              </p>
              <SelectField label="What best describes you?" required placeholder="Please choose" options={PARTNER_TYPES} {...bind('experience')} />
              <TextField label="Business or brand name" autoComplete="organization" maxLength={120} hint="Optional" {...bind('company')} />
              <TextField label="Website" type="url" inputMode="url" autoComplete="url" maxLength={200} placeholder="yourwebsite.com" hint="Optional" {...bind('website')} />
              <TextField label="Social handle" maxLength={120} placeholder="@yourhandle" hint="Instagram, TikTok, YouTube or Pinterest" {...bind('socialHandle')} />
              <SelectField label="Audience size" placeholder="Choose a range (optional)" options={AUDIENCE_SIZES} {...bind('audienceSize')} />
              <TextareaField
                label="Tell us about yourself"
                rows={5}
                maxLength={2000}
                counter
                className="sm:col-span-2"
                placeholder="Who is your audience, and how would you like to share our jewelry with them?"
                {...bind('message')}
              />
            </fieldset>

            <div className="mt-8">
              <label className="group flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-charcoal">
                <input
                  type="checkbox"
                  name="consent"
                  checked={values.consent}
                  onChange={(e) => {
                    setValues((s) => ({ ...s, consent: e.target.checked }));
                    if (errors.consent) setErrors((x) => ({ ...x, consent: '' }));
                  }}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? 'f-consent-error' : undefined}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-ink"
                />
                <span>
                  I agree that {brand} may contact me about this application and have read the{' '}
                  <Link href="/pages/privacy-policy" className="underline decoration-stone underline-offset-4 hover:decoration-ink">
                    Privacy Policy
                  </Link>
                  .<span className="ml-0.5 text-gold">*</span>
                </span>
              </label>
              {errors.consent && (
                <p id="f-consent-error" className="mt-1.5 pl-7 text-xs text-danger">
                  {errors.consent}
                </p>
              )}
            </div>

            <FormAlert className="mt-6">{alert}</FormAlert>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-taupe">
                <span className="text-gold">*</span> Required fields
              </p>
              <Button type="submit" size="lg" loading={status === 'submitting'} className="w-full sm:w-auto">
                {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
              </Button>
            </div>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
