import type { Metadata, Viewport } from 'next';
import { Sen, Spectral } from 'next/font/google';
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
  keywords: ['natural diamonds', 'lab-grown diamonds', 'engagement rings', 'wedding bands', 'fine jewelry', 'IGI certified', 'tennis bracelet', 'diamond earrings'],
  openGraph: { siteName: site.name, type: 'website', locale: 'en_US', url: site.url },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};

// Spectral for headings and prices, Sen for everything else (self-hosted by next/font at build time)
const serif = Spectral({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], display: 'swap', variable: '--font-serif' });
const sans = Sen({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export const viewport: Viewport = {
  themeColor: '#FBF9F5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </body>
    </html>
  );
}
