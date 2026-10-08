'use client';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImageIcon } from 'lucide-react';
import { saveHeroSettings } from '@/lib/server/admin/actions/settings';
import type { StoreSettings } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { safeUrl } from '../bespoke/links';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { toast } from '../toast';
import { Panel } from '../ui';
import { Counter, PanelFooter, settingsLabel } from './shared';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024;
const LIMITS = { eyebrow: 60, title: 120, subtitle: 300 } as const;

export function HeroForm({ hero }: { hero: StoreSettings['hero'] }) {
  const form = useAdminForm(saveHeroSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [eyebrow, setEyebrow] = useState(hero.eyebrow);
  const [title, setTitle] = useState(hero.title);
  const [subtitle, setSubtitle] = useState(hero.subtitle);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [remove, setRemove] = useState(false);

  // Release the object URL of a previously chosen file.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const current = safeUrl(hero.image);
  const shown = preview ?? (remove ? null : current);
  const fieldError = (name: string) => (form.state && !form.state.ok && form.state.fieldErrors?.[name] ? true : undefined);

  const clearFile = () => {
    if (fileRef.current) fileRef.current.value = '';
    setPreview(null);
    setFileName('');
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return clearFile();
    if (file.type.startsWith('video/')) {
      toast.error('Videos aren’t supported for the hero', 'Please choose a still image — JPG, PNG, WebP, AVIF or GIF.');
      return clearFile();
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Unsupported file type', 'Please choose a JPG, PNG, WebP, AVIF or GIF image.');
      return clearFile();
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image is too large', 'Please choose an image under 8 MB.');
      return clearFile();
    }
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setRemove(false);
  };

  return (
    <form onSubmit={form.onSubmit} noValidate>
      <Panel
        id="hero"
        title="Homepage hero"
        description="The headline block at the top of the homepage. Without an image, the illustrated hero is shown."
        footer={
          <PanelFooter note={fileName ? `New image: ${fileName} — uploaded when you save` : remove ? 'The current image will be removed when you save' : undefined}>
            <SubmitButton pending={form.pending} pendingLabel={fileName ? 'Uploading…' : 'Saving…'}>
              Save hero
            </SubmitButton>
          </PanelFooter>
        }
      >
        <FormBanner state={form.state && !form.state.ok ? form.state : null} className="mb-4" />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="hero-eyebrow" className={settingsLabel}>
                  Eyebrow <span className="text-gold">*</span>
                </label>
                <Counter value={eyebrow.length} max={LIMITS.eyebrow} />
              </div>
              <input id="hero-eyebrow" name="eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} maxLength={LIMITS.eyebrow} aria-invalid={fieldError('eyebrow')} className="field py-2.5" />
              <FieldMsg state={form.state} name="eyebrow" />
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="hero-title" className={settingsLabel}>
                  Title <span className="text-gold">*</span>
                </label>
                <Counter value={title.length} max={LIMITS.title} />
              </div>
              <input id="hero-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.title} aria-invalid={fieldError('title')} className="field py-2.5 font-serif text-lg" />
              <FieldMsg state={form.state} name="title" />
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="hero-subtitle" className={settingsLabel}>
                  Subtitle <span className="text-gold">*</span>
                </label>
                <Counter value={subtitle.length} max={LIMITS.subtitle} />
              </div>
              <textarea
                id="hero-subtitle"
                name="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={LIMITS.subtitle}
                rows={3}
                aria-invalid={fieldError('subtitle')}
                className="field resize-y py-2.5 leading-relaxed"
              />
              <FieldMsg state={form.state} name="subtitle" />
            </div>
          </div>

          <div>
            <p className={settingsLabel} id="hero-image-label">
              Background image
            </p>
            <div className="relative aspect-[4/3] overflow-hidden border border-line bg-porcelain">
              {shown ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview of an upload / object URL
                <img src={shown} alt={preview ? 'Preview of the new hero image' : 'Current hero image'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-taupe">
                  <ImageIcon className="h-5 w-5" strokeWidth={1.25} aria-hidden />
                  {remove ? 'Image will be removed' : 'No image — the illustrated hero is shown'}
                </div>
              )}
              {preview && <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-[12px] uppercase tracking-[0.14em] text-ivory">New</span>}
            </div>
            <label htmlFor="hero-image" className="sr-only">
              Upload a new hero image
            </label>
            <input
              ref={fileRef}
              id="hero-image"
              type="file"
              name="image"
              accept={IMAGE_TYPES.join(',')}
              onChange={onFile}
              aria-describedby="hero-image-hint"
              className={cn(
                'mt-3 block w-full text-xs text-taupe',
                'file:mr-3 file:cursor-pointer file:border file:border-ink/80 file:bg-white file:px-3 file:py-2 file:text-[12.5px] file:font-medium file:uppercase file:tracking-[0.14em] file:text-ink file:transition-colors hover:file:bg-ink hover:file:text-ivory',
              )}
            />
            <p id="hero-image-hint" className="mt-1.5 text-[13px] text-taupe">
              JPG, PNG, WebP, AVIF or GIF up to 8 MB. Landscape, at least 2000 px wide works best.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {preview && (
                <button type="button" onClick={clearFile} className="text-xs text-charcoal underline underline-offset-4 hover:text-ink">
                  Discard new image
                </button>
              )}
              {current && !preview && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-charcoal">
                  <input type="checkbox" name="removeImage" checked={remove} onChange={(e) => setRemove(e.target.checked)} className="h-3.5 w-3.5 accent-ink" />
                  Remove current image
                </label>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </form>
  );
}
