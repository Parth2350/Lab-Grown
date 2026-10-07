import { NextResponse } from 'next/server';
import { MAX_UPLOAD_BYTES, saveUpload, UploadError } from '@/lib/server/storage';
import { badRequest, clientIp, rateLimit, tooManyRequests } from '@/components/content/server/guard';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

/** Confirms the bytes really are the image type the browser claims. */
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
      return ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12));
    default:
      return false;
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(`upload:${clientIp(req)}`, 20, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 256 * 1024) return NextResponse.json({ error: 'That image is larger than 8 MB. Please choose a smaller file.' }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest('We could not read that upload. Please try again.');
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return badRequest('Please choose an image to upload.');
  if (!IMAGE_TYPES.has(file.type)) return badRequest('Please upload a JPG, PNG, WebP, AVIF or GIF image.');
  if (file.size > MAX_UPLOAD_BYTES) return badRequest('That image is larger than 8 MB. Please choose a smaller file.');

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniff(head, file.type)) return badRequest('That file does not appear to be a valid image. Please try another.');

  try {
    const { url } = await saveUpload(file, 'bespoke');
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) return badRequest(err.message);
    return NextResponse.json({ error: 'We could not upload that image just now. Please try again.' }, { status: 500 });
  }
}
