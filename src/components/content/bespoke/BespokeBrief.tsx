'use client';
/* eslint-disable @next/next/no-img-element -- photo previews are local blob: URLs; collection photos are catalogue hotlinks */
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { currencyInfo } from '@/lib/currency';
import { IMAGE_ACCEPT, prepareUpload, UploadPrepError } from '@/lib/image-upload';
import { cn } from '@/lib/utils';
import { useCurrency, useFormatMoney } from '@/components/providers/CurrencyProvider';
import { MAX_INSPIRATION_IMAGES } from '../forms/schemas';
import { Honeypot, postJson } from '../forms/client';

export type CollectionPiece = { slug: string; name: string; image: string; price: number };

/** category chip → the catalogue category its "Inspired by our collection" pieces come from */
const CATEGORIES = [
  { label: 'Engagement Ring', slug: 'engagement-rings', plural: 'engagement rings' },
  { label: 'Wedding Band', slug: 'wedding-bands', plural: 'wedding bands' },
  { label: 'Necklace', slug: 'necklaces', plural: 'necklaces' },
  { label: 'Pendant', slug: 'pendants', plural: 'pendants' },
  { label: 'Earrings', slug: 'earrings', plural: 'earrings' },
  { label: 'Bracelet', slug: 'bracelets', plural: 'bracelets' },
  { label: 'Something else', slug: null, plural: null },
] as const;
const METALS = ['Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Not sure'];
const STAMPS = ['10K', '14K', '18K', 'PT950'];
const SHAPES = ['Round', 'Oval', 'Emerald', 'Pear', 'Marquise', 'Cushion', 'Princess', 'Radiant', 'Asscher', 'Heart'];
const STEPS = ['Your idea', 'Make it yours', 'Reach you'];

type Photo = { key: string; preview: string; status: 'uploading' | 'done' | 'error'; url?: string; error?: string };
let seq = 0;

const label = 'text-sm font-semibold text-ink';
const field = 'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-gold';
const chip = (on: boolean) => cn('rounded-full border px-4 py-2 text-sm transition', on ? 'border-gold bg-gold font-semibold text-ink' : 'border-line text-ink hover:border-ink');

/** The bespoke brief, as on brilliancecarat.com: your idea → make it yours → reach you. Most fields are optional. */
export function BespokeBrief({ collection }: { collection: Record<string, CollectionPiece[]> }) {
  const currency = useCurrency();
  const formatMoney = useFormatMoney();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ category: '', idea: '', metal: '', metalStamp: '', goldWeight: '', shape: '', carat: '', totalCarat: '', setting: '', budget: '', needBy: '', notes: '', name: '', email: '', phone: '' });
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: p[k] === v ? '' : v }));
  const go = (n: number) => {
    setStep(n);
    top.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps -- on unmount

  // budgets in the shopper's currency: rupee ranges in India, the partner's dollar ranges elsewhere (converted for CAD)
  const rupees = currency === 'INR';
  const info = currencyInfo(currency);
  const money = (n: number) => info.prefix + (rupees ? n.toLocaleString('en-IN') : Math.round(n * info.perUsd).toLocaleString('en-US'));
  const [b0, b1, b2, b3] = rupees ? [100000, 250000, 500000, 1000000] : [1000, 2500, 5000, 10000];
  const budgets = [`Under ${money(b0)}`, `${money(b0)} – ${money(b1)}`, `${money(b1)} – ${money(b2)}`, `${money(b2)} – ${money(b3)}`, `${money(b3)} & above`, 'Flexible'];

  const category = CATEGORIES.find((c) => c.label === f.category);
  const pieces = category?.slug ? (collection[category.slug] ?? []) : [];

  const addPhotos = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, MAX_INSPIRATION_IMAGES - photos.length);
    if (fileRef.current) fileRef.current.value = '';
    for (const file of list) {
      const key = `p${++seq}`;
      setPhotos((p) => [...p, { key, preview: URL.createObjectURL(file), status: 'uploading' }]);
      const patch = (x: Partial<Photo>) => setPhotos((p) => p.map((it) => (it.key === key ? { ...it, ...x } : it)));
      try {
        // resized in the browser so phone photos stay under the hosting upload limit
        const fd = new FormData();
        fd.append('file', await prepareUpload(file));
        fd.append('folder', 'bespoke');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        patch(res.ok && json.url ? { status: 'done', url: json.url } : { status: 'error', error: json.error ?? 'Upload failed. Please try again.' });
      } catch (e) {
        patch({ status: 'error', error: e instanceof UploadPrepError ? e.message : 'Upload failed — please check your connection.' });
      }
    }
  };
  const removePhoto = (key: string) =>
    setPhotos((p) => {
      const gone = p.find((x) => x.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return p.filter((x) => x.key !== key);
    });

  const addLink = () => {
    const v = linkDraft.trim();
    if (!v) return;
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    try {
      new URL(url);
    } catch {
      return setErrors((e) => ({ ...e, links: 'Please check your reference link.' }));
    }
    if (links.length < 10 && !links.includes(url)) setLinks((l) => [...l, url]);
    setLinkDraft('');
    setErrors(({ links: _, ...e }) => e);
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errs.email = 'Please enter a valid email address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError('');
    const res = await postJson<{ ok: true; reference: string }>('/api/bespoke', {
      ...f,
      jewelryType: f.category,
      links,
      inspirationUrls: photos.filter((p) => p.status === 'done').map((p) => p.url),
      _hp: hp,
    });
    setBusy(false);
    if (res.ok) {
      setDone({ reference: res.data.reference, name: f.name.trim().split(' ')[0] ?? '' });
      top.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    setFormError(res.error);
    setErrors(res.fieldErrors ?? {});
    const fields = Object.keys(res.fieldErrors ?? {});
    if (fields.some((k) => ['jewelryType', 'idea', 'links', 'inspirationUrls'].includes(k))) setStep(0);
    else if (fields.some((k) => !['name', 'email', 'phone'].includes(k))) setStep(1);
  };

  const uploading = photos.some((p) => p.status === 'uploading');
  const err = (k: string) => errors[k] && <p className="mt-1.5 text-xs text-danger">{errors[k]}</p>;

  return (
    <div ref={top} className="scroll-mt-32 overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
      <div className="flex items-center gap-2 border-b border-line px-6 py-4 sm:px-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cn('grid h-6 w-6 place-items-center rounded-full text-2xs font-bold', i <= step || done ? 'bg-gold text-ink' : 'bg-porcelain text-taupe')}>{i + 1}</span>
            <span className={cn('hidden text-xs sm:inline', i === step && !done ? 'font-semibold text-ink' : 'text-taupe')}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-line sm:w-8" />}
          </div>
        ))}
        <span className="ml-auto text-2xs uppercase tracking-luxe text-taupe">2 min · no obligation</span>
      </div>

      {done ? (
        <div className="px-6 py-14 text-center sm:px-8" role="status">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink">
            <Check className="h-6 w-6" strokeWidth={1.5} aria-hidden />
          </span>
          <h3 className="mt-5 font-serif text-3xl text-ink">Thank you{done.name ? `, ${done.name}` : ''} — your brief is with our workshop.</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-taupe">We reply within 24 hours with ideas and a direct quote. Please quote your reference in any message to us.</p>
          <p className="mx-auto mt-6 inline-flex flex-col rounded-2xl bg-porcelain px-8 py-4">
            <span className="text-2xs uppercase tracking-luxe text-taupe">Your reference</span>
            <span className="mt-1 font-serif text-2xl tracking-[0.08em] text-ink">{done.reference}</span>
          </p>
        </div>
      ) : (
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Honeypot value={hp} onChange={setHp} />
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <p className={label}>What would you like made?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button key={c.label} type="button" aria-pressed={f.category === c.label} onClick={() => toggle('category', c.label)} className={chip(f.category === c.label)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="brief-idea" className={label}>
                    Describe your idea
                  </label>
                  <textarea
                    id="brief-idea"
                    rows={4}
                    value={f.idea}
                    onChange={(e) => set('idea')(e.target.value)}
                    maxLength={3000}
                    placeholder="A pear + emerald toi-et-moi, around 2ct, in rose gold — like the one my grandmother had…"
                    className={cn(field, 'mt-2 resize-y py-3')}
                  />
                  {err('idea')}
                </div>
                <div>
                  <p className={label}>
                    References <span className="font-normal text-taupe">— a photo or a link says a thousand words</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photos.map((p) => (
                      <span key={p.key} className={cn('relative h-20 w-20 overflow-hidden rounded-lg border', p.status === 'error' ? 'border-danger' : 'border-line')} title={p.error}>
                        <img src={p.preview} alt="" className={cn('h-full w-full object-cover', p.status === 'uploading' && 'opacity-50')} />
                        {p.status === 'uploading' && <span className="absolute inset-0 grid place-items-center text-2xs text-ink">…</span>}
                        <button type="button" onClick={() => removePhoto(p.key)} aria-label="Remove photo" className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white">
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                    {photos.length < MAX_INSPIRATION_IMAGES && (
                      <button type="button" onClick={() => fileRef.current?.click()} className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-line text-2xs text-taupe hover:border-gold hover:text-gold">
                        + Photo
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
                  </div>
                  {photos.some((p) => p.status === 'error') && <p className="mt-1.5 text-xs text-danger">{photos.find((p) => p.status === 'error')?.error} Remove it and try again.</p>}
                  {err('inspirationUrls')}
                  {links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {links.map((l) => (
                        <span key={l} className="flex max-w-full items-center gap-1.5 rounded-full bg-porcelain px-3 py-1 text-xs text-ink">
                          <span className="truncate">{l.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          <button type="button" onClick={() => setLinks((x) => x.filter((y) => y !== l))} aria-label="Remove link">
                            <X className="h-3 w-3" strokeWidth={2} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLink();
                        }
                      }}
                      placeholder="Paste a Pinterest or reference link"
                      aria-label="Reference link"
                      className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-gold"
                    />
                    <button type="button" onClick={addLink} className="shrink-0 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:border-ink">
                      Add
                    </button>
                  </div>
                  {err('links')}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => go(1)} disabled={uploading} className="rounded-full bg-ink px-8 py-3 text-2xs font-semibold uppercase tracking-luxe text-white transition hover:bg-charcoal disabled:opacity-40">
                    {uploading ? 'Uploading…' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <p className="rounded-lg bg-porcelain px-3 py-2 text-xs text-taupe">Everything here is optional — tell us only what you already know. We&apos;ll figure out the rest together.</p>
                <div>
                  <p className={label}>Metal</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {METALS.map((m) => (
                      <button key={m} type="button" aria-pressed={f.metal === m} onClick={() => toggle('metal', m)} className={chip(f.metal === m)}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="brief-stamp" className={label}>
                      Metal stamp
                    </label>
                    <select id="brief-stamp" value={f.metalStamp} onChange={(e) => set('metalStamp')(e.target.value)} className={field}>
                      <option value="">—</option>
                      {STAMPS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="brief-gold" className={label}>
                      Approx gold wt (g)
                    </label>
                    <input id="brief-gold" value={f.goldWeight} onChange={(e) => set('goldWeight')(e.target.value)} maxLength={20} placeholder="e.g. 3.5" className={field} />
                  </div>
                  <div>
                    <label htmlFor="brief-shape" className={label}>
                      Centre shape
                    </label>
                    <select id="brief-shape" value={f.shape} onChange={(e) => set('shape')(e.target.value)} className={field}>
                      <option value="">—</option>
                      {SHAPES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="brief-carat" className={label}>
                      Centre carat
                    </label>
                    <input id="brief-carat" type="number" min="0" max="15" step="0.01" value={f.carat} onChange={(e) => set('carat')(e.target.value)} placeholder="max 15.00 ct" className={field} />
                  </div>
                  <div>
                    <label htmlFor="brief-ctw" className={label}>
                      Total diamond wt (ctw)
                    </label>
                    <input id="brief-ctw" value={f.totalCarat} onChange={(e) => set('totalCarat')(e.target.value)} maxLength={20} placeholder="e.g. 2.10" className={field} />
                  </div>
                  <div>
                    <label htmlFor="brief-setting" className={label}>
                      Setting type <span className="font-normal text-taupe">(optional)</span>
                    </label>
                    <input id="brief-setting" value={f.setting} onChange={(e) => set('setting')(e.target.value)} maxLength={60} placeholder="Prong / Bezel / Pavé" className={field} />
                  </div>
                </div>
                <div>
                  <p className={label}>Budget</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {budgets.map((b) => (
                      <button key={b} type="button" aria-pressed={f.budget === b} onClick={() => toggle('budget', b)} className={chip(f.budget === b)}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:max-w-xs">
                  <label htmlFor="brief-date" className={label}>
                    Need it by
                  </label>
                  <input id="brief-date" type="date" value={f.needBy} onChange={(e) => set('needBy')(e.target.value)} className={field} />
                </div>
                <div>
                  <label htmlFor="brief-notes" className={label}>
                    Anything else?
                  </label>
                  <textarea
                    id="brief-notes"
                    rows={3}
                    value={f.notes}
                    onChange={(e) => set('notes')(e.target.value)}
                    maxLength={3000}
                    placeholder="Engraving, an heirloom stone to reset, a hallmark…"
                    className={cn(field, 'mt-2 resize-y')}
                  />
                </div>
                {err('carat')}
                <div className="flex justify-between">
                  <button type="button" onClick={() => go(0)} className="text-2xs font-semibold uppercase tracking-luxe text-taupe hover:text-ink">
                    ← Back
                  </button>
                  <button type="button" onClick={() => go(2)} className="rounded-full bg-ink px-8 py-3 text-2xs font-semibold uppercase tracking-luxe text-white transition hover:bg-charcoal">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="brief-name" className={label}>
                      Your name
                    </label>
                    <input id="brief-name" value={f.name} onChange={(e) => set('name')(e.target.value)} autoComplete="name" maxLength={100} aria-invalid={!!errors.name} className={cn(field, 'mt-2')} />
                    {err('name')}
                  </div>
                  <div>
                    <label htmlFor="brief-email" className={label}>
                      Email
                    </label>
                    <input id="brief-email" type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" maxLength={200} placeholder="you@email.com" aria-invalid={!!errors.email} className={cn(field, 'mt-2')} />
                    {err('email')}
                  </div>
                  <div>
                    <label htmlFor="brief-phone" className={label}>
                      Phone / WhatsApp
                    </label>
                    <input id="brief-phone" type="tel" value={f.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" maxLength={32} placeholder="+91…" aria-invalid={!!errors.phone} className={cn(field, 'mt-2')} />
                    {err('phone')}
                  </div>
                </div>
                {formError && (
                  <p role="alert" className="text-sm text-danger">
                    {formError}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => go(1)} className="text-2xs font-semibold uppercase tracking-luxe text-taupe hover:text-ink">
                    ← Back
                  </button>
                  <button type="button" onClick={() => void submit()} disabled={busy || uploading} className="rounded-full bg-gold px-9 py-3.5 text-2xs font-semibold uppercase tracking-luxe text-ink transition hover:bg-gold-light disabled:opacity-50">
                    {busy ? 'Sending…' : 'Send my brief'}
                  </button>
                </div>
                <p className="text-center text-xs text-taupe">No design fee · no obligation · we reply within 24 hours</p>
              </div>
            )}
          </div>

          <aside className="rounded-2xl bg-porcelain p-5">
            <p className="text-2xs uppercase tracking-luxe text-gold">Inspired by our collection</p>
            <p className="mt-1 text-sm text-taupe">{category?.plural ? `We can craft something like these ${category.plural}${step > 0 ? ' — or anything you dream up.' : ''}` : 'Pick a category to see pieces we can make.'}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {pieces.length
                ? pieces.map((p) => (
                    <Link key={p.slug} href={`/products/${p.slug}`} className="group block overflow-hidden rounded-xl border border-line bg-white">
                      <span className="block aspect-square overflow-hidden">
                        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      </span>
                      <span className="block px-2.5 py-2">
                        <span className="block truncate text-2xs uppercase text-taupe">{category?.plural}</span>
                        <span className="block text-sm font-semibold text-ink">{formatMoney(p.price)}</span>
                      </span>
                    </Link>
                  ))
                : [0, 1, 2, 3].map((i) => <span key={i} className="aspect-square rounded-xl bg-white/60" />)}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
