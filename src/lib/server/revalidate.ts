import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { forget } from './cache';

/** Call after any admin change to products, variants, diamonds, categories or collections. */
export async function revalidateCatalog() {
  revalidateTag('products');
  revalidateTag('categories');
  revalidateTag('collections');
  await forget('catalog:');
  revalidatePath('/', 'layout');
}

/** Call after changing store settings (announcements, tax, shipping, hero copy). */
export function revalidateSettings() {
  revalidateTag('settings');
  revalidatePath('/', 'layout');
}
