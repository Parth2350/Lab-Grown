import { ImageResponse } from 'next/og';
import { getProductBySlug } from '@/lib/server/catalog';
import { OG_SIZE, OgFrame } from '@/lib/og';
import { formatMoney } from '@/lib/utils';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Lab-grown diamond jewelry';

export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return new ImageResponse(
    <OgFrame eyebrow={p?.category.name ?? 'Fine Jewelry'} title={p?.name ?? 'Lab-Grown Diamond Jewelry'} subtitle={p ? `From ${formatMoney(p.fromPrice)}` : undefined} shape={p?.shapes[0] ?? 'round'} />,
    size,
  );
}
