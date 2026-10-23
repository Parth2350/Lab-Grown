/**
 * "Find Your Match", laid out as on brilliancecarat.com: occasion → what for → budget (+ metal) → taste → matches.
 */

export const QUIZ_SLUG = 'find-your-match';

/** categories: what the "What for" step starts with selected */
export const MATCH_OCCASIONS = [
  { value: 'engagement', label: 'Engagement', hint: 'The one', image: '/images/match/engagement.webp', categories: ['engagement-rings'] },
  { value: 'wedding', label: 'Wedding', hint: 'Bands & sets', image: '/images/match/wedding.webp', categories: [] },
  { value: 'anniversary', label: 'Anniversary', hint: 'Milestone', image: '/images/match/anniversary.webp', categories: [] },
  { value: 'gift', label: 'A gift', hint: 'For someone special', image: '/images/match/gift.webp', categories: [] },
  { value: 'everyday', label: 'Everyday', hint: 'Wear it always', image: '/images/match/everyday.webp', categories: [] },
  { value: 'treat', label: 'Treat myself', hint: 'Because why not', image: '/images/match/treat.webp', categories: [] },
] as const;

export const MATCH_CATEGORIES = [
  { slug: 'engagement-rings', label: 'Engagement rings' },
  { slug: 'wedding-bands', label: 'Wedding bands' },
  { slug: 'earrings', label: 'Earrings' },
  { slug: 'necklaces', label: 'Necklaces' },
  { slug: 'pendants', label: 'Pendants' },
  { slug: 'bracelets', label: 'Bracelets' },
] as const;

/** Budget ranges ([min, max], max null = no limit): rupees for India; dollars elsewhere, converted for other currencies */
export const MATCH_BUDGETS = {
  INR: [[0, 75000], [75000, 150000], [150000, 300000], [300000, 600000], [600000, null]],
  USD: [[0, 750], [750, 1500], [1500, 3000], [3000, 6000], [6000, null]],
} as const;

export const MATCH_METALS = [
  { slug: 'white', label: 'White Gold' },
  { slug: 'yellow', label: 'Yellow Gold' },
  { slug: 'rose', label: 'Rose Gold' },
] as const;
