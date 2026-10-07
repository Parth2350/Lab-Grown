import type { MetadataRoute } from 'next';
import { db } from '@/lib/server/db';
import { getCategories, getCollections } from '@/lib/server/catalog';
import { SHAPES } from '@/lib/catalog';
import { VIRTUAL_COLLECTIONS } from '@/config/navigation';
import { absoluteUrl } from '@/lib/utils';
import { CONTENT_SLUGS } from '@/components/content/pages/registry';

export const revalidate = 3600;

const STATIC = [...new Set(['/', '/about', '/contact', '/bespoke', '/partner-program', '/gifts', '/find-your-match', '/pages/lab-grown-diamonds', ...CONTENT_SLUGS.map((s) => `/pages/${s}`)])];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [categories, collections, products] = await Promise.all([
    getCategories(),
    getCollections(),
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...STATIC.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/${c.slug}`), lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })),
    ...collections.map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...Object.keys(VIRTUAL_COLLECTIONS).map((s) => ({ url: absoluteUrl(`/collections/${s}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...SHAPES.map((s) => ({ url: absoluteUrl(`/collections/shape/${s.slug}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map((p) => ({ url: absoluteUrl(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
