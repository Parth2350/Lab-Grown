'use server';
import 'server-only';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { slugify } from '@/lib/utils';
import { VIRTUAL_COLLECTIONS } from '@/config/navigation';
import { ActionError, adminAction, formObject, ok, parse, revalidateAdmin, zCheckbox, zCuid, zInt, zOptText, zSlug, zText } from '../action';
import { collectionProductSelect, toProductHit, type CollectionProductHit } from '../queries/collections';
import type { ActionResult, FormState } from '../types';

/** /collections/<slug> is shared with the virtual collections (gifts-under-250, all …) and /collections/shape/*. */
const isReservedSlug = (s: string) => s === 'shape' || Object.prototype.hasOwnProperty.call(VIRTUAL_COLLECTIONS, s);

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

const zImageUrl = z
  .preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string()
      .trim()
      .max(500, 'Image URL must be 500 characters or fewer')
      .refine((v) => /^\/(?!\/)\S*$/.test(v) || isHttpUrl(v), 'Use a full https:// URL or a site path starting with /')
      .nullable()
      .optional(),
  )
  .transform((v) => v ?? null);

const collectionSchema = z.object({
  id: zCuid.optional(),
  name: zText('Name', 80),
  slug: zSlug.refine((s) => !isReservedSlug(s), 'That slug is used by a built-in collection page — please choose another'),
  description: zOptText(1000),
  image: zImageUrl,
  seoTitle: zOptText(120),
  seoDescription: zOptText(320),
  position: zInt('Position', { min: 0, max: 10_000 }),
  isFeatured: zCheckbox,
});

const zSearch = z.string().trim().max(100).default('');

export async function saveCollection(_prev: FormState, fd: FormData): Promise<FormState<{ id: string }>> {
  return adminAction(async () => {
    const raw = formObject(fd);
    if (!raw.slug && typeof raw.name === 'string') raw.slug = slugify(raw.name.replace(/['’‘`]/g, ''));
    const { id, ...data } = parse(collectionSchema, raw);
    const row = id
      ? await db.collection.update({ where: { id }, data, select: { id: true, name: true } })
      : await db.collection.create({ data, select: { id: true, name: true } });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(id ? `${row.name} updated` : `${row.name} created — now add some products`, { id: row.id });
  });
}

export async function setCollectionFeatured(id: string, isFeatured: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.collection.update({
      where: { id: parse(zCuid, id) },
      data: { isFeatured: parse(z.boolean(), isFeatured) },
      select: { name: true, isFeatured: true },
    });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(row.isFeatured ? `${row.name} is now featured` : `${row.name} is no longer featured`);
  });
}

/** Deleting a collection only removes the grouping — products are untouched (implicit m2m rows go with it). */
export async function deleteCollection(id: string, redirectToList?: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const collection = await db.collection.findUnique({ where: { id: parse(zCuid, id) }, select: { id: true, name: true } });
    if (!collection) throw new ActionError('This collection no longer exists — it may already have been deleted.');
    await db.collection.delete({ where: { id: collection.id } });
    await revalidateCatalog();
    revalidateAdmin();
    if (parse(z.boolean().optional(), redirectToList)) redirect('/admin/collections');
    return ok(`${collection.name} deleted`);
  });
}

/** Up to 20 products that are not yet in the collection, matched on name, SKU or slug. */
export async function searchProductsForCollection(collectionId: string, q: string): Promise<ActionResult<CollectionProductHit[]>> {
  return adminAction(async () => {
    const id = parse(zCuid, collectionId);
    const term = parse(zSearch, q);
    const rows = await db.product.findMany({
      where: {
        collections: { none: { id } },
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { sku: { contains: term, mode: 'insensitive' } },
                { slug: { contains: slugify(term) || term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: term ? [{ isActive: 'desc' }, { name: 'asc' }] : [{ createdAt: 'desc' }, { name: 'asc' }],
      take: 20,
      select: collectionProductSelect,
    });
    return ok(undefined, rows.map(toProductHit));
  });
}

export async function addProductToCollection(collectionId: string, productId: string): Promise<ActionResult> {
  return adminAction(async () => {
    const cid = parse(zCuid, collectionId);
    const pid = parse(zCuid, productId);
    const product = await db.product.findUnique({ where: { id: pid }, select: { id: true, name: true } });
    if (!product) throw new ActionError('That product no longer exists.');
    const collection = await db.collection.update({
      where: { id: cid },
      data: { products: { connect: { id: product.id } } },
      select: { name: true },
    });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`Added ${product.name} to ${collection.name}`);
  });
}

export async function removeProductFromCollection(collectionId: string, productId: string): Promise<ActionResult> {
  return adminAction(async () => {
    const cid = parse(zCuid, collectionId);
    const pid = parse(zCuid, productId);
    const collection = await db.collection.update({
      where: { id: cid },
      data: { products: { disconnect: { id: pid } } },
      select: { name: true },
    });
    const product = await db.product.findUnique({ where: { id: pid }, select: { name: true } });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`Removed ${product?.name ?? 'product'} from ${collection.name}`);
  });
}
