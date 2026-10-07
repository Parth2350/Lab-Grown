'use server';
import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { slugify } from '@/lib/utils';
import { ActionError, adminAction, formObject, ok, parse, revalidateAdmin, zCheckbox, zCuid, zInt, zOptText, zSlug, zText } from '../action';
import type { ActionResult, FormState } from '../types';

/**
 * Category slugs are top-level storefront URLs (/<slug>), so they must not shadow a real page.
 */
const RESERVED_SLUGS = new Set([
  'about',
  'account',
  'admin',
  'api',
  'bespoke',
  'blog',
  'cart',
  'checkout',
  'collections',
  'compare',
  'contact',
  'dev-art',
  'diamonds',
  'faq',
  'find-your-match',
  'gifts',
  'journal',
  'login',
  'orders',
  'pages',
  'partner-program',
  'privacy',
  'products',
  'register',
  'returns',
  'search',
  'shipping',
  'terms',
  'wishlist',
]);

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Optional image: absolute http(s) URL or a site-relative path like /images/rings.jpg */
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

const categorySchema = z.object({
  id: zCuid.optional(),
  name: zText('Name', 80),
  slug: zSlug.refine((s) => !RESERVED_SLUGS.has(s), 'That slug is used by a store page — please choose another'),
  description: zOptText(1000),
  image: zImageUrl,
  seoTitle: zOptText(120),
  seoDescription: zOptText(320),
  position: zInt('Position', { min: 0, max: 10_000 }),
  isActive: zCheckbox,
});

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState<{ id: string }>> {
  return adminAction(async () => {
    const raw = formObject(fd);
    if (!raw.slug && typeof raw.name === 'string') raw.slug = slugify(raw.name.replace(/['’‘`]/g, ''));
    const { id, ...data } = parse(categorySchema, raw);
    const row = id
      ? await db.category.update({ where: { id }, data, select: { id: true, name: true } })
      : await db.category.create({ data, select: { id: true, name: true } });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(id ? `${row.name} updated` : `${row.name} created`, { id: row.id });
  });
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.category.update({
      where: { id: parse(zCuid, id) },
      data: { isActive: parse(z.boolean(), isActive) },
      select: { name: true, isActive: true },
    });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(row.isActive ? `${row.name} is visible in the store` : `${row.name} and its products are hidden from the store`);
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const category = await db.category.findUnique({ where: { id: parse(zCuid, id) }, select: { id: true, name: true } });
    if (!category) throw new ActionError('This category no longer exists — it may already have been deleted.');
    const products = await db.product.count({ where: { categoryId: category.id } });
    if (products > 0) {
      throw new ActionError(
        `${category.name} still has ${products} product${products === 1 ? '' : 's'}. Move ${products === 1 ? 'it' : 'them'} to another category or delete ${products === 1 ? 'it' : 'them'} first — or simply deactivate the category to hide it from the store.`,
      );
    }
    await db.category.delete({ where: { id: category.id } });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`${category.name} deleted`);
  });
}
