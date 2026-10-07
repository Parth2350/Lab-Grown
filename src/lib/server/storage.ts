import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm']);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export class UploadError extends Error {}

/** Verify the file's real signature matches its declared type (never trust the client MIME type). */
function sniff(bytes: Uint8Array, type: string) {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  switch (type) {
    case 'image/jpeg':
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/png':
      return bytes[0] === 0x89 && ascii(1, 4) === 'PNG';
    case 'image/gif':
      return ascii(0, 4) === 'GIF8';
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'image/avif':
      return ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12));
    case 'video/mp4':
      return ascii(4, 8) === 'ftyp';
    case 'video/webm':
      return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    default:
      return false;
  }
}

/**
 * Stores an uploaded file:
 *  1. Cloudinary (signed upload) when CLOUDINARY_* env vars are set,
 *  2. Vercel Blob when BLOB_READ_WRITE_TOKEN is set (added automatically when a Blob
 *     store is connected to the Vercel project),
 *  3. otherwise /public/uploads — local development only (serverless filesystems are read-only).
 */
export async function saveUpload(file: File, folder = 'misc'): Promise<{ url: string; kind: 'image' | 'video' }> {
  if (!ALLOWED.has(file.type)) throw new UploadError('Unsupported file type. Please upload JPG, PNG, WebP, AVIF, GIF, MP4 or WebM.');
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('File is larger than 8 MB.');
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniff(head, file.type)) throw new UploadError('This file does not look like a valid image or video.');
  const kind = file.type.startsWith('video/') ? 'video' : 'image';
  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '').slice(0, 40) || 'misc';

  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (cloud && key && secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = `folder=aurevia/${safeFolder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(params + secret).digest('hex');
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', key);
    form.append('timestamp', String(timestamp));
    form.append('folder', `aurevia/${safeFolder}`);
    form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${kind}/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new UploadError('Upload to image storage failed.');
    const json = (await res.json()) as { secure_url: string };
    return { url: json.secure_url, kind };
  }

  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`uploads/${safeFolder}/${name}`, file, { access: 'public', contentType: file.type, addRandomSuffix: false });
      return { url: blob.url, kind };
    } catch {
      throw new UploadError('Upload to file storage failed. Please try again.');
    }
  }
  if (process.env.VERCEL) throw new UploadError('File storage is not configured — connect a Vercel Blob store to this project.');

  const dir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${safeFolder}/${name}`, kind };
}
