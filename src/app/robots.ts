import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/utils';

// Every listing URL is rendered on demand, so crawlers walking filter combinations burn the hosting plan's function
// time. Single-filter menu pages (?shape=oval) stay crawlable; combinations, sorting, price ranges, paging and
// searches don't. SEO-tool scrapers and AI-training crawlers are kept out entirely (search engines and AI search
// assistants are still welcome).
const PRIVATE = ['/admin', '/account', '/checkout', '/cart', '/api/', '/search'];
const COMBINATIONS = ['/*?*&', '/*?*sort=', '/*?*price=', '/*?*page=', '/*?*q='];
const SCRAPERS = ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot', 'Bytespider', 'GPTBot', 'CCBot', 'ClaudeBot', 'meta-externalagent', 'Amazonbot', 'Applebot-Extended', 'DataForSeoBot', 'BLEXBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: [...PRIVATE, ...COMBINATIONS] },
      { userAgent: SCRAPERS, disallow: '/' },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
