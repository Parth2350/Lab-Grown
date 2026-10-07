/** Diamond grading vocabulary used by the admin form (client) and its server action (validation). */

export const FINISH_GRADES = ['Excellent', 'Very Good', 'Good'] as const;
export const FLUORESCENCE = ['None', 'Faint', 'Medium', 'Strong'] as const;
export const GROWTH_METHODS = ['CVD', 'HPHT'] as const;

export const DIAMOND_SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'carat-asc', label: 'Carat: small to large' },
  { value: 'carat-desc', label: 'Carat: large to small' },
] as const;
export type DiamondSort = (typeof DIAMOND_SORTS)[number]['value'];
export const DIAMOND_SORT_VALUES = DIAMOND_SORTS.map((s) => s.value) as DiamondSort[];

export const CARAT_LIMITS = { min: 0.1, max: 30 } as const;
