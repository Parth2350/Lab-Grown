import { facetPaths, SHAPE_ASPECT } from './geometry';

/** Fine line-art diamond shape icon (inherits currentColor). */
export function ShapeIcon({ shape, size = 40, className, strokeWidth = 1 }: { shape: string; size?: number; className?: string; strokeWidth?: number }) {
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
