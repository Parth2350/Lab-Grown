// WhatsApp ordering: adds three different pieces to the bag through the real buttons, then checks
// that the product page, the bag drawer and the bag page (desktop + phone) all open WhatsApp on the
// store number with every piece in the message.   npm run qa:whatsapp
import { launch } from './cdp.mjs';
import { BASE, TMP, projectRequire } from './env.mjs';

const NUMBER = '919824822200';
const { PrismaClient } = projectRequire('@prisma/client');
const db = new PrismaClient();
const pick = (where) => db.product.findFirst({ where: { isActive: true, variants: { some: { stock: { gt: 0 } } }, ...where }, select: { slug: true, name: true } });
const ring = await pick({ hasCenterStone: true, requiresSize: true });
const band = await pick({ hasCenterStone: false, diamondOptions: { some: { kind: 'TOTAL_WEIGHT' } } });
const plain = await pick({ hasCenterStone: false, requiresSize: false, NOT: { slug: band?.slug } });
await db.$disconnect();
const products = [ring, band, plain].filter(Boolean);

let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
  if (!ok) failures++;
};
/** the decoded message of every WhatsApp link on the page whose text matches */
const waLinks = (b, scope = 'document') =>
  b.eval(`return [...${scope}.querySelectorAll('a[href*="wa.me/"]')]
    .filter((a) => /whatsapp|enquire/i.test(a.textContent) && a.getBoundingClientRect().width > 0)
    .map((a) => { const u = new URL(a.href); return { text: a.textContent.trim(), number: u.pathname.slice(1), msg: u.searchParams.get('text') ?? '' }; })`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await launch({ profile: TMP + '/chrome-whatsapp', port: 9341 });
try {
  await b.goto(BASE + '/');
  await b.eval(`localStorage.removeItem('aurevia-cart'); return 1`);

  for (const [i, p] of products.entries()) {
    await b.goto(`${BASE}/products/${p.slug}`, 2500);
    const hasSize = await b.eval(`return !!document.querySelector('button[id^="ring-size-"]')`);
    if (hasSize) {
      // the size is picked from a side drawer
      await b.eval(`document.querySelector('button[id^="ring-size-"]').click(); return 1`);
      check(await b.waitFor(`[...document.querySelectorAll('[role="dialog"] button')].some((x) => x.textContent.trim() === 'Size 6.5')`, 5000), `${p.name}: ring size drawer opens`);
      await b.eval(`[...document.querySelectorAll('[role="dialog"] button')].find((x) => x.textContent.trim() === 'Size 6.5').click(); return 1`);
      await sleep(500);
      check(await b.eval(`return document.querySelector('button[id^="ring-size-"]').textContent.includes('Size 6.5')`), `${p.name}: chosen size shows on the page`);
    }
    if (i === 1) {
      await b.eval(`const el = document.querySelector('input[id^="engraving-"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'A & J 2026 forever');
        el.dispatchEvent(new Event('input', { bubbles: true })); return 1`);
    }
    await sleep(400);
    const pdp = (await waLinks(b)).find((l) => l.text === 'Enquire');
    check(!!pdp && !(await b.eval(`return [...document.querySelectorAll('button')].some((x) => /buy it now/i.test(x.textContent))`)), `${p.name}: "Buy It Now" replaced by the green "Enquire" WhatsApp button`);
    check(pdp?.number === NUMBER, `${p.name}: product button opens WhatsApp on +${NUMBER}`);
    check(!!pdp && pdp.msg.includes(p.name) && /Metal: /.test(pdp.msg) && /Price: ₹/.test(pdp.msg) && pdp.msg.includes(`/products/${p.slug}?`), `${p.name}: message has name, metal, price and link`);
    if (hasSize) check(!!pdp?.msg.includes('Ring size: 6.5'), `${p.name}: message has the chosen ring size`);
    if (i === 1) check(!!pdp?.msg.includes('Engraving: "A & J 2026 f"'), `${p.name}: message has the engraving (cut to 12 characters)`);
    if (i === 0) await b.screenshot(TMP + '/wa-product.png');

    await b.eval(`[...document.querySelectorAll('button')].find((x) => /^add to cart/i.test(x.textContent.trim())).click(); return 1`);
    check(await b.waitFor(`document.querySelector('[role="dialog"]') && /Your Bag/.test(document.querySelector('[role="dialog"]').textContent)`, 8000), `${p.name}: added to bag, drawer opened`);
    await sleep(600);
  }

  // bag drawer
  const names = products.map((p) => p.name);
  const drawer = (await waLinks(b, `document.querySelector('[role="dialog"]')`)).find((l) => l.text === 'Chat with us on WhatsApp');
  check(!(await b.eval(`return [...document.querySelectorAll('[role="dialog"] a, [role="dialog"] button')].some((x) => /^checkout$/i.test(x.textContent.trim()))`)), 'drawer: no Checkout button left');
  check(drawer?.number === NUMBER, 'drawer: WhatsApp button on the store number');
  check(!!drawer && names.every((n) => drawer.msg.includes(n)), `drawer: message lists all ${names.length} pieces`);
  check(!!drawer && /\*Total: ₹[\d,.]+\*/.test(drawer.msg) && /Subtotal: ₹/.test(drawer.msg), 'drawer: message has subtotal and total');
  await b.screenshot(TMP + '/wa-drawer.png');
  console.log('\n--- drawer message ---\n' + (drawer?.msg ?? '(none)') + '\n---\n');

  // bag page, desktop then phone
  for (const mobile of [false, true]) {
    if (mobile) await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await b.goto(BASE + '/cart', 2500);
    const who = mobile ? 'bag page (phone)' : 'bag page (desktop)';
    const links = (await waLinks(b)).filter((l) => /chat/i.test(l.text));
    check(links.length >= 1 && links.every((l) => l.number === NUMBER), `${who}: WhatsApp button(s) on the store number (${links.map((l) => l.text).join(' | ')})`);
    check(links.length >= 1 && links.every((l) => names.every((n) => l.msg.includes(n))), `${who}: every WhatsApp button lists all pieces`);
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
