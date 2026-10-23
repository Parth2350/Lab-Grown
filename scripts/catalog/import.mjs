// Loads the partner catalogue (data/catalog/brilliancecarat.json.gz) into the database.
//
//   node scripts/catalog/import.mjs [--force]
//
// • Runs in one transaction — it either fully succeeds or changes nothing.
// • Skips itself when this catalogue version was already imported (unless --force).
// • First import removes the demo products listed below (only those — products made in the admin stay).
// • Re-imports refresh what the catalogue owns (prices, metals, options, photos) and keep what the
//   admin owns (name, description, category, visibility, merchandising flags, SEO, collections).
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { Prisma, PrismaClient } from '@prisma/client';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILE = path.join(ROOT, 'data/catalog/brilliancecarat.json.gz');
const MARKER = 'catalog:brilliancecarat';
const BROKEN_HOST = 'https://vats-wt.s3.ap-south-1.amazonaws.com/brilliance_carat/ No newline at end of file';
const force = process.argv.includes('--force');

const DEMO_SLUGS = [
  'adele-round-full-eternity-band', 'adeline-pear-halo-drop-earrings', 'amara-heart-halo-engagement-ring', 'anouk-baguette-tennis-bracelet',
  'aria-round-solitaire-engagement-ring', 'aurelie-emerald-three-stone-baguette-ring', 'beatrix-emerald-cut-eternity-band',
  'bianca-oval-drop-earrings', 'brielle-bold-gold-cuff', 'camille-oval-eternity-band', 'celeste-oval-hidden-halo-engagement-ring',
  'colette-oval-bezel-solitaire-ring', 'cora-emerald-bezel-stud-earrings', 'dahlia-petite-bezel-stud-earrings',
  'delphine-baguette-channel-eternity-band', 'elise-round-solitaire-pendant', 'elodie-cushion-halo-engagement-ring',
  'eloise-classic-comfort-fit-band', 'esme-elongated-cushion-pav-ring', 'fleur-oval-solitaire-pendant', 'florence-pav-half-eternity-band',
  'gaia-pear-halo-pendant', 'genevieve-curved-contour-band', 'hazel-bezel-round-pendant', 'helena-marquise-eternity-band',
  'ines-round-halo-engagement-ring', 'iris-heart-halo-pendant', 'isla-radiant-three-stone-engagement-ring', 'ivy-dainty-pav-stacking-ring',
  'jolie-emerald-cut-pendant', 'josephine-emerald-cut-cocktail-ring', 'juliette-pear-and-oval-toi-et-moi-ring', 'kaia-three-stone-journey-pendant',
  'liora-asscher-art-deco-double-halo-ring', 'lucienne-bold-gold-dome-ring', 'lumi-engravable-disc-pendant',
  'maren-radiant-solitaire-engagement-ring', 'margaux-pear-halo-engagement-ring', 'mila-petite-round-pendant', 'mireille-oval-bezel-ring',
  'nadia-diamond-cluster-ring', 'noor-oval-solitaire-engagement-ring', 'nova-classic-round-tennis-necklace', 'odette-marquise-vintage-halo-ring',
  'olympia-graduated-tennis-necklace', 'ophelia-monogram-signet-ring', 'paloma-emerald-cut-tennis-necklace', 'penelope-five-stone-anniversary-ring',
  'quinn-oval-tennis-necklace', 'rhea-asscher-bezel-ring', 'rosalind-pear-hidden-halo-engagement-ring', 'sabine-baguette-stacking-band',
  'saskia-emerald-and-pear-toi-et-moi-ring', 'seraphine-emerald-cut-hidden-halo-ring', 'sienna-round-pav-cathedral-ring',
  'sloane-diamond-station-necklace', 'talia-round-solitaire-stud-earrings', 'tessa-bezel-oval-solitaire-necklace',
  'thea-east-west-oval-engagement-ring', 'uma-layering-chain-with-diamond-stations', 'ursula-oval-solitaire-stud-earrings',
  'valentina-emerald-solitaire-engagement-ring', 'vera-classic-round-tennis-bracelet', 'violette-princess-stud-earrings',
  'vivienne-princess-solitaire-engagement-ring', 'willa-round-halo-stud-earrings', 'winona-oval-tennis-bracelet', 'wren-round-three-stone-pear-ring',
  'xanthe-pav-hoop-earrings', 'xenia-emerald-cut-tennis-bracelet', 'ysolde-mini-pav-huggie-earrings', 'yvette-bezel-station-bracelet',
  'zara-large-inside-out-hoop-earrings', 'zelie-pav-diamond-bangle',
];

const METAL_ORDER = ['yellow', 'white', 'rose', 'yellow-white', 'rose-white', 'black'];
const METAL_WORDS = { yellow: 'yellow', white: 'white', rose: 'rose', 'yellow-white': 'yellow & white', 'rose-white': 'rose & white', black: 'black rhodium' };
const PURITY_ORDER = ['9K', '10K', '14K', '18K'];
const RING_CATEGORIES = ['engagement-rings', 'wedding-bands', 'rings'];
const NOUNS = { 'ENGAGEMENT RINGS': 'engagement ring', 'WEDDING BANDS': 'wedding band', RING: 'ring', EARRINGS: 'pair of earrings', PENDANT: 'pendant', NECKLACE: 'necklace', BRACELET: 'bracelet' };
const STOCK = 999; // made to order: always orderable

/** our collections, filled by rule (links are only ever added) */
const lower = (xs) => xs.map((x) => x.toLowerCase());
const COLLECTION_RULES = {
  solitaire: (p) => p.styles.includes('solitaire') || lower(p.collections).includes('solitaire'),
  engagement: (p) => p.category === 'engagement-rings' && p.trending,
  geometric: (p) => lower(p.collections).includes('geometric') || p.styles.includes('east-west') || p.shapes.includes('hexagon'),
  'art-deco': (p) => lower(p.collections).includes('art deco') || p.styles.includes('step-cut') || p.styles.includes('vintage'),
  'emerald-cut': (p) => p.shapes.includes('emerald'),
  halo: (p) => p.styles.includes('halo') || p.styles.includes('hidden-halo'),
  'three-stone': (p) => p.styles.includes('three-stone'),
  'toi-et-moi': (p) => p.styles.includes('toi-et-moi'),
  eternity: (p) => p.styles.includes('eternity'),
  stackable: (p) => p.styles.includes('stackable'),
  tennis: (p) => p.styles.includes('tennis'),
  bridal: (p) => p.category === 'engagement-rings' || p.category === 'wedding-bands',
  'anniversary-gifts': (p) => p.styles.includes('anniversary') || p.styles.includes('eternity'),
  'birthday-gifts': (p) => ['earrings', 'pendants', 'necklaces', 'bracelets'].includes(p.category) && p.fromPrice <= 100_000_00,
  'wedding-gifts': (p) => p.category === 'wedding-bands',
  'bridal-gifts': (p) => ['earrings', 'necklaces'].includes(p.category) && (p.styles.includes('drop') || p.styles.includes('tennis')),
  'personalized-jewelry': (p) => p.engraving,
};

const newId = () => 'c' + randomBytes(12).toString('hex');
const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const list = (xs, last = 'or') => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}`);
const ct = (n) => `${Number(n).toFixed(2)} ct`;
const chunks = (xs, n) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

function describe(p, def, stones, metals, purities) {
  const styles = p.styles.filter((s) => !['fashion', 'high-jewelry', 'super-fancy', 'fancy'].includes(s)).slice(0, 1).map((s) => titleCase(s).toLowerCase());
  const noun = NOUNS[p.type] ?? 'piece';
  const article = /^[aeiou]/i.test(styles[0] ?? 'lab') ? 'An' : 'A';
  const out = [`${article} ${styles.length ? styles.join(', ') + ' ' : ''}lab-grown diamond ${noun}, made to order in ${list(purities)} ${list(metals.map((m) => METAL_WORDS[m] ?? m))} gold.`];
  const center = stones.find((s) => s.role === 'center');
  const side = stones.filter((s) => s.role === 'side');
  const grade = (s) => [s.color && `${s.color} colour`, s.clarity && `${s.clarity} clarity`].filter(Boolean).join(', ');
  const parts = [];
  if (center) {
    const what = `${(center.shape ?? '').toLowerCase()} ${center.type === 'Diamond' ? 'centre diamond' : 'centre stone'}`.trim();
    const many = center.pieces > 1;
    parts.push(`${many ? `${center.pieces} ${what}s${center.carat ? ` totalling ${ct(center.carat)}` : ''}` : `a ${center.carat ? ct(center.carat) + ' ' : ''}${what}`}${grade(center) ? ` (${grade(center)})` : ''}`);
  }
  const pieces = side.reduce((n, s) => n + (s.pieces ?? 0), 0);
  const sideCt = side.reduce((n, s) => n + (s.carat ?? 0), 0);
  if (pieces) parts.push(`${pieces} accent ${side.every((s) => s.type === 'Diamond') ? 'diamonds' : 'stones'}${sideCt ? ` totalling ${ct(sideCt)}` : ''}${grade(side[0]) ? ` (${grade(side[0])})` : ''}`);
  const total = def.totalCarat ?? (center?.carat ?? 0) + sideCt;
  if (parts.length) out.push(`Set with ${total ? ct(total) + ' of ' : ''}certified lab-grown ${center && center.type !== 'Diamond' ? 'stones' : 'diamonds'}: ${list(parts, 'and')}.`);
  const choices = [];
  if (p.axes.includes('shape')) choices.push(`${new Set(p.v.map((v) => v[3])).size} diamond shapes`);
  if (p.axes.includes('carat')) choices.push(`${new Set(p.v.map((v) => (p.caratKind === 'center' ? v[4] : v[5]))).size} carat weights`);
  if (p.axes.includes('length')) choices.push(`${new Set(p.v.map((v) => v[6])).size} lengths`);
  if (choices.length) out.push(`Available in ${list(choices, 'and')}.`);
  return out.join(' ');
}

export async function importCatalog({ datasourceUrl } = {}) {
  const data = JSON.parse(gunzipSync(readFileSync(FILE)));
  const db = new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
  try {
    const marker = await db.setting.findUnique({ where: { key: MARKER } });
    if (!force && marker?.value?.version === data.version) {
      console.log(`Catalogue ${data.version} already imported — skipping.`);
      return;
    }
    const [categories, collections, existingProducts] = await Promise.all([
      db.category.findMany({ select: { id: true, slug: true } }),
      db.collection.findMany({ select: { id: true, slug: true } }),
      db.product.findMany({ where: { familyKey: { not: null } }, select: { id: true, familyKey: true } }),
    ]);
    const catId = new Map(categories.map((c) => [c.slug, c.id]));
    const missing = [...new Set(data.products.map((p) => p.category))].filter((c) => !catId.has(c));
    if (missing.length) throw new Error(`Missing categories: ${missing.join(', ')}`);
    const existingId = new Map(existingProducts.map((p) => [p.familyKey, p.id]));
    // some partner links carry a corrupted host prefix in front of the real media host
    const mediaUrl = (u) => (u && !/^https?:\/\//.test(u) ? data.mediaHost + u : u)?.replace(BROKEN_HOST, 'https://');

    // ── shape every product, variant and photo row ──
    const products = [];
    const variants = [];
    const images = [];
    const links = [];
    for (const p of data.products) {
      const id = existingId.get(p.key) ?? newId();
      const vs = p.v.map(([sku, purity, metalColor, shape, centerCarat, totalCarat, length, price, st, sz]) => ({
        sku,
        purity,
        metalColor,
        shape,
        centerCarat,
        totalCarat,
        length,
        price,
        stones: p.st[st] ?? [],
        sizePrices: sz >= 0 ? Object.fromEntries(p.sz[sz]) : null,
      }));
      const def = vs.find((v) => v.sku === p.def) ?? vs[0];
      const metals = METAL_ORDER.filter((m) => vs.some((v) => v.metalColor === m));
      const purities = PURITY_ORDER.filter((x) => vs.some((v) => v.purity === x));
      const shapes = [...new Set([def.shape, ...vs.map((v) => v.shape)].filter(Boolean))];
      const prices = vs.map((v) => v.price);
      const tags = p.tags;
      const trending = tags.some((t) => /best sell/i.test(t));
      const row = {
        id,
        familyKey: p.key,
        slug: p.slug,
        sku: p.key,
        name: p.name,
        sourceTitle: p.title,
        productType: p.type,
        subtitle: p.styles.slice(0, 3).map(titleCase).join(' · ') || null,
        description: describe(p, def, def.stones, metals, purities),
        categoryId: catId.get(p.category),
        basePrice: Math.min(...prices),
        fromPrice: Math.min(...prices),
        priceTo: Math.max(...prices),
        variantCount: vs.length,
        metalColors: metals,
        purities,
        defaultMetalColor: def.metalColor,
        defaultPurity: def.purity,
        shapes,
        centerCarat: def.centerCarat,
        totalCarat: def.totalCarat,
        caratSort: def.centerCarat ?? def.totalCarat ?? 0,
        settingType: p.setting,
        styles: p.styles,
        tags,
        hasCenterStone: false,
        requiresSize: p.ringSizes.length > 0 || RING_CATEGORIES.includes(p.category),
        ringSizes: p.ringSizes,
        showEngraving: p.engraving,
        madeToOrder: true,
        optionAxes: p.axes,
        caratKind: p.caratKind,
        isNew: tags.some((t) => /new arrival/i.test(t)),
        isTrending: trending,
        isFeatured: trending,
        position: p.rank,
        seoTitle: p.metaTitle,
        seoDescription: p.metaDescription,
      };
      products.push(row);
      for (const v of vs) variants.push({ ...v, productId: id });

      // photos: each metal's first two pictures of the default shape first (cards), then the rest, videos last
      const groups = Object.entries(p.m).map(([k, g]) => {
        const [metalColor, shape] = k.split('|');
        return { metalColor, shape: shape || null, ...g };
      });
      groups.sort((a, b) => Number(b.shape === def.shape) - Number(a.shape === def.shape) || METAL_ORDER.indexOf(a.metalColor) - METAL_ORDER.indexOf(b.metalColor));
      const first = groups.filter((g) => g.shape === def.shape || !g.shape);
      const ordered = [];
      for (const g of first) g.i.slice(0, 2).forEach((url) => ordered.push({ url, kind: 'image', metalColor: g.metalColor, shape: g.shape }));
      for (const g of groups) g.i.slice(first.includes(g) ? 2 : 0).forEach((url) => ordered.push({ url, kind: 'image', metalColor: g.metalColor, shape: g.shape }));
      for (const g of groups) if (g.vid) ordered.push({ url: g.vid, kind: 'video', metalColor: g.metalColor, shape: g.shape });
      ordered.forEach((m, i) => images.push({ id: newId(), productId: id, url: mediaUrl(m.url), alt: row.name, kind: m.kind, metalColor: m.metalColor, shape: m.shape, position: i }));

      const ruleInput = { ...p, shapes, trending, fromPrice: row.fromPrice };
      for (const c of collections) if (COLLECTION_RULES[c.slug]?.(ruleInput)) links.push([c.id, id]);
    }

    const keys = new Set(products.map((p) => p.familyKey));
    const fresh = products.filter((p) => !existingId.has(p.familyKey));
    const known = products.filter((p) => existingId.has(p.familyKey));
    console.log(`Importing ${products.length} products (${fresh.length} new, ${known.length} refreshed), ${variants.length} variants, ${images.length} photos & videos …`);

    await db.$transaction(
      async (tx) => {
        // 1 · demo products out (first import only matters; later runs find none)
        const demo = await tx.product.deleteMany({ where: { slug: { in: DEMO_SLUGS }, familyKey: null } });
        if (demo.count) console.log(`  removed ${demo.count} demo products`);

        // 2 · products
        for (const batch of chunks(fresh, 200)) await tx.product.createMany({ data: batch });
        for (const p of known) {
          const { id, slug, name, subtitle, description, categoryId, styles, isNew, isTrending, isFeatured, position, seoTitle, seoDescription, ...owned } = p;
          await tx.product.update({ where: { id }, data: owned });
        }
        // catalogue products that left the catalogue are hidden, not deleted (orders keep their history)
        const gone = await tx.product.updateMany({ where: { familyKey: { not: null, notIn: [...keys] }, isActive: true }, data: { isActive: false } });
        if (gone.count) console.log(`  hid ${gone.count} products no longer in the catalogue`);

        // 3 · variants: insert new SKUs, refresh existing ones, retire missing ones
        const ids = products.map((p) => p.id);
        const current = await tx.productVariant.findMany({ where: { productId: { in: ids } }, select: { sku: true } });
        const have = new Set(current.map((v) => v.sku));
        const add = variants.filter((v) => !have.has(v.sku));
        for (const batch of chunks(add, 1000)) await tx.productVariant.createMany({ data: batch.map((v) => ({ ...v, id: newId(), stock: STOCK, isActive: true, stones: v.stones, sizePrices: v.sizePrices ?? Prisma.DbNull })) });
        const refresh = variants.filter((v) => have.has(v.sku));
        for (const batch of chunks(refresh, 500)) {
          const rows = batch.map(
            (v) =>
              Prisma.sql`(${v.sku}::text, ${v.productId}::text, ${v.purity}::text, ${v.metalColor}::text, ${v.price}::int, ${v.shape}::text, ${v.centerCarat}::float8, ${v.totalCarat}::float8, ${v.length}::text, ${JSON.stringify(v.stones)}::jsonb, ${v.sizePrices ? JSON.stringify(v.sizePrices) : null}::jsonb)`,
          );
          await tx.$executeRaw`
            UPDATE "product_variants" AS t SET
              "productId" = s.pid, "purity" = s.purity, "metalColor" = s.metal, "price" = s.price, "isActive" = true,
              "shape" = s.shape, "centerCarat" = s.cc, "totalCarat" = s.tc, "length" = s.len, "stones" = s.stones, "sizePrices" = s.sizes
            FROM (VALUES ${Prisma.join(rows)}) AS s(sku, pid, purity, metal, price, shape, cc, tc, len, stones, sizes)
            WHERE t."sku" = s.sku`;
        }
        const keep = new Set(variants.map((v) => v.sku));
        const retire = current.filter((v) => !keep.has(v.sku)).map((v) => v.sku);
        for (const batch of chunks(retire, 1000)) await tx.productVariant.updateMany({ where: { sku: { in: batch } }, data: { isActive: false } });

        // 4 · catalogue photos & videos are replaced wholesale; photos uploaded in the admin are kept (and stay first)
        await tx.productImage.deleteMany({ where: { productId: { in: ids }, url: { startsWith: data.mediaHost } } });
        const own = await tx.productImage.groupBy({ by: ['productId'], where: { productId: { in: ids } }, _max: { position: true } });
        const offset = new Map(own.map((r) => [r.productId, (r._max.position ?? -1) + 1]));
        for (const m of images) m.position += offset.get(m.productId) ?? 0;
        for (const batch of chunks(images, 1000)) await tx.productImage.createMany({ data: batch });

        // 5 · collections (additive)
        for (const batch of chunks(links, 1000)) {
          await tx.$executeRaw`INSERT INTO "_CollectionToProduct" ("A", "B") VALUES ${Prisma.join(batch.map(([a, b]) => Prisma.sql`(${a}, ${b})`))} ON CONFLICT DO NOTHING`;
        }

        await tx.setting.upsert({
          where: { key: MARKER },
          create: { key: MARKER, value: { version: data.version, products: products.length, variants: variants.length, importedAt: new Date().toISOString() } },
          update: { value: { version: data.version, products: products.length, variants: variants.length, importedAt: new Date().toISOString() } },
        });
      },
      { timeout: 20 * 60_000, maxWait: 60_000 },
    );
    console.log(`Catalogue ${data.version} imported: ${products.length} products, ${variants.length} variants, ${images.length} media, ${links.length} collection links.`);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  importCatalog().catch((e) => {
    console.error('✖ Catalogue import failed — nothing was changed.\n', e);
    process.exit(1);
  });
}
