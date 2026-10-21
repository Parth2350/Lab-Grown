import { facetPaths, SHAPE_ASPECT } from './geometry';

/** Fine line-art diamond shape icon (inherits currentColor). */
const STANDARD = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'marquise', 'radiant', 'asscher', 'heart'];
const ALIASES: Record<string, string> = {
  baguette: 'emerald',
  'taper-baguette': 'emerald',
  hexagon: 'asscher',
  lozenge: 'princess',
  trilliant: 'heart',
  triangle: 'heart',
  moval: 'oval',
  'long-cushion': 'cushion',
  'sq-cushion': 'cushion',
};

/** Catalogue cuts (e.g. "step-cut-marquise", "emerald-pear") drawn with the closest classic outline */
export function iconShape(shape: string) {
  if (STANDARD.includes(shape)) return shape;
  return ALIASES[shape] ?? shape.split('-').find((t) => STANDARD.includes(t)) ?? 'round';
}

export function ShapeIcon({ shape: raw, size = 40, className, strokeWidth = 1 }: { shape: string; size?: number; className?: string; strokeWidth?: number }) {
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
