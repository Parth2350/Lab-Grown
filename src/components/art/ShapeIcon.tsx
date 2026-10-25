import { facetPaths, SHAPE_ASPECT } from './geometry';

/** Fine line-art diamond shape icon (inherits currentColor). */
const STANDARD = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'marquise', 'radiant', 'asscher', 'heart'];
const ALIASES: Record<string, string> = {
  baguette: 'emerald',
  'taper-baguette': 'emerald',
  hexagon: 'asscher',
  lozenge: 'princess',
  moval: 'oval',
  'long-cushion': 'cushion',
  'sq-cushion': 'cushion',
};

/** Catalogue cuts (e.g. "step-cut-marquise", "emerald-pear") drawn with the closest classic outline */
export function iconShape(shape: string) {
  if (STANDARD.includes(shape)) return shape;
  return ALIASES[shape] ?? shape.split('-').find((t) => STANDARD.includes(t)) ?? 'round';
}

/** Outlines for the fancy cuts with no classic look-alike (viewBox -50…50); the table is the same outline, scaled down */
const OUTLINES: Record<string, string> = {
  triangle: 'M0 -40 L42 34 L-42 34 Z',
  trilliant: 'M0 -40 Q24 -6 42 34 Q0 44 -42 34 Q-24 -6 0 -40 Z',
  shield: 'M-36 -34 L36 -34 L36 4 L0 42 L-36 4 Z',
  trapezoid: 'M-24 -30 L24 -30 L42 30 L-42 30 Z',
  bullet: 'M-20 -18 L0 -42 L20 -18 L20 42 L-20 42 Z',
  'calf-head': 'M-40 -30 L40 -30 L28 8 L0 40 L-28 8 Z',
  'v-cut': 'M-42 -30 L0 -14 L42 -30 L0 42 Z',
  'diamond-cut': 'M0 -44 L32 -4 L0 44 L-32 -4 Z',
  kite: 'M0 -44 L32 -4 L0 44 L-32 -4 Z',
};

export function ShapeIcon({ shape: raw, size = 40, className, strokeWidth = 1 }: { shape: string; size?: number; className?: string; strokeWidth?: number }) {
  const outline = OUTLINES[raw];
  if (outline)
    return (
      <svg width={size} height={size} viewBox="-50 -50 100 100" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinejoin="round">
        <path d={outline} strokeWidth={strokeWidth * 1.6} />
        <path d={outline} strokeWidth={strokeWidth * 1.2} opacity={0.75} transform="scale(0.55)" />
      </svg>
    );
  const shape = iconShape(raw);
  const aspect = SHAPE_ASPECT[shape] ?? 1;
  const h = 84;
  const w = Math.min(84, h / aspect);
  const hh = w * aspect;
  const f = facetPaths(shape, w, hh);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinejoin="round">
      <path d={f.outline} strokeWidth={strokeWidth * 1.6} />
      <path d={f.lines} strokeWidth={strokeWidth * 0.7} opacity={0.75} />
    </svg>
  );
}
