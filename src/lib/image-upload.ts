'use client';
/**
 * Browser-side preparation of files before they are uploaded.
 *
 * Vercel rejects any request body over 4.5 MB before it reaches the app, so photos
 * straight from a phone or camera (often 4–15 MB) would fail. Images are therefore
 * resized and re-encoded in the browser first; files that can't be shrunk here
 * (GIF animations, videos) must already be under the limit.
 */

/** Largest file we send in one request (leaves headroom under Vercel's 4.5 MB body limit). */
export const UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
export const UPLOAD_LIMIT_LABEL = '4 MB';

/** Longest edge of an uploaded photo — plenty for zoom on a 4K screen. */
const MAX_EDGE = 2560;
/** Photos already this small (and within MAX_EDGE) are uploaded untouched. */
const KEEP_ORIGINAL_BELOW = 1.5 * 1024 * 1024;

/** Still-image formats the server accepts as-is. */
export const WEB_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
/** iPhone photos: converted in the browser where it can decode them (Safari). */
const HEIC_TYPES = ['image/heic', 'image/heif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];

/** `accept` attribute for image pickers (HEIC included so iPhone photos can be chosen). */
export const IMAGE_ACCEPT = [...WEB_IMAGE_TYPES, ...HEIC_TYPES].join(',');

export class UploadPrepError extends Error {}

const isHeic = (f: File) => HEIC_TYPES.includes(f.type) || /\.(heic|heif)$/i.test(f.name);

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> decoding (older Safari) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function shrink(file: File, label: string): Promise<File> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    throw new UploadPrepError(
      isHeic(file)
        ? `${label}: this browser can't read HEIC photos. Open it on an iPhone/Mac and share it as JPG, or change the camera format to "Most Compatible".`
        : `${label}: this image could not be read. Please try a JPG or PNG.`,
    );
  }
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';

  for (const edge of [MAX_EDGE, 2048, 1600]) {
    const scale = Math.min(1, edge / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    // WebP keeps transparency and is small; browsers that can't encode it hand back PNG, so use JPEG there
    let blob = await encode(canvas, 'image/webp', 0.86);
    let ext = 'webp';
    if (!blob || blob.type !== 'image/webp') {
      blob = await encode(canvas, 'image/jpeg', 0.88);
      ext = 'jpg';
    }
    if (blob && blob.size <= UPLOAD_LIMIT_BYTES) {
      if ('close' in source) source.close();
      return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
    }
  }
  if ('close' in source) source.close();
  throw new UploadPrepError(`${label}: this image is too large to upload even after resizing.`);
}

/**
 * Returns a file that is safe to upload, or throws UploadPrepError with a message for the user.
 * `allowVideo` lets MP4/WebM through (they must already be under the limit).
 */
export async function prepareUpload(file: File, opts: { allowVideo?: boolean } = {}): Promise<File> {
  const label = `“${file.name}”`;
  if (VIDEO_TYPES.includes(file.type)) {
    if (!opts.allowVideo) throw new UploadPrepError(`${label}: please choose a still image, not a video.`);
    if (file.size > UPLOAD_LIMIT_BYTES) throw new UploadPrepError(`${label}: videos must be under ${UPLOAD_LIMIT_LABEL}. Please shorten or compress it.`);
    return file;
  }
  if (file.type === 'image/gif') {
    // re-encoding would drop the animation
    if (file.size > UPLOAD_LIMIT_BYTES) throw new UploadPrepError(`${label}: GIFs must be under ${UPLOAD_LIMIT_LABEL}.`);
    return file;
  }
  if (!WEB_IMAGE_TYPES.includes(file.type) && !isHeic(file)) {
    throw new UploadPrepError(`${label}: unsupported file type. Please use JPG, PNG, WebP, AVIF${opts.allowVideo ? ', GIF, MP4 or WebM' : ' or GIF'}.`);
  }
  if (!isHeic(file) && file.size <= KEEP_ORIGINAL_BELOW) {
    // small enough already — keep the original unless its pixels are oversized
    try {
      const probe = await decode(file);
      const w = 'naturalWidth' in probe ? probe.naturalWidth : probe.width;
      const h = 'naturalHeight' in probe ? probe.naturalHeight : probe.height;
      if ('close' in probe) probe.close();
      if (Math.max(w, h) <= MAX_EDGE) return file;
    } catch {
      return file; // let the server's own checks decide
    }
  }
  return shrink(file, label);
}
