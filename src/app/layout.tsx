import type { Metadata, Viewport } from 'next';
import { site } from '@/config/site';
import { Providers } from '@/components/providers/Providers';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationLd, websiteLd } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ['lab-grown diamonds', 'engagement rings', 'wedding bands', 'fine jewelry', 'IGI certified', 'tennis bracelet', 'diamond earrings'],
  openGraph: { siteName: site.name, type: 'website', locale: 'en_US', url: site.url },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#FBF9F5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* fonts are self-hosted (public/fonts) and declared in globals.css */}
        <link rel="preload" href="/fonts/cormorant-garamond-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/jost-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </body>
    </html>
  );
}
