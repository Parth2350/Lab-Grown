'use client';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImageIcon, Video } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { saveHeroSettings } from '@/lib/server/admin/actions/settings';
import type { StoreSettings } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { IMAGE_ACCEPT, prepareUpload, UploadPrepError } from '@/lib/image-upload';
import { safeUrl } from '../bespoke/links';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { toast } from '../toast';
import { Panel } from '../ui';
import { Counter, PanelFooter, settingsLabel } from './shared';

const LIMITS = { eyebrow: 60, title: 120, subtitle: 300 } as const;

/** directUpload: the browser sends the video straight to Vercel Blob (production); otherwise it goes with the form */
export function HeroForm({ hero, directUpload }: { hero: StoreSettings['hero']; directUpload: boolean }) {
  const form = useAdminForm(saveHeroSettings);
  const videoRef = useRef<HTMLInputElement>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const currentVideo = safeUrl(hero.video);
  const shownVideo = videoPreview ?? (removeVideo ? null : currentVideo);

  useEffect(() => {
    if (!videoPreview) return;
    return () => URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  const clearVideo = () => {
    if (videoRef.current) videoRef.current.value = '';
    setVideoPreview(null);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const video = fd.get('video');
    if (directUpload && video instanceof File && video.size) {
      setUploading(true);
      try {
        const name = video.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase();
        const blob = await upload(`uploads/hero/${name}`, video, { access: 'public', handleUploadUrl: '/api/admin/blob', contentType: video.type });
        fd.set('videoUrl', blob.url);
        fd.delete('video');
      } catch (err) {
        toast.error('The video could not be uploaded', err instanceof Error ? err.message : 'Please try again.');
        return;
      } finally {
        setUploading(false);
      }
    }
    form.submit(fd);
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [eyebrow, setEyebrow] = useState(hero.eyebrow);
  const [title, setTitle] = useState(hero.title);
  const [subtitle, setSubtitle] = useState(hero.subtitle);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [remove, setRemove] = useState(false);
  const [preparing, setPreparing] = useState(false);

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

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const picked = input.files?.[0];
    if (!picked) return clearFile();
    setPreparing(true);
    try {
      // resize in the browser so the upload stays under the hosting limit, then put the
      // prepared file back into the input — that is what the form submits
      const file = await prepareUpload(picked);
      if (file !== picked) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      }
      setPreview(URL.createObjectURL(file));
      setFileName(picked.name);
      setRemove(false);
    } catch (err) {
      toast.error('This image can’t be used', err instanceof UploadPrepError ? err.message : 'Please try a different JPG or PNG.');
      clearFile();
    } finally {
      setPreparing(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <Panel
        id="hero"
        title="Homepage hero"
        description="The headline block at the top of the homepage. A video plays behind the headline, with the image showing while it loads; without either, the illustrated hero is shown."
        footer={
          <PanelFooter note={fileName ? `New image: ${fileName} — uploaded when you save` : remove ? 'The current image will be removed when you save' : undefined}>
            <SubmitButton pending={form.pending || preparing || uploading} pendingLabel={preparing ? 'Preparing image…' : uploading ? 'Uploading video…' : fileName ? 'Uploading…' : 'Saving…'}>
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
              accept={IMAGE_ACCEPT}
              onChange={(e) => void onFile(e)}
              aria-describedby="hero-image-hint"
              className={cn(
                'mt-3 block w-full text-xs text-taupe',
                'file:mr-3 file:cursor-pointer file:border file:border-ink/80 file:bg-white file:px-3 file:py-2 file:text-[12.5px] file:font-medium file:uppercase file:tracking-[0.14em] file:text-ink file:transition-colors hover:file:bg-ink hover:file:text-ivory',
              )}
            />
            <p id="hero-image-hint" className="mt-1.5 text-[13px] text-taupe">
              JPG, PNG, WebP, AVIF, HEIC or GIF — large photos are resized automatically. Landscape, at least 2000 px wide works best.
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

            <p className={cn(settingsLabel, 'mt-6')}>Background video</p>
            <div className="relative aspect-[16/9] overflow-hidden border border-line bg-porcelain">
              {shownVideo ? (
                <video key={shownVideo} src={shownVideo} muted loop autoPlay playsInline className="h-full w-full object-cover" aria-label={videoPreview ? 'Preview of the new hero video' : 'Current hero video'} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-taupe">
                  <Video className="h-5 w-5" strokeWidth={1.25} aria-hidden />
                  {removeVideo ? 'Video will be removed' : 'No video'}
                </div>
              )}
              {videoPreview && <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-[12px] uppercase tracking-[0.14em] text-ivory">New</span>}
            </div>
            <label htmlFor="hero-video" className="sr-only">
              Upload a new hero video
            </label>
            <input
              ref={videoRef}
              id="hero-video"
              type="file"
              name="video"
              accept="video/mp4,video/webm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return clearVideo();
                if (!directUpload && f.size > 8 * 1024 * 1024) {
                  toast.error('This video is too large here', 'Without cloud storage, videos up to 8 MB can be uploaded.');
                  return clearVideo();
                }
                setVideoPreview(URL.createObjectURL(f));
                setRemoveVideo(false);
              }}
              aria-describedby="hero-video-hint"
              className={cn(
                'mt-3 block w-full text-xs text-taupe',
                'file:mr-3 file:cursor-pointer file:border file:border-ink/80 file:bg-white file:px-3 file:py-2 file:text-[12.5px] file:font-medium file:uppercase file:tracking-[0.14em] file:text-ink file:transition-colors hover:file:bg-ink hover:file:text-ivory',
              )}
            />
            <p id="hero-video-hint" className="mt-1.5 text-[13px] text-taupe">
              MP4 (H.264) plays on every phone and browser. It plays muted on a loop; keep it short (10–20 s) and under about 10 MB so it starts quickly on phones.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {videoPreview && (
                <button type="button" onClick={clearVideo} className="text-xs text-charcoal underline underline-offset-4 hover:text-ink">
                  Discard new video
                </button>
              )}
              {currentVideo && !videoPreview && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-charcoal">
                  <input type="checkbox" name="removeVideo" checked={removeVideo} onChange={(e) => setRemoveVideo(e.target.checked)} className="h-3.5 w-3.5 accent-ink" />
                  Remove current video
                </label>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </form>
  );
}
