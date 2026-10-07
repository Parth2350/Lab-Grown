import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import type { ArtSpec } from '@/components/art/JewelryArt';
import type { MediaImage } from '@/lib/types';

/** Product summary used by the collection product table and the picker (client-safe shape). */
export type CollectionProductHit = {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
  categoryName: string;
  art: ArtSpec | null;
  images: MediaImage[];
  shape: string;
  metal: string;
  carat: number | null;
};

export const collectionProductSelect = {
  id: true,
  name: true,
  sku: true,
  isActive: true,
  art: true,
  shapes: true,
  defaultMetalColor: true,
  centerCarat: true,
  totalCarat: true,
  category: { select: { name: true } },
  images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, alt: true, kind: true, metalColor: true } },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof collectionProductSelect }>;

export function toProductHit(p: ProductRow): CollectionProductHit {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    isActive: p.isActive,
    categoryName: p.category.name,
    art: (p.art as ArtSpec | null) ?? null,
    images: p.images,
    shape: p.shapes[0] ?? 'round',
    metal: p.defaultMetalColor,
    carat: p.centerCarat ?? p.totalCarat ?? null,
  };
}

export async function listAdminCollections() {
  return db.collection.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      seoTitle: true,
      seoDescription: true,
      isFeatured: true,
      position: true,
      updatedAt: true,
      _count: { select: { products: true } },
    },
  });
}

export async function nextCollectionPosition() {
  const agg = await db.collection.aggregate({ _max: { position: true } });
  return agg._max.position == null ? 0 : agg._max.position + 1;
}

export async function getAdminCollection(id: string) {
  const c = await db.collection.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      seoTitle: true,
      seoDescription: true,
      isFeatured: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      products: { orderBy: [{ isActive: 'desc' }, { name: 'asc' }], select: collectionProductSelect },
    },
  });
  if (!c) return null;
  return { ...c, products: c.products.map(toProductHit) };
}
