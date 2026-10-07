import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/server/catalog';

/** Full product detail (variants, diamond options, default diamond, reviews) — used by quick view & compare. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } });
}
