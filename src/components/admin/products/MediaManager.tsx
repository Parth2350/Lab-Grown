'use client';
import { useRef, useState, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, Film, ImagePlus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { METAL_COLORS } from '@/lib/catalog';
import { deleteProductMedia, moveProductMedia, updateProductMedia, uploadProductMedia } from '@/lib/server/admin/actions/product-media';
import type { ActionResult } from '@/lib/server/admin/types';
import { cn } from '@/lib/utils';
import { IMAGE_ACCEPT, prepareUpload, UPLOAD_LIMIT_LABEL, UploadPrepError, VIDEO_TYPES } from '@/lib/image-upload';
import { ConfirmDialog } from '../forms';
import { toast } from '../toast';
import { chevronStyle, labelCls } from './editor-ui';
import type { MediaItem } from './shared';

const ACCEPT = [IMAGE_ACCEPT, ...VIDEO_TYPES].join(',');
const smallSelect = 'field h-9 cursor-pointer appearance-none py-0 pl-3 pr-8 text-[14.5px]';

type MediaResult = ActionResult<{ items: MediaItem[] }>;

function metalOptions(metals: string[], current: string | null) {
  const list: { value: string; label: string }[] = METAL_COLORS.filter((m) => metals.includes(m.slug)).map((m) => ({ value: m.slug, label: m.label }));
  if (current && !metals.includes(current)) list.push({ value: current, label: `${METAL_COLORS.find((m) => m.slug === current)?.label ?? current} (not offered)` });
  return list;
}

function MediaRow({
  item,
  index,
  count,
  metals,
  productName,
  busy,
  run,
}: {
  item: MediaItem;
  index: number;
  count: number;
  metals: string[];
  productName: string;
  busy: boolean;
  run: (id: string, fn: () => Promise<MediaResult>, opts?: { quiet?: boolean }) => Promise<boolean>;
}) {
  const [alt, setAlt] = useState(item.alt ?? '');
  const [confirm, setConfirm] = useState(false);
  const altChanged = alt.trim() !== (item.alt ?? '');
  const saveAlt = () => run(item.id, () => updateProductMedia(item.id, { alt, metalColor: item.metalColor ?? '' }));
  const isVideo = item.kind === 'video';

  return (
    <li className={cn('grid grid-cols-[72px_minmax(0,1fr)] gap-3 border border-line bg-white p-3 transition-opacity sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center', busy && 'opacity-60')} aria-busy={busy}>
      <div className="art-tile relative aspect-square w-full overflow-hidden border border-line">
        {isVideo ? (
          <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" aria-label={item.alt ?? `${productName} video`} />
        ) : (
          <img src={item.url} alt={item.alt ?? productName} loading="lazy" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-1 top-1 bg-ink/80 px-1.5 text-[12px] leading-4 text-ivory">{index === 0 ? 'Primary' : `#${index + 1}`}</span>
        {isVideo && <Film className="absolute bottom-1 right-1 h-3.5 w-3.5 text-ivory drop-shadow" strokeWidth={1.6} aria-hidden />}
      </div>

      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_170px]">
        <div className="min-w-0">
          <label htmlFor={`alt-${item.id}`} className={labelCls}>
            Alt text
          </label>
          <div className="flex">
            <input
              id={`alt-${item.id}`}
              value={alt}
              maxLength={200}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (altChanged) void saveAlt();
                }
              }}
              placeholder={`Defaults to “${productName || 'product name'}”`}
              className="field h-9 min-w-0 px-3 py-0 text-[14.5px]"
            />
            {altChanged && (
              <button type="button" onClick={() => void saveAlt()} disabled={busy} className="h-9 shrink-0 border border-l-0 border-ink bg-ink px-3 text-[13px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-charcoal disabled:opacity-50">
                Save
              </button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor={`metal-${item.id}`} className={labelCls}>
            Show for
          </label>
          <select
            id={`metal-${item.id}`}
            value={item.metalColor ?? ''}
            disabled={busy}
            onChange={(e) => void run(item.id, () => updateProductMedia(item.id, { alt: item.alt ?? '', metalColor: e.target.value }))}
            className={smallSelect}
            style={chevronStyle}
          >
            <option value="">All metals</option>
            {metalOptions(metals, item.metalColor).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
        <button
          type="button"
          onClick={() => void run(item.id, () => moveProductMedia(item.id, 'up'), { quiet: true })}
          disabled={busy || index === 0}
          aria-label={`Move item ${index + 1} earlier`}
          title="Move earlier"
          className="inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe hover:border-line hover:text-ink disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={1.4} />
        </button>
        <button
          type="button"
          onClick={() => void run(item.id, () => moveProductMedia(item.id, 'down'), { quiet: true })}
          disabled={busy || index === count - 1}
          aria-label={`Move item ${index + 1} later`}
          title="Move later"
          className="inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe hover:border-line hover:text-ink disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" strokeWidth={1.4} />
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          disabled={busy}
          aria-label={`Delete item ${index + 1}`}
          title="Delete"
          className="inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe hover:border-danger/30 hover:text-danger disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.4} />
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => !busy && setConfirm(false)}
        pending={busy}
        title={isVideo ? 'Delete this video?' : 'Delete this photo?'}
        description="It will be removed from the product immediately. This can’t be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          await run(item.id, () => deleteProductMedia(item.id));
          setConfirm(false);
        }}
      />
    </li>
  );
}

export function MediaManager({
  productId,
  productName,
  items,
  onItemsChange: setItems,
  metals,
}: {
  productId: string;
  productName: string;
  items: MediaItem[];
  onItemsChange: (items: MediaItem[]) => void;
  metals: string[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadMetal, setUploadMetal] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (id: string, fn: () => Promise<MediaResult>, opts: { quiet?: boolean } = {}) => {
    setBusyId(id);
    try {
      const res = await fn();
      if (res.ok) {
        if (res.data) setItems(res.data.items);
        if (!opts.quiet) toast.success(res.message ?? 'Saved');
        return true;
      }
      toast.error(res.message);
      return false;
    } catch {
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const upload = async (list: FileList | File[]) => {
    const files = Array.from(list);
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length || progress) return;
    setProgress({ done: 0, total: files.length });
    let uploaded = 0;
    // One request per file, each resized in the browser first, keeps every request under
    // the hosting limit (Vercel rejects request bodies over 4.5 MB).
    for (const [i, original] of files.entries()) {
      try {
        const file = await prepareUpload(original, { allowVideo: true });
        const fd = new FormData();
        fd.append('files', file);
        fd.append('metalColor', uploadMetal);
        const res = await uploadProductMedia(productId, fd);
        if (res.ok) {
          uploaded++;
          if (res.data) setItems(res.data.items);
        } else toast.error(`${original.name}: ${res.message}`);
      } catch (e) {
        toast.error(e instanceof UploadPrepError ? e.message : `${original.name}: upload failed — please check your connection and try again.`);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setProgress(null);
    if (uploaded) toast.success(`Uploaded ${uploaded} file${uploaded === 1 ? '' : 's'}`);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files);
  };

  const photoCount = items.filter((i) => i.kind === 'image').length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-medium uppercase tracking-[0.12em] text-ink">Photos &amp; video</h3>
          <p className="mt-0.5 text-xs text-taupe">
            Uploaded photos replace the illustration on the storefront. Tag a photo with a metal to show it only for that metal.
          </p>
        </div>
        <p className="text-xs text-taupe">
          {items.length} item{items.length === 1 ? '' : 's'} · {photoCount} photo{photoCount === 1 ? '' : 's'}
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn('flex flex-col items-center gap-3 border border-dashed px-4 py-6 text-center transition-colors sm:flex-row sm:justify-between sm:text-left', dragOver ? 'border-gold bg-gold-pale/40' : 'border-stone bg-ivory/60')}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-taupe" aria-hidden>
            <ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.3} />
          </span>
          <div>
            <p className="text-[15px] text-ink">{progress ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : 'Drop files here or choose from your computer'}</p>
            <p className="text-xs text-taupe">JPG, PNG, WebP, AVIF, HEIC or GIF photos (large photos are resized automatically) · MP4 or WebM video up to {UPLOAD_LIMIT_LABEL}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-center gap-2">
          <div className="text-left">
            <label htmlFor="upload-metal" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.14em] text-taupe">
              Tag uploads for
            </label>
            <select id="upload-metal" value={uploadMetal} onChange={(e) => setUploadMetal(e.target.value)} className={smallSelect} style={chevronStyle}>
              <option value="">All metals</option>
              {metalOptions(metals, null).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <input ref={inputRef} id="media-files" type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => e.target.files && void upload(e.target.files)} disabled={!!progress} />
          <Button type="button" size="sm" variant="outline" loading={!!progress} onClick={() => inputRef.current?.click()}>
            {!progress && <Upload className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
            Upload
          </Button>
        </div>
      </div>
      {progress && (
        <div className="mt-2 h-1 w-full bg-gold-pale" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
          <div className="h-full bg-gold transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}

      {items.length > 0 ? (
        <ol className="mt-4 grid gap-2">
          {items.map((item, i) => (
            <MediaRow key={`${item.id}:${item.alt ?? ''}`} item={item} index={i} count={items.length} metals={metals} productName={productName} busy={busyId === item.id} run={run} />
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-xs text-taupe">No photos yet — shoppers see the illustration above.</p>
      )}
    </div>
  );
}
