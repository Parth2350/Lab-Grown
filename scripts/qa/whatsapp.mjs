// WhatsApp ordering: adds three different catalogue pieces to the bag through the real buttons — a sized
// ring with engraving, a piece with shape & carat choices, a plain piece — then checks the product page,
// the bag drawer and the bag page (desktop + phone) all open WhatsApp on the store number with every piece
// (and its options) in the message, and that the server prices the bag without complaint.   npm run qa:whatsapp
import { launch } from './cdp.mjs';
import { BASE, TMP, projectRequire } from './env.mjs';

const NUMBER = '919824822200';
const { PrismaClient } = projectRequire('@prisma/client');
const db = new PrismaClient();
const pick = (where) => db.product.findFirst({ where: { isActive: true, familyKey: { not: null }, ...where }, orderBy: { position: 'asc' }, select: { slug: true, name: true, optionAxes: true } });
const ring = await pick({ requiresSize: true, showEngraving: true, NOT: { ringSizes: { isEmpty: true } } });
const shaped = await pick({ optionAxes: { hasEvery: ['shape', 'carat'] }, requiresSize: false });
const plain = await pick({ optionAxes: { isEmpty: true }, requiresSize: false });
await db.$disconnect();
const products = [ring, shaped, plain].filter(Boolean);

let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
  if (!ok) failures++;
};
check(products.length === 3, `test products found (${products.map((p) => p.slug).join(', ')})`);
/** the decoded message of every WhatsApp link on the page whose text matches */
const waLinks = (b, scope = 'document') =>
  b.eval(`return [...${scope}.querySelectorAll('a[href*="wa.me/"]')]
    .filter((a) => /whatsapp|enquire/i.test(a.textContent) && a.getBoundingClientRect().width > 0)
    .map((a) => { const u = new URL(a.href); return { text: a.textContent.trim(), number: u.pathname.slice(1), msg: u.searchParams.get('text') ?? '' }; })`);
const price = (b) => b.eval(`return document.querySelector('p[aria-live="polite"]')?.textContent.trim()`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await launch({ profile: TMP + '/chrome-whatsapp', port: 9341 });
try {
  await b.goto(BASE + '/');
  await b.eval(`localStorage.removeItem('aurevia-cart'); return 1`);

  for (const [i, p] of products.entries()) {
    await b.goto(`${BASE}/products/${p.slug}`, 2500);
    const who = `${['ring', 'shape & carat', 'plain'][i]} (${p.slug.slice(0, 40)}…)`;
    let size = null;
    if (i === 0) {
      // the size is picked from a side drawer; bigger sizes use more gold, so the price follows
      const before = await price(b);
      await b.eval(`document.querySelector('button[id^="ring-size-"]').click(); return 1`);
      check(await b.waitFor(`[...document.querySelectorAll('[role="dialog"] button')].some((x) => /^Size /.test(x.textContent.trim()))`, 5000), `${who}: ring size drawer opens`);
      size = await b.eval(`const bs = [...document.querySelectorAll('[role="dialog"] button')].filter((x) => /^Size /.test(x.textContent.trim())); const pick = bs[bs.length - 1]; pick.click(); return pick.textContent.trim().replace('Size ', '');`);
      await sleep(500);
      check(await b.eval(`return document.querySelector('button[id^="ring-size-"]').textContent.includes('Size ${size}')`), `${who}: chosen size ${size} shows on the page`);
      const after = await price(b);
      check(!!before && !!after && before !== after, `${who}: price follows the ring size (${before} → ${after})`);
      await b.eval(`const el = document.querySelector('input[id^="engraving-"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'A & J 2026 forever');
        el.dispatchEvent(new Event('input', { bubbles: true })); return 1`);
    }
    if (i === 1) {
      // switch shape, then carat: the URL, price and message follow the exact variant
      const shape = await b.eval(`const g = [...document.querySelectorAll('fieldset')].find((f) => /^Shape/i.test(f.querySelector('legend')?.textContent ?? '')); const bs = [...g.querySelectorAll('button')]; const next = bs.find((x) => x.getAttribute('aria-pressed') !== 'true'); next.click(); return next.getAttribute('aria-label');`);
      await sleep(600);
      const url = await b.eval(`return location.search`);
      check(/shape=/.test(url), `${who}: choosing ${shape} updates the link (${url})`);
      const carat = await b.eval(`const g = [...document.querySelectorAll('fieldset')].find((f) => /Carat/i.test(f.querySelector('legend')?.textContent ?? '')); const bs = [...g.querySelectorAll('button')]; const next = bs[bs.length - 1]; next.click(); return next.textContent.trim();`);
      await sleep(600);
      const msg = (await waLinks(b)).find((l) => l.text === 'Enquire')?.msg ?? '';
      check(msg.includes(`Options: ${shape}`) && msg.includes(`${carat} ct`), `${who}: message carries the chosen shape ${shape} and ${carat} ct`);
    }
    await sleep(400);
    const pdp = (await waLinks(b)).find((l) => l.text === 'Enquire');
    check(!!pdp && !(await b.eval(`return [...document.querySelectorAll('button')].some((x) => /buy it now/i.test(x.textContent))`)), `${who}: green "Enquire" WhatsApp button`);
    check(pdp?.number === NUMBER, `${who}: opens WhatsApp on +${NUMBER}`);
    check(!!pdp && pdp.msg.includes(p.name) && /Metal: /.test(pdp.msg) && /Price: ₹/.test(pdp.msg) && /SKU: /.test(pdp.msg) && pdp.msg.includes(`/products/${p.slug}?`), `${who}: message has name, metal, price, item code and link`);
    if (i === 0) {
      check(!!pdp?.msg.includes(`Ring size: ${size}`), `${who}: message has ring size ${size}`);
      check(!!pdp?.msg.includes('Engraving: "A & J 2026 f"'), `${who}: message has the engraving (cut to 12 characters)`);
      await b.screenshot(TMP + '/wa-product.png');
    }

    await b.eval(`[...document.querySelectorAll('button')].find((x) => /^add to cart/i.test(x.textContent.trim())).click(); return 1`);
    check(await b.waitFor(`document.querySelector('[role="dialog"]') && /Your Bag/.test(document.querySelector('[role="dialog"]').textContent)`, 8000), `${who}: added to bag, drawer opened`);
    await sleep(600);
  }

  // bag drawer
  const links = products.map((p) => `/products/${p.slug}?`);
  const drawer = (await waLinks(b, `document.querySelector('[role="dialog"]')`)).find((l) => l.text === 'Chat with us on WhatsApp');
  check(!(await b.eval(`return [...document.querySelectorAll('[role="dialog"] a, [role="dialog"] button')].some((x) => /^checkout$/i.test(x.textContent.trim()))`)), 'drawer: no Checkout button left');
  check(drawer?.number === NUMBER, 'drawer: WhatsApp button on the store number');
  check(!!drawer && links.every((l) => drawer.msg.includes(l)), `drawer: message lists all ${links.length} pieces`);
  check(!!drawer && /Options: /.test(drawer.msg), 'drawer: message carries the chosen options');
  check(!!drawer && /\*Total: ₹[\d,.]+\*/.test(drawer.msg) && /Subtotal: ₹/.test(drawer.msg), 'drawer: message has subtotal and total');
  await b.screenshot(TMP + '/wa-drawer.png');
  console.log('\n--- drawer message ---\n' + (drawer?.msg ?? '(none)') + '\n---\n');
  const names = links;

  // bag page, desktop then phone
  for (const mobile of [false, true]) {
    if (mobile) await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await b.goto(BASE + '/cart', 2500);
    const who = mobile ? 'bag page (phone)' : 'bag page (desktop)';
    const links = (await waLinks(b)).filter((l) => /chat/i.test(l.text));
    check(links.length >= 1 && links.every((l) => l.number === NUMBER), `${who}: WhatsApp button(s) on the store number (${links.map((l) => l.text).join(' | ')})`);
    check(links.length >= 1 && links.every((l) => names.every((n) => l.msg.includes(n))), `${who}: every WhatsApp button lists all pieces`);
    const issues = await b.eval(`await new Promise((r) => setTimeout(r, 1500)); return [...document.querySelectorAll('section[aria-label="Pieces in your bag"] [role=alert]')].map((x) => x.textContent.trim())`);
    check(issues.length === 0, `${who}: the server prices every piece without a problem${issues.length ? ' — ' + issues.join(' / ') : ''}`);
    check(!(await b.eval(`return [...document.querySelectorAll('a, button')].some((x) => /^checkout$/i.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0)`)), `${who}: no Checkout button left`);
    check(!(await b.eval(`return document.documentElement.scrollWidth > innerWidth + 1`)), `${who}: no sideways overflow`);
    await b.screenshot(TMP + `/wa-cart-${mobile ? 'phone' : 'desktop'}.png`);
  }

  // product page on a phone: Enquire / Add to Cart pinned to the bottom, never covering the footer
  await b.goto(`${BASE}/products/${products[0].slug}`, 2500);
  const bar = await b.eval(`const a = [...document.querySelectorAll('a[href*="wa.me/"]')].find((x) => x.textContent.trim() === 'Enquire');
    const r = a.getBoundingClientRect(); return { fixed: getComputedStyle(a.parentElement).position === 'fixed', bottom: r.bottom, h: innerHeight }`);
  check(bar.fixed && bar.bottom <= bar.h && bar.bottom > bar.h - 90, `product page (phone): Enquire bar pinned to the bottom of the screen`);
  const footerClear = await b.eval(`document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.documentElement.scrollHeight); await new Promise((r) => setTimeout(r, 600));
    const bar = document.querySelector('[data-mobile-bar]').getBoundingClientRect();
    const f = document.querySelector('footer'); const last = [...f.querySelectorAll('a, p, span')].filter((e) => e.getBoundingClientRect().height > 0).pop().getBoundingClientRect();
    return last.bottom <= bar.top`);
  check(footerClear, 'product page (phone): footer is not hidden behind the bar');
  check(!(await b.eval(`return document.documentElement.scrollWidth > innerWidth + 1`)), 'product page (phone): no sideways overflow');
  await b.screenshot(TMP + '/wa-product-phone.png');

  await b.goto(BASE + '/checkout', 2500);
  check((await b.eval(`return location.pathname`)) === '/cart', '/checkout redirects to the bag');
  check(b.consoleErrors.length === 0, `no console errors${b.consoleErrors.length ? ': ' + b.consoleErrors.join(' / ') : ''}`);
  await b.eval(`localStorage.removeItem('aurevia-cart'); return 1`);
} finally {
  await b.close();
}
console.log(`\n${failures ? failures + ' FAILED' : 'all passed'} — screenshots in ${TMP}`);
process.exit(failures ? 1 : 0);
