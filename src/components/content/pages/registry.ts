/** Metadata and navigation for the /pages/* information pages. */

export type PageGroup = 'care' | 'craft' | 'legal';

export type PageMetaEntry = {
  slug: string;
  title: string;
  navLabel: string;
  eyebrow: string;
  description: string;
  group: PageGroup;
  /** ISO date the page content was last revised */
  updated?: string;
};

export const CONTENT_PAGES = {
  'shipping-policy': {
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    navLabel: 'Shipping',
    eyebrow: 'Client Care',
    description: 'Complimentary, fully insured shipping on every order. Delivery options, production times, international duties and how we package your jewelry.',
    group: 'care',
    updated: '2026-09-01',
  },
  returns: {
    slug: 'returns',
    title: 'Returns & Exchanges',
    navLabel: 'Returns & Exchanges',
    eyebrow: 'Client Care',
    description: 'Return or exchange your jewelry within 30 days of delivery with a complimentary, insured return label. How to start a return and what we accept.',
    group: 'care',
    updated: '2026-09-01',
  },
  'refund-policy': {
    slug: 'refund-policy',
    title: 'Refund Policy',
    navLabel: 'Refunds',
    eyebrow: 'Client Care',
    description: 'How and when refunds are issued, order cancellations, bespoke deposits and promotional purchases — explained clearly.',
    group: 'care',
    updated: '2026-09-01',
  },
  warranty: {
    slug: 'warranty',
    title: 'Lifetime Warranty',
    navLabel: 'Lifetime Warranty',
    eyebrow: 'Client Care',
    description: 'Every piece is covered by our lifetime manufacturing warranty, with complimentary cleaning, inspection and prong tightening for as long as you own it.',
    group: 'care',
    updated: '2026-09-01',
  },
  'care-guide': {
    slug: 'care-guide',
    title: 'Jewelry Care Guide',
    navLabel: 'Care Guide',
    eyebrow: 'Client Care',
    description: 'How to clean, store and care for diamond jewelry and solid gold, so every piece keeps its brilliance for a lifetime.',
    group: 'care',
  },
  faq: {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    navLabel: 'FAQ',
    eyebrow: 'Client Care',
    description: 'Answers about natural and lab-grown diamonds, certification, orders, payment, shipping, returns, ring sizing and bespoke design.',
    group: 'care',
  },
  manufacturing: {
    slug: 'manufacturing',
    title: 'Our Manufacturing',
    navLabel: 'Manufacturing',
    eyebrow: 'Inside the Workshop',
    description: 'From first sketch to final polish — the six-step process behind every piece made in our own fine jewelry workshop.',
    group: 'craft',
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    navLabel: 'Privacy Policy',
    eyebrow: 'Legal',
    description: 'What personal information we collect, how we use and protect it, who we share it with, and the choices and rights you have.',
    group: 'legal',
    updated: '2026-09-01',
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    navLabel: 'Terms of Service',
    eyebrow: 'Legal',
    description: 'The terms that apply when you browse our website and purchase jewelry from us, including orders, pricing, intellectual property and liability.',
    group: 'legal',
    updated: '2026-09-01',
  },
  'cookie-policy': {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    navLabel: 'Cookie Policy',
    eyebrow: 'Legal',
    description: 'The cookies and similar technologies our website uses, why we use them and how you can control them.',
    group: 'legal',
    updated: '2026-09-01',
  },
} satisfies Record<string, PageMetaEntry>;

export type ContentSlug = keyof typeof CONTENT_PAGES;
export const CONTENT_SLUGS = Object.keys(CONTENT_PAGES) as ContentSlug[];

export function getContentPage(slug: string): PageMetaEntry | null {
  return (CONTENT_PAGES as Record<string, PageMetaEntry>)[slug] ?? null;
}

/** Side navigation, including the standalone lab-grown diamonds guide. */
export const PAGE_NAV: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Client Care',
    links: [
      { label: 'Shipping', href: '/pages/shipping-policy' },
      { label: 'Returns & Exchanges', href: '/pages/returns' },
      { label: 'Refunds', href: '/pages/refund-policy' },
      { label: 'Lifetime Warranty', href: '/pages/warranty' },
      { label: 'Care Guide', href: '/pages/care-guide' },
      { label: 'FAQ', href: '/pages/faq' },
    ],
  },
  {
    title: 'Our Craft',
    links: [
      { label: 'Lab-Grown Diamonds', href: '/pages/lab-grown-diamonds' },
      { label: 'Manufacturing', href: '/pages/manufacturing' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/pages/privacy-policy' },
      { label: 'Terms of Service', href: '/pages/terms' },
      { label: 'Cookie Policy', href: '/pages/cookie-policy' },
    ],
  },
];
