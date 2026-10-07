import type { Metadata } from 'next';
import { site } from '@/config/site';
import type { ProductDetail } from './types';
import { absoluteUrl } from './utils';

type MetaInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  type?: 'website' | 'article';
};

/** Consistent per-page metadata: title, description, canonical, OpenGraph & Twitter. */
export function pageMeta({ title, description, path, image, noIndex, type = 'website' }: MetaInput): Metadata {
  const desc = (description ?? site.description).slice(0, 160);
  const url = absoluteUrl(path);
  const images = image ? [{ url: image.startsWith('http') ? image : absoluteUrl(image), width: 1200, height: 630, alt: title }] : undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, siteName: site.name, type, locale: 'en_US', ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', title, description: desc, ...(images ? { images: images.map((i) => i.url) } : {}) },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: absoluteUrl('/icon.svg'),
    description: site.description,
    email: site.contact.email,
    telephone: site.contact.phone,
    foundingDate: String(site.foundedYear),
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.address.street,
      addressLocality: site.contact.address.city,
      addressRegion: site.contact.address.region,
      postalCode: site.contact.address.postalCode,
      addressCountry: site.contact.address.country,
    },
    sameAs: Object.values(site.socials),
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(items: { label: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

export function productLd(p: ProductDetail) {
  const prices = p.variants.map((v) => v.price);
  const diamondFrom = Math.max(0, p.fromPrice - (prices.length ? Math.min(...prices) : p.fromPrice));
  const high = prices.length ? Math.max(...prices) + diamondFrom : p.fromPrice;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    description: p.description,
    url: absoluteUrl(`/products/${p.slug}`),
    image: [p.images[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : absoluteUrl(p.images[0].url)) : absoluteUrl(`/api/og/${p.slug}`)],
    brand: { '@type': 'Brand', name: site.name },
    category: p.category.name,
    material: p.metalColors.map((m) => `${m.replace('-', ' & ')} gold`).join(', '),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: site.currency,
      lowPrice: (p.fromPrice / 100).toFixed(2),
      highPrice: (high / 100).toFixed(2),
      offerCount: p.variants.length,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: { '@id': `${site.url}/#organization` },
    },
    ...(p.reviewCount > 0
      ? {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.toFixed(1), reviewCount: p.reviewCount, bestRating: 5, worstRating: 1 },
          review: p.reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.authorName },
            datePublished: r.createdAt.slice(0, 10),
            name: r.title,
            reviewBody: r.body,
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
          })),
        }
      : {}),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

export function itemListLd(name: string, items: { name: string; slug: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/products/${p.slug}`), name: p.name })),
  };
}
