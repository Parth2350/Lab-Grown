import { ImageResponse } from 'next/og';
import { getProductBySlug } from '@/lib/server/catalog';
import { OG_SIZE, OgFrame } from '@/lib/og';
import { formatMoney } from '@/lib/utils';

/** Stable product image URL for structured data (the file-based OG route carries a build hash). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return new Response('Not found', { status: 404 });
  return new ImageResponse(
    <OgFrame eyebrow={p.category.name} title={p.name} subtitle={`From ${formatMoney(p.fromPrice)}`} shape={p.shapes[0] ?? 'round'} />,
    { ...OG_SIZE, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
  );
}
