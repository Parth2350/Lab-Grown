'use server';
import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { saveUpload, UploadError } from '@/lib/server/storage';
import { ActionError, adminAction, fdFiles, fdString, ok, parse, revalidateAdmin, zCuid, zOptText } from '../action';
import { getProductMedia } from '../queries/products';
import type { ActionResult } from '../types';
import { removeLocalUploads } from './product-files';
import type { MediaItem } from '@/components/admin/products/shared';

const MAX_MEDIA_PER_PRODUCT = 40;
const CATALOG_MEDIA_PREFIX = 'https://webassests.s3.';
const MAX_FILES_PER_UPLOAD = 10;

type MediaResult = ActionResult<{ items: MediaItem[] }>;

async function productOrThrow(productId: string) {
  // partner-catalogue photos don't count towards the limit — it is for the store's own uploads
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, metalColors: true, _count: { select: { images: { where: { NOT: { url: { startsWith: CATALOG_MEDIA_PREFIX } } } } } } },
  });
  if (!product) throw new ActionError('This product no longer exists.');
  return product;
}

/** '' → null (all metals); otherwise must be one of the product's metal colours */
function metalTag(value: string, allowed: string[]) {
  if (!value) return null;
  if (!allowed.includes(value)) throw new ActionError('Choose one of this product’s metal colours.');
  return value;
}

async function refreshed(productId: string, message: string): Promise<MediaResult> {
  await revalidateCatalog();
  revalidateAdmin();
  return ok(message, { items: await getProductMedia(productId) });
}

/** Rewrite positions 0..n-1 in the given order */
async function writeOrder(ids: string[]) {
  await db.$transaction(ids.map((id, position) => db.productImage.update({ where: { id }, data: { position } })));
}

/** Upload one or more images/videos to a product (fields: files[], metalColor, alt). */
export async function uploadProductMedia(productId: string, fd: FormData): Promise<MediaResult> {
  return adminAction(async () => {
    const pid = parse(zCuid, productId);
    const files = fdFiles(fd, 'files');
    if (!files.length) throw new ActionError('Choose at least one image or video to upload.');
    if (files.length > MAX_FILES_PER_UPLOAD) throw new ActionError(`Upload up to ${MAX_FILES_PER_UPLOAD} files at a time.`);
    const product = await productOrThrow(pid);
    if (product._count.images + files.length > MAX_MEDIA_PER_PRODUCT) throw new ActionError(`A product can have up to ${MAX_MEDIA_PER_PRODUCT} photos and videos.`);
    const metalColor = metalTag(fdString(fd, 'metalColor'), product.metalColors);
    const alt = parse(zOptText(200), fdString(fd, 'alt'));

    const last = await db.productImage.aggregate({ where: { productId: pid }, _max: { position: true } });
    let position = (last._max.position ?? -1) + 1;
    let saved = 0;
    const failures: string[] = [];
    for (const file of files) {
      try {
        const up = await saveUpload(file, 'products');
        await db.productImage.create({ data: { productId: pid, url: up.url, kind: up.kind, alt, metalColor, position: position++ } });
        saved++;
      } catch (e) {
        if (e instanceof UploadError) failures.push(files.length > 1 ? `${file.name}: ${e.message}` : e.message);
        else throw e;
      }
    }
    if (!saved) throw new ActionError(failures[0] ?? 'Upload failed. Please try again.');
    const message = failures.length ? `Uploaded ${saved} of ${files.length} — ${failures.join('; ')}` : `Uploaded ${saved} file${saved === 1 ? '' : 's'}`;
    return refreshed(pid, message);
  });
}

const updateSchema = z.object({ alt: zOptText(200), metalColor: z.string().max(40) });

/** Update alt text and/or metal tag of one media item. */
export async function updateProductMedia(id: string, input: { alt: string; metalColor: string }): Promise<MediaResult> {
  return adminAction(async () => {
    const data = parse(updateSchema, input);
    const item = await db.productImage.findUnique({ where: { id: parse(zCuid, id) }, select: { id: true, productId: true, product: { select: { metalColors: true } } } });
    if (!item) throw new ActionError('This photo no longer exists.');
    await db.productImage.update({ where: { id: item.id }, data: { alt: data.alt, metalColor: metalTag(data.metalColor, item.product.metalColors) } });
    return refreshed(item.productId, 'Media updated');
  });
}

/** Move one media item up or down; positions are rewritten 0..n-1. */
export async function moveProductMedia(id: string, direction: 'up' | 'down'): Promise<MediaResult> {
  return adminAction(async () => {
    const dir = parse(z.enum(['up', 'down']), direction);
    const item = await db.productImage.findUnique({ where: { id: parse(zCuid, id) }, select: { id: true, productId: true } });
    if (!item) throw new ActionError('This photo no longer exists.');
    const ids = (await getProductMedia(item.productId)).map((m) => m.id);
    const i = ids.indexOf(item.id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return ok(undefined, { items: await getProductMedia(item.productId) });
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await writeOrder(ids);
    return refreshed(item.productId, dir === 'up' ? 'Moved earlier' : 'Moved later');
  });
}

/** Delete one media item (and its local file when stored under /public/uploads). */
export async function deleteProductMedia(id: string): Promise<MediaResult> {
  return adminAction(async () => {
    const item = await db.productImage.findUnique({ where: { id: parse(zCuid, id) }, select: { id: true, productId: true, url: true, kind: true } });
    if (!item) throw new ActionError('This photo no longer exists.');
    await db.productImage.delete({ where: { id: item.id } });
    await removeLocalUploads([item.url]);
    const remaining = await getProductMedia(item.productId);
    if (remaining.some((m, i) => m.position !== i)) await writeOrder(remaining.map((m) => m.id));
    return refreshed(item.productId, item.kind === 'video' ? 'Video deleted' : 'Photo deleted');
  });
}
