// Bespoke brief (brilliancecarat.com style): your idea → make it yours → reach you, with a photo and a link; the request
// reaches the admin with every detail.   npm run qa:bespoke   (removes the request and photo it creates)
//   QA_SHOTS=<dir> also saves a screenshot of each step.
import fs from 'node:fs';
import { launch } from './cdp.mjs';
import { BASE, ROOT, TMP, projectRequire } from './env.mjs';

const { PrismaClient } = projectRequire('@prisma/client');
const sharp = projectRequire('sharp');
const db = new PrismaClient();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, pass, detail = '') => { results.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const shots = process.env.QA_SHOTS;
const email = `qa.bespoke.${Date.now()}@example.com`;
const photo = TMP + '/bespoke-ref.png';
await sharp({ create: { width: 600, height: 400, channels: 3, background: '#c9a46a' } }).png().toFile(photo);

const b = await launch({ profile: TMP + '/chrome-bespoke', port: 9340, width: 1440 });
const shot = async (name) => {
  if (!shots) return;
  const r = await b.eval(`const c = document.querySelector('#start').getBoundingClientRect(); return { y: c.top + scrollY, h: c.height };`);
  const { data } = await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 75, captureBeyondViewport: true, clip: { x: 0, y: r.y, width: 1440, height: Math.min(r.h, 1400), scale: 0.6 } });
  fs.writeFileSync(`${shots}/bespoke-${name}.jpg`, Buffer.from(data, 'base64'));
};
const click = (text) => b.eval(`const el = [...document.querySelectorAll('#start button')].find((x) => x.textContent.trim() === ${JSON.stringify(text)}); el.click(); return 1;`);
const type = (id, v) => b.eval(`const el = document.getElementById(${JSON.stringify(id)}); const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 1;`);

let row = null;
try {
  await b.goto(BASE + '/bespoke', 3000);
  await b.waitFor(`Object.keys(document.getElementById('brief-idea') || {}).some((k) => k.startsWith('__reactProps'))`, 30000);
  await b.eval(`document.getElementById('start').scrollIntoView(); return 1;`);

  // 1 · your idea
  await click('Engagement Ring');
  await sleep(500);
  const pieces = await b.eval(`return document.querySelectorAll('#start aside a[href^="/products/"]').length;`);
  check('choosing a category shows pieces from the collection', pieces === 6, `${pieces} pieces`);
  await type('brief-idea', 'An oval solitaire on a thin pavé band, around 2ct.');
  await b.setFiles('#start input[type=file]', [photo]);
  // the preview appears at once; it stops being faded when the upload has finished
  await b.waitFor(`document.querySelector('#start img[src^="blob:"]') && !document.querySelector('#start img.opacity-50')`, 20000);
  await sleep(800);
  await b.eval(`const i = [...document.querySelectorAll('#start input')].find((x) => x.placeholder.startsWith('Paste a Pinterest')); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'pinterest.com/pin/12345'); i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`);
  await click('Add');
  await sleep(300);
  await shot('1-idea');
  await click('Continue →');
  await sleep(500);

  // 2 · make it yours
  await click('White Gold');
  await type('brief-stamp', '18K');
  await type('brief-shape', 'Oval');
  await type('brief-carat', '2');
  await type('brief-ctw', '2.4');
  await type('brief-setting', 'Prong');
  const budget = await b.eval(`const el = [...document.querySelectorAll('#start button')].find((x) => /^Under /.test(x.textContent.trim())); el.click(); return el.textContent.trim();`);
  await type('brief-notes', 'Engrave "always" inside the band.');
  await sleep(300);
  await shot('2-make-it-yours');
  await click('Continue →');
  await sleep(500);

  // 3 · reach you
  await type('brief-name', 'QA Bespoke');
  await type('brief-email', email);
  await type('brief-phone', '+91 98765 43210');
  await shot('3-reach-you');
  await click('Send my brief');
  const sent = await b.waitFor(`/BSP-[A-Z0-9]{6}/.test(document.querySelector('#start').textContent)`, 20000);
  await shot('4-sent');
  row = await db.bespokeRequest.findFirst({ where: { email } });
  check('the brief is sent and a reference shown', sent && !!row, row ? `BSP-${row.id.slice(-6).toUpperCase()}` : 'no request saved');
  if (row) {
    const n = row.notes ?? '';
    check(
      'every detail reaches the admin',
      row.jewelryType === 'Engagement Ring' && row.metal === 'White Gold' && row.shape === 'Oval' && row.carat === '2 ct' && row.budget === budget && row.phone && row.inspirationUrls.length === 1 &&
        ['Idea: An oval solitaire', 'https://pinterest.com/pin/12345', 'Metal stamp: 18K', 'Total diamond weight: 2.4 ctw', 'Setting type: Prong', 'Anything else: Engrave'].every((s) => n.includes(s)),
      `${row.jewelryType} · ${row.metal} · ${row.shape} · ${row.carat} · ${row.budget} · photos=${row.inspirationUrls.length}`,
    );
  }
} finally {
  if (row) {
    await db.bespokeRequest.delete({ where: { id: row.id } });
    for (const u of row.inspirationUrls) if (u.startsWith('/uploads/')) try { fs.unlinkSync(ROOT + 'public' + u); } catch {}
  }
  await b.close();
  await db.$disconnect();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
