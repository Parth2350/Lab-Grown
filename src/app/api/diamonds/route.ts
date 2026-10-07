import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queryDiamonds } from '@/lib/server/catalog';
import { remember } from '@/lib/server/cache';

const list = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').filter(Boolean).slice(0, 12) : undefined));
const num = z.coerce.number().finite().optional();

const schema = z.object({
  shape: z.string().max(20).optional(),
  minCarat: num,
  maxCarat: num,
  colors: list,
  clarities: list,
  cuts: list,
  labs: list,
  minPrice: num,
  maxPrice: num,
  sort: z.enum(['price-asc', 'price-desc', 'carat-asc', 'carat-desc']).optional(),
  page: z.coerce.number().int().min(1).max(200).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).optional(),
});

/** Certified loose diamond search for the diamond configurator. Prices in cents. */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(sp);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  const key = `catalog:diamonds:${JSON.stringify(parsed.data)}`;
  const data = await remember(key, 60, () => queryDiamonds(parsed.data));
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
}
