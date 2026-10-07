import { NextResponse } from 'next/server';
import { searchCatalog } from '@/lib/server/catalog';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.slice(0, 120) ?? '';
  const data = await searchCatalog(q, 8);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
