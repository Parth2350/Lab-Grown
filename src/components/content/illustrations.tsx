/**
 * Original line-art illustrations for the editorial content pages.
 * Pure SVG, no hooks — safe in server and client components. Each illustration is
 * used at most once per page, so gradient/marker ids are static and prefixed.
 */
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { cn } from '@/lib/utils';

const INK = '#141311';
const TAUPE = '#77706A';
const GOLD = '#A8834A';
const STONE = '#D8CFC1';
const SAND = '#ECE5DA';
const GEM = '#EEF2F5';
const GEM_STROKE = '#9AA5B0';

const labelProps = { fontSize: 9, letterSpacing: 1.6, fill: TAUPE, fontFamily: 'inherit' } as const;

// ───────────────────────────── diamond growth ─────────────────────────────

export function CvdIllustration({ className }: { className?: string }) {
  const atoms = [
    [150, 172], [168, 166], [190, 176], [210, 168], [160, 186], [200, 188], [178, 180], [222, 182], [140, 182],
  ];
  return (
    <svg viewBox="0 0 360 280" className={className} role="img" aria-labelledby="cvd-title">
      <title id="cvd-title">Chemical vapour deposition: a carbon-rich gas is energised into plasma and settles, layer by layer, onto diamond seed plates.</title>
      <defs>
        <radialGradient id="cvd-plasma" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F1E7D3" stopOpacity="1" />
          <stop offset="0.6" stopColor="#F1E7D3" stopOpacity="0.7" />
          <stop offset="1" stopColor="#F1E7D3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cvd-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F5F1EA" />
        </linearGradient>
      </defs>
      {/* gas inlet */}
      <path d="M180 14 V58" stroke={TAUPE} strokeWidth="1" />
      <path d="M175 49 L180 58 L185 49" fill="none" stroke={TAUPE} strokeWidth="1" />
      <text x="192" y="30" {...labelProps}>
        CH₄ + H₂
      </text>
      {/* chamber */}
      <path d="M92 226 V128 C92 86 132 62 180 62 C228 62 268 86 268 128 V226" fill="url(#cvd-glass)" stroke={INK} strokeOpacity="0.5" />
      <path d="M104 220 V130 C104 98 136 76 180 76" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      {/* plasma */}
      <ellipse cx="180" cy="138" rx="70" ry="32" fill="url(#cvd-plasma)" />
      <ellipse cx="180" cy="138" rx="52" ry="19" fill="none" stroke={GOLD} strokeDasharray="2 4" strokeWidth="1" />
      {/* carbon settling */}
      {atoms.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.6} fill={GOLD} opacity={0.75} />
      ))}
      {/* substrate & seeds */}
      <rect x="124" y="206" width="112" height="7" fill={STONE} />
      {[0, 1, 2, 3].map((i) => {
        const x = 131 + i * 26;
        return (
          <g key={i}>
            <rect x={x} y={194} width={20} height={12} fill={GEM} stroke={GEM_STROKE} strokeWidth="0.8" />
            {[197, 200, 203].map((y) => (
              <path key={y} d={`M${x + 1} ${y} H${x + 19}`} stroke={GEM_STROKE} strokeWidth="0.4" />
            ))}
          </g>
        );
      })}
      {/* base */}
      <rect x="76" y="226" width="208" height="12" fill={SAND} stroke={INK} strokeOpacity="0.3" />
      <path d="M112 238 V258 M248 238 V258" stroke={INK} strokeOpacity="0.3" />
      {/* labels */}
      <path d="M234 138 H284" stroke={TAUPE} strokeWidth="0.6" />
      <text x="288" y="141" {...labelProps}>
        PLASMA
      </text>
      <path d="M238 200 H284" stroke={TAUPE} strokeWidth="0.6" />
      <text x="288" y="203" {...labelProps}>
        SEEDS
      </text>
      <path d="M96 100 H68" stroke={TAUPE} strokeWidth="0.6" />
      <text x="10" y="103" {...labelProps}>
        CHAMBER
      </text>
    </svg>
  );
}

export function HphtIllustration({ className }: { className?: string }) {
  const anvil = 'M130 22 L230 22 L206 98 L154 98 Z';
  return (
    <svg viewBox="0 0 360 280" className={className} role="img" aria-labelledby="hpht-title">
      <title id="hpht-title">High pressure, high temperature: a press squeezes a capsule containing a diamond seed and carbon, recreating conditions deep within the earth.</title>
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r} 180 136)`}>
          <path d={anvil} fill={SAND} stroke={INK} strokeOpacity="0.35" />
          <path d="M146 30 L214 30" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
          <path d="M180 2 V14 M175 7 L180 14 L185 7" fill="none" stroke={GOLD} strokeWidth="1" />
        </g>
      ))}
      <rect x="150" y="106" width="60" height="60" fill="#FFFDF9" stroke={INK} strokeOpacity="0.5" />
      <polygon points="180,116 200,136 180,154 160,136" fill={GEM} stroke={GEM_STROKE} strokeWidth="0.9" />
      <path d="M160 136 H200 M170 126 L180 154 L190 126" fill="none" stroke={GEM_STROKE} strokeWidth="0.5" />
      <rect x="172" y="157" width="16" height="4" fill={STONE} />
      <text x="10" y="40" {...labelProps}>
        ≈ 1,400 °C
      </text>
      <text x="270" y="40" {...labelProps}>
        ≈ 5–6 GPA
      </text>
      <path d="M190 160 H204 L252 228" fill="none" stroke={TAUPE} strokeWidth="0.6" />
      <text x="258" y="234" {...labelProps}>
        SEED + CARBON
      </text>
    </svg>
  );
}

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

// ───────────────────────────── place & reach ─────────────────────────────

/** A quiet, map-like street illustration with a pin (no external map tiles). */
export function MapIllustration({ className }: { className?: string }) {
  const roads = [
    'M118 64 C250 86 420 40 640 72',
    'M132 252 C300 230 460 262 640 232',
    'M300 0 C322 120 280 300 334 440',
    'M478 0 C456 150 506 300 474 440',
    'M128 156 C300 166 420 142 640 162',
    'M190 440 C230 360 300 330 360 306 C420 282 520 334 640 322',
  ];
  const lanes = [
    'M200 0 L214 440', 'M390 0 L402 440', 'M556 0 L548 440', 'M120 110 L640 116', 'M126 204 L640 198', 'M140 300 L640 290', 'M150 376 L640 372',
  ];
  return (
    <svg viewBox="0 0 640 440" className={className} role="img" aria-labelledby="map-title" preserveAspectRatio="xMidYMid slice">
      <title id="map-title">Illustrated map showing the location of our atelier</title>
      <rect width="640" height="440" fill="#F5F1EA" />
      <path d="M0 0 H112 C146 70 92 130 124 200 C156 270 100 330 136 440 H0 Z" fill={SAND} />
      {[40, 90, 140, 190, 240, 290, 340, 390].map((y, i) => (
        <path key={y} d={`M${14 + (i % 2) * 18} ${y} q8 -4 16 0 t16 0`} stroke={STONE} fill="none" strokeWidth="1" />
      ))}
      <rect x="352" y="70" width="86" height="56" rx="28" fill="#ECE8DA" />
      {[[372, 92], [390, 104], [410, 88], [420, 108]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#E1DBC8" />
      ))}
      {lanes.map((d) => (
        <path key={d} d={d} stroke="#FFFFFF" strokeWidth="3" fill="none" />
      ))}
      {roads.map((d) => (
        <g key={d}>
          <path d={d} stroke="#E6DFD3" strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d={d} stroke="#FFFFFF" strokeWidth="10" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <path d="M592 0 C572 150 612 300 592 440" stroke={STONE} strokeWidth="3" strokeDasharray="10 7" fill="none" />
      <circle cx="400" cy="214" r="34" fill={GOLD} opacity="0.1" />
      <circle cx="400" cy="214" r="18" fill={GOLD} opacity="0.18" />
      <path d="M400 214 c-12 -15 -17 -23 -17 -32 a17 17 0 1 1 34 0 c0 9 -5 17 -17 32z" fill={INK} />
      <circle cx="400" cy="181" r="6" fill="#CDB079" />
      <g transform="translate(600 396)" stroke={TAUPE} fill="none" strokeWidth="1">
        <circle r="14" />
        <path d="M0 -10 L4 4 L0 1 L-4 4 Z" fill={TAUPE} />
      </g>
    </svg>
  );
}

/** Line-art globe with routes radiating from the workshop. */
export function GlobeIllustration({ className }: { className?: string }) {
  const hub: [number, number] = [262, 218];
  const cities: [number, number][] = [
    [128, 150], [96, 196], [176, 120], [300, 136], [330, 262], [214, 300], [150, 252], [316, 188], [236, 160],
  ];
  const parallels = [-60, -30, 0, 30, 60].map((lat) => {
    const rad = (lat * Math.PI) / 180;
    const hw = Math.round(160 * Math.cos(rad));
    return { y: Math.round(200 - 160 * Math.sin(rad)), hw };
  });
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-labelledby="globe-title">
      <title id="globe-title">A globe with routes connecting our workshop to clients around the world</title>
      <circle cx="200" cy="200" r="160" fill="#FFFDF9" stroke={STONE} />
      {[150, 113, 55].map((rx) => (
        <ellipse key={rx} cx="200" cy="200" rx={rx} ry="160" fill="none" stroke={SAND} />
      ))}
      <path d="M200 40 V360" stroke={SAND} />
      {parallels.map((p) => (
        <ellipse key={p.y} cx="200" cy={p.y} rx={p.hw} ry={Math.max(2, Math.round(p.hw * 0.1))} fill="none" stroke={SAND} />
      ))}
      {cities.map(([x, y]) => {
        const mx = (x + hub[0]) / 2;
        const my = Math.min(y, hub[1]) - 46;
        return <path key={`${x}-${y}`} d={`M${hub[0]} ${hub[1]} Q${mx} ${my} ${x} ${y}`} fill="none" stroke={GOLD} strokeWidth="0.9" strokeDasharray="2 3" opacity="0.8" />;
      })}
      {cities.map(([x, y]) => (
        <circle key={`d${x}-${y}`} cx={x} cy={y} r="3" fill={GOLD} />
      ))}
      <circle cx={hub[0]} cy={hub[1]} r="12" fill={GOLD} opacity="0.15" />
      <circle cx={hub[0]} cy={hub[1]} r="5" fill={INK} />
    </svg>
  );
}

// ───────────────────────────── workshop process ─────────────────────────────

export function SketchIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-labelledby="sketch-title">
      <title id="sketch-title">A hand sketch of a ring design with construction lines</title>
      <g transform="rotate(-4 160 160)">
        <rect x="46" y="34" width="228" height="256" fill="#FFFDF9" stroke="#E6DFD3" />
        <path d="M70 196 H250 M160 64 V280" stroke={STONE} strokeDasharray="3 4" strokeWidth="0.8" />
        <circle cx="160" cy="196" r="62" fill="none" stroke={INK} strokeOpacity="0.6" strokeWidth="1.1" />
        <circle cx="160" cy="196" r="52" fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="0.9" />
        <circle cx="160" cy="196" r="74" fill="none" stroke={STONE} strokeDasharray="2 5" strokeWidth="0.8" />
        <ellipse cx="160" cy="120" rx="20" ry="28" fill="#FFFFFF" stroke={INK} strokeOpacity="0.65" strokeWidth="1.1" />
        <path d="M160 92 L148 112 L160 148 L172 112 Z M140 120 H180 M148 112 L140 120 M172 112 L180 120" fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="0.7" />
        <path d="M144 140 L150 150 M176 140 L170 150 M141 100 L147 94 M179 100 L173 94" stroke={INK} strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M196 98 C214 92 226 96 236 88" fill="none" stroke={GOLD} strokeWidth="0.9" />
        <text x="238" y="86" fontSize="11" fontStyle="italic" fill={TAUPE} fontFamily="var(--font-serif), Georgia, serif">
          oval
        </text>
        <text x="70" y="276" fontSize="11" fontStyle="italic" fill={TAUPE} fontFamily="var(--font-serif), Georgia, serif">
          four claws · knife-edge band
        </text>
      </g>
      <g transform="rotate(32 250 250)">
        <rect x="196" y="244" width="120" height="10" fill={SAND} stroke={INK} strokeOpacity="0.35" />
        <path d="M316 244 L332 249 L316 254 Z" fill="#FFFDF9" stroke={INK} strokeOpacity="0.35" />
        <path d="M328 247.8 L332 249 L328 250.2 Z" fill={INK} />
      </g>
    </svg>
  );
}

export function CadWireframe({ className }: { className?: string }) {
  const connectors = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.round(160 + 92 * Math.cos(a)), Math.round(214 + 30 * Math.sin(a))] as const;
  });
  const grid = Array.from({ length: 15 }, (_, i) => i * 22 + 6);
  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-labelledby="cad-title">
      <title id="cad-title">A wireframe CAD model of a solitaire ring with measurement guides</title>
      {grid.map((v) => (
        <g key={v} stroke="#EFE9DF" strokeWidth="0.8">
          <path d={`M${v} 0 V320`} />
          <path d={`M0 ${v} H320`} />
        </g>
      ))}
      <g fill="none" stroke={GOLD} strokeWidth="1">
        <ellipse cx="160" cy="214" rx="92" ry="30" />
        <ellipse cx="160" cy="230" rx="92" ry="30" />
        <ellipse cx="160" cy="214" rx="78" ry="23" strokeOpacity="0.55" />
        {connectors.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y} V${y + 16}`} strokeOpacity="0.6" />
        ))}
        <path d="M120 112 L136 100 H184 L200 112 L160 152 Z" />
        <path d="M120 112 H200 M136 100 L148 112 L160 100 L172 112 L184 100 M148 112 L160 152 L172 112" strokeOpacity="0.55" />
        <path d="M134 190 L124 108 M186 190 L196 108 M150 194 L146 114 M170 194 L174 114" strokeWidth="1.3" />
      </g>
      <g stroke={INK} strokeOpacity="0.55" strokeWidth="0.8" fill="none">
        <path d="M228 100 H262 M228 152 H262 M252 100 V152 M248 104 L252 100 L256 104 M248 148 L252 152 L256 148" />
        <path d="M68 270 V288 M252 270 V288 M68 280 H252" />
      </g>
      <text x="266" y="130" fontSize="10" fill={TAUPE} fontFamily="inherit" letterSpacing="1">
        6.5 mm
      </text>
      <text x="136" y="302" fontSize="10" fill={TAUPE} fontFamily="inherit" letterSpacing="1">
        Size 6 · 16.5 mm
      </text>
      <circle cx="160" cy="126" r="3" fill="none" stroke={INK} strokeOpacity="0.6" />
      <path d="M160 118 V134 M152 126 H168" stroke={INK} strokeOpacity="0.4" strokeWidth="0.6" />
    </svg>
  );
}

/** Loupe ring overlaid on a loose diamond (place absolutely over a LooseDiamond). */
export function LoupeOverlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <circle cx="212" cy="190" r="118" fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="10" />
      <circle cx="212" cy="190" r="108" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5" />
      <path d="M296 274 L352 336" stroke={INK} strokeOpacity="0.7" strokeWidth="20" strokeLinecap="round" />
      <path d="M150 112 C170 96 196 90 222 92" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function PackagingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-labelledby="pack-title">
      <title id="pack-title">An open ring box with a diamond ring resting in its cushion</title>
      <ellipse cx="160" cy="276" rx="118" ry="10" fill={INK} opacity="0.06" />
      {/* lid */}
      <path d="M86 156 L102 54 H218 L234 156 Z" fill="#F5F1EA" stroke={INK} strokeOpacity="0.3" />
      <path d="M100 146 L112 66 H208 L220 146 Z" fill="#FBF9F5" stroke={STONE} strokeWidth="0.8" />
      <path d="M144 104 H176" stroke={GOLD} strokeWidth="1" />
      <path d="M152 112 H168" stroke={GOLD} strokeWidth="0.6" />
      {/* base */}
      <path d="M78 168 L86 156 H234 L242 168 Z" fill="#E7DED0" stroke={INK} strokeOpacity="0.3" />
      <rect x="78" y="168" width="164" height="100" fill={SAND} stroke={INK} strokeOpacity="0.3" />
      <path d="M78 186 H242" stroke={STONE} strokeWidth="0.8" />
      {/* cushion */}
      <path d="M96 168 C96 160 104 158 112 158 H208 C216 158 224 160 224 168 Z" fill="#FBF9F5" stroke={STONE} strokeWidth="0.8" />
      <path d="M118 165 H202" stroke={STONE} strokeWidth="1.2" />
      {/* ring */}
      <ellipse cx="160" cy="160" rx="20" ry="8" fill="none" stroke="#D2A85C" strokeWidth="3.2" />
      <path d="M160 142 L152 150 L160 158 L168 150 Z" fill="#FFFFFF" stroke={GEM_STROKE} strokeWidth="0.9" />
      <path d="M152 150 H168 M156 146 L160 158 L164 146" fill="none" stroke={GEM_STROKE} strokeWidth="0.5" />
      <path d="M182 136 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z" fill={GOLD} opacity="0.6" />
    </svg>
  );
}
