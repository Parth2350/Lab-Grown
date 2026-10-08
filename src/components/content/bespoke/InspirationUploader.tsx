'use client';
/* eslint-disable @next/next/no-img-element -- previews are local blob: URLs */
import { AlertCircle, ImagePlus, RotateCcw, X } from 'lucide-react';
import { useCallback, useRef, useState, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { MAX_INSPIRATION_IMAGES } from '../forms/schemas';

export type UploadItem = {
  key: string;
  name: string;
  preview: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
  /** kept until the upload succeeds so a failed upload can be retried */
  file?: File;
};

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024;

let seq = 0;

/**
 * Drag & drop / click-to-browse image uploader that posts each file to /api/upload.
 * Items (and their blob: previews) are owned by the parent so they survive step changes;
 * the parent revokes previews when it unmounts.
 */
export function InspirationUploader({ items, onChange }: { items: UploadItem[]; onChange: (update: (prev: UploadItem[]) => UploadItem[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const patch = useCallback((key: string, p: Partial<UploadItem>) => onChange((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it))), [onChange]);

  const upload = useCallback(
    async (key: string, file?: File) => {
      if (!file) return;
      patch(key, { status: 'uploading', error: undefined });
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'bespoke');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (res.ok && json.url) {
          patch(key, { status: 'done', url: json.url, file: undefined });
        } else {
          patch(key, { status: 'error', error: json.error ?? 'Upload failed. Please try again.' });
        }
      } catch {
        patch(key, { status: 'error', error: 'Upload failed — please check your connection.' });
      }
    },
    [patch],
  );

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const room = MAX_INSPIRATION_IMAGES - items.length;
    const messages: string[] = [];
    if (room <= 0) {
      setWarning(`You can share up to ${MAX_INSPIRATION_IMAGES} images. Remove one to add another.`);
      return;
    }
    const accepted: UploadItem[] = [];
    for (const file of incoming) {
      if (accepted.length >= room) {
        messages.push(`Only ${MAX_INSPIRATION_IMAGES} images can be shared — some were not added.`);
        break;
      }
      if (!ACCEPT.includes(file.type)) {
        messages.push(`“${file.name}” is not a supported image (JPG, PNG, WebP, AVIF or GIF).`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        messages.push(`“${file.name}” is larger than 8 MB.`);
        continue;
      }
      const key = `u${Date.now()}-${seq++}`;
      accepted.push({ key, name: file.name, preview: URL.createObjectURL(file), status: 'uploading', file });
    }
    setWarning(messages.join(' '));
    setNotice(accepted.length ? `${accepted.length} image${accepted.length > 1 ? 's' : ''} uploading.` : '');
    if (accepted.length) {
      onChange((prev) => [...prev, ...accepted]);
      accepted.forEach((a) => void upload(a.key, a.file));
    }
  }

  function remove(item: UploadItem) {
    URL.revokeObjectURL(item.preview);
    setWarning('');
    onChange((prev) => prev.filter((p) => p.key !== item.key));
    setNotice(`Removed ${item.name}.`);
    inputRef.current?.focus();
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const full = items.length >= MAX_INSPIRATION_IMAGES;

  return (
    <div>
      <label
        htmlFor="bespoke-files"
        onDragEnter={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          'flex min-h-[220px] cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors duration-300',
          'focus-within:outline focus-within:outline-1 focus-within:outline-offset-[3px] focus-within:outline-gold',
          dragging ? 'border-gold bg-gold-pale/40' : 'border-stone bg-white hover:border-ink',
          full && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          id="bespoke-files"
          type="file"
          accept={ACCEPT.join(',')}
          multiple
          disabled={full}
          className="sr-only"
          aria-describedby="bespoke-files-help"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-gold">
          <ImagePlus className="h-6 w-6" strokeWidth={1} aria-hidden />
        </span>
        <span className="mt-5 font-serif text-xl">{dragging ? 'Drop your images here' : 'Drag & drop images, or click to browse'}</span>
        <span id="bespoke-files-help" className="mt-2 max-w-sm text-[15px] text-taupe">
          Up to {MAX_INSPIRATION_IMAGES} images · JPG, PNG, WebP, AVIF or GIF · 8 MB each. Screenshots, sketches and heirloom photos are all welcome.
        </span>
      </label>

      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
      <div role="alert">
        {warning && (
          <p className="mt-3 flex items-start gap-2 text-[15px] text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
            {warning}
          </p>
        )}
      </div>

      {items.length > 0 && (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="Inspiration images">
          {items.map((it) => (
            <li key={it.key} className="group relative aspect-square overflow-hidden border border-line bg-porcelain">
              <img src={it.preview} alt={it.name} className={cn('h-full w-full object-cover transition-opacity', it.status !== 'done' && 'opacity-50')} />
              {it.status === 'uploading' && (
                <span className="absolute inset-0 flex items-center justify-center" aria-label={`Uploading ${it.name}`}>
                  <span className="h-6 w-6 animate-spin rounded-full border border-ink border-t-transparent" />
                </span>
              )}
              {it.status === 'error' && (
                <button
                  type="button"
                  onClick={() => void upload(it.key, it.file)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ivory/80 px-2 text-center text-[12px] uppercase tracking-[0.12em] text-danger"
                  title={it.error}
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  Retry
                  <span className="sr-only">
                    uploading {it.name}. {it.error}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(it)}
                aria-label={`Remove ${it.name}`}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-soft transition-colors hover:bg-ink hover:text-ivory"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
