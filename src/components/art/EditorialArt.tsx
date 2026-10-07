import { useId, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { JewelryArt, LooseDiamond } from './JewelryArt';
import { facetPaths, SHAPE_ASPECT, sparklePath } from './geometry';

/**
 * Editorial illustrations for brand storytelling (homepage hero, atelier, process, bespoke).
 * Entirely original, deterministic SVG — no photography, no randomness — so server and
 * client output always match. Line-art scenes are drawn in ink & gold on transparent
 * backgrounds; place them in an `art-tile` (or on `bg-ink` for the bespoke drawing).
 */

export type EditorialScene = 'hero' | 'workshop' | 'bespoke' | 'sketch' | 'cad' | 'setting' | 'inspection' | 'polishing' | 'packaging';

const LABELS: Record<EditorialScene, string> = {
  hero: 'An oval diamond engagement ring in yellow gold surrounded by loose lab-grown diamonds',
  workshop: 'A jeweller’s bench with a diamond ring, a design sketch, tweezers holding a diamond and a loupe',
  bespoke: 'Technical design drawing of a bespoke oval diamond ring with measurements',
  sketch: 'A pencil design sketch of a diamond engagement ring',
  cad: 'A wireframe CAD model of a diamond ring',
  setting: 'A diamond being secured into its claws with a setting tool',
  inspection: 'A diamond examined under a jeweller’s loupe',
  polishing: 'A ring being polished against a buffing wheel',
  packaging: 'A diamond ring presented in an open jewellery box',
};

// ───────────────────────────── deterministic helpers ─────────────────────────────

const f = (n: number) => Math.round(n * 10) / 10;
const sn = (deg: number) => Math.round(Math.sin((deg * Math.PI) / 180) * 1e5) / 1e5;
const cs = (deg: number) => Math.round(Math.cos((deg * Math.PI) / 180) * 1e5) / 1e5;

const INK = '#141311';
const GOLD = '#A8834A';
const GOLD_LIGHT = '#CDB079';
const GOLD_PALE = '#F1E7D3';
const PAPER = '#FFFDF8';
const LINE = '#E2D9CB';
const SANS: CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' };
const SERIF: CSSProperties = { fontFamily: 'var(--font-serif), Georgia, serif' };

/** Polyline along an elliptical arc (degrees, y down). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 36) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += `${i ? 'L' : 'M'}${f(cx + rx * cs(a))} ${f(cy + ry * sn(a))}`;
  }
  return d;
}

/** Side-on brilliant (crown + pavilion), girdle centred at the origin. */
function profile(W: number) {
  const ch = W * 0.17;
  const tw = W * 0.28;
  const pd = W * 0.44;
  const body = `M${f(-tw)} ${f(-ch)}L${f(tw)} ${f(-ch)}L${f(W / 2)} 0L0 ${f(pd)}L${f(-W / 2)} 0Z`;
  const lines =
    `M${f(-W / 2)} 0L${f(W / 2)} 0` +
    `M${f(-tw)} ${f(-ch)}L${f(-W * 0.36)} 0M${f(-tw)} ${f(-ch)}L${f(-W * 0.12)} 0` +
    `M${f(tw)} ${f(-ch)}L${f(W * 0.12)} 0M${f(tw)} ${f(-ch)}L${f(W * 0.36)} 0` +
    `M${f(-W * 0.25)} 0L0 ${f(pd)}M${f(W * 0.25)} 0L0 ${f(pd)}M0 0L0 ${f(pd)}`;
  return { body, lines, ch, pd };
}

function ProfileStone({ x, y, W, stroke, sw = 1, fill = 'none', facet = 0.7 }: { x: number; y: number; W: number; stroke: string; sw?: number; fill?: string; facet?: number }) {
  const p = profile(W);
  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      <path d={p.body} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d={p.lines} fill="none" stroke={stroke} strokeWidth={sw * 0.6} opacity={facet} strokeLinejoin="round" />
    </g>
  );
}

/** Face-up stone drawn as fine line art. */
function LineStone({
  shape,
  x,
  y,
  w,
  rot = 0,
  stroke,
  sw = 1,
  fill = 'none',
  facet = 0.7,
}: {
  shape: string;
  x: number;
  y: number;
  w: number;
  rot?: number;
  stroke: string;
  sw?: number;
  fill?: string;
  facet?: number;
}) {
  const h = w * (SHAPE_ASPECT[shape] ?? 1);
  const fp = facetPaths(shape, w, h);
  return (
    <g transform={`translate(${f(x)} ${f(y)})${rot ? ` rotate(${rot})` : ''}`}>
      <path d={fp.outline} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d={fp.lines} fill="none" stroke={stroke} strokeWidth={sw * 0.55} opacity={facet} strokeLinejoin="round" />
    </g>
  );
}

/** Four-point glint. Animated glints twinkle (CSS, collapses for reduced motion). */
function Glint({ x, y, s, fill = '#FFFFFF', delay = 0, still = false, opacity = 1 }: { x: number; y: number; s: number; fill?: string; delay?: number; still?: boolean; opacity?: number }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)})`} opacity={opacity}>
      <path
        d={sparklePath(s)}
        fill={fill}
        className={still ? undefined : 'animate-twinkle'}
        style={still ? undefined : { transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${delay}s`, animationDuration: '4.6s' }}
      />
    </g>
  );
}

function Label({ x, y, children, size = 7, fill = INK, opacity = 0.55, anchor = 'start', spacing = 1.4 }: { x: number; y: number; children: ReactNode; size?: number; fill?: string; opacity?: number; anchor?: 'start' | 'middle' | 'end'; spacing?: number }) {
  return (
    <text x={x} y={y} fontSize={size} letterSpacing={spacing} fill={fill} opacity={opacity} textAnchor={anchor} style={SANS}>
      {children}
    </text>
  );
}

/** Dimension line with end ticks */
function Dim({ x1, y1, x2, y2, stroke, sw = 0.8, tick = 4 }: { x1: number; y1: number; x2: number; y2: number; stroke: string; sw?: number; tick?: number }) {
  const vertical = x1 === x2;
  const t = vertical ? `M${x1 - tick} ${y1}L${x1 + tick} ${y1}M${x2 - tick} ${y2}L${x2 + tick} ${y2}` : `M${x1} ${y1 - tick}L${x1} ${y1 + tick}M${x2} ${y2 - tick}L${x2} ${y2 + tick}`;
  return <path d={`M${x1} ${y1}L${x2} ${y2}${t}`} stroke={stroke} strokeWidth={sw} fill="none" />;
}

// ───────────────────────────── HERO (composed) ─────────────────────────────

function HeroScene({ uid }: { uid: string }) {
  const glow = `${uid}glow`;
  const ray = `${uid}ray`;
  const soft = `${uid}soft`;
  const haze = `${uid}haze`;
  const floor = `${uid}floor`;
  // light fans thrown by the centre stone onto the surface (caustics)
  const fan = [-30, -19, -9, 0, 9, 19, 30].map((deg, i) => {
    const len = 520 - Math.abs(deg) * 3;
    const spread = 7 + (i % 3) * 3;
    const x0 = 505;
    const y0 = 255;
    const a = 90 + deg;
    const p1 = [x0 + len * cs(a - spread / 2), y0 + len * sn(a - spread / 2)];
    const p2 = [x0 + len * cs(a + spread / 2), y0 + len * sn(a + spread / 2)];
    return `M${x0} ${y0}L${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}Z`;
  });
  // fine caustic filigree on the surface
  const caustics = [0, 1, 2, 3, 4].map((i) => {
    const y = 742 + i * 22;
    const amp = 6 + (i % 2) * 5;
    const x0 = 200 + i * 18;
    const x1 = 820 - i * 22;
    const segs = 6;
    let d = `M${x0} ${y}`;
    for (let s = 1; s <= segs; s++) {
      const x = x0 + ((x1 - x0) * s) / segs;
      const cx = x - (x1 - x0) / segs / 2;
      d += `Q${f(cx)} ${f(y + (s % 2 ? -amp : amp))} ${f(x)} ${y}`;
    }
    return d;
  });

  return (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 900" aria-hidden>
        <defs>
          <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#FFFDF7" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFFDF7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={ray} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFF8EA" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={floor} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#E3D2B4" stopOpacity="0.55" />
            <stop offset="1" stopColor="#E3D2B4" stopOpacity="0" />
          </radialGradient>
          <filter id={soft} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id={haze} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        {/* halo of light behind the ring */}
        <ellipse cx="505" cy="330" rx="420" ry="360" fill={`url(#${glow})`} />
        {/* the surface */}
        <ellipse cx="505" cy="790" rx="520" ry="112" fill={`url(#${floor})`} />
        <ellipse cx="505" cy="770" rx="360" ry="60" fill="#FFFFFF" opacity="0.5" filter={`url(#${soft})`} />
        {/* caustic light fans */}
        <g filter={`url(#${haze})`} opacity="0.75">
          {fan.map((d, i) => (
            <path key={i} d={d} fill={`url(#${ray})`} />
          ))}
        </g>
        <g fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.7" filter={`url(#${haze})`}>
          {caustics.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g fill="none" stroke={GOLD_LIGHT} strokeWidth="0.9" opacity="0.35">
          <path d={arc(505, 792, 300, 34, 196, 344)} />
          <path d={arc(505, 800, 380, 46, 200, 340)} strokeDasharray="2 7" />
        </g>
      </svg>

      {/* the oversized ring */}
      <div className="absolute left-[5%] top-[-12%] aspect-square w-[94%]">
        <JewelryArt spec={{ kind: 'ring', head: 'hidden-halo', band: 'pave' }} shape="oval" metal="yellow" carat={2.6} view={1} className="h-full w-full" title="Oval hidden halo engagement ring" />
      </div>
      {/* loose diamonds resting on the surface */}
      <div className="absolute left-[3%] top-[62%] aspect-square w-[25%] -rotate-[24deg]">
        <LooseDiamond shape="pear" className="h-full w-full" title="Pear diamond" />
      </div>
      <div className="absolute left-[75%] top-[66%] aspect-square w-[19%] rotate-[8deg]">
        <LooseDiamond shape="emerald" className="h-full w-full" title="Emerald cut diamond" />
      </div>
      <div className="absolute left-[64%] top-[78%] aspect-square w-[11%]">
        <LooseDiamond shape="round" className="h-full w-full" title="Round brilliant diamond" />
      </div>
      <div className="absolute left-[24%] top-[80%] aspect-square w-[8%] rotate-[30deg]">
        <LooseDiamond shape="marquise" className="h-full w-full" title="Marquise diamond" />
      </div>

      {/* glints */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 900" aria-hidden>
        <Glint x={452} y={150} s={20} delay={0.2} />
        <Glint x={560} y={176} s={11} delay={1.6} />
        <Glint x={322} y={418} s={9} delay={2.4} />
        <Glint x={128} y={722} s={13} delay={0.9} />
        <Glint x={838} y={735} s={12} delay={3.1} />
        <Glint x={700} y={812} s={7} delay={1.2} />
        <Glint x={760} y={232} s={6} fill={GOLD_LIGHT} delay={2.8} />
        <Glint x={236} y={210} s={5} fill={GOLD_LIGHT} delay={3.6} />
      </svg>
    </>
  );
}

// ───────────────────────────── WORKSHOP (composed) ─────────────────────────────

function WorkshopScene({ uid }: { uid: string }) {
  const beam = `${uid}beam`;
  const bench = `${uid}bench`;
  const blur = `${uid}blur`;
  const steel = `${uid}steel`;
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 500" aria-hidden>
        <defs>
          <linearGradient id={beam} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={bench} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9C7A8" stopOpacity="0" />
            <stop offset="0.25" stopColor="#D9C7A8" stopOpacity="0.22" />
            <stop offset="1" stopColor="#C9B38E" stopOpacity="0.36" />
          </linearGradient>
          <linearGradient id={steel} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F4F2EE" />
            <stop offset="0.5" stopColor="#D9D6CF" />
            <stop offset="1" stopColor="#B9B5AC" />
          </linearGradient>
          <filter id={blur} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* window light falling across the bench */}
        <g filter={`url(#${blur})`} opacity="0.85">
          <path d="M-20 -20L120 -20L420 330L420 430Z" fill={`url(#${beam})`} />
          <path d="M150 -20L210 -20L420 210L420 260Z" fill={`url(#${beam})`} opacity="0.7" />
        </g>

        {/* bench surface */}
        <rect x="0" y="318" width="400" height="182" fill={`url(#${bench})`} />
        <path d="M0 318.5H400" stroke={INK} strokeOpacity="0.12" />

        {/* pinned design sheet */}
        <g transform="rotate(-6 120 120)">
          <rect x="34" y="46" width="176" height="138" fill={PAPER} stroke={LINE} />
          <path d="M34 46h176v138H34z" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.7" />
          <circle cx="122" cy="52" r="3" fill={GOLD} opacity="0.8" />
          <g fill="none" stroke={INK} strokeWidth="0.8" opacity="0.55">
            <path d={arc(96, 132, 34, 34, 0, 360, 48)} />
            <path d={arc(96, 132, 28, 28, 0, 360, 48)} />
            <path d="M96 84V182M52 132H140" strokeDasharray="2 3" opacity="0.6" />
          </g>
          <ProfileStone x={96} y={90} W={30} stroke={GOLD} sw={0.9} />
          <LineStone shape="oval" x={168} y={104} w={26} stroke={INK} sw={0.7} facet={0.5} />
          <Label x={168} y={138} size={5.5} anchor="middle" spacing={1}>
            TOP VIEW
          </Label>
          <path d="M146 158h44M146 166h30" stroke={INK} strokeOpacity="0.25" strokeWidth="0.8" />
          <text x="44" y="176" fontSize="9" fill={GOLD} opacity="0.9" fontStyle="italic" style={SERIF}>
            No. 0427
          </text>
        </g>

        {/* tweezers reaching in from the right */}
        <g stroke={INK} strokeOpacity="0.55" strokeWidth="0.8" strokeLinejoin="round">
          <path d="M410 70L404 62L276 222L280 226Z" fill={`url(#${steel})`} />
          <path d="M416 82L411 75L281 228L285 231Z" fill={`url(#${steel})`} />
        </g>

        {/* loupe resting on the bench */}
        <g stroke={INK} strokeOpacity="0.5" strokeWidth="0.9">
          <path d="M288 424L262 452L276 462L304 436Z" fill="#2B2925" fillOpacity="0.85" />
          <ellipse cx="318" cy="414" rx="44" ry="17" fill="#1E1C19" fillOpacity="0.88" />
          <ellipse cx="318" cy="410" rx="38" ry="13.5" fill="#F7F4EE" fillOpacity="0.85" />
          <path d={arc(318, 410, 30, 9, 200, 300, 12)} fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.6" />
        </g>
        <ellipse cx="318" cy="436" rx="52" ry="9" fill="#2A241D" opacity="0.1" filter={`url(#${blur})`} />
      </svg>

      <div className="absolute bottom-[3%] left-[-2%] aspect-square w-[74%]">
        <JewelryArt spec={{ kind: 'ring', head: 'solitaire', band: 'pave', prongs: 6 }} shape="round" metal="yellow" carat={1.6} view={1} className="h-full w-full" title="Round solitaire ring in yellow gold" />
      </div>
      <div className="absolute left-[56%] top-[36%] aspect-square w-[22%]">
        <LooseDiamond shape="round" className="h-full w-full" title="Round diamond held in tweezers" />
      </div>
      <div className="absolute left-[78%] top-[63%] aspect-square w-[13%] rotate-[18deg]">
        <LooseDiamond shape="pear" className="h-full w-full" title="Pear diamond" />
      </div>
      <div className="absolute left-[50%] top-[79%] aspect-square w-[9%]">
        <LooseDiamond shape="cushion" className="h-full w-full" title="Cushion diamond" />
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 500" aria-hidden>
        <Glint x={258} y={208} s={9} delay={0.4} />
        <Glint x={128} y={262} s={8} delay={1.8} />
        <Glint x={330} y={334} s={6} delay={2.7} />
        <Glint x={60} y={300} s={5} fill={GOLD_LIGHT} delay={3.3} />
      </svg>
    </>
  );
}

// ───────────────────────────── BESPOKE (gold line drawing on dark) ─────────────────────────────

function BespokeScene() {
  const cx = 230;
  const cy = 330;
  const R = 118;
  const r = 100;
  const g = cy - R - 34;
  const W = 96;
  const stone = profile(W);
  const pave: ReactNode[] = [];
  for (let a = -158; a <= -22; a += 7) {
    if (a > -112 && a < -68) continue;
    pave.push(<circle key={a} cx={f(cx + (R - 9) * cs(a))} cy={f(cy + (R - 9) * sn(a))} r="3.6" />);
  }
  const haloDots: ReactNode[] = [];
  const oW = 66;
  const oH = oW * SHAPE_ASPECT.oval;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 360;
    haloDots.push(<circle key={i} cx={f(430 + (oW / 2 + 6) * cs(a))} cy={f(132 + (oH / 2 + 6) * sn(a))} r="2.4" />);
  }
  const grid: string[] = [];
  for (let x = 20; x < 520; x += 40) grid.push(`M${x} 0V560`);
  for (let y = 20; y < 560; y += 40) grid.push(`M0 ${y}H520`);

  return (
    <g>
      <path d={grid.join('')} stroke={GOLD_LIGHT} strokeOpacity="0.07" strokeWidth="0.6" />

      {/* centre lines */}
      <path d={`M${cx} 110V486M70 ${cy}H392`} stroke={GOLD_LIGHT} strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="10 4 2 4" />

      {/* band, front elevation */}
      <g fill="none" stroke={GOLD_LIGHT} strokeWidth="1.3">
        <circle cx={cx} cy={cy} r={R} />
        <circle cx={cx} cy={cy} r={r} opacity="0.85" />
        <circle cx={cx} cy={cy} r={(R + r) / 2} opacity="0.25" strokeDasharray="3 5" />
      </g>
      <g fill="none" stroke={GOLD_LIGHT} strokeWidth="0.8" opacity="0.75">
        {pave}
      </g>

      {/* head: gallery, prongs, stone */}
      <g fill="none" stroke={GOLD_LIGHT} strokeWidth="1.2" strokeLinecap="round">
        <path d={`M${cx - 34} ${g + 30}Q${cx} ${g + 58} ${cx + 34} ${g + 30}`} opacity="0.8" />
        <path d={`M${cx - 24} ${cy - R + 2}L${cx - 34} ${g + 24}M${cx + 24} ${cy - R + 2}L${cx + 34} ${g + 24}`} />
        <path d={`M${f(cx - W * 0.36)} ${f(g + stone.pd * 0.72)}L${f(cx - W * 0.48)} ${f(g - W * 0.13)}M${f(cx + W * 0.36)} ${f(g + stone.pd * 0.72)}L${f(cx + W * 0.48)} ${f(g - W * 0.13)}`} strokeWidth="2.2" />
      </g>
      <ProfileStone x={cx} y={g} W={W} stroke={GOLD_LIGHT} sw={1.3} fill="rgba(205,176,121,0.08)" facet={0.85} />
      <g fill="none" stroke={GOLD_LIGHT} strokeWidth="0.7" opacity="0.8">
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <circle key={i} cx={cx + i * 9} cy={g + 12} r="3.4" />
        ))}
      </g>

      {/* dimensions */}
      <g stroke={GOLD_LIGHT} opacity="0.65">
        <Dim x1={cx - R} y1={492} x2={cx + R} y2={492} stroke={GOLD_LIGHT} sw={0.7} />
        <path d={`M${cx - R} ${cy}V500M${cx + R} ${cy}V500`} strokeWidth="0.5" strokeDasharray="2 3" />
        <Dim x1={60} y1={f(g - stone.ch)} x2={60} y2={cy + R} stroke={GOLD_LIGHT} sw={0.7} />
        <path d={`M54 ${f(g - stone.ch)}H${cx - 50}M54 ${cy + R}H${cx}`} strokeWidth="0.5" strokeDasharray="2 3" />
      </g>
      <Label x={cx} y={486} size={8} fill={GOLD_LIGHT} opacity={0.85} anchor="middle" spacing={2}>
        Ø 17.3 MM
      </Label>
      <g transform={`translate(50 ${f((g - stone.ch + cy + R) / 2)}) rotate(-90)`}>
        <Label x={0} y={0} size={8} fill={GOLD_LIGHT} opacity={0.85} anchor="middle" spacing={2}>
          24.6 MM
        </Label>
      </g>

      {/* top view detail */}
      <g>
        <circle cx="430" cy="132" r="64" fill="none" stroke={GOLD_LIGHT} strokeOpacity="0.3" strokeWidth="0.7" strokeDasharray="1 4" />
        <g fill="none" stroke={GOLD_LIGHT} strokeWidth="0.6" opacity="0.7">
          {haloDots}
        </g>
        <LineStone shape="oval" x={430} y={132} w={oW} stroke={GOLD_LIGHT} sw={1.1} facet={0.65} />
        <Label x={430} y={226} size={7.5} fill={GOLD_LIGHT} opacity={0.85} anchor="middle" spacing={2}>
          OVAL · 2.00 CT
        </Label>
        <Label x={430} y={238} size={6} fill={GOLD_LIGHT} opacity={0.5} anchor="middle" spacing={2}>
          HIDDEN HALO
        </Label>
        <path d={`M372 160L${cx + 60} ${g - 6}`} stroke={GOLD_LIGHT} strokeOpacity="0.35" strokeWidth="0.6" strokeDasharray="2 3" fill="none" />
      </g>

      {/* band profile detail */}
      <g transform="translate(430 330)">
        <path d="M-26 -9Q0 -15 26 -9L24 9Q0 13 -24 9Z" fill="none" stroke={GOLD_LIGHT} strokeWidth="1.1" />
        <path d="M-26 -9L-24 9M26 -9L24 9" stroke={GOLD_LIGHT} strokeOpacity="0.4" strokeWidth="0.6" />
        <Label x={0} y={32} size={6.5} fill={GOLD_LIGHT} opacity={0.7} anchor="middle" spacing={2}>
          COMFORT FIT · 2.2 MM
        </Label>
      </g>

      {/* title block */}
      <g transform="translate(372 452)">
        <rect width="132" height="88" fill="none" stroke={GOLD_LIGHT} strokeOpacity="0.55" strokeWidth="0.8" />
        <path d="M0 40H132M0 64H132M66 64V88" stroke={GOLD_LIGHT} strokeOpacity="0.4" strokeWidth="0.6" />
        <text x="12" y="28" fontSize="17" fill={GOLD_LIGHT} fontStyle="italic" style={SERIF}>
          Bespoke
        </text>
        <Label x={12} y={56} size={6.5} fill={GOLD_LIGHT} opacity={0.7} spacing={1.8}>
          COMMISSION NO. 0427
        </Label>
        <Label x={12} y={79} size={6} fill={GOLD_LIGHT} opacity={0.6} spacing={1.6}>
          SCALE 4:1
        </Label>
        <Label x={78} y={79} size={6} fill={GOLD_LIGHT} opacity={0.6} spacing={1.6}>
          18K GOLD
        </Label>
      </g>

      <Glint x={cx - 14} y={g - 10} s={9} fill={GOLD_LIGHT} delay={0.6} />
      <Glint x={456} y={104} s={6} fill={GOLD_LIGHT} delay={2.2} />
      <Glint x={128} y={232} s={5} fill={GOLD_LIGHT} delay={3.4} opacity={0.8} />
    </g>
  );
}

// ───────────────────────────── PROCESS SCENES (ink line art, 480 × 360) ─────────────────────────────

function SketchScene() {
  const hatch: string[] = [];
  for (let a = 22; a <= 158; a += 6) {
    const x = 226 + 86 * cs(a);
    const y = 222 + 30 * sn(a);
    hatch.push(`M${f(x)} ${f(y)}l-7 9`);
  }
  return (
    <g>
      <g transform="rotate(4 240 180)">
        <rect x="100" y="48" width="296" height="262" fill={PAPER} stroke={LINE} />
      </g>
      <g transform="rotate(-3 240 180)">
        <rect x="80" y="36" width="318" height="282" fill={PAPER} stroke="#D9CFBF" />
        {[262, 276, 290].map((y) => (
          <path key={y} d={`M300 ${y}H382`} stroke={INK} strokeOpacity="0.12" strokeWidth="0.8" />
        ))}
        {/* construction */}
        <g fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.55" strokeDasharray="3 4">
          <path d="M226 104V280" />
          <circle cx="226" cy="150" r="44" />
        </g>
        {/* band in three-quarter view */}
        <g fill="none" stroke={INK} strokeLinecap="round" opacity="0.82">
          <path d={arc(226, 210, 86, 30, 0, 360, 60)} strokeWidth="1.3" />
          <path d={arc(226, 206, 70, 21, 0, 360, 60)} strokeWidth="1" />
          <path d={arc(226, 222, 86, 30, 0, 180, 30)} strokeWidth="1.2" />
          <path d="M140 210V222M312 210V222" strokeWidth="1.1" />
          <path d={hatch.join('')} strokeWidth="0.6" opacity="0.5" />
          <path d="M204 190L198 160M248 190L254 160M214 184L212 164M238 184L240 164" strokeWidth="1" />
        </g>
        <ProfileStone x={226} y={156} W={66} stroke={INK} sw={1.2} facet={0.6} />
        <path d={arc(226, 156, 34, 4, 180, 360, 16)} fill="none" stroke={GOLD} strokeWidth="1" opacity="0.8" />
        {/* thumbnails & notes */}
        <LineStone shape="oval" x={124} y={92} w={30} stroke={INK} sw={0.9} facet={0.55} />
        <Label x={124} y={130} size={6} anchor="middle" spacing={1.2}>
          TOP
        </Label>
        <path d="M300 116Q284 128 262 146" fill="none" stroke={GOLD} strokeWidth="0.8" />
        <text x="302" y="114" fontSize="13" fill={GOLD} fontStyle="italic" style={SERIF}>
          oval, 2 ct
        </text>
        <path d="M118 176Q150 170 168 160" fill="none" stroke={GOLD} strokeWidth="0.8" />
        <text x="96" y="192" fontSize="12" fill={GOLD} fontStyle="italic" style={SERIF}>
          hidden halo
        </text>
        <Dim x1={140} y1={286} x2={312} y2={286} stroke={INK} sw={0.7} />
        <Label x={226} y={281} size={6.5} anchor="middle" spacing={1.2}>
          17.3 MM
        </Label>
      </g>
      {/* pencil */}
      <g transform="translate(318 318) rotate(-33)">
        <path d="M0 0L26 -6.5V6.5Z" fill="#EBDDC5" stroke={INK} strokeOpacity="0.7" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M0 0L8 -2V2Z" fill={INK} />
        <rect x="26" y="-6.5" width="170" height="13" fill="#F4EEE4" stroke={INK} strokeOpacity="0.7" strokeWidth="0.8" />
        <path d="M26 -2.2H196M26 2.2H196" stroke={INK} strokeOpacity="0.15" strokeWidth="0.6" />
        <rect x="196" y="-7" width="14" height="14" fill={GOLD_PALE} stroke={GOLD} strokeWidth="0.8" />
        <path d="M200 -7V7M205 -7V7" stroke={GOLD} strokeWidth="0.6" />
      </g>
      <path d="M352 336l3 -2M362 330l2 1M346 342l2 -1" stroke={INK} strokeOpacity="0.4" strokeLinecap="round" />
    </g>
  );
}

function CadScene() {
  const cx = 240;
  const cy = 218;
  const R = 92;
  const r = 78;
  const meridians: string[] = [];
  for (let a = 0; a < 360; a += 15) {
    meridians.push(`M${f(cx + R * cs(a))} ${f(cy + R * sn(a))}L${f(cx + 10 + R * cs(a))} ${f(cy - 6 + R * sn(a))}`);
    meridians.push(`M${f(cx + r * cs(a))} ${f(cy + r * sn(a))}L${f(cx + R * cs(a))} ${f(cy + R * sn(a))}`);
  }
  const floor: string[] = [];
  for (let i = -7; i <= 7; i++) floor.push(`M${240 + i * 16} 300L${240 + i * 64} 360`);
  [300, 308, 320, 336, 356].forEach((y) => floor.push(`M0 ${y}H480`));
  const g = cy - R - 30;
  const W = 74;
  return (
    <g>
      <path d={floor.join('')} stroke={INK} strokeOpacity="0.1" strokeWidth="0.8" />
      {/* viewport chrome */}
      <g fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="1">
        <path d="M16 34V16H34M446 16H464V34M464 326V344H446M34 344H16V326" />
      </g>
      <Label x={28} y={30} size={6.5} spacing={1.6}>
        PERSPECTIVE · SHADED WIRE
      </Label>
      <Label x={452} y={30} size={6.5} anchor="end" spacing={1.6}>
        TOL. ±0.01 MM
      </Label>

      {/* wireframe band */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <circle cx={cx + 10} cy={cy - 6} r={R} strokeOpacity="0.25" strokeDasharray="3 3" strokeWidth="0.9" />
        <circle cx={cx} cy={cy} r={R} strokeOpacity="0.85" strokeWidth="1.3" />
        <circle cx={cx} cy={cy} r={r} strokeOpacity="0.7" strokeWidth="1.1" />
        <circle cx={cx} cy={cy} r={(R + r) / 2} strokeOpacity="0.25" strokeWidth="0.7" />
        <path d={meridians.join('')} strokeOpacity="0.3" strokeWidth="0.7" />
      </g>

      {/* basket & prongs */}
      <g fill="none" stroke={INK} strokeOpacity="0.75" strokeWidth="1.1" strokeLinecap="round">
        <path d={`M${cx - 18} ${cy - R + 1}L${cx - 26} ${g + 22}M${cx + 18} ${cy - R + 1}L${cx + 26} ${g + 22}`} />
        <path d={arc(cx, g + 24, 27, 5, 0, 360, 24)} strokeOpacity="0.5" />
        <path d={`M${f(cx - W * 0.36)} ${f(g + 22)}L${f(cx - W * 0.48)} ${f(g - 10)}M${f(cx + W * 0.36)} ${f(g + 22)}L${f(cx + W * 0.48)} ${f(g - 10)}`} strokeWidth="1.8" />
      </g>
      <ProfileStone x={cx} y={g} W={W} stroke={GOLD} sw={1.3} facet={0.85} />

      {/* selection gizmo */}
      <g fill="none" stroke={GOLD} strokeWidth="0.8">
        <rect x={cx - 50} y={g - 24} width="100" height="62" strokeDasharray="4 3" />
        {[
          [cx - 50, g - 24],
          [cx + 50, g - 24],
          [cx - 50, g + 38],
          [cx + 50, g + 38],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 2.5} y={y - 2.5} width="5" height="5" fill={PAPER} />
        ))}
      </g>
      <Label x={cx + 58} y={g - 16} size={6.5} fill={GOLD} opacity={0.95} spacing={1.4}>
        CENTRE STONE 8.0 × 6.0
      </Label>

      {/* dimension */}
      <Dim x1={370} y1={cy - R} x2={370} y2={cy + R} stroke={INK} sw={0.7} />
      <path d={`M${cx} ${cy - R}H376M${cx} ${cy + R}H376`} stroke={INK} strokeOpacity="0.25" strokeWidth="0.6" strokeDasharray="2 3" />
      <g transform={`translate(384 ${cy}) rotate(90)`}>
        <Label x={0} y={0} size={6.5} anchor="middle" spacing={1.4}>
          Ø 17.3
        </Label>
      </g>

      {/* axis triad */}
      <g transform="translate(48 318)" strokeWidth="1.2" strokeLinecap="round">
        <path d="M0 0H30" stroke={GOLD} />
        <path d="M0 0V-30" stroke={INK} strokeOpacity="0.7" />
        <path d="M0 0L-16 12" stroke={INK} strokeOpacity="0.35" />
        <Label x={34} y={3} size={6.5}>
          X
        </Label>
        <Label x={-3} y={-34} size={6.5}>
          Y
        </Label>
        <Label x={-26} y={20} size={6.5}>
          Z
        </Label>
      </g>
    </g>
  );
}

function SettingScene({ uid }: { uid: string }) {
  const cx = 228;
  const cy = 178;
  const w = 152;
  const claws = [-90, -30, 30, 90, 150, 210];
  const lens = `${uid}lens`;
  return (
    <g>
      <defs>
        <radialGradient id={lens} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={PAPER} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="132" fill={`url(#${lens})`} stroke={LINE} strokeWidth="1" />
      <circle cx={cx} cy={cy} r="140" fill="none" stroke={LINE} strokeWidth="0.6" strokeDasharray="1 5" />

      {/* gallery seen through the stone */}
      <circle cx={cx} cy={cy} r={w / 2 + 6} fill="none" stroke={GOLD} strokeOpacity="0.4" strokeWidth="1" />
      <LineStone shape="round" x={cx} y={cy} w={w} stroke={INK} sw={1.2} facet={0.5} fill="#FFFFFF" />

      {/* claws */}
      {claws.map((a, i) => {
        const x = cx + (w / 2 + 1) * cs(a);
        const y = cy + (w / 2 + 1) * sn(a);
        return (
          <g key={a} transform={`translate(${f(x)} ${f(y)}) rotate(${a + 90})`}>
            <path d="M-7 4Q-8 -9 0 -11Q8 -9 7 4Z" fill={i === 2 ? '#E6CF9F' : GOLD_PALE} stroke={GOLD} strokeWidth="1" />
            <path d="M-3 -5Q0 -8 3 -5" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.9" />
          </g>
        );
      })}

      {/* setting pusher meeting the right-hand claw */}
      <g stroke={INK} strokeOpacity="0.75" strokeWidth="1" strokeLinejoin="round">
        <path d="M300 222L306 214L414 286L408 294Z" fill="#E7E3DB" />
        <path d="M300 222L306 214L297 211Z" fill="#CFCAC0" />
        <path d="M404 280Q420 268 444 286Q462 304 446 322Q426 330 410 312Q398 298 404 280Z" fill="#E9D9BE" />
        <path d="M418 290Q430 286 440 298" fill="none" strokeOpacity="0.3" />
      </g>
      <g fill="none" stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.85">
        <path d="M282 196Q290 190 290 182" />
        <path d="M290 206Q300 198 301 188" />
      </g>

      {/* tweezers presenting a melee */}
      <g stroke={INK} strokeOpacity="0.65" strokeWidth="0.9" strokeLinejoin="round">
        <path d="M10 18L16 12L104 88L100 92Z" fill="#E7E3DB" />
        <path d="M4 30L9 24L98 96L95 100Z" fill="#E7E3DB" />
      </g>
      <LineStone shape="round" x={106} y={98} w={16} stroke={INK} sw={0.8} facet={0.6} fill="#FFFFFF" />

      <Label x={24} y={340} size={6.5} spacing={1.6}>
        SIX CLAW · HAND SET · ×12
      </Label>
      <Glint x={196} y={142} s={10} fill={GOLD} delay={0.8} opacity={0.8} />
      <Glint x={290} y={168} s={5} fill={GOLD} delay={2.2} />
    </g>
  );
}

function InspectionScene({ uid }: { uid: string }) {
  const clip = `${uid}clip`;
  const sheen = `${uid}sheen`;
  const cx = 262;
  const cy = 160;
  const R = 96;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <circle cx={cx} cy={cy} r={R - 6} />
        </clipPath>
        <radialGradient id={sheen} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F3EEE6" />
        </radialGradient>
      </defs>

      {/* handle */}
      <g stroke={INK} strokeOpacity="0.75" strokeWidth="1" strokeLinejoin="round">
        <path d="M322 232L336 220L432 322Q438 334 426 340Q414 344 406 336Z" fill="#2B2925" />
        <path d="M330 228L342 216L352 226L340 238Z" fill={GOLD_PALE} stroke={GOLD} />
      </g>

      {/* lens */}
      <circle cx={cx} cy={cy} r={R + 6} fill="#2B2925" />
      <circle cx={cx} cy={cy} r={R} fill={GOLD_PALE} stroke={GOLD} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={R - 6} fill={`url(#${sheen})`} />
      <g clipPath={`url(#${clip})`}>
        <path d={`M${cx - R} ${cy}H${cx + R}M${cx} ${cy - R}V${cy + R}`} stroke={INK} strokeOpacity="0.08" strokeWidth="0.8" />
        <LineStone shape="round" x={cx} y={cy} w={132} stroke={INK} sw={1.2} facet={0.55} />
        <circle cx={cx + 22} cy={cy - 18} r="2" fill="none" stroke={GOLD} strokeWidth="0.8" />
        <path d={`M${cx + 25} ${cy - 21}L${cx + 44} ${cy - 40}`} stroke={GOLD} strokeWidth="0.7" />
        <path d={arc(cx, cy, R - 18, R - 18, 200, 250, 16)} fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      </g>
      <Label x={cx + 48} y={cy - 42} size={6} fill={GOLD} opacity={0.95} spacing={1.2}>
        VVS1
      </Label>

      {/* the stone at actual size, on its parcel paper */}
      <path d="M44 244L112 232L132 276L62 290Z" fill={PAPER} stroke={LINE} />
      <LineStone shape="round" x={88} y={260} w={22} stroke={INK} sw={0.8} facet={0.6} fill="#FFFFFF" />
      <path d="M100 248Q140 214 168 210" fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="0.8" strokeDasharray="2 3" />

      {/* colour scale */}
      <g transform="translate(36 54)">
        {['D', 'E', 'F', 'G', 'H'].map((l, i) => (
          <g key={l} transform={`translate(${i * 20} 0)`}>
            {i === 0 && <circle cx="0" cy="-3" r="8.5" fill="none" stroke={GOLD} strokeWidth="1" />}
            <text x="0" y="0" fontSize="10" textAnchor="middle" fill={i === 0 ? GOLD : INK} opacity={i === 0 ? 1 : 0.45} style={SERIF}>
              {l}
            </text>
          </g>
        ))}
        <path d="M-8 14H90" stroke={INK} strokeOpacity="0.2" strokeWidth="0.8" />
        <Label x={-8} y={28} size={6.5} spacing={1.6}>
          COLOUR · CLARITY · CUT
        </Label>
      </g>

      {/* approval mark */}
      <g transform="translate(410 66)">
        <circle r="17" fill="none" stroke={GOLD} strokeWidth="1" />
        <circle r="21" fill="none" stroke={GOLD} strokeWidth="0.5" strokeDasharray="1 3" />
        <path d="M-7 0L-2 5L8 -6" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Glint x={232} y={128} s={9} fill={GOLD} delay={1.2} opacity={0.8} />
    </g>
  );
}

function PolishingScene() {
  const wx = 166;
  const wy = 178;
  const WR = 112;
  const folds: string[] = [];
  for (let a = 0; a < 360; a += 12) folds.push(`M${f(wx + 80 * cs(a))} ${f(wy + 80 * sn(a))}L${f(wx + 106 * cs(a + 4))} ${f(wy + 106 * sn(a + 4))}`);
  const rx = 332;
  const ry = 196;
  const ringR = 54;
  const sparks: string[] = [];
  [-62, -40, -18, 6, 28].forEach((a) => {
    sparks.push(`M${f(282 + 10 * cs(a))} ${f(184 + 10 * sn(a))}L${f(282 + 26 * cs(a))} ${f(184 + 26 * sn(a))}`);
  });
  return (
    <g>
      {/* buffing wheel */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <circle cx={wx} cy={wy} r={WR} fill="#F7F2EA" strokeOpacity="0.75" strokeWidth="1.2" />
        <circle cx={wx} cy={wy} r={WR - 10} strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="2 4" />
        <circle cx={wx} cy={wy} r="74" strokeOpacity="0.3" strokeWidth="0.8" />
        <circle cx={wx} cy={wy} r="46" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="2 4" />
        <path d={folds.join('')} strokeOpacity="0.22" strokeWidth="0.8" />
        <circle cx={wx} cy={wy} r="18" fill={GOLD_PALE} stroke={GOLD} strokeWidth="1" />
        <circle cx={wx} cy={wy} r="5" fill={INK} stroke="none" />
      </g>
      {/* motion */}
      <g fill="none" stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.8">
        <path d={arc(wx, wy, WR + 16, WR + 16, 200, 248, 18)} />
        <path d={`M${f(wx + (WR + 16) * cs(248))} ${f(wy + (WR + 16) * sn(248))}l-8 -1m8 1l-3 7`} />
        <path d={arc(wx, wy, WR + 16, WR + 16, 110, 150, 16)} />
        <path d={`M${f(wx + (WR + 16) * cs(110))} ${f(wy + (WR + 16) * sn(110))}l7 1m-7 -1l3 -7`} />
      </g>
      {/* ring pressed to the wheel */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <circle cx={rx} cy={ry} r={ringR} strokeOpacity="0.85" strokeWidth="1.3" fill="#FFFFFF" fillOpacity="0.6" />
        <circle cx={rx} cy={ry} r={ringR - 9} strokeOpacity="0.7" strokeWidth="1.1" fill={PAPER} />
        <path d={arc(rx, ry, ringR - 4.5, ringR - 4.5, 120, 210, 20)} stroke="#FFFFFF" strokeWidth="2.4" />
        <path d={`M${rx - 12} ${ry - ringR + 1}L${rx - 18} ${ry - ringR - 20}M${rx + 12} ${ry - ringR + 1}L${rx + 18} ${ry - ringR - 20}`} strokeOpacity="0.75" strokeWidth="1.1" />
      </g>
      <ProfileStone x={rx} y={ry - ringR - 24} W={46} stroke={GOLD} sw={1.2} facet={0.8} fill="#FFFFFF" />
      {/* a finger guiding the ring */}
      <path d="M392 248Q418 238 448 246Q470 254 476 270L476 300Q450 290 424 288Q404 286 390 274Z" fill="#F1E5D3" stroke={INK} strokeOpacity="0.45" strokeWidth="0.9" />
      <path d="M440 262Q452 262 460 268" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="0.8" />
      {/* sparks */}
      <path d={sparks.join('')} stroke={GOLD} strokeWidth="1" strokeLinecap="round" />
      {[
        [306, 150],
        [300, 222],
        [318, 170],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill={GOLD} />
      ))}
      <Glint x={358} y={164} s={8} fill={GOLD} delay={0.5} />
      <Glint x={350} y={116} s={6} fill={GOLD} delay={2.1} />
      <Label x={24} y={340} size={6.5} spacing={1.6}>
        MIRROR FINISH · HAND POLISHED
      </Label>
    </g>
  );
}

function PackagingScene({ uid }: { uid: string }) {
  const satin = `${uid}satin`;
  return (
    <g>
      <defs>
        <linearGradient id={satin} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#F4EDE2" />
          <stop offset="1" stopColor="#E9DFCF" />
        </linearGradient>
      </defs>
      <ellipse cx="250" cy="314" rx="170" ry="12" fill="#2A241D" opacity="0.06" />
      {/* lid */}
      <g stroke={INK} strokeOpacity="0.75" strokeWidth="1" strokeLinejoin="round">
        <path d="M150 206L350 206L372 74L172 74Z" fill="#1E1C19" />
        <path d="M160 200L340 200L360 82L180 82Z" fill={`url(#${satin})`} />
        <path d="M168 194L333 194L351 90L186 90Z" fill="none" stroke={GOLD} strokeOpacity="0.6" strokeWidth="0.7" />
      </g>
      <g transform="translate(262 138)" fill="none" stroke={GOLD} strokeWidth="0.9" strokeLinejoin="round">
        <path d="M-9 -7h18l6 7.5-15 18-15-18z" />
        <path d="M-15 0.5h30M-4 -7l-3 7.5 7 18 7-18-3-7.5" opacity="0.7" />
      </g>
      {/* base */}
      <g stroke={INK} strokeOpacity="0.75" strokeWidth="1" strokeLinejoin="round">
        <path d="M150 206L350 206L374 194L174 194Z" fill="#2B2925" />
        <path d="M130 236L330 236L374 194L174 194Z" fill="#F6F0E6" />
        <path d="M130 236L330 236L330 300L130 300Z" fill="#1E1C19" />
        <path d="M330 236L374 194L374 258L330 300Z" fill="#2B2925" />
      </g>
      <path d="M130 244H330" stroke={GOLD} strokeWidth="0.8" opacity="0.8" />
      {/* cushion slit */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <path d="M156 216Q252 224 352 214" strokeOpacity="0.55" strokeWidth="1.1" />
        <path d="M160 222Q252 232 346 220" strokeOpacity="0.15" strokeWidth="0.8" />
      </g>
      {/* ring standing in the slit */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <path d={arc(254, 220, 30, 30, 180, 360, 30)} stroke={GOLD} strokeWidth="5" strokeOpacity="0.75" />
        <path d={arc(254, 220, 30, 30, 196, 250, 12)} stroke="#FFFFFF" strokeWidth="1.4" />
        <path d="M246 191L240 172M262 191L268 172" stroke={GOLD} strokeWidth="1.6" />
      </g>
      <ProfileStone x={254} y={170} W={40} stroke={INK} sw={1.1} facet={0.6} fill="#FFFFFF" />
      {/* satin ribbon */}
      <g fill="none" stroke={GOLD} strokeLinecap="round" opacity="0.85">
        <path d="M352 300Q392 286 404 304Q414 322 448 314" strokeWidth="1.1" />
        <path d="M356 306Q392 296 400 312Q410 330 446 324" strokeWidth="0.8" opacity="0.6" />
        <path d="M340 304Q330 330 296 334" strokeWidth="1" />
      </g>
      {/* card */}
      <g transform="rotate(-8 82 286)">
        <rect x="40" y="258" width="88" height="56" fill={PAPER} stroke={LINE} />
        <path d="M54 284H114M60 294H108" stroke={INK} strokeOpacity="0.25" strokeWidth="0.8" />
        <text x="84" y="276" fontSize="10" textAnchor="middle" fill={GOLD} fontStyle="italic" style={SERIF}>
          for always
        </text>
      </g>
      <Glint x={244} y={156} s={10} fill={GOLD} delay={0.4} />
      <Glint x={290} y={128} s={5} fill={GOLD} delay={2.4} />
    </g>
  );
}

// ───────────────────────────── component ─────────────────────────────

type Props = { scene: EditorialScene; className?: string; title?: string; decorative?: boolean };

export function EditorialArt({ scene, className, title, decorative = false }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const label = title ?? LABELS[scene];
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img' as const, 'aria-label': label };

  if (scene === 'hero' || scene === 'workshop') {
    return (
      <div className={cn('relative overflow-hidden', scene === 'hero' ? 'aspect-[10/9]' : 'aspect-[4/5]', className)} {...a11y}>
        <div className="absolute inset-0" aria-hidden>
          {scene === 'hero' ? <HeroScene uid={uid} /> : <WorkshopScene uid={uid} />}
        </div>
      </div>
    );
  }

  const isBespoke = scene === 'bespoke';
  return (
    <svg viewBox={isBespoke ? '0 0 520 560' : '0 0 480 360'} className={cn('block h-auto w-full', className)} preserveAspectRatio="xMidYMid meet" {...a11y}>
      {!decorative && <title>{label}</title>}
      {scene === 'bespoke' && <BespokeScene />}
      {scene === 'sketch' && <SketchScene />}
      {scene === 'cad' && <CadScene />}
      {scene === 'setting' && <SettingScene uid={uid} />}
      {scene === 'inspection' && <InspectionScene uid={uid} />}
      {scene === 'polishing' && <PolishingScene />}
      {scene === 'packaging' && <PackagingScene uid={uid} />}
    </svg>
  );
}
