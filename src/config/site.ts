/**
 * Brand identity — change the name here and it propagates across the whole site,
 * SEO metadata, structured data, emails and the admin.
 */
export const site = {
  name: 'The V Jewels',
  legalName: 'The V Jewels',
  tagline: 'Natural & Lab-Grown Diamond Fine Jewelry',
  description:
    'The V Jewels crafts certified natural & lab-grown diamond engagement rings, wedding bands and fine jewelry in our own workshop — made for the moments that matter.',
  // NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is detected automatically
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, ''),
  locale: 'en-IN',
  currency: 'INR',
  currencySymbol: '₹',
  foundedYear: 2010,
  contact: {
    email: 'support@thevjewels.com',
    phone: '+91 98248 22200',
    phoneHref: 'tel:+919824822200',
    whatsapp: '+91 98248 22200',
    /** digits only (country code first), as wa.me expects */
    whatsappNumber: '919824822200',
    whatsappHref: 'https://wa.me/919824822200',
    address: {
      street: 'Laxmi Enclave 2',
      city: 'Surat',
      region: 'Gujarat',
      postalCode: '395003',
      country: 'India',
    },
    hours: [
      { days: 'Monday – Friday', time: '10:00 – 19:00 IST' },
      { days: 'Saturday', time: '11:00 – 17:00 IST' },
      { days: 'Sunday', time: 'By appointment' },
    ],
  },
  socials: {
    instagram: 'https://instagram.com/',
    pinterest: 'https://pinterest.com/',
    facebook: 'https://facebook.com/',
    youtube: 'https://youtube.com/',
  },
  stats: {
    years: '15+',
    countries: '18+',
    pieces: '40,000+',
    artisans: '120',
  },
} as const;

export type Site = typeof site;
