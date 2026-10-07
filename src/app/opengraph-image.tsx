import { ImageResponse } from 'next/og';
import { site } from '@/config/site';
import { OG_SIZE, OgFrame } from '@/lib/og';

export const alt = `${site.name} — ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<OgFrame eyebrow={site.tagline} title="Jewelry Made for the Moments That Matter" shape="oval" />, size);
}
