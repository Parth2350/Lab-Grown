// Downloads the BrillianceCarat partner catalogue (list, every product's variants, INR rate).
//
//   node scripts/catalog/download.mjs <download-dir>
//
// Then: node scripts/catalog/build.mjs <download-dir>  → commit data/catalog → deploy (the build imports it).
// Already-downloaded products are skipped, so re-running only fetches what is missing.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const API = 'https://engine.brilliancecarat.com/api/v1';
const DIR = process.argv[2];
if (!DIR) {
  console.error('usage: node scripts/catalog/download.mjs <download-dir>');
  process.exit(1);
}
const RAW = path.join(DIR, 'raw');
mkdirSync(RAW, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (TVJ catalogue sync)', Accept: 'application/json' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`);
      await sleep(1500 * i);
    }
  }
}

const rates = await get(`${API}/currencies`);
const inr = rates?.data?.list?.find((c) => c.code === 'INR')?.rate;
if (!inr) throw new Error('INR rate not found');
writeFileSync(path.join(DIR, 'rates.json'), JSON.stringify({ INR: inr, source: `${API}/currencies`, fetchedAt: new Date().toISOString() }));
console.log(`INR rate ${inr}`);

const first = await get(`${API}/products?page=1`);
const { pages, total } = first.data;
const items = first.data.items;
for (let p = 2; p <= pages; p++) {
  items.push(...(await get(`${API}/products?page=${p}`)).data.items);
  await sleep(150);
}
writeFileSync(path.join(DIR, 'list.json'), JSON.stringify(items));
console.log(`list: ${items.length} of ${total}`);

const todo = items.map((x) => x.slug).filter((s) => !existsSync(path.join(RAW, s + '.json.gz')));
console.log(`details to fetch: ${todo.length}`);
let done = 0;
const failed = [];
async function worker() {
  while (todo.length) {
    const slug = todo.shift();
    try {
      const d = await get(`${API}/products/${encodeURIComponent(slug)}`);
      if (!d) failed.push(slug + ' (404)');
      else writeFileSync(path.join(RAW, slug + '.json.gz'), gzipSync(JSON.stringify(d.data)));
    } catch (e) {
      failed.push(`${slug} ${e.message}`);
    }
    if (++done % 50 === 0) console.log(`details ${done} done, ${todo.length} left, ${failed.length} failed`);
    await sleep(100);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
writeFileSync(path.join(DIR, 'failed.txt'), failed.join('\n'));
console.log(`finished: ${done} fetched, ${failed.length} failed${failed.length ? ' — run again to retry them' : ''}`);
