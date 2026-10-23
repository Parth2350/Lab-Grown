// Turns a BrillianceCarat partner download (scripts/catalog/download.mjs) into the compact catalogue
// the store imports: data/catalog/brilliancecarat.json.gz
//
//   node scripts/catalog/build.mjs <download-dir>
//
// Prices are converted from USD with the partner's published INR rate and stored in paise.
// Photos and videos stay on the partner's media server (paths are stored without the host).
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node scripts/catalog/build.mjs <download-dir>');
  process.exit(1);
}
const MEDIA_HOST = 'https://webassests.s3.us-east-1.amazonaws.com/';
const RATES = JSON.parse(readFileSync(path.join(SRC, 'rates.json'), 'utf8'));
const INR_PER_USD = Number(process.env.INR_PER_USD ?? RATES.INR);
const CAD_PER_USD = Number(process.env.CAD_PER_USD ?? RATES.CAD);
if (!CAD_PER_USD) throw new Error('No CAD rate in rates.json — download the catalogue again (or set CAD_PER_USD)');

const METALS = {
  'Yellow Gold': 'yellow',
  'White Gold': 'white',
  'Rose Gold': 'rose',
  'Rose & White Gold': 'rose-white',
  'Yellow & White Gold': 'yellow-white',
  'Black Rodium Gold': 'black',
};
const METAL_ORDER = ['yellow', 'white', 'rose', 'yellow-white', 'rose-white', 'black'];
const PURITY_ORDER = ['9K', '10K', '14K', '18K'];
const TYPES = {
  'ENGAGEMENT RINGS': 'engagement-rings',
  'WEDDING BANDS': 'wedding-bands',
  RING: 'rings',
  EARRINGS: 'earrings',
  PENDANT: 'pendants',
  NECKLACE: 'necklaces',
  BRACELET: 'bracelets',
};

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const prettyShape = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\b(\w)/g, (c) => c.toUpperCase())
    .replace(/\bSq\b(?!\.)/, 'Sq.');
const paise = (usd) => Math.round(usd * INR_PER_USD) * 100;
const media = (u) => (u && u.startsWith(MEDIA_HOST) ? u.slice(MEDIA_HOST.length) : u || null);
const num = (x) => (x == null || x === '' || Number.isNaN(Number(x)) ? null : Number(x));
const sizeSort = (a, b) => Number(a) - Number(b);

const order = JSON.parse(readFileSync(path.join(SRC, 'list.json'), 'utf8')).map((x) => x.slug);
const rank = new Map(order.map((s, i) => [s, i]));
const files = readdirSync(path.join(SRC, 'raw')).filter((f) => f.endsWith('.json.gz'));

const problems = [];
const shapeLabels = {};
const products = [];
for (const f of files) {
  const d = JSON.parse(gunzipSync(readFileSync(path.join(SRC, 'raw', f))));
  const where = d.slug;
  const category = TYPES[d.productType];
  if (!category) problems.push(`${where}: unknown product type ${d.productType}`);

  const axes = d.axes ?? [];
  const optionAxes = [];
  if (axes.includes('shape')) optionAxes.push('shape');
  if (axes.includes('centerCarat') || axes.includes('totalCarat')) optionAxes.push('carat');
  if (axes.includes('length')) optionAxes.push('length');
  const caratKind = axes.includes('centerCarat') ? 'center' : axes.includes('totalCarat') ? 'total' : null;

  const stones = [];
  const stoneIdx = new Map();
  const sizes = [];
  const sizeIdx = new Map();
  const mediaGroups = {};
  const seen = new Set();
  const ringSizes = new Set();
  const settings = new Map();
  const v = [];
  for (const x of d.variants ?? []) {
    const metal = METALS[x.metalType];
    if (!metal) {
      problems.push(`${where}: unknown metal ${x.metalType} (${x.itemCode}) — skipped`);
      continue;
    }
    if (!PURITY_ORDER.includes(x.metalStamp)) {
      problems.push(`${where}: unknown purity ${x.metalStamp} (${x.itemCode}) — skipped`);
      continue;
    }
    if (!(x.price > 0)) {
      problems.push(`${where}: no price for ${x.itemCode} — skipped`);
      continue;
    }
    const shape = x.shape ? slugify(x.shape) : null;
    if (x.shape && !shapeLabels[shape]) shapeLabels[shape] = prettyShape(x.shape);
    const length = x.length ? String(x.length) : null;
    const center = num(x.centerCarat);
    const total = num(x.totalCarat);
    // the same choice listed twice: keep the first
    const choice = [metal, x.metalStamp, optionAxes.includes('shape') ? shape : '', optionAxes.includes('carat') ? (caratKind === 'center' ? center : total) : '', optionAxes.includes('length') ? length : ''].join('|');
    if (seen.has(choice)) {
      problems.push(`${where}: duplicate choice ${choice} (${x.itemCode}) — skipped`);
      continue;
    }
    seen.add(choice);

    const st = (x.stones ?? []).map((s) => ({
      role: s.role === 'center' ? 'center' : 'side',
      shape: s.shape ? prettyShape(s.shape) : null,
      type: /color/i.test(s.stoneType ?? '') || s.isGem ? 'Colour stone' : 'Diamond',
      color: [s.colorFrom, s.colorTo].filter(Boolean).join('–') || null,
      clarity: [s.clarityFrom, s.clarityTo].filter(Boolean).join('–') || null,
      size: s.sizeFrom || null,
      pieces: num(s.pieces),
      carat: num(s.carat),
    }));
    const stKey = JSON.stringify(st);
    if (!stoneIdx.has(stKey)) stoneIdx.set(stKey, stones.push(st) - 1);

    let sz = -1;
    const rs = (x.ringSizes ?? []).filter((r) => r && r.Size != null && r.Price > 0);
    if (rs.length) {
      const pairs = rs.map((r) => [String(r.Size), paise(r.Price)]).sort((a, b) => sizeSort(a[0], b[0]));
      pairs.forEach(([s]) => ringSizes.add(s));
      const k = JSON.stringify(pairs);
      if (!sizeIdx.has(k)) sizeIdx.set(k, sizes.push(pairs) - 1);
      sz = sizeIdx.get(k);
    }
    if (x.settingType && x.settingType !== '-' && x.settingType !== 'null') settings.set(x.settingType, (settings.get(x.settingType) ?? 0) + 1);

    const g = `${metal}|${shape ?? ''}`;
    if (!mediaGroups[g]) mediaGroups[g] = { i: (x.images?.length ? x.images : [x.image]).filter(Boolean).map(media), vid: media(x.video) };
    v.push([x.itemCode, x.metalStamp, metal, shape, center, total, length, paise(x.price), stoneIdx.get(stKey), sz]);
  }
  if (!v.length) {
    problems.push(`${where}: no usable variants — product skipped`);
    continue;
  }
  const setting = [...settings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  products.push({
    key: d.familyKey,
    slug: d.slug,
    title: d.title,
    name: d.displayTitle || d.title,
    type: d.productType,
    category,
    metaTitle: d.metaTitle || null,
    metaDescription: d.metaDescription || null,
    styles: [...new Set((d.styles ?? []).map(slugify).filter(Boolean))],
    collections: [...new Set((d.collections ?? []).map((c) => String(c).trim()).filter(Boolean))],
    tags: [...new Set((d.tags ?? []).map((t) => String(t).trim()).filter(Boolean))],
    engraving: !!d.showEngraving,
    setting: setting ? slugify(setting) : null,
    axes: optionAxes,
    caratKind,
    def: d.defaultItemCode,
    rank: rank.get(d.slug) ?? 99999,
    ringSizes: [...ringSizes].sort(sizeSort),
    v,
    st: stones,
    sz: sizes,
    m: mediaGroups,
  });
}
products.sort((a, b) => a.rank - b.rank);

const body = { source: 'brilliancecarat', mediaHost: MEDIA_HOST, inrPerUsd: INR_PER_USD, shapeLabels, products };
const version = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16);
const out = path.join(ROOT, 'data/catalog/brilliancecarat.json.gz');
mkdirSync(path.dirname(out), { recursive: true });
const gz = gzipSync(JSON.stringify({ version, builtAt: new Date().toISOString(), ...body }), { level: 9 });
writeFileSync(out, gz);

// shape names for the UI (exact spelling, e.g. "Emerald + Pear") and the extra shapes worth a filter option
const shapeCount = {};
for (const p of products) for (const s of new Set(p.v.map((v) => v[3]).filter(Boolean))) shapeCount[s] = (shapeCount[s] ?? 0) + 1;
const STANDARD = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'marquise', 'radiant', 'asscher', 'heart'];
const common = Object.entries(shapeCount)
  .filter(([s, n]) => n >= 15 && !STANDARD.includes(s))
  .sort((a, b) => b[1] - a[1])
  .map(([s]) => s);
const labels = Object.fromEntries(Object.entries(shapeLabels).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(
  path.join(ROOT, 'src/lib/catalog-generated.ts'),
  `// Generated by scripts/catalog/build.mjs from the partner catalogue — do not edit by hand.\n\n` +
    `/** Display names of every diamond shape in the catalogue, by slug */\n` +
    `export const CATALOG_SHAPE_LABELS: Record<string, string> = ${JSON.stringify(labels, null, 2).replace(/"([a-z0-9_-]+)":/g, "'$1':").replace(/: "([^"]*)"/g, (_, v) => `: '${v.replace(/'/g, "\\'")}'`)};\n\n` +
    `/** Non-standard shapes common enough (15+ products) to offer as a filter */\n` +
    `export const CATALOG_COMMON_SHAPES: string[] = ${JSON.stringify(common).replace(/"/g, "'")};\n\n` +
    `/** Rupees per US dollar used for the catalogue prices — US visitors see the partner's dollar prices */\n` +
    `export const CATALOG_INR_PER_USD = ${INR_PER_USD};\n\n` +
    `/** Canadian dollars per US dollar (the partner's published rate) — Canadian visitors see the partner's CAD prices */\n` +
    `export const CATALOG_CAD_PER_USD = ${CAD_PER_USD};\n`,
);

const variants = products.reduce((n, p) => n + p.v.length, 0);
console.log(`products ${products.length}, variants ${variants}, shapes ${Object.keys(shapeLabels).length}, rate ₹${INR_PER_USD}/$`);
console.log(`wrote ${path.relative(ROOT, out)} (${(gz.length / 1024 / 1024).toFixed(2)} MB), version ${version}`);
console.log(`${problems.length} notes${problems.length ? ':\n  ' + problems.slice(0, 40).join('\n  ') : ''}`);
