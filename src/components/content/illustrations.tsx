/**
 * Original line-art diagrams of the 4Cs for the lab-grown diamond guide.
 * Pure SVG, no hooks — safe in server and client components. Each illustration is
 * used at most once per page, so gradient/marker ids are static and prefixed.
 */
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { cn } from '@/lib/utils';

const TAUPE = '#77706A';
const GOLD = '#A8834A';
const GEM_STROKE = '#9AA5B0';


// ───────────────────────────── 4Cs ─────────────────────────────

function CutProfile({ depth, variant }: { depth: number; variant: 'shallow' | 'ideal' | 'deep' }) {
  const hit = depth * (1 - 20 / 60);
  const marker = `cut-arrow-${variant}`;
  const ray =
    variant === 'ideal'
      ? `M-20 -40 L-20 ${hit} L20 ${hit} L20 -40`
      : variant === 'shallow'
        ? `M-20 -40 L-20 ${hit}`
        : `M-20 -40 L-20 ${hit} L30 ${depth * 0.5}`;
  const leak = variant === 'shallow' ? `M-20 ${hit} L-6 ${depth + 26}` : variant === 'deep' ? `M30 ${depth * 0.5} L74 ${depth * 0.5 - 18}` : null;
  return (
    <svg viewBox="-80 -48 160 140" className="h-auto w-full" aria-hidden>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={GOLD} />
        </marker>
      </defs>
      <polygon points={`-60,0 -34,-17 34,-17 60,0 0,${depth}`} fill="#F8FAFB" stroke="#8E99A5" strokeWidth="1" />
      <path d={`M-60 0 H60 M-34 -17 L-14 0 L0 ${depth} L14 0 L34 -17 M-14 0 L0 -17 L14 0`} fill="none" stroke={GEM_STROKE} strokeWidth="0.45" />
      <path d={ray} fill="none" stroke={GOLD} strokeWidth="1.3" markerEnd={leak ? undefined : `url(#${marker})`} />
      {leak && <path d={leak} fill="none" stroke={TAUPE} strokeWidth="1.1" strokeDasharray="3 3" markerEnd={`url(#${marker})`} />}
    </svg>
  );
}

export function CutDiagram({ className }: { className?: string }) {
  const items = [
    { variant: 'shallow' as const, depth: 34, title: 'Too shallow', text: 'Light slips out through the base, leaving a glassy centre.' },
    { variant: 'ideal' as const, depth: 52, title: 'Ideal', text: 'Light bounces between the facets and returns to the eye.' },
    { variant: 'deep' as const, depth: 74, title: 'Too deep', text: 'Light leaks from the sides and the stone looks darker.' },
  ];
  return (
    <ul className={cn('grid gap-px bg-line sm:grid-cols-3', className)}>
      {items.map((it) => (
        <li key={it.variant} className={cn('flex flex-col items-center bg-ivory px-6 py-8 text-center', it.variant === 'ideal' && 'bg-white')}>
          <div className="w-full max-w-[180px]">
            <CutProfile depth={it.depth} variant={it.variant} />
          </div>
          <p className={cn('label-caps mt-4', it.variant === 'ideal' ? 'text-gold' : 'text-ink')}>{it.title}</p>
          <p className="mt-2 max-w-[220px] text-[15px] leading-relaxed text-taupe">{it.text}</p>
        </li>
      ))}
    </ul>
  );
}

const COLOR_GRADES = [
  { g: 'D', tint: '#FFFFFF' },
  { g: 'E', tint: '#FEFEFD' },
  { g: 'F', tint: '#FDFCF8' },
  { g: 'G', tint: '#FBF8EB' },
  { g: 'H', tint: '#F9F3DC' },
  { g: 'I', tint: '#F7EDCB' },
  { g: 'J', tint: '#F4E5B6' },
  { g: 'K', tint: '#F0DCA0' },
];

export function ColorScale({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <ol className="grid grid-cols-8 gap-1 sm:gap-2" aria-label="Diamond colour grades from D to K">
        {COLOR_GRADES.map((c) => (
          <li key={c.g} className="flex flex-col items-center gap-2 sm:gap-3">
            <span
              className="relative block h-8 w-8 rounded-full xs:h-10 xs:w-10 sm:h-14 sm:w-14"
              style={{ background: `radial-gradient(circle at 34% 30%, #FFFFFF 0%, ${c.tint} 55%, ${c.tint} 100%)` }}
              aria-hidden
            >
              <ShapeIcon shape="round" size={56} className="absolute inset-0 h-full w-full text-[#9AA5B0]" strokeWidth={0.8} />
            </span>
            <span className="font-serif text-base sm:text-xl">{c.g}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 grid grid-cols-8 gap-x-1 text-[11px] uppercase leading-snug tracking-[0.12em] text-taupe sm:gap-x-2 sm:text-[12px] sm:tracking-[0.14em]" aria-hidden>
        <span className="col-span-3 border-t border-ink pt-2">Colourless</span>
        <span className="col-span-4 border-t border-stone pt-2">Near colourless</span>
        <span className="col-span-1 border-t border-line pt-2">Faint</span>
      </div>
      <figcaption className="sr-only">D, E and F are colourless; G to J are near colourless; K shows a faint tint.</figcaption>
    </figure>
  );
}

const CLARITY = [
  { grade: 'FL – IF', name: 'Flawless', dots: [] as [number, number, number][] },
  { grade: 'VVS1 – VVS2', name: 'Very, very slightly included', dots: [[12, -8, 0.9]] as [number, number, number][] },
  { grade: 'VS1 – VS2', name: 'Very slightly included', dots: [[12, -8, 1.3], [-14, 10, 1.1]] as [number, number, number][] },
  { grade: 'SI1 – SI2', name: 'Slightly included', dots: [[12, -8, 1.8], [-14, 10, 1.6], [4, 16, 1.4], [-6, -14, 1.5]] as [number, number, number][] },
  { grade: 'I1 – I3', name: 'Included', dots: [[12, -8, 2.6], [-14, 10, 2.4], [4, 16, 2], [-6, -14, 2.2], [18, 8, 2], [-18, -4, 1.8], [0, 2, 2.6]] as [number, number, number][] },
];

export function ClarityScale({ className }: { className?: string }) {
  return (
    <ol className={cn('grid grid-cols-2 gap-px bg-line sm:grid-cols-5', className)} aria-label="Diamond clarity grades">
      {CLARITY.map((c, i) => (
        <li key={c.grade} className={cn('flex flex-col items-center bg-ivory px-3 py-6 text-center', i === CLARITY.length - 1 && 'col-span-2 sm:col-span-1')}>
          <span className="relative block h-16 w-16 rounded-full bg-white" aria-hidden>
            <ShapeIcon shape="round" size={64} className="absolute inset-0 h-full w-full text-[#9AA5B0]" strokeWidth={0.8} />
            <svg viewBox="-50 -50 100 100" className="absolute inset-0 h-full w-full">
              {c.dots.map(([x, y, r], k) => (
                <circle key={k} cx={x} cy={y} r={r} fill="#5E5A55" opacity={0.75} />
              ))}
            </svg>
          </span>
          <span className="label-caps mt-4 text-ink">{c.grade}</span>
          <span className="mt-1 text-[14px] leading-snug text-taupe">{c.name}</span>
        </li>
      ))}
    </ol>
  );
}

const CARATS = [
  { ct: '0.50', mm: 5.2 },
  { ct: '1.00', mm: 6.5 },
  { ct: '1.50', mm: 7.4 },
  { ct: '2.00', mm: 8.2 },
  { ct: '3.00', mm: 9.4 },
  { ct: '4.00', mm: 10.3 },
];

export function CaratScale({ className }: { className?: string }) {
  return (
    <ol className={cn('flex flex-wrap items-end justify-center gap-x-6 gap-y-8 sm:justify-between', className)} aria-label="Approximate face-up size of round diamonds by carat weight">
      {CARATS.map((c) => {
        const px = Math.round(c.mm * 7.4);
        return (
          <li key={c.ct} className="flex flex-col items-center gap-3">
            <ShapeIcon shape="round" size={px} className="text-charcoal" strokeWidth={0.9} />
            <span className="font-serif text-lg leading-none">{c.ct} ct</span>
            <span className="text-[13px] uppercase tracking-[0.14em] text-taupe">≈ {c.mm} mm</span>
          </li>
        );
      })}
    </ol>
  );
}
