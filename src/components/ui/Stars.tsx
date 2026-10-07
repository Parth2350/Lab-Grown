import { useId } from 'react';
import { cn } from '@/lib/utils';

const STAR = 'M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.3l-6.1 3.4 1.5-6.7L2.3 9.4l6.8-.7z';

/** Five stars in a single SVG, gold-filled to the exact rating via a clip path. */
export function Stars({ rating, size = 12, className }: { rating: number; size?: number; className?: string }) {
  const id = `st${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const gap = 2;
  const w = 5 * 24 + 4 * gap * 2;
  const pct = Math.max(0, Math.min(1, rating / 5));
  const stars = [0, 1, 2, 3, 4].map((i) => <path key={i} d={STAR} transform={`translate(${i * (24 + gap * 2)} 0)`} />);
  return (
    <svg
      width={(w / 24) * size}
      height={size}
      viewBox={`0 0 ${w} 24`}
      className={cn('inline-block shrink-0', className)}
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      <defs>
        <clipPath id={id}>
          <rect width={Math.round(w * pct * 10) / 10} height="24" />
        </clipPath>
      </defs>
      <g fill="#E2D9CB">{stars}</g>
      <g fill="#A8834A" clipPath={`url(#${id})`}>
        {stars}
      </g>
    </svg>
  );
}
