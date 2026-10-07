import { NextResponse } from 'next/server';
import { getCardsByIds, listProducts } from '@/lib/server/catalog';
import { parseFilters } from '@/lib/filters';
import { VIRTUAL_COLLECTIONS } from '@/config/navigation';

/**
 * GET /api/products?ids=a,b,c                     → cards for specific products (wishlist/compare refresh)
 * GET /api/products?category=rings&metal=yellow… → paged listing with the same filters as collection pages
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ids = sp.get('ids');
  if (ids) {
    const products = await getCardsByIds(ids.split(',').filter(Boolean).slice(0, 100));
    return NextResponse.json({ products });
  }
  const filters = parseFilters(sp);
  const virtual = VIRTUAL_COLLECTIONS[sp.get('collectionSlug') ?? ''];
  const listing = await listProducts(
    {
      category: sp.get('category') ?? undefined,
      collection: virtual ? undefined : sp.get('collectionSlug') ?? undefined,
      shape: sp.get('shapeSlug') ?? undefined,
      maxPrice: virtual?.maxPrice,
      minPrice: virtual?.minPrice,
    },
    filters,
    Number(sp.get('pageSize') ?? 24),
  );
  return NextResponse.json(listing, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } });
}
