import { useId, type ReactNode, type SVGProps } from 'react';
import {
  facetPaths,
  perimeter,
  prongPoints,
  r1,
  resample,
  scalePts,
  SHAPE_ASPECT,
  shapePolygon,
  sparklePath,
  STEP_CUTS,
  stoneWidth,
  toPath,
} from './geometry';

/**
 * Procedural, original jewelry illustrations. Used as product imagery until real
 * photography is uploaded via the admin (Cloudinary / S3 / local uploads).
 * Re-renders instantly when the shopper changes metal colour, shape or carat.
 */

export type ArtKind =
  | 'ring'
  | 'band'
  | 'signet'
  | 'studs'
  | 'hoops'
  | 'drops'
  | 'pendant'
  | 'tennis-necklace'
  | 'station-necklace'
  | 'tennis-bracelet'
  | 'bangle';

export type ArtSpec = {
  kind: ArtKind;
  head?: 'solitaire' | 'halo' | 'double-halo' | 'hidden-halo' | 'three-stone' | 'toi-et-moi' | 'bezel' | 'cluster' | 'five-stone' | 'east-west';
  band?: 'plain' | 'pave' | 'cathedral' | 'bold' | 'knife';
  prongs?: number;
  sides?: string;
  second?: string;
  stones?: 'full' | 'half' | 'none';
  stoneShape?: string;
  graduated?: boolean;
  size?: 'huggie' | 'medium' | 'large' | 'thin' | 'wide';
};

export type JewelryArtProps = {
  spec: ArtSpec;
  shape?: string;
  metal?: string;
  carat?: number;
  /** 0 = hero view, 1 = alternate (hover) view, 2 = close-up */
  view?: number;
  className?: string;
  title?: string;
};

const METAL: Record<string, string[]> = {
  yellow: ['#FFF4D2', '#EDCD86', '#D2A85C', '#AC8137', '#7F5F28'],
  white: ['#FFFFFF', '#EDEFF1', '#CED2D7', '#A5ABB2', '#7C828A'],
  rose: ['#FFE8DD', '#EEBBA5', '#D6957C', '#B2725B', '#865140'],
};

// Server (Node) and browser V8 builds can differ in the last bits of transcendental
// functions; rounding keeps SSR and hydration output identical.
const st = (n: number) => Math.round(n * 1e6) / 1e6;
const sin = (x: number) => st(Math.sin(x));
const cos = (x: number) => st(Math.cos(x));
const atan2 = (y: number, x: number) => st(Math.atan2(y, x));
const r2 = (n: number) => Math.round(n * 100) / 100;
const clampN = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const STONE_STROKE = '#8E99A5';
const paint = (gradientId: string, stroke: string) => ({ fill: `url(#${gradientId})`, stroke, strokeWidth: 0.35 });
const FACET_STROKE = '#A9B3BE';

type Ids = { mb: string; mh: string; sv: string; d: string; dr: string; blur: string; fade: string };
/** Paint for melee stones (mc) and prongs (pc). Set as attributes rather than a <style> block:
 * the ids come from useId(), and an id inside text content turns any server/client id
 * difference into a hydration error, while attribute differences are tolerated. */
type Paint = Pick<SVGProps<SVGCircleElement>, 'fill' | 'stroke' | 'strokeWidth'>;
type Ctx = { ids: Ids; band: string[]; head: string[]; mc: Paint; pc: Paint };

function metalPalettes(metal = 'yellow') {
  const [primary, secondary] = metal.split('-');
  const band = METAL[primary] ?? METAL.yellow;
  const head = secondary ? METAL[secondary] ?? band : band;
  return { band, head };
}

function Defs({ ids, band, head }: Ctx) {
  const metalGrad = (id: string, p: string[]) => (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={p[1]} />
      <stop offset="0.28" stopColor={p[0]} />
      <stop offset="0.52" stopColor={p[2]} />
      <stop offset="0.76" stopColor={p[3]} />
      <stop offset="1" stopColor={p[1]} />
    </linearGradient>
  );
  return (
    <defs>
      {metalGrad(ids.mb, band)}
      {metalGrad(ids.mh, head)}
      <linearGradient id={ids.sv} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={band[3]} />
        <stop offset="0.22" stopColor={band[0]} />
        <stop offset="0.5" stopColor={band[1]} />
        <stop offset="0.8" stopColor={band[2]} />
        <stop offset="1" stopColor={band[4]} />
      </linearGradient>
      <linearGradient id={ids.d} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.38" stopColor="#E7EDF2" />
        <stop offset="0.56" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#CFD9E3" />
      </linearGradient>
      <radialGradient id={ids.dr} cx="0.36" cy="0.32" r="0.8">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.5" stopColor="#EDF1F5" />
        <stop offset="1" stopColor="#B9C4D0" />
      </radialGradient>
      <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <linearGradient id={ids.fade} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1B1A17" stopOpacity="0.55" />
        <stop offset="0.2" stopColor="#1B1A17" stopOpacity="0" />
        <stop offset="0.8" stopColor="#1B1A17" stopOpacity="0" />
        <stop offset="1" stopColor="#1B1A17" stopOpacity="0.55" />
      </linearGradient>
    </defs>
  );
}

// ───────────────────────────── primitives ─────────────────────────────

type StoneOpts = {
  k?: string | number;
  shape: string;
  x: number;
  y: number;
  w: number;
  rot?: number;
  prongs?: number;
  bezel?: boolean;
  halo?: 'none' | 'halo' | 'double' | 'hidden';
  detail?: boolean;
  sparkle?: boolean;
};

/** A face-up stone with optional prongs, bezel and halo */
function stone(c: Ctx, o: StoneOpts): ReactNode {
  const { shape, x, y, w, rot = 0, prongs = 4, bezel = false, halo = 'none', detail = true, sparkle = true } = o;
  const h = w * (SHAPE_ASPECT[shape] ?? 1);
  const poly = shapePolygon(shape, w, h);
  const f = facetPaths(shape, w, h);
  const sw = Math.max(0.45, w / 85);
  const mr = Math.max(1.7, Math.min(4.4, w * 0.072));
  const out: ReactNode[] = [];

  if (halo === 'halo' || halo === 'double') {
    const rings = halo === 'double' ? 2 : 1;
    const frame = rings * (2 * mr + 1.1) + 1.5;
    out.push(
      <path key="hf" d={toPath(scalePts(poly, 1 + (2 * frame) / w, 1 + (2 * frame) / h))} fill={`url(#${c.ids.mh})`} stroke={c.head[4]} strokeWidth="0.4" />,
    );
    for (let ring = 0; ring < rings; ring++) {
      const off = mr + 0.9 + ring * (2 * mr + 1.1);
      const pts = scalePts(poly, 1 + (2 * off) / w, 1 + (2 * off) / h);
      const n = Math.max(8, Math.floor(perimeter(pts) / (2 * mr + 0.7)));
      resample(pts, n).forEach(([px, py], i) =>
        out.push(<circle key={`h${ring}-${i}`} cx={r1(px)} cy={r1(py)} r={r1(mr)} {...c.mc} />),
      );
    }
  }
  if (halo === 'hidden') {
    const off = mr * 0.35;
    const pts = scalePts(poly, 1 + (2 * off) / w, 1 + (2 * off) / h);
    const n = Math.max(8, Math.floor(perimeter(pts) / (1.6 * mr)));
    resample(pts, n).forEach(([px, py], i) =>
      out.push(<circle key={`hh${i}`} cx={r1(px)} cy={r1(py)} r={r1(mr * 0.8)} {...c.mc} />),
    );
  }
  if (bezel) {
    const rim = Math.max(2.6, w * 0.085);
    out.push(
      <path key="bz" d={toPath(scalePts(poly, 1 + (2 * rim) / w, 1 + (2 * rim) / h))} fill={`url(#${c.ids.mh})`} stroke={c.head[4]} strokeWidth="0.5" />,
    );
  }
  out.push(<path key="o" d={f.outline} fill={`url(#${c.ids.d})`} stroke={STONE_STROKE} strokeWidth={sw} />);
  if (detail) {
    out.push(
      <path key="s" d={f.shade} fill="#8FA2B6" fillOpacity="0.2" />,
      <path key="l" d={f.light} fill="#FFFFFF" fillOpacity="0.78" />,
      <path key="t" d={f.table} fill="#F6F9FB" fillOpacity="0.55" />,
      <path key="f" d={f.lines} fill="none" stroke={FACET_STROKE} strokeWidth={sw * 0.6} strokeLinejoin="round" />,
    );
  }
  if (!bezel && prongs > 0) {
    const pr = Math.max(1.4, w * 0.056);
    prongPoints(shape, w, h, prongs).forEach(([px, py], i) =>
      out.push(<circle key={`p${i}`} cx={r1(px)} cy={r1(py)} r={r1(pr)} {...c.pc} />),
    );
  }
  if (sparkle && w > 14) {
    out.push(<path key="sp" d={sparklePath(Math.max(2.6, w * 0.15))} transform={`translate(${r1(-w * 0.17)} ${r1(-h * 0.2)})`} fill="#FFFFFF" />);
  }
  return (
    <g key={o.k} transform={`translate(${r1(x)} ${r1(y)})${rot ? ` rotate(${r1(rot)})` : ''}`}>
      {out}
    </g>
  );
}

function melee(c: Ctx, x: number, y: number, r: number, k: string | number, opacity = 1) {
  return <circle key={k} cx={r1(x)} cy={r1(y)} r={r1(r)} {...c.mc} opacity={opacity < 1 ? r2(opacity) : undefined} />;
}

function shadow(c: Ctx, cx: number, cy: number, rx: number, ry: number, k = 'sh', opacity = 0.12) {
  return <ellipse key={k} cx={r1(cx)} cy={r1(cy)} rx={r1(rx)} ry={r1(ry)} fill="#2A241D" opacity={opacity} filter={`url(#${c.ids.blur})`} />;
}

/** Side-on diamond (crown + pavilion), girdle centred at (x, g) */
function profileStone(c: Ctx, x: number, g: number, W: number, shape: string, k: string | number, rot = 0) {
  const step = STEP_CUTS.has(shape) || shape === 'princess' || shape === 'radiant';
  const ch = W * 0.17;
  const tw = W * (step ? 0.34 : 0.28);
  const pd = W * (step ? 0.4 : 0.44);
  const culet = step ? W * 0.05 : 0;
  const body = `M${r1(-tw)} ${r1(-ch)}L${r1(tw)} ${r1(-ch)}L${r1(W / 2)} 0L${r1(W / 2)} 1.4L${r1(culet)} ${r1(pd)}L${r1(-culet)} ${r1(pd)}L${r1(-W / 2)} 1.4L${r1(-W / 2)} 0Z`;
  let lines = `M${r1(-W / 2)} 0.7L${r1(W / 2)} 0.7`;
  if (step) {
    lines += `M${r1(-(tw + W / 2) / 2)} ${r1(-ch / 2)}L${r1((tw + W / 2) / 2)} ${r1(-ch / 2)}`;
    [0.33, 0.66].forEach((p) => {
      const half = (W / 2) * (1 - p) + culet * p;
      lines += `M${r1(-half)} ${r1(pd * p)}L${r1(half)} ${r1(pd * p)}`;
    });
    lines += `M${r1(-tw)} ${r1(-ch)}L${r1(-W / 2)} 0M${r1(tw)} ${r1(-ch)}L${r1(W / 2)} 0`;
  } else {
    lines += `M${r1(-tw)} ${r1(-ch)}L${r1(-W * 0.36)} 0M${r1(-tw)} ${r1(-ch)}L${r1(-W * 0.12)} 0M${r1(tw)} ${r1(-ch)}L${r1(W * 0.12)} 0M${r1(tw)} ${r1(-ch)}L${r1(W * 0.36)} 0`;
    lines += `M${r1(-W * 0.25)} 1.4L0 ${r1(pd)}M${r1(W * 0.25)} 1.4L0 ${r1(pd)}M0 1.4L0 ${r1(pd)}M${r1(-W * 0.44)} 1.4L0 ${r1(pd)}M${r1(W * 0.44)} 1.4L0 ${r1(pd)}`;
  }
  const lightCrown = `M${r1(-tw)} ${r1(-ch)}L${r1(0)} ${r1(-ch)}L${r1(-W * 0.12)} 0L${r1(-W / 2)} 0Z`;
  const shadePav = `M0 1.4L${r1(W / 2)} 1.4L${r1(culet)} ${r1(pd)}L0 ${r1(pd)}Z`;
  return (
    <g key={k} transform={`translate(${r1(x)} ${r1(g)})${rot ? ` rotate(${rot})` : ''}`}>
      <path d={body} fill={`url(#${c.ids.d})`} stroke={STONE_STROKE} strokeWidth={Math.max(0.5, W / 90)} strokeLinejoin="round" />
      <path d={lightCrown} fill="#FFFFFF" fillOpacity="0.8" />
      <path d={shadePav} fill="#8FA2B6" fillOpacity="0.22" />
      <path d={lines} fill="none" stroke={FACET_STROKE} strokeWidth={Math.max(0.4, W / 140)} />
      {W > 18 && <path d={sparklePath(W * 0.13)} transform={`translate(${r1(-W * 0.14)} ${r1(-ch * 0.55)})`} fill="#FFFFFF" />}
    </g>
  );
}

// ───────────────────────────── rings ─────────────────────────────

function ringTop(c: Ctx, spec: ArtSpec, shape: string, carat: number): ReactNode[] {
  const cy = 200;
  const head = spec.head ?? 'solitaire';
  const bandStyle = spec.band ?? 'plain';
  const t = bandStyle === 'bold' ? 26 : bandStyle === 'cathedral' ? 17 : spec.size === 'thin' ? 10 : 15;
  const x0 = 26;
  const x1 = 374;
  const bow = 12;
  const top = cy - t / 2;
  const bot = cy + t / 2;
  const yc = (x: number) => cy + bow * (1 - 2 * ((x - x0) / (x1 - x0))) ** 2;
  const out: ReactNode[] = [shadow(c, 200, 236, 150, 16)];
  const d = `M${x0} ${top + bow}Q200 ${top - bow} ${x1} ${top + bow}L${x1} ${bot + bow}Q200 ${bot - bow} ${x0} ${bot + bow}Z`;
  out.push(<path key="band" d={d} fill={`url(#${c.ids.sv})`} />, <path key="bandfade" d={d} fill={`url(#${c.ids.fade})`} />);
  out.push(
    <path key="hl" d={`M${x0 + 34} ${top + bow * 0.55 + 2}Q200 ${top - bow + 2} ${x1 - 34} ${top + bow * 0.55 + 2}`} stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />,
  );
  if (bandStyle === 'knife') {
    out.push(<path key="knife" d={`M${x0} ${cy + bow}Q200 ${cy - bow} ${x1} ${cy + bow}`} stroke={c.band[0]} strokeWidth="1.4" fill="none" />);
  }

  const w = head === 'five-stone' || head === 'cluster' ? clampN(stoneWidth(shape, carat, 58), 44, 70) : clampN(stoneWidth(shape, carat, 72), 52, 104);
  const h = w * (SHAPE_ASPECT[shape] ?? 1);
  const headHalf = head === 'three-stone' ? w * 1.25 : head === 'toi-et-moi' ? w * 0.95 : head === 'five-stone' ? w * 1.5 : w / 2 + (head.includes('halo') ? 10 : 2);

  if (bandStyle === 'pave') {
    const r = t * 0.34;
    for (const dir of [-1, 1]) {
      for (let dx = headHalf + 7; dx < 136; dx += 2 * r + 1.1) {
        const x = 200 + dir * dx;
        out.push(melee(c, x, yc(x), r, `pv${dir}${Math.round(dx)}`));
      }
    }
  }
  if (bandStyle === 'cathedral') {
    for (const dir of [-1, 1]) {
      out.push(
        <path
          key={`cat${dir}`}
          d={`M${r1(200 + dir * (headHalf + 42))} ${r1(yc(200 + dir * (headHalf + 42)))}Q${r1(200 + dir * (headHalf + 8))} ${cy - 2} ${r1(200 + dir * (w * 0.32))} ${cy - 1}`}
          stroke={`url(#${c.ids.mh})`}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />,
      );
    }
  }

  const prongs = spec.prongs ?? 4;
  switch (head) {
    case 'halo':
    case 'double-halo':
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w, prongs, halo: head === 'halo' ? 'halo' : 'double' }));
      break;
    case 'hidden-halo':
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w, prongs, halo: 'hidden' }));
      break;
    case 'bezel':
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w, bezel: true }));
      break;
    case 'east-west':
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w, prongs, rot: 90 }));
      break;
    case 'three-stone': {
      const side = spec.sides ?? 'pear';
      const sw = w * (side === 'baguette' ? 0.34 : 0.62);
      const sLen = sw * (SHAPE_ASPECT[side] ?? 1);
      const off = w / 2 + (side === 'round' ? sw / 2 : sLen / 2) + 3;
      const rot = side === 'round' ? 0 : 90;
      out.push(stone(c, { k: 'l', shape: side, x: 200 - off, y: cy, w: sw, rot: side === 'pear' ? 90 : rot, prongs: side === 'baguette' ? 4 : 3 }));
      out.push(stone(c, { k: 'r', shape: side, x: 200 + off, y: cy, w: sw, rot: side === 'pear' ? -90 : rot, prongs: side === 'baguette' ? 4 : 3 }));
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w, prongs }));
      break;
    }
    case 'toi-et-moi': {
      const second = spec.second ?? 'pear';
      out.push(stone(c, { k: 'b', shape: second, x: 200 + w * 0.42, y: cy + h * 0.16, w: w * 0.92, rot: 205, prongs: 3 }));
      out.push(stone(c, { k: 'a', shape, x: 200 - w * 0.42, y: cy - h * 0.16, w: w * 0.92, rot: -25, prongs: 4 }));
      break;
    }
    case 'cluster': {
      const pr = w * 0.62;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        out.push(stone(c, { k: `pt${i}`, shape: 'round', x: 200 + cos(a) * pr, y: cy + sin(a) * pr, w: w * 0.42, prongs: 0, sparkle: false }));
      }
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w: w * 0.85, prongs: 4 }));
      break;
    }
    case 'five-stone': {
      const sizes = [0.55, 0.78, 1, 0.78, 0.55];
      let x = 200 - (sizes.reduce((s, v) => s + v, 0) * w + 4 * 2) / 2;
      sizes.forEach((s, i) => {
        const sw = w * s;
        x += sw / 2;
        out.push(stone(c, { k: `f${i}`, shape: 'round', x, y: yc(x), w: sw, prongs: 4, sparkle: i === 2 }));
        x += sw / 2 + 2;
      });
      break;
    }
    default:
      out.push(stone(c, { k: 'c', shape, x: 200, y: cy, w, prongs }));
  }
  return out;
}

function ringProfile(c: Ctx, spec: ArtSpec, shape: string, carat: number): ReactNode[] {
  const cx = 200;
  const cy = 238;
  const R = 92;
  const head = spec.head ?? 'solitaire';
  const bandStyle = spec.band ?? 'plain';
  const t = bandStyle === 'bold' ? 22 : spec.size === 'thin' ? 9 : 13;
  const out: ReactNode[] = [shadow(c, 200, 346, 100, 9, 'sh', 0.14)];
  out.push(
    <circle key="inner" cx={cx} cy={cy + 3} r={R - t / 2 + 1} fill="none" stroke={c.band[3]} strokeOpacity="0.45" strokeWidth="2.4" />,
    <circle key="band" cx={cx} cy={cy} r={R} fill="none" stroke={`url(#${c.ids.mb})`} strokeWidth={t} />,
    <path key="hl" d={`M${cx - R + 2} ${cy + 30}A${R} ${R} 0 0 1 ${cx - 40} ${cy - R + 12}`} stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6" fill="none" />,
  );
  if (bandStyle === 'pave') {
    const r = t * 0.32;
    for (let a = -180; a <= 0; a += (((2 * r + 1.4) / R) * 180) / Math.PI) {
      if (Math.abs(a + 90) < 26) continue;
      const rad = (a * Math.PI) / 180;
      out.push(melee(c, cx + R * cos(rad), cy + R * sin(rad), r, `pv${Math.round(a * 10)}`));
    }
  }

  const W = clampN(stoneWidth(shape, carat, 64), 44, 88);
  const g = cy - R - (head === 'bezel' ? 20 : 34);
  const pd = W * 0.44;
  const headMetal = `url(#${c.ids.mh})`;

  // basket / gallery
  if (head !== 'bezel' && head !== 'cluster') {
    out.push(
      <path key="post" d={`M${r1(cx - W * 0.26)} ${r1(g + pd * 0.5)}L${cx - 6} ${cy - R + 2}M${r1(cx + W * 0.26)} ${r1(g + pd * 0.5)}L${cx + 6} ${cy - R + 2}`} stroke={headMetal} strokeWidth="3.2" strokeLinecap="round" fill="none" />,
    );
  }
  if (bandStyle === 'cathedral') {
    for (const dir of [-1, 1]) {
      out.push(
        <path key={`cat${dir}`} d={`M${cx + dir * 58} ${cy - R + 22}Q${cx + dir * 30} ${r1(g + pd * 0.5)} ${r1(cx + dir * W * 0.3)} ${r1(g + pd * 0.45)}`} stroke={headMetal} strokeWidth="4" fill="none" strokeLinecap="round" />,
      );
    }
  }

  const prongStroke = (x1: number, y1: number, x2: number, y2: number, k: string) => (
    <path key={k} d={`M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`} stroke={headMetal} strokeWidth={Math.max(2.2, W * 0.07)} strokeLinecap="round" />
  );

  if (head === 'three-stone') {
    const side = spec.sides ?? 'pear';
    const sw = W * 0.64;
    for (const dir of [-1, 1]) {
      const x = cx + dir * (W / 2 + sw / 2 + 2);
      out.push(profileStone(c, x, g + 7, sw, side, `side${dir}`));
      out.push(prongStroke(x + dir * sw * 0.36, g + 7 + sw * 0.32, x + dir * sw * 0.47, g + 7 - sw * 0.1, `sp${dir}`));
    }
  }
  if (head === 'toi-et-moi') {
    out.push(profileStone(c, cx - W * 0.42, g, W * 0.85, shape, 'ta', -8));
    out.push(profileStone(c, cx + W * 0.42, g + 2, W * 0.8, spec.second ?? 'pear', 'tb', 8));
    return out;
  }
  if (head === 'five-stone') {
    [-2, -1, 0, 1, 2].forEach((i) => {
      const s = [0.55, 0.78, 1, 0.78, 0.55][i + 2] * W * 0.7;
      out.push(profileStone(c, cx + i * W * 0.62, g + 14 + Math.abs(i) * 6, s, 'round', `fs${i}`));
    });
    return out;
  }
  if (head === 'cluster') {
    out.push(profileStone(c, cx - W * 0.55, g + 6, W * 0.42, 'round', 'cl1'));
    out.push(profileStone(c, cx + W * 0.55, g + 6, W * 0.42, 'round', 'cl2'));
  }

  out.push(profileStone(c, cx, g, W, shape, 'main'));

  if (head === 'bezel') {
    out.push(
      <path
        key="bezel"
        d={`M${r1(cx - W / 2 - 3)} ${r1(g - 3)}L${r1(cx + W / 2 + 3)} ${r1(g - 3)}L${r1(cx + W * 0.36)} ${r1(g + pd * 0.6)}L${r1(cx - W * 0.36)} ${r1(g + pd * 0.6)}Z`}
        fill={headMetal}
        stroke={c.head[4]}
        strokeWidth="0.5"
      />,
      <path key="bzpost" d={`M${r1(cx - W * 0.2)} ${r1(g + pd * 0.6)}L${cx - 8} ${cy - R + 2}L${cx + 8} ${cy - R + 2}L${r1(cx + W * 0.2)} ${r1(g + pd * 0.6)}Z`} fill={headMetal} />,
    );
  } else {
    out.push(
      prongStroke(cx - W * 0.36, g + pd * 0.72, cx - W * 0.47, g - W * 0.12, 'pl'),
      prongStroke(cx + W * 0.36, g + pd * 0.72, cx + W * 0.47, g - W * 0.12, 'pr'),
    );
    if ((spec.prongs ?? 4) >= 6) out.push(prongStroke(cx, g + pd * 0.85, cx, g - W * 0.14, 'pm'));
  }
  if (head === 'halo' || head === 'double-halo') {
    const mr = Math.max(2.4, W * 0.07);
    const span = W * 0.66;
    out.push(<rect key="hframe" x={r1(cx - span - mr)} y={r1(g - mr + 1)} width={r1(2 * span + 2 * mr)} height={r1(2 * mr + 1)} rx={r1(mr)} fill={headMetal} />);
    for (let x = cx - span; x <= cx + span + 0.1; x += 2 * mr + 0.6) out.push(melee(c, x, g + 1.5, mr, `hl${Math.round(x)}`));
  }
  if (head === 'hidden-halo') {
    const mr = Math.max(1.9, W * 0.055);
    for (let x = cx - W * 0.34; x <= cx + W * 0.34 + 0.1; x += 2 * mr + 0.5) out.push(melee(c, x, g + pd * 0.24, mr, `hh${Math.round(x)}`));
  }
  return out;
}

function signetTop(c: Ctx, shape: string): ReactNode[] {
  const out = ringTop(c, { kind: 'ring', band: 'bold', head: 'solitaire' }, shape, 0.01).slice(0, 3);
  out.push(
    <ellipse key="plate" cx="200" cy="200" rx="62" ry="50" fill={`url(#${c.ids.mb})`} stroke={c.band[4]} strokeWidth="0.6" />,
    <ellipse key="bevel" cx="200" cy="200" rx="54" ry="42" fill="none" stroke={c.band[0]} strokeOpacity="0.8" strokeWidth="1.2" />,
    stone(c, { k: 's', shape, x: 200, y: 200, w: 20, bezel: true }),
  );
  return out;
}

// ───────────────────────────── bands ─────────────────────────────

function bandPerspective(c: Ctx, spec: ArtSpec, shape: string): ReactNode[] {
  const cx = 200;
  const cy = 194;
  const rx = 130;
  const ry = 72;
  const thin = spec.size === 'thin';
  const t = thin ? 14 : spec.size === 'wide' ? 34 : 24;
  const stones = spec.stones ?? 'full';
  const sShape = spec.stoneShape ?? shape ?? 'round';
  const out: ReactNode[] = [shadow(c, cx, cy + ry + 26, rx, 14)];
  out.push(
    <ellipse key="rim" cx={cx} cy={cy + t * 0.45} rx={rx - t * 0.3} ry={ry - t * 0.2} fill="none" stroke={c.band[3]} strokeOpacity="0.5" strokeWidth="2.6" />,
    <ellipse key="band" cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={`url(#${c.ids.mb})`} strokeWidth={t} />,
    <path key="hl" d={`M${cx - rx + 8} ${cy + 18}A${rx} ${ry} 0 0 0 ${cx + 40} ${cy + ry - 2}`} stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.3" fill="none" />,
  );
  if (stones === 'none') return out;

  const baseR = t * (thin ? 0.4 : 0.36);
  const isRound = sShape === 'round';
  const unit = isRound ? baseR * 2 + 1.2 : baseR * 2 * (SHAPE_ASPECT[sShape] ?? 1) * 0.92 + 1.6;
  const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const n = Math.floor(per / unit);
  const items: { a: number; depth: number; node: ReactNode }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const sa = sin(a);
    if (stones === 'half' && sa < 0.05) continue;
    const x = cx + rx * cos(a);
    const y = cy + ry * sa;
    const depth = (sa + 1) / 2; // 0 back → 1 front
    const scale = 0.72 + 0.28 * depth;
    const opacity = 0.65 + 0.35 * depth;
    const tangent = (atan2(ry * cos(a), -rx * sa) * 180) / Math.PI;
    let node: ReactNode;
    if (sShape === 'baguette') {
      const bw = baseR * 1.7 * scale;
      const bh = baseR * 1.05 * scale * 2;
      node = (
        <g key={`b${i}`} opacity={r2(opacity)} transform={`translate(${r1(x)} ${r1(y)}) rotate(${r1(tangent)})`}>
          <rect x={r1(-bw / 2)} y={r1(-bh / 2)} width={r1(bw)} height={r1(bh)} fill={`url(#${c.ids.d})`} stroke={STONE_STROKE} strokeWidth="0.4" />
          <rect x={r1(-bw / 2 + bw * 0.22)} y={r1(-bh / 2 + bh * 0.22)} width={r1(bw * 0.56)} height={r1(bh * 0.56)} fill="#fff" fillOpacity="0.6" stroke={FACET_STROKE} strokeWidth="0.3" />
        </g>
      );
    } else if (isRound) {
      node = melee(c, x, y, baseR * scale, `r${i}`, opacity);
    } else {
      node = (
        <g key={`s${i}`} opacity={r2(opacity)}>
          {stone(c, { shape: sShape, x, y, w: baseR * 2 * scale * 0.95, rot: tangent + 90, prongs: 0, sparkle: false, detail: baseR * scale > 4 })}
        </g>
      );
    }
    items.push({ a, depth, node });
  }
  items.sort((p, q) => p.depth - q.depth).forEach((it) => out.push(it.node));
  return out;
}

function bandProfile(c: Ctx, spec: ArtSpec, shape: string): ReactNode[] {
  const cx = 200;
  const cy = 210;
  const R = 112;
  const t = spec.size === 'thin' ? 9 : spec.size === 'wide' ? 22 : 15;
  const out: ReactNode[] = [shadow(c, 200, cy + R + 22, 110, 10)];
  out.push(
    <circle key="inner" cx={cx} cy={cy + 3} r={R - t / 2 + 1} fill="none" stroke={c.band[3]} strokeOpacity="0.45" strokeWidth="2.6" />,
    <circle key="band" cx={cx} cy={cy} r={R} fill="none" stroke={`url(#${c.ids.mb})`} strokeWidth={t} />,
  );
  if ((spec.stones ?? 'full') === 'none') {
    out.push(<path key="hl" d={`M${cx - R + 3} ${cy + 30}A${R} ${R} 0 0 1 ${cx - 30} ${cy - R + 6}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="2" fill="none" />);
    return out;
  }
  const sShape = spec.stoneShape ?? shape ?? 'round';
  const r = t * 0.36;
  const unit = sShape === 'round' ? 2 * r + 1.2 : 2 * r * (SHAPE_ASPECT[sShape] ?? 1) * 0.9 + 1.6;
  const from = spec.stones === 'half' ? -165 : -180;
  const to = spec.stones === 'half' ? -15 : 180;
  for (let a = from; a < to; a += ((unit / R) * 180) / Math.PI) {
    const rad = (a * Math.PI) / 180;
    const x = cx + R * cos(rad);
    const y = cy + R * sin(rad);
    if (sShape === 'round') out.push(melee(c, x, y, r, `p${Math.round(a * 10)}`));
    else if (sShape === 'baguette')
      out.push(
        <rect key={`p${Math.round(a * 10)}`} x={r1(x - r * 0.85)} y={r1(y - r * 1.05)} width={r1(r * 1.7)} height={r1(r * 2.1)} transform={`rotate(${r1(a + 90)} ${r1(x)} ${r1(y)})`} fill={`url(#${c.ids.d})`} stroke={STONE_STROKE} strokeWidth="0.4" />,
      );
    else out.push(stone(c, { k: `p${Math.round(a * 10)}`, shape: sShape, x, y, w: r * 1.9, rot: a, prongs: 0, sparkle: false, detail: r > 4 }));
  }
  return out;
}

// ───────────────────────────── earrings ─────────────────────────────

function studs(c: Ctx, spec: ArtSpec, shape: string, carat: number, single: boolean): ReactNode[] {
  const each = Math.max(0.1, carat / 2);
  const w = single ? clampN(stoneWidth(shape, each, 190), 120, 180) : clampN(stoneWidth(shape, each, 112), 66, 108);
  const h = w * (SHAPE_ASPECT[shape] ?? 1);
  const halo = spec.head === 'halo' ? 'halo' : spec.head === 'double-halo' ? 'double' : 'none';
  const bezel = spec.head === 'bezel';
  const prongs = spec.prongs ?? 4;
  if (single) {
    return [shadow(c, 206, 214 + h / 2, w * 0.8, 10), stone(c, { k: 's', shape, x: 200, y: 196, w, prongs, halo, bezel, rot: 6 })];
  }
  const gap = Math.max(w, h) / 2 + 26;
  return [
    shadow(c, 200 - gap + 4, 212 + h / 2, w * 0.6, 8, 'sh1'),
    shadow(c, 200 + gap + 4, 212 + h / 2, w * 0.6, 8, 'sh2'),
    stone(c, { k: 'l', shape, x: 200 - gap, y: 196, w, prongs, halo, bezel }),
    stone(c, { k: 'r', shape, x: 200 + gap, y: 196, w, prongs, halo, bezel }),
  ];
}

function hoop(c: Ctx, spec: ArtSpec, cx: number, cy: number, rx: number, ry: number, t: number, k: string, tilt = 0): ReactNode {
  const gapDeg = 22;
  const start = -90 + gapDeg;
  const end = 270 - gapDeg;
  const p = (deg: number): [number, number] => [cx + rx * cos((deg * Math.PI) / 180), cy + ry * sin((deg * Math.PI) / 180)];
  const [sx, sy] = p(start);
  const [ex, ey] = p(end);
  const parts: ReactNode[] = [
    <path key="h" d={`M${r1(sx)} ${r1(sy)}A${rx} ${ry} 0 1 1 ${r1(ex)} ${r1(ey)}`} fill="none" stroke={`url(#${c.ids.mb})`} strokeWidth={t} strokeLinecap="round" />,
    <path key="post" d={`M${r1(ex)} ${r1(ey)}Q${cx} ${r1(cy - ry - t * 0.9)} ${r1(sx)} ${r1(sy)}`} fill="none" stroke={c.band[3]} strokeWidth={Math.max(1.4, t * 0.22)} />,
  ];
  if ((spec.stones ?? 'full') !== 'none') {
    const r = t * 0.38;
    const stepDeg = ((2 * r + 1) / ((rx + ry) / 2)) * (180 / Math.PI);
    for (let a = start + 10; a <= end - 10; a += stepDeg) {
      const [x, y] = p(a);
      parts.push(melee(c, x, y, r, `m${Math.round(a * 10)}`));
    }
  } else {
    parts.push(<path key="hl" d={`M${r1(p(160)[0])} ${r1(p(160)[1])}A${rx} ${ry} 0 0 1 ${r1(p(215)[0])} ${r1(p(215)[1])}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />);
  }
  return (
    <g key={k} transform={tilt ? `rotate(${tilt} ${cx} ${cy})` : undefined}>
      {parts}
    </g>
  );
}

function hoops(c: Ctx, spec: ArtSpec, single: boolean): ReactNode[] {
  const size = spec.size ?? 'medium';
  const [rx, ry, t] = size === 'huggie' ? [44, 50, 13] : size === 'large' ? [76, 100, 9] : [60, 76, 10];
  if (single) {
    return [shadow(c, 210, 318, rx * 1.2, 10), hoop(c, spec, 200, 196, rx * 1.55, ry * 1.55, t * 1.45, 'one', -10)];
  }
  const off = rx + 16;
  return [
    shadow(c, 200 - off, 212 + ry, rx, 9, 'a'),
    shadow(c, 200 + off, 212 + ry, rx, 9, 'b'),
    hoop(c, spec, 200 - off, 200, rx, ry, t, 'l', -6),
    hoop(c, spec, 200 + off, 200, rx, ry, t, 'r', 6),
  ];
}

function drops(c: Ctx, spec: ArtSpec, shape: string, carat: number, single: boolean): ReactNode[] {
  const s = single ? 1.6 : 1;
  const dropShape = shape || 'pear';
  const w = clampN(stoneWidth(dropShape, Math.max(0.15, carat / 2), 82), 56, 84) * s;
  const h = w * (SHAPE_ASPECT[dropShape] ?? 1);
  const one = (x: number, k: string) => {
    const topY = single ? 70 : 92;
    const studW = 26 * s;
    const dropY = topY + studW / 2 + 16 * s + h / 2 + (spec.head === 'halo' ? 8 : 0);
    return (
      <g key={k}>
        {shadow(c, x + 4, dropY + h / 2 + 18, w * 0.55, 7, `${k}sh`)}
        <path d={`M${x} ${r1(topY + studW / 2)}L${x} ${r1(dropY - h / 2 - 2)}`} stroke={c.head[3]} strokeWidth={1.8 * s} />
        {stone(c, { shape: 'round', x, y: topY, w: studW, prongs: 4, sparkle: false })}
        {stone(c, { shape: dropShape, x, y: dropY, w, prongs: dropShape === 'pear' ? 5 : 4, halo: spec.head === 'halo' ? 'halo' : 'none' })}
      </g>
    );
  };
  if (single) return [one(200, 's')];
  return [one(126, 'l'), one(274, 'r')];
}

// ───────────────────────────── necklaces & pendants ─────────────────────────────

function chain(c: Ctx, d: string, k: string) {
  return (
    <g key={k}>
      <path d={d} fill="none" stroke={c.band[3]} strokeWidth="2.2" strokeDasharray="3.2 1.6" strokeLinecap="round" />
      <path d={d} fill="none" stroke={c.band[0]} strokeWidth="0.7" strokeOpacity="0.9" />
    </g>
  );
}

function pendant(c: Ctx, spec: ArtSpec, shape: string, carat: number, close: boolean): ReactNode[] {
  const w = clampN(stoneWidth(shape, carat, 74), 50, 96);
  const h = w * (SHAPE_ASPECT[shape] ?? 1);
  const head = spec.head ?? 'solitaire';
  const halo = head === 'halo' ? 'halo' : head === 'double-halo' ? 'double' : 'none';
  const bailY = 196;
  const extra = halo !== 'none' ? 10 : head === 'bezel' ? 4 : 0;
  const sy = bailY + 9 + h / 2 + extra;
  const inner: ReactNode[] = [
    chain(c, 'M58 -6Q118 142 200 190', 'cl'),
    chain(c, 'M342 -6Q282 142 200 190', 'cr'),
    <rect key="bail" x="195" y={bailY - 9} width="10" height="18" rx="5" fill="none" stroke={`url(#${c.ids.mh})`} strokeWidth="3" />,
    shadow(c, 206, sy + h / 2 + 20, w * 0.7, 8),
  ];
  if (head === 'three-stone') {
    [-1, 1].forEach((d) => inner.push(stone(c, { k: `ts${d}`, shape: 'round', x: 200 + d * (w * 0.32), y: sy - h * 0.62 - 4, w: w * 0.4, prongs: 4, sparkle: false })));
  }
  inner.push(stone(c, { k: 'p', shape, x: 200, y: sy, w, prongs: spec.prongs ?? 4, halo, bezel: head === 'bezel' }));
  if (!close) return inner;
  return [
    <g key="zoom" transform={`translate(200 200) scale(1.75) translate(-200 ${r1(-sy)})`}>
      {inner}
    </g>,
  ];
}

function sampleCurve(fn: (t: number) => [number, number], n = 200) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) pts.push(fn(i / n));
  return pts;
}

function alongCurve(pts: [number, number][], spacing: number) {
  const out: { x: number; y: number; t: number; ang: number }[] = [];
  let acc = 0;
  let next = spacing / 2;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    const seg = Math.hypot(x2 - x1, y2 - y1);
    while (acc + seg >= next) {
      const f = (next - acc) / seg;
      out.push({ x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, t: i / (pts.length - 1), ang: (atan2(y2 - y1, x2 - x1) * 180) / Math.PI });
      next += spacing;
    }
    acc += seg;
  }
  return out;
}

function linkStone(c: Ctx, sShape: string, x: number, y: number, size: number, ang: number, k: string, prongs = true) {
  const elongated = (SHAPE_ASPECT[sShape] ?? 1) > 1.05;
  const rot = elongated ? ang : 0;
  const w = elongated ? size / (SHAPE_ASPECT[sShape] ?? 1) : size;
  return (
    <g key={k}>
      <circle cx={r1(x)} cy={r1(y)} r={r1(size * 0.62)} fill={`url(#${c.ids.mh})`} opacity="0.9" />
      {stone(c, { shape: sShape, x, y, w: elongated ? size * 0.95 : w * 0.92, rot: elongated ? rot + 90 : 0, prongs: prongs ? 4 : 0, sparkle: size > 30, detail: size > 30 })}
    </g>
  );
}

function tennisNecklace(c: Ctx, spec: ArtSpec, shape: string, close: boolean): ReactNode[] {
  const sShape = spec.stoneShape ?? shape ?? 'round';
  if (close) return straightLine(c, sShape);
  const pts = sampleCurve((t) => {
    const a = t * Math.PI;
    return [200 - 152 * cos(a), -10 + 268 * sin(a)];
  });
  const base = 11;
  const out: ReactNode[] = [shadow(c, 200, 300, 120, 12)];
  alongCurve(pts, base * 2 + 2).forEach((p, i) => {
    const g = spec.graduated ? 0.62 + 0.38 * sin(p.t * Math.PI) : 0.86;
    out.push(linkStone(c, sShape, p.x, p.y, base * 2 * g, p.ang, `n${i}`, false));
  });
  return out;
}

function stationNecklace(c: Ctx, spec: ArtSpec, shape: string, close: boolean): ReactNode[] {
  const sShape = spec.stoneShape ?? shape ?? 'round';
  const curve = (t: number): [number, number] => {
    const a = t * Math.PI;
    return [200 - 150 * cos(a), -10 + 250 * sin(a)];
  };
  const out: ReactNode[] = [];
  const d = `M${sampleCurve(curve, 60).map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}`;
  out.push(chain(c, d, 'ch'));
  const stations = [0.3, 0.4, 0.5, 0.6, 0.7];
  stations.forEach((t, i) => {
    const [x, y] = curve(t);
    out.push(stone(c, { k: `st${i}`, shape: sShape, x, y, w: i === 2 ? 22 : 17, bezel: true, sparkle: i === 2 }));
  });
  if (!close) return out;
  const [, cyy] = curve(0.5);
  return [
    <g key="zoom" transform={`translate(200 200) scale(2.2) translate(-200 ${r1(-cyy)})`}>
      {out}
    </g>,
  ];
}

function straightLine(c: Ctx, sShape: string): ReactNode[] {
  const out: ReactNode[] = [shadow(c, 200, 262, 170, 12)];
  const n = 6;
  const size = 50;
  for (let i = 0; i < n; i++) {
    const x = 200 + (i - (n - 1) / 2) * (size + 8);
    const y = 200 + ((i - (n - 1) / 2) / n) ** 2 * 60;
    out.push(
      <g key={`cl${i}`}>
        <rect x={r1(x - size * 0.52)} y={r1(y - size * 0.18)} width={r1(size * 1.04 + 8)} height={r1(size * 0.36)} rx="4" fill={`url(#${c.ids.mh})`} opacity="0.95" />
        {linkStone(c, sShape, x, y, size, 0, `ls${i}`)}
      </g>,
    );
  }
  return out;
}

function tennisBracelet(c: Ctx, spec: ArtSpec, shape: string, close: boolean): ReactNode[] {
  const sShape = spec.stoneShape ?? shape ?? 'round';
  if (close) return straightLine(c, sShape);
  const cx = 200;
  const cy = 196;
  const rx = 150;
  const ry = 76;
  const base = 12;
  const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const n = Math.floor(per / (base * 2 * 0.98));
  const items: { depth: number; node: ReactNode }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const sa = sin(a);
    const depth = (sa + 1) / 2;
    const x = cx + rx * cos(a);
    const y = cy + ry * sa;
    const tangent = (atan2(ry * cos(a), -rx * sa) * 180) / Math.PI;
    const s = base * 2 * (0.7 + 0.3 * depth);
    items.push({
      depth,
      node: (
        <g key={`b${i}`} opacity={r2(0.6 + 0.4 * depth)}>
          {linkStone(c, sShape, x, y, s, tangent, `bs${i}`, false)}
        </g>
      ),
    });
  }
  return [shadow(c, cx, cy + ry + 22, rx, 14), ...items.sort((p, q) => p.depth - q.depth).map((i) => i.node)];
}

function bangle(c: Ctx, spec: ArtSpec, shape: string, close: boolean): ReactNode[] {
  if (close) return bandProfile(c, { ...spec, stones: spec.stones ?? 'half', size: 'wide' }, spec.stoneShape ?? 'round');
  const cx = 200;
  const cy = 196;
  const rx = 146;
  const ry = 72;
  const t = 15;
  const out: ReactNode[] = [
    shadow(c, cx, cy + ry + 22, rx, 14),
    <ellipse key="rim" cx={cx} cy={cy + 6} rx={rx - 6} ry={ry - 5} fill="none" stroke={c.band[3]} strokeOpacity="0.5" strokeWidth="3" />,
    <ellipse key="b" cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={`url(#${c.ids.mb})`} strokeWidth={t} />,
  ];
  if ((spec.stones ?? 'half') !== 'none') {
    const r = t * 0.34;
    for (let a = 18; a <= 162; a += 2.7) {
      const rad = (a * Math.PI) / 180;
      out.push(melee(c, cx + rx * cos(rad), cy + ry * sin(rad), r * (0.85 + 0.15 * sin(rad)), `bg${a}`));
    }
  }
  if (spec.head === 'bezel') {
    out.push(stone(c, { k: 'bz', shape, x: cx, y: cy + ry, w: 26, bezel: true }));
  }
  return out;
}

// ───────────────────────────── main component ─────────────────────────────

export function JewelryArt({ spec, shape = 'round', metal = 'yellow', carat = 1, view = 0, className, title }: JewelryArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ids: Ids = { mb: `${uid}mb`, mh: `${uid}mh`, sv: `${uid}sv`, d: `${uid}d`, dr: `${uid}dr`, blur: `${uid}bl`, fade: `${uid}fd` };
  const { band, head } = metalPalettes(metal);
  const c: Ctx = { ids, band, head, mc: paint(ids.dr, STONE_STROKE), pc: paint(ids.mh, head[4]) };
  const alt = view > 0;
  const kind = spec?.kind ?? 'ring';

  let body: ReactNode[];
  switch (kind) {
    case 'ring':
      body = alt ? ringProfile(c, spec, shape, carat) : ringTop(c, spec, shape, carat);
      break;
    case 'signet':
      body = alt ? ringProfile(c, { kind: 'ring', band: 'bold', head: 'bezel' }, shape, 0.15) : signetTop(c, shape);
      break;
    case 'band':
      body = alt ? bandProfile(c, spec, shape) : bandPerspective(c, spec, shape);
      break;
    case 'studs':
      body = studs(c, spec, shape, carat, alt);
      break;
    case 'hoops':
      body = hoops(c, spec, alt);
      break;
    case 'drops':
      body = drops(c, spec, shape, carat, alt);
      break;
    case 'pendant':
      body = pendant(c, spec, shape, carat, alt);
      break;
    case 'tennis-necklace':
      body = tennisNecklace(c, spec, shape, alt);
      break;
    case 'station-necklace':
      body = stationNecklace(c, spec, shape, alt);
      break;
    case 'tennis-bracelet':
      body = tennisBracelet(c, spec, shape, alt);
      break;
    case 'bangle':
      body = bangle(c, spec, shape, alt);
      break;
    default:
      body = ringTop(c, spec, shape, carat);
  }

  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={title ?? 'Jewelry illustration'} preserveAspectRatio="xMidYMid meet">
      {title && <title>{title}</title>}
      <Defs {...c} />
      {body}
    </svg>
  );
}

/** A single loose diamond, face-up with a soft shadow — used by the diamond configurator. */
export function LooseDiamond({ shape = 'round', className, title, shadow: withShadow = true }: { shape?: string; className?: string; title?: string; shadow?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ids: Ids = { mb: `${uid}mb`, mh: `${uid}mh`, sv: `${uid}sv`, d: `${uid}d`, dr: `${uid}dr`, blur: `${uid}bl`, fade: `${uid}fd` };
  const { band, head } = metalPalettes('white');
  const c: Ctx = { ids, band, head, mc: paint(ids.dr, STONE_STROKE), pc: paint(ids.mh, head[4]) };
  const aspect = SHAPE_ASPECT[shape] ?? 1;
  const w = 210 / Math.max(1, aspect * 0.95);
  const h = w * aspect;
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={title ?? `${shape} diamond`}>
      <Defs {...c} />
      {withShadow && shadow(c, 205, 200 + h / 2 + 22, w * 0.45, 10)}
      {stone(c, { shape, x: 200, y: 196, w, prongs: 0 })}
    </svg>
  );
}
