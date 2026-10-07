import 'server-only';
import { db } from '@/lib/server/db';

export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  position: number;
  isActive: boolean;
  updatedAt: Date;
  productCount: number;
  activeProductCount: number;
};

/** Every category (there are only a handful) with product counts aggregated in SQL. */
export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  const [rows, counts] = await Promise.all([
    db.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        image: true,
        seoTitle: true,
        seoDescription: true,
        position: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    db.product.groupBy({ by: ['categoryId', 'isActive'], _count: { _all: true } }),
  ]);

  const total = new Map<string, number>();
  const active = new Map<string, number>();
  for (const c of counts) {
    total.set(c.categoryId, (total.get(c.categoryId) ?? 0) + c._count._all);
    if (c.isActive) active.set(c.categoryId, (active.get(c.categoryId) ?? 0) + c._count._all);
  }

  return rows.map((r) => ({ ...r, productCount: total.get(r.id) ?? 0, activeProductCount: active.get(r.id) ?? 0 }));
}

/** Lightweight list for filter selects. */
export async function categoryOptions() {
  return db.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }], select: { slug: true, name: true } });
}
