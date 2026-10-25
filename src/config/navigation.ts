import { site } from './site';

export type NavLink = { label: string; href: string; value: string };
export type MegaColumn = { title: string; kind: 'shape' | 'metal' | 'style'; links: NavLink[] };
export type NavItem = { label: string; href: string; mega?: { columns: MegaColumn[]; promo: { image: string; alt: string } } };

// The menu mirrors brilliancecarat.com: each jewelry category opens Shop by Shape · Shop by Metal · Shop by Style,
// in their order and wording. The store layout drops any link no product in that category carries (see getMainNav).
const SHAPES: [string, string][] = [
  ['round', 'Round'],
  ['oval', 'Oval'],
  ['princess', 'Princess'],
  ['cushion', 'Cushion'],
  ['emerald', 'Emerald'],
  ['pear', 'Pear'],
  ['marquise', 'Marquise'],
  ['radiant', 'Radiant'],
  ['heart', 'Heart'],
  ['asscher', 'Asscher'],
  ['calf-head', 'Calf Head'],
  ['step-cut-oval', 'Step Cut Oval'],
  ['bullet', 'Bullet'],
  ['long-cushion', 'Long Cushion'],
  ['diamond-cut', 'Diamond Cut'],
  ['step-cut-pear', 'Step Cut Pear'],
  ['step-cut-marquise', 'Step Cut Marquise'],
  ['dutch-marquise', 'Dutch Marquise'],
  ['shield', 'Shield'],
  ['trapezoid', 'Trapezoid'],
  ['triangle', 'Triangle'],
  ['trilliant', 'Trilliant'],
  ['v-cut', 'V Cut'],
  ['moval', 'Moval'],
];
const METALS: [string, string][] = [
  ['yellow', 'Yellow Gold'],
  ['white', 'White Gold'],
  ['rose', 'Rose Gold'],
  ['yellow-white', 'Yellow & White Gold'],
  ['rose-white', 'Rose & White Gold'],
];

function category(label: string, href: string, styles: string[], promoAlt: string, extraMetals: [string, string][] = []): NavItem {
  const slug = (l: string) => l.trim().toLowerCase().replace(/\s+/g, '-');
  return {
    label,
    href,
    mega: {
      columns: [
        { title: 'Shop by Shape', kind: 'shape', links: SHAPES.map(([v, l]) => ({ label: l, value: v, href: `${href}?shape=${v}` })) },
        { title: 'Shop by Metal', kind: 'metal', links: [...METALS, ...extraMetals].map(([v, l]) => ({ label: l, value: v, href: `${href}?metal=${v}` })) },
        { title: 'Shop by Style', kind: 'style', links: styles.map((l) => ({ label: l, value: slug(l), href: `${href}?style=${slug(l)}` })) },
      ],
      promo: { image: `/images/nav${href}.webp`, alt: promoAlt },
    },
  };
}

export const MAIN_NAV: NavItem[] = [
  category(
    'Engagement Rings',
    '/engagement-rings',
    ['Bezel', 'Bold Gold', 'Channel', 'East West', 'Fancy Color', 'Fancy Shape', 'Halo', 'Hidden Halo', 'High Jewelry', 'Wave', 'Side Stone', 'Fashion', 'Solitaire', 'Toi Et Moi', 'Three Stone', 'Vintage', 'Half Bezel'],
    'An oval diamond engagement ring worn on the hand',
  ),
  category(
    'Wedding Bands',
    '/wedding-bands',
    ['Anniversary', 'Bezel', 'Channel', 'Color Stone', 'Curve', 'Eternity', 'Fancy', 'Stackable', 'Mens Jewelry', 'Hidden Halo', 'Five Stone', 'Fancy Shape', 'Prong', 'Fashion', 'Seven Stone', 'High Jewelry', 'Fancy Color'],
    'A pair of diamond wedding bands',
  ),
  category(
    'Rings',
    '/rings',
    ['Baguette', 'Bezel', 'Bypass', 'Channel', 'Color Stone', 'Curve', 'Chevron Band', 'East West', 'Fashion', 'Stackable', 'Solitaire', 'Side Stone', 'High Jewelry', 'Fancy Color', 'Half Bezel', 'Wave', 'Five Stone', 'Super Fancy', 'Step Cut', 'Fancy Shape'],
    'Stacked diamond rings worn together',
    [['black', 'Black Rhodium Gold']],
  ),
  category(
    'Earrings',
    '/earrings',
    ['Bezel', 'Cluster', 'Color Stone', 'Drilled Diamond', 'Drop', 'Fancy Color', 'Fancy Shape', 'Hoops', 'Halo', 'Fashion', 'Solitaire', 'High Jewelry', 'Paper Clip', 'Baguette', 'Long', 'Half Bezel', 'Toi Et Moi', 'Super Fancy', 'Step Cut', 'Three Stone'],
    'Diamond drop earrings worn with the hair swept back',
  ),
  category(
    'Pendants',
    '/pendants',
    ['Bar Necklace', 'Bezel', 'Circle', 'Cluster', 'Cross', 'Curve', 'Diamond By Yard', 'Fashion', 'Solitaire', 'Heart', 'Three Stone', 'Halo', 'Fancy Color', 'Fancy Shape', 'High Jewelry', 'Half Bezel', 'Toi Et Moi', 'Super Fancy', 'Step Cut', 'Drop'],
    'A diamond solitaire pendant at the collarbone',
  ),
  category(
    'Necklaces',
    '/necklaces',
    ['Bezel', 'Chain', 'Choker', 'Color Stone', 'Diamond By Yard', 'Drilled Diamond', 'Drop', 'Fancy Color', 'Tennis', 'Fashion', 'Layered', 'Paper Clip', 'High Jewelry', 'Fancy Shape', 'Solitaire', 'Lariat', 'Paper Clip Stone', 'Y Necklace', 'Step Cut', 'Half Bezel'],
    'Layered diamond necklaces',
  ),
  category(
    'Bracelets',
    '/bracelets',
    ['Bangle', 'Bezel', 'Chain', 'Color Stone', 'Cluster', 'Drilled Diamond', 'Drop', 'East West', 'Tennis', 'Fashion', 'Paper Clip', 'Fancy Color', 'High Jewelry', 'Fancy Shape', 'Super Fancy', 'Step Cut', 'Solitaire', 'Half Bezel', 'Five Stone'],
    'A diamond tennis bracelet on the wrist',
  ),
  { label: 'Bespoke Design', href: '/bespoke' },
  { label: 'Gifts', href: '/gifts' },
  { label: 'Find Your Match', href: '/find-your-match' },
];

/** Virtual (rule-based) collections, resolved in /collections/[slug] */
export const VIRTUAL_COLLECTIONS: Record<string, { title: string; description: string; maxPrice?: number; minPrice?: number; isNew?: boolean }> = {
  'gifts-under-25000': { title: 'Gifts Under ₹25,000', description: 'Thoughtful lab-grown diamond gifts, all under ₹25,000 — beautifully boxed and ready to give.', maxPrice: 2500000 },
  'gifts-under-50000': { title: 'Gifts Under ₹50,000', description: 'Studs, pendants and stacking rings under ₹50,000 that feel far more precious.', maxPrice: 5000000 },
  'gifts-under-100000': { title: 'Gifts Under ₹1,00,000', description: 'Considered fine jewelry gifts under ₹1,00,000 — made to be treasured for a lifetime.', maxPrice: 10000000 },
  all: { title: 'All Jewelry', description: `Explore every ${site.name} design — certified natural and lab-grown diamonds in solid gold, crafted in our own workshop.` },
};

export const FOOTER_NAV = {
  shop: [
    { label: 'Shop All', href: '/collections/all' },
    { label: 'Engagement Rings', href: '/engagement-rings' },
    { label: 'Wedding Bands', href: '/wedding-bands' },
    { label: 'Rings', href: '/rings' },
    { label: 'Earrings', href: '/earrings' },
    { label: 'Pendants', href: '/pendants' },
    { label: 'Necklaces', href: '/necklaces' },
    { label: 'Bracelets', href: '/bracelets' },
  ],
  care: [
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping', href: '/pages/shipping-policy' },
    { label: 'Returns', href: '/pages/returns' },
    { label: 'Warranty', href: '/pages/warranty' },
    { label: 'Care Guide', href: '/pages/care-guide' },
    { label: 'FAQ', href: '/pages/faq' },
  ],
  about: [
    { label: 'Our Story', href: '/about' },
    { label: 'Bespoke', href: '/bespoke' },
    { label: 'Lab-Grown Diamonds', href: '/pages/lab-grown-diamonds' },
    { label: 'Manufacturing', href: '/pages/manufacturing' },
    { label: 'Partner Program', href: '/partner-program' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/pages/privacy-policy' },
    { label: 'Terms', href: '/pages/terms' },
    { label: 'Refund Policy', href: '/pages/refund-policy' },
    { label: 'Shipping Policy', href: '/pages/shipping-policy' },
    { label: 'Cookie Policy', href: '/pages/cookie-policy' },
  ],
};
