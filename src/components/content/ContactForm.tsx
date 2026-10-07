'use client';
import { AnimatePresence, m } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CONTACT_SUBJECTS, contactSchema, firstErrors, type ContactInput, type FieldErrors } from './forms/schemas';
import { FormAlert, Honeypot, SelectField, TextareaField, TextField, focusFirstError, postJson } from './forms/client';

const EMPTY: Required<ContactInput> = { name: '', email: '', phone: '', subject: '', message: '' };

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(EMPTY);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [sentTo, setSentTo] = useState('');

  const bind = (k: keyof ContactInput) => ({
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
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const errs = firstErrors(parsed.error);
      setErrors(errs);
      focusFirstError(formRef.current, errs);
      return;
    }
    setStatus('submitting');
    const res = await postJson<{ ok: true }>('/api/contact', { ...values, _hp: hp });
    if (res.ok) {
      setSentTo(parsed.data.email);
      setValues(EMPTY);
      setErrors({});
      setStatus('sent');
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
        {status === 'submitting' ? 'Sending your message…' : status === 'sent' ? 'Your message has been sent.' : ''}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {status === 'sent' ? (
          <m.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="border border-line bg-white px-6 py-12 text-center sm:px-12"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold">
              <Check className="h-6 w-6" strokeWidth={1.25} aria-hidden />
            </span>
            <h3 className="mt-6 font-serif text-3xl font-light">Thank you — your message is with us</h3>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-taupe">
              A member of our client care team will reply to <span className="break-all text-ink">{sentTo}</span> within one business day. For anything urgent,
              WhatsApp is the quickest way to reach us.
            </p>
            <Button variant="outline" className="mt-8" onClick={() => setStatus('idle')}>
              Send another message
            </Button>
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
            className="relative grid gap-6 sm:grid-cols-2"
            aria-label="Contact form"
          >
            <Honeypot value={hp} onChange={setHp} />
            <TextField label="Full name" required autoComplete="name" maxLength={100} {...bind('name')} />
            <TextField label="Email" type="email" inputMode="email" required autoComplete="email" maxLength={200} {...bind('email')} />
            <TextField label="Phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={32} hint="Optional — include your country code" {...bind('phone')} />
            <SelectField label="Subject" required placeholder="Choose a subject" options={CONTACT_SUBJECTS} {...bind('subject')} />
            <TextareaField
              label="Message"
              required
              rows={6}
              maxLength={4000}
              counter
              className="sm:col-span-2"
              placeholder="How can we help? If it is about an order, please include your order number."
              {...bind('message')}
            />
            <FormAlert className="sm:col-span-2">{alert}</FormAlert>
            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-taupe">
                <span className="text-gold">*</span> Required. We only use your details to reply to you.
              </p>
              <Button type="submit" size="lg" loading={status === 'submitting'} className="w-full sm:w-auto">
                {status === 'submitting' ? 'Sending…' : 'Send Message'}
              </Button>
            </div>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
