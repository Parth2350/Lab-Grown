/**
 * Diamond geometry for the procedural jewelry illustrations.
 * Every shape is produced as a polygon centred on (0,0), starting at top-centre and
 * running clockwise (screen coordinates, y down) so facets can be derived uniformly.
 */

export type Pt = [number, number];

/** height / width when viewed face-up (length runs vertically) */
export const SHAPE_ASPECT: Record<string, number> = {
  round: 1,
  oval: 1.38,
  princess: 1,
  cushion: 1.06,
  emerald: 1.42,
  pear: 1.52,
  marquise: 2,
  radiant: 1.24,
  asscher: 1,
  heart: 0.94,
  baguette: 2.4,
};

export const STEP_CUTS = new Set(['emerald', 'asscher', 'baguette']);
export const CORNERED = new Set(['princess', 'emerald', 'asscher', 'radiant', 'baguette']);

export const r1 = (n: number) => Math.round(n * 10) / 10;

// Deterministic transcendental helpers (identical output on server and in the browser)
const s6 = (n: number) => Math.round(n * 1e6) / 1e6;
const sinS = (x: number) => s6(Math.sin(x));
const cosS = (x: number) => s6(Math.cos(x));
const asinS = (x: number) => s6(Math.asin(x));
const hyp = (x: number, y: number) => s6(Math.sqrt(x * x + y * y));

function ellipse(a: number, b: number, n = 72): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
    pts.push([a * cosS(t), b * sinS(t)]);
  }
  return pts;
}

function superellipse(a: number, b: number, p: number, n = 72): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const c = cosS(t);
    const s = sinS(t);
    pts.push([a * Math.sign(c) * Math.abs(c) ** (2 / p), b * Math.sign(s) * Math.abs(s) ** (2 / p)]);
  }
  return pts;
}

function cutRect(a: number, b: number, c: number): Pt[] {
  return [
    [0, -b],
    [a - c, -b],
    [a, -b + c],
    [a, b - c],
    [a - c, b],
    [-a + c, b],
    [-a, b - c],
    [-a, -b + c],
    [-a + c, -b],
  ];
}

function quad(p0: Pt, p1: Pt, p2: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
  }
  return out;
}

let heartCache: Pt[] | null = null;
function heartUnit(): Pt[] {
  if (heartCache) return heartCache;
  const raw: Pt[] = [];
  const n = 96;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * sinS(t) ** 3;
    const y = -(13 * cosS(t) - 5 * cosS(2 * t) - 2 * cosS(3 * t) - cosS(4 * t));
    raw.push([x, y]);
  }
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  heartCache = raw.map(([x, y]) => [(x - cx) / (maxX - minX), (y - cy) / (maxY - minY)]);
  return heartCache;
}

/** Face-up outline of a diamond shape with bounding box w × h */
export function shapePolygon(shape: string, w: number, h: number): Pt[] {
  const a = w / 2;
  const b = h / 2;
  switch (shape) {
    case 'oval':
    case 'round':
      return ellipse(a, b);
    case 'cushion':
      return superellipse(a, b, 3.4);
    case 'princess':
      return [[0, -b], [a, -b], [a, b], [-a, b], [-a, -b]];
    case 'emerald':
      return cutRect(a, b, w * 0.2);
    case 'asscher':
      return cutRect(a, b, w * 0.27);
    case 'radiant':
      return cutRect(a, b, w * 0.15);
    case 'baguette':
      return [[0, -b], [a, -b], [a, b], [-a, b], [-a, -b]];
    case 'marquise': {
      const R = (a * a + b * b) / (2 * a);
      const d = R - a;
      const phi0 = asinS(b / R);
      const pts: Pt[] = [];
      const n = 36;
      for (let i = 0; i < n; i++) {
        const phi = -phi0 + (i / n) * 2 * phi0;
        pts.push([-d + R * cosS(phi), R * sinS(phi)]);
      }
      for (let i = 0; i < n; i++) {
        const phi = -phi0 + (i / n) * 2 * phi0;
        pts.push([d - R * cosS(phi), -R * sinS(phi)]);
      }
      return pts;
    }
    case 'pear': {
      const cy = b - a; // centre of the rounded end
      const tip: Pt = [0, -b];
      const right: Pt = [a, cy];
      const left: Pt = [-a, cy];
      const pts: Pt[] = [];
      pts.push(...quad(tip, [a * 0.98, -b * 0.28], right, 26));
      for (let i = 0; i < 36; i++) {
        const t = (i / 36) * Math.PI;
        pts.push([a * cosS(t), cy + a * sinS(t)]);
      }
      pts.push(...quad(left, [-a * 0.98, -b * 0.28], tip, 26));
      return pts;
    }
    case 'heart':
      return heartUnit().map(([x, y]) => [x * w, y * h]);
    default:
      return ellipse(a, b);
  }
}

export function scalePts(pts: Pt[], s: number, sy = s): Pt[] {
  return pts.map(([x, y]) => [x * s, y * sy]);
}

export function perimeter(pts: Pt[]) {
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    p += hyp(x2 - x1, y2 - y1);
  }
  return p;
}

/** Evenly re-sample a closed polygon into `count` points along its perimeter (starting at pts[0]) */
export function resample(pts: Pt[], count: number, offset = 0): Pt[] {
  const total = perimeter(pts);
  const seg: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    seg.push(hyp(x2 - x1, y2 - y1));
  }
  const out: Pt[] = [];
  for (let k = 0; k < count; k++) {
    let target = (((k + offset) / count) * total) % total;
    let i = 0;
    while (target > seg[i] && i < seg.length - 1) {
      target -= seg[i];
      i++;
    }
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const t = seg[i] ? target / seg[i] : 0;
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return out;
}

export function toPath(pts: Pt[], dx = 0, dy = 0, close = true) {
  if (!pts.length) return '';
  let d = `M${r1(pts[0][0] + dx)} ${r1(pts[0][1] + dy)}`;
  for (let i = 1; i < pts.length; i++) d += `L${r1(pts[i][0] + dx)} ${r1(pts[i][1] + dy)}`;
  return close ? `${d}Z` : d;
}

export type Facets = {
  outline: string;
  table: string;
  lines: string;
  light: string; // facets filled bright
  shade: string; // facets filled slightly darker
};

/** Facet paths for a face-up stone of bounding box w × h, centred on (0,0) */
export function facetPaths(shape: string, w: number, h: number): Facets {
  const poly = shapePolygon(shape, w, h);
  const outline = toPath(poly);

  if (STEP_CUTS.has(shape)) {
    const tableScale = shape === 'asscher' ? 0.46 : 0.55;
    const rings = [1, 0.82, 0.66, tableScale].map((s) => scalePts(poly, s));
    const corners = poly.slice(1); // skip the top-centre point
    let lines = rings.slice(1).map((r) => toPath(r)).join('');
    corners.forEach((_, idx) => {
      const i = idx + 1;
      lines += `M${r1(rings[0][i][0])} ${r1(rings[0][i][1])}L${r1(rings[3][i][0])} ${r1(rings[3][i][1])}`;
    });
    if (shape === 'asscher') {
      // windmill diagonals
      const c = rings[2];
      lines += `M${r1(c[2][0])} ${r1(c[2][1])}L${r1(c[6][0])} ${r1(c[6][1])}M${r1(c[4][0])} ${r1(c[4][1])}L${r1(c[8][0])} ${r1(c[8][1])}`;
    }
    // alternate ring bands for depth
    const band = (outer: Pt[], inner: Pt[]) => `${toPath(outer)}${toPath([...inner].reverse())}`;
    return {
      outline,
      table: toPath(rings[3]),
      lines,
      light: band(rings[1], rings[2]),
      shade: band(rings[0], rings[1]),
    };
  }

  const O = resample(poly, 16);
  const T = resample(scalePts(poly, 0.52), 8);
  const K = resample(scalePts(poly, 0.8), 8, 0.5);
  let lines = toPath(T);
  let light = '';
  let shade = '';
  for (let i = 0; i < 8; i++) {
    const ti = T[i];
    const tn = T[(i + 1) % 8];
    const k = K[i];
    const kp = K[(i + 7) % 8];
    const o0 = O[(2 * i) % 16];
    const o1 = O[(2 * i + 1) % 16];
    const o2 = O[(2 * i + 2) % 16];
    lines += `M${r1(ti[0])} ${r1(ti[1])}L${r1(k[0])} ${r1(k[1])}L${r1(tn[0])} ${r1(tn[1])}`;
    lines += `M${r1(o0[0])} ${r1(o0[1])}L${r1(k[0])} ${r1(k[1])}L${r1(o2[0])} ${r1(o2[1])}M${r1(k[0])} ${r1(k[1])}L${r1(o1[0])} ${r1(o1[1])}`;
    const kite = toPath([ti, k, o0, kp]);
    const star = toPath([ti, tn, k]);
    const g1 = toPath([k, o0, o1]);
    const g2 = toPath([k, o1, o2]);
    if (i % 2 === 0) {
      light += kite + g2;
      shade += g1;
    } else {
      shade += kite;
      light += star + g1;
    }
  }
  return { outline, table: toPath(T), lines, light, shade };
}

/** Points on the outline at which prongs sit, by prong count and shape */
export function prongPoints(shape: string, w: number, h: number, count: number): Pt[] {
  const poly = shapePolygon(shape, w, h);
  if (CORNERED.has(shape) && count <= 4) {
    const a = w / 2, b = h / 2;
    const c = shape === 'princess' || shape === 'baguette' ? 0 : shape === 'asscher' ? w * 0.27 : shape === 'emerald' ? w * 0.2 : w * 0.15;
    const k = c * 0.5;
    return [[a - k, -b + k], [a - k, b - k], [-a + k, b - k], [-a + k, -b + k]];
  }
  if (shape === 'pear') return [0, 0.26, 0.42, 0.58, 0.74].map((t) => resample(poly, 100)[Math.round(t * 100) % 100]);
  if (shape === 'marquise') return [0, 0.5, 0.18, 0.32, 0.68, 0.82].slice(0, Math.max(2, count)).map((t) => resample(poly, 100)[Math.round(t * 100) % 100]);
  if (shape === 'heart') return [0.5, 0.2, 0.8].map((t) => resample(poly, 100)[Math.round(t * 100) % 100]);
  const n = count || 4;
  return resample(poly, n, 0.5);
}

/** Stone face width for a carat weight (face-up spread grows ~ with the cube root of weight) */
export function stoneWidth(shape: string, carat: number, base = 46) {
  const aspect = SHAPE_ASPECT[shape] ?? 1;
  const ct = Math.max(0.1, Math.min(carat || 1, 6));
  return Math.round(((base * Math.cbrt(ct)) / Math.sqrt(aspect)) * 1000) / 1000;
}

export function sparklePath(s: number) {
  const k = s * 0.2;
  return `M0 ${-s}L${k} ${-k}L${s} 0L${k} ${k}L0 ${s}L${-k} ${k}L${-s} 0L${-k} ${-k}Z`;
}
