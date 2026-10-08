import { site } from './site';
import type { ArtSpec } from '@/components/art/JewelryArt';

export type NavLink = { label: string; href: string; shape?: string; metal?: string };
export type MegaColumn = { title: string; links: NavLink[]; kind?: 'shapes' | 'metals' | 'list' };
export type NavItem = {
  label: string;
  href: string;
  mega?: {
    columns: MegaColumn[];
    feature?: { eyebrow: string; title: string; href: string; cta: string; art: ArtSpec; shape: string; metal: string; carat?: number };
  };
};

const shapeLinks = (base: string, shapes: string[]) =>
  shapes.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), href: `${base}?shape=${s}`, shape: s }));
const metalLinks = (base: string) => [
  { label: 'Yellow Gold', href: `${base}?metal=yellow`, metal: 'yellow' },
  { label: 'White Gold', href: `${base}?metal=white`, metal: 'white' },
  { label: 'Rose Gold', href: `${base}?metal=rose`, metal: 'rose' },
];

export const MAIN_NAV: NavItem[] = [
  {
    label: 'Engagement Rings',
    href: '/engagement-rings',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Solitaire', href: '/engagement-rings?style=solitaire' },
            { label: 'Halo', href: '/engagement-rings?style=halo' },
            { label: 'Hidden Halo', href: '/engagement-rings?style=hidden-halo' },
            { label: 'Three Stone', href: '/engagement-rings?style=three-stone' },
            { label: 'Toi et Moi', href: '/engagement-rings?style=toi-et-moi' },
            { label: 'Vintage', href: '/engagement-rings?style=vintage' },
            { label: 'View All Engagement Rings', href: '/engagement-rings' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/engagement-rings', ['oval', 'emerald', 'cushion', 'pear', 'radiant', 'round']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/engagement-rings') },
      ],
      feature: {
        eyebrow: 'Most Loved',
        title: 'The Oval Hidden Halo',
        href: '/products/celeste-oval-hidden-halo-engagement-ring',
        cta: 'Discover',
        art: { kind: 'ring', head: 'hidden-halo', band: 'pave' },
        shape: 'oval',
        metal: 'yellow',
        carat: 2,
      },
    },
  },
  {
    label: 'Wedding Bands',
    href: '/wedding-bands',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Eternity', href: '/wedding-bands?style=eternity' },
            { label: 'Stackable', href: '/wedding-bands?style=stackable' },
            { label: 'Baguette', href: '/wedding-bands?style=baguette' },
            { label: 'Classic Gold', href: '/wedding-bands?style=bold-gold' },
            { label: 'Anniversary', href: '/wedding-bands?style=anniversary' },
            { label: 'View All Wedding Bands', href: '/wedding-bands' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/wedding-bands', ['round', 'emerald', 'oval', 'marquise']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/wedding-bands') },
      ],
      feature: { eyebrow: 'Forever', title: 'Emerald Cut Eternity', href: '/products/beatrix-emerald-cut-eternity-band', cta: 'Discover', art: { kind: 'band', stones: 'full', stoneShape: 'emerald' }, shape: 'emerald', metal: 'white' },
    },
  },
  {
    label: 'Rings',
    href: '/rings',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Stackable', href: '/rings?style=stackable' },
            { label: 'Eternity', href: '/wedding-bands?style=eternity' },
            { label: 'Cocktail', href: '/rings?style=cocktail' },
            { label: 'Diamond Rings', href: '/rings' },
            { label: 'Gold Rings', href: '/rings?style=bold-gold' },
            { label: 'Anniversary', href: '/rings?style=anniversary' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/rings', ['round', 'oval', 'emerald', 'asscher']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/rings') },
      ],
      feature: { eyebrow: 'Statement', title: 'Emerald Cocktail Ring', href: '/products/josephine-emerald-cut-cocktail-ring', cta: 'Discover', art: { kind: 'ring', head: 'double-halo', band: 'bold' }, shape: 'emerald', metal: 'yellow', carat: 3 },
    },
  },
  {
    label: 'Earrings',
    href: '/earrings',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Studs', href: '/earrings?style=stud' },
            { label: 'Hoops', href: '/earrings?style=hoop' },
            { label: 'Drop Earrings', href: '/earrings?style=drop' },
            { label: 'Solitaire Earrings', href: '/earrings?style=solitaire' },
            { label: 'Halo Earrings', href: '/earrings?style=halo' },
            { label: 'View All Earrings', href: '/earrings' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/earrings', ['round', 'oval', 'princess', 'pear', 'emerald']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/earrings') },
      ],
      feature: { eyebrow: 'Everyday Icon', title: 'Round Solitaire Studs', href: '/products/talia-round-solitaire-stud-earrings', cta: 'Discover', art: { kind: 'studs' }, shape: 'round', metal: 'yellow', carat: 1 },
    },
  },
  {
    label: 'Pendants',
    href: '/pendants',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Solitaire', href: '/pendants?style=solitaire' },
            { label: 'Halo', href: '/pendants?style=halo' },
            { label: 'Bezel', href: '/pendants?style=bezel' },
            { label: 'Three Stone', href: '/pendants?style=three-stone' },
            { label: 'Personalized', href: '/collections/personalized-jewelry' },
            { label: 'View All Pendants', href: '/pendants' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/pendants', ['round', 'oval', 'pear', 'heart', 'emerald']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/pendants') },
      ],
      feature: { eyebrow: 'The First Diamond', title: 'Round Solitaire Pendant', href: '/products/elise-round-solitaire-pendant', cta: 'Discover', art: { kind: 'pendant', head: 'solitaire' }, shape: 'round', metal: 'yellow', carat: 1 },
    },
  },
  {
    label: 'Necklaces',
    href: '/necklaces',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Tennis', href: '/necklaces?style=tennis' },
            { label: 'Solitaire', href: '/necklaces?style=solitaire' },
            { label: 'Pendant', href: '/pendants' },
            { label: 'Layering', href: '/necklaces?style=layering' },
            { label: 'View All Necklaces', href: '/necklaces' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/necklaces', ['round', 'oval', 'emerald']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/necklaces') },
      ],
      feature: { eyebrow: 'Red Carpet', title: 'Classic Tennis Necklace', href: '/products/nova-classic-round-tennis-necklace', cta: 'Discover', art: { kind: 'tennis-necklace', stoneShape: 'round' }, shape: 'round', metal: 'white' },
    },
  },
  {
    label: 'Bracelets',
    href: '/bracelets',
    mega: {
      columns: [
        {
          title: 'Shop by Style',
          links: [
            { label: 'Tennis Bracelets', href: '/bracelets?style=tennis' },
            { label: 'Bangles & Cuffs', href: '/bracelets?style=bangle' },
            { label: 'Layering', href: '/bracelets?style=layering' },
            { label: 'Baguette', href: '/bracelets?style=baguette' },
            { label: 'View All Bracelets', href: '/bracelets' },
          ],
        },
        { title: 'Shop by Shape', kind: 'shapes', links: shapeLinks('/bracelets', ['round', 'oval', 'emerald']) },
        { title: 'Shop by Metal', kind: 'metals', links: metalLinks('/bracelets') },
      ],
      feature: { eyebrow: 'Timeless', title: 'Classic Tennis Bracelet', href: '/products/vera-classic-round-tennis-bracelet', cta: 'Discover', art: { kind: 'tennis-bracelet', stoneShape: 'round' }, shape: 'round', metal: 'yellow' },
    },
  },
  { label: 'Bespoke Design', href: '/bespoke' },
  {
    label: 'Gifts',
    href: '/gifts',
    mega: {
      columns: [
        {
          title: 'By Price',
          links: [
            { label: 'Gifts Under ₹25,000', href: '/collections/gifts-under-25000' },
            { label: 'Gifts Under ₹50,000', href: '/collections/gifts-under-50000' },
            { label: 'Gifts Under ₹1,00,000', href: '/collections/gifts-under-100000' },
          ],
        },
        {
          title: 'By Occasion',
          links: [
            { label: 'Anniversary Gifts', href: '/collections/anniversary-gifts' },
            { label: 'Birthday Gifts', href: '/collections/birthday-gifts' },
            { label: 'Wedding Gifts', href: '/collections/wedding-gifts' },
            { label: 'Bridal Gifts', href: '/collections/bridal-gifts' },
            { label: 'Personalized Jewelry', href: '/collections/personalized-jewelry' },
          ],
        },
        {
          title: 'Need Inspiration?',
          links: [
            { label: 'Find Your Match Quiz', href: '/find-your-match' },
            { label: 'The Gift Guide', href: '/gifts' },
            { label: 'Speak to a Concierge', href: '/contact' },
          ],
        },
      ],
      feature: { eyebrow: 'Gift Guide', title: 'Studs, Hoops & Pendants', href: '/gifts', cta: 'Explore Gifts', art: { kind: 'hoops', size: 'medium' }, shape: 'round', metal: 'rose' },
    },
  },
  { label: 'Find Your Match', href: '/find-your-match' },
];

/** Virtual (rule-based) collections, resolved in /collections/[slug] */
export const VIRTUAL_COLLECTIONS: Record<string, { title: string; description: string; maxPrice?: number; minPrice?: number; isNew?: boolean }> = {
  'gifts-under-25000': { title: 'Gifts Under ₹25,000', description: 'Thoughtful lab-grown diamond gifts, all under ₹25,000 — beautifully boxed and ready to give.', maxPrice: 2500000 },
  'gifts-under-50000': { title: 'Gifts Under ₹50,000', description: 'Studs, pendants and stacking rings under ₹50,000 that feel far more precious.', maxPrice: 5000000 },
  'gifts-under-100000': { title: 'Gifts Under ₹1,00,000', description: 'Considered fine jewelry gifts under ₹1,00,000 — made to be treasured for a lifetime.', maxPrice: 10000000 },
  all: { title: 'All Jewelry', description: `Explore every ${site.name} design — certified lab-grown diamonds in solid gold, crafted in our own workshop.` },
};

export const FOOTER_NAV = {
  shop: [
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
