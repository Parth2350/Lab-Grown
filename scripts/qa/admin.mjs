// End-to-end admin QA: drives the real UI in headless Chrome and verifies every change in the database.
//   npm run qa:admin                         all groups
//   node scripts/qa/admin.mjs coupons,orders only matching groups
// Needs the local DB (npm run db:start) and dev server (npm run dev). Cleans up the test data it creates.
import { launch } from './cdp.mjs';
import { login } from './login.mjs';
import { BASE, ROOT, TMP, bigPhoto, projectRequire } from './env.mjs';

const S = TMP;
const { PrismaClient } = projectRequire('@prisma/client');
const db = new PrismaClient();
await bigPhoto();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv[2] ? process.argv[2].split(',') : null;

const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const b = await launch({ profile: S + '/chrome-admin', port: 9335 });

// page helpers injected after every navigation
const HELPERS = `
  window.__t = [];
  const box = document.querySelector('[aria-live=polite][role=status].fixed') || document.body;
  new MutationObserver(() => { box.querySelectorAll('div,p,span').forEach(n => { const t = n.textContent.trim(); if (t && !window.__t.includes(t) && n.children.length === 0) window.__t.push(t); }); }).observe(box, { subtree: true, childList: true, characterData: true });
  window.__set = (el, v) => { const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  window.__label = (text, root = document) => { const l = [...root.querySelectorAll('label, legend')].find(l => l.textContent.replace(/[*\\s]+$/,'').trim().toLowerCase().startsWith(text.toLowerCase())); if (!l) return null; return l.htmlFor ? document.getElementById(l.htmlFor) : l.querySelector('input,select,textarea') || l.parentElement.querySelector('input,select,textarea'); };
  window.__btn = (text, root = document) => [...root.querySelectorAll('button, a')].find(x => ((x.getAttribute('aria-label') || '') + '|' + x.textContent.trim()).toLowerCase().includes(text.toLowerCase()) && !x.disabled);
  window.__dialog = () => [...document.querySelectorAll('[role=dialog]')].pop();
  true;`;
const go = async (path) => { await b.goto(BASE + path, 2200); await b.waitFor(`document.querySelector('main') && Object.keys(document.querySelector('main') || {}).length >= 0`, 5000); await sleep(600); await b.eval(HELPERS); };
const toasts = () => b.eval(`return window.__t.slice()`);
const waitToast = async (re, timeout = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const t = await toasts(); const hit = t.find((x) => re.test(x)); if (hit) return hit; await sleep(250); } return null; };
const anyError = async () => (await toasts()).find((x) => /wrong|failed|couldn|error|invalid|must|too large|required/i.test(x));
const run = async (name, fn) => { if (only && !only.some((o) => name.toLowerCase().includes(o))) return; try { await fn(); } catch (e) { check(name, false, 'threw: ' + e.message.slice(0, 200)); } };

try {
  check('admin sign-in', await login(b));

  // ───────────── PRODUCTS ─────────────
  await run('products: edit & save price typed as ₹1,23,400', async () => {
    const p = await db.product.findFirst({ where: { slug: 'aria-round-solitaire-engagement-ring' }, include: { variants: { orderBy: [{ purity: 'asc' }, { metalColor: 'asc' }] } } });
    await go('/admin/products/' + p.id);
    const original = await b.eval(`const i = document.querySelector('input[id^=v-][id$=-price]'); return { label: i.labels[0].textContent.trim(), value: i.value, id: i.id };`);
    await b.eval(`window.__set(document.getElementById('${original.id}'), '₹1,23,400');`);
    await b.eval(`window.__btn('Save changes').click();`);
    const t = await waitToast(/saved|updated|changes/i);
    const label = original.label.replace('Price for ', '').replace(' in rupees', '');
    const after = await db.productVariant.findMany({ where: { productId: p.id } });
    const hit = after.find((v) => v.price === 12340000);
    check('products: save with ₹ and Indian commas', !!t && !!hit, `toast="${t}" error="${await anyError()}" variant(${label})=${hit ? '₹1,23,400 saved' : 'not saved'}`);
    // restore
    await b.eval(`window.__set(document.getElementById('${original.id}'), '${original.value}');`);
    await b.eval(`window.__btn('Save changes').click();`);
    await waitToast(/saved|updated|changes/i);
  });

  await run('products: create, duplicate and delete', async () => {
    await go('/admin/products/new');
    const fields = await b.eval(`return [...document.querySelectorAll('label')].map(l => l.textContent.trim()).filter(Boolean).slice(0, 40)`);
    await b.eval(`
      window.__set(window.__label('Name'), 'QA Test Pendant');
      window.__set(window.__label('SKU'), 'QA-PEN-001');
      const cat = window.__label('Category'); const opt = [...cat.options].find(o => /pendant/i.test(o.textContent)) || cat.options[1]; window.__set(cat, opt.value);
      const base = window.__label('Base price') || window.__label('Base'); if (base) window.__set(base, '45,000');
      const desc = window.__label('Description'); if (desc) window.__set(desc, 'QA test product created by the automated admin check.');
    `);
    await b.eval(`window.__btn('Create product').click();`);
    const moved = await b.waitFor(`/\\/admin\\/products\\/(?!new)[a-z0-9]+/.test(location.pathname)`, 20000);
    const created = await db.product.findFirst({ where: { name: 'QA Test Pendant' }, include: { variants: true } });
    check('products: create new product', moved && !!created, moved ? `id=${created?.id} variants=${created?.variants.length} base=₹${created ? created.basePrice / 100 : '?'}` : `stayed on form; messages=${JSON.stringify(await toasts())} errors=${JSON.stringify(await b.eval(`return [...document.querySelectorAll('[role=alert]')].map(n=>n.textContent.trim()).filter(Boolean)`))} fields=${fields.join('|')}`);
    if (!created) return;
    await go('/admin/products/' + created.id);
    await b.eval(`window.__btn('Duplicate').click();`);
    await sleep(800);
    const dlgBtn = await b.eval(`const d = window.__dialog(); return d ? [...d.querySelectorAll('button')].map(x => x.textContent.trim()) : null`);
    if (dlgBtn) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await b.waitFor(`!location.pathname.endsWith('${created.id}')`, 15000);
    const copy = await db.product.findFirst({ where: { name: { contains: 'QA Test Pendant' }, NOT: { id: created.id } } });
    check('products: duplicate', !!copy, copy ? `copy=${copy.name}` : `messages=${JSON.stringify(await toasts())}`);
    for (const id of [copy?.id, created.id].filter(Boolean)) {
      await go('/admin/products/' + id);
      await b.eval(`window.__btn('Delete').click();`);
      await sleep(800);
      await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
      await b.waitFor(`location.pathname === '/admin/products'`, 15000);
    }
    const left = await db.product.count({ where: { name: { contains: 'QA Test Pendant' } } });
    check('products: delete (returns to list)', left === 0 && (await b.eval(`return location.pathname`)) === '/admin/products', `remaining=${left}`);
  });

  // ───────────── UPLOADS ─────────────
  await run('uploads: product photo from disk (4.8 MB camera-size JPEG)', async () => {
    const fs = await import('node:fs');
    const p = await db.product.findFirst({ where: { slug: 'celeste-oval-hidden-halo-engagement-ring' } });
    const before = await db.productImage.findMany({ where: { productId: p.id } });
    await go('/admin/products/' + p.id);
    await b.setFiles('#media-files', [S + '/photo_4000.jpg']);
    const t = await waitToast(/Uploaded \d|failed|can't|could not/i, 40000);
    const after = await db.productImage.findMany({ where: { productId: p.id } });
    const added = after.filter((a) => !before.some((x) => x.id === a.id));
    const file = added[0] && ROOT + 'public' + added[0].url;
    const size = file && fs.existsSync(file) ? fs.statSync(file).size : 0;
    check('uploads: product photo 4.8 MB → uploaded & resized', added.length === 1 && size > 0 && size < 4 * 1048576, `toast="${t}" saved=${added[0]?.url} ${(size / 1048576).toFixed(2)} MB`);
    for (const a of added) { await db.productImage.delete({ where: { id: a.id } }); try { fs.unlinkSync(ROOT + 'public' + a.url); } catch {} }
  });

  await run('uploads: hero image from disk', async () => {
    const fs = await import('node:fs');
    const sBefore = await db.setting.findUnique({ where: { key: 'store' } });
    await go('/admin/settings');
    await b.setFiles('#hero-image', [S + '/photo_4000.jpg']);
    await b.waitFor(`document.getElementById('hero-image').files[0] && document.getElementById('hero-image').files[0].size < 4 * 1048576`, 20000);
    const prepared = await b.eval(`const f = document.getElementById('hero-image').files[0]; return f.name + ' ' + (f.size / 1048576).toFixed(2) + ' MB';`);
    await b.eval(`window.__btn('Save hero').click();`);
    await b.waitFor(`!/Uploading|Preparing/.test(document.body.textContent)`, 30000);
    await sleep(1500);
    const sAfter = await db.setting.findUnique({ where: { key: 'store' } });
    const img = sAfter.value.hero?.image;
    const size = img && fs.existsSync(ROOT + 'public' + img) ? fs.statSync(ROOT + 'public' + img).size : 0;
    check('uploads: hero image 4.8 MB → saved', img && img !== sBefore.value.hero?.image && size > 0, `sent=${prepared} saved=${img} ${(size / 1048576).toFixed(2)} MB error="${await anyError()}"`);
    // restore the store's real hero and remove the test file, so the test leaves no trace
    await db.setting.update({ where: { key: 'store' }, data: { value: sBefore.value } });
    if (img && img.startsWith('/uploads/')) try { fs.unlinkSync(ROOT + 'public' + img); } catch {}
  });

  // ───────────── CATEGORIES ─────────────
  await run('categories: edit & save', async () => {
    await go('/admin/categories');
    const cat = await db.category.findFirst({ where: { slug: 'pendants' } });
    await b.eval(`window.__btn('Edit Pendants').click();`);
    await sleep(900);
    await b.eval(`const d = window.__dialog() || document; window.__set(window.__label('Description', d), 'Pendants — QA edit');`);
    await b.eval(`const d = window.__dialog() || document; [...d.querySelectorAll('button[type=submit]')].pop().click();`);
    const t = await waitToast(/saved|updated/i);
    const after = await db.category.findUnique({ where: { id: cat.id } });
    check('categories: edit & save', after.description === 'Pendants — QA edit', `toast="${t}" error="${await anyError()}"`);
    await db.category.update({ where: { id: cat.id }, data: { description: cat.description } });
  });

  // ───────────── COLLECTIONS ─────────────
  await run('collections: create, add/remove product, delete', async () => {
    await go('/admin/collections/new');
    await b.eval(`const f = document.querySelector('main form'); window.__set(f.querySelector('[name=name]'), 'QA Test Collection'); const s = f.querySelector('[name=slug]'); if (!s.value) window.__set(s, 'qa-test-collection'); window.__set(f.querySelector('[name=description]'), 'Created by the automated admin check.');`);
    await b.eval(`window.__btn('Create collection').click();`);
    const moved = await b.waitFor(`/\\/admin\\/collections\\/(?!new)[a-z0-9]+/.test(location.pathname)`, 15000);
    const col = await db.collection.findFirst({ where: { name: 'QA Test Collection' } });
    check('collections: create', moved && !!col, `messages=${JSON.stringify(await toasts())}`);
    if (!col) return;
    await go('/admin/collections/' + col.id);
    await b.eval(`[...document.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || '').startsWith('Add ')).click();`);
    await sleep(2500);
    let n = await db.collection.findUnique({ where: { id: col.id }, include: { _count: { select: { products: true } } } });
    check('collections: add product', n._count.products === 1, `products=${n._count.products} messages=${JSON.stringify(await toasts())}`);
    await go('/admin/collections/' + col.id);
    await b.eval(`window.__btn('Remove').click();`);
    await sleep(800);
    if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await sleep(2500);
    n = await db.collection.findUnique({ where: { id: col.id }, include: { _count: { select: { products: true } } } });
    check('collections: remove product', n._count.products === 0, `products=${n._count.products}`);
    await go('/admin/collections/' + col.id);
    await b.eval(`window.__btn('Delete').click();`);
    await sleep(800);
    await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    const back = await b.waitFor(`location.pathname === '/admin/collections'`, 15000);
    const gone = !(await db.collection.findUnique({ where: { id: col.id } }));
    check('collections: delete from detail page returns to list', back && gone, `url=${await b.eval(`return location.pathname`)} deleted=${gone} messages=${JSON.stringify(await toasts())}`);
  });

  // ───────────── DIAMONDS ─────────────
  await run('diamonds: add (₹ price), edit, delete', async () => {
    await go('/admin/diamonds/new');
    await b.eval(`
      const set = (n, v) => { const el = document.querySelector('[name=' + n + ']'); if (el) window.__set(el, v); };
      set('sku', 'QA-DIA-001'); set('shape', 'oval'); set('carat', '1.25'); set('color', 'F'); set('clarity', 'VS1'); set('cut', 'Excellent');
      set('certLab', 'IGI'); set('certNumber', 'LG999000111'); set('price', '₹2,50,000');`);
    await b.eval(`window.__btn('Add diamond').click();`);
    const moved = await b.waitFor(`/\\/admin\\/diamonds\\/(?!new)[a-z0-9-]+/.test(location.pathname)`, 15000);
    const d = await db.diamond.findFirst({ where: { sku: 'QA-DIA-001' } });
    check('diamonds: add with price "₹2,50,000"', !!d && d.price === 25000000, d ? `price=₹${d.price / 100}` : `moved=${moved} messages=${JSON.stringify(await toasts())} alerts=${JSON.stringify(await b.eval(`return [...document.querySelectorAll('[role=alert]')].map(n=>n.textContent.trim()).filter(Boolean)`))}`);
    if (!d) return;
    await go('/admin/diamonds/' + d.id);
    await b.eval(`window.__set(document.querySelector('[name=price]'), '15,00,000');`);
    await b.eval(`window.__btn('Save changes').click();`);
    const t = await waitToast(/saved|updated/i);
    const d2 = await db.diamond.findUnique({ where: { id: d.id } });
    check('diamonds: edit price ₹15,00,000 (above old ₹10 lakh cap)', d2.price === 150000000, `toast="${t}" error="${await anyError()}"`);
    await b.eval(`window.__btn('Delete').click();`);
    await sleep(800);
    if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const dd = window.__dialog(); [...dd.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    const back = await b.waitFor(`location.pathname === '/admin/diamonds'`, 15000);
    const gone = !(await db.diamond.findUnique({ where: { id: d.id } }));
    check('diamonds: delete from detail page returns to list', back && gone, `url=${await b.eval(`return location.pathname`)} deleted=${gone} messages=${JSON.stringify(await toasts())}`);
  });

  // ───────────── INVENTORY ─────────────
  await run('inventory: set stock', async () => {
    await go('/admin/inventory');
    const sku = await b.eval(`const btn = document.querySelector('button[aria-label^="Save stock for"]'); return btn.getAttribute('aria-label').replace('Save stock for ', '');`);
    const v = await db.productVariant.findFirst({ where: { sku } });
    await b.eval(`const btn = document.querySelector('button[aria-label="Save stock for ${sku}"]'); const input = btn.parentElement.querySelector('input[type=number]') || btn.closest('form,div,td').querySelector('input[type=number]'); window.__set(input, '${v.stock + 7}'); btn.click();`);
    await sleep(2500);
    const v2 = await db.productVariant.findUnique({ where: { id: v.id } });
    check('inventory: set stock', v2.stock === v.stock + 7, `${sku}: ${v.stock} → ${v2.stock} messages=${JSON.stringify(await toasts())}`);
    await db.productVariant.update({ where: { id: v.id }, data: { stock: v.stock } });
  });

  // ───────────── ORDERS ─────────────
  await run('orders: status, notes, shipment', async () => {
    const o = await db.order.findFirst({ where: { status: { in: ['PAID', 'PROCESSING'] } }, include: { shipments: true } });
    await go('/admin/orders/' + o.id);
    const opts = await b.eval(`const s = document.querySelector('form [name=status]'); return [...s.options].filter(x => !x.disabled).map(x => x.value);`);
    const target = opts.find((x) => x && x !== o.status && !['CANCELLED', 'REFUNDED', 'PENDING'].includes(x));
    await b.eval(`window.__set(document.querySelector('form [name=status]'), '${target}'); [...document.querySelector('form [name=status]').form.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const o2 = await db.order.findUnique({ where: { id: o.id } });
    check('orders: change status', o2.status === target, `${o.status} → ${o2.status} (wanted ${target}) messages=${JSON.stringify(await toasts())}`);
    await b.eval(`const n = document.querySelector('form [name=notes]'); window.__set(n, 'QA internal note'); [...n.form.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const o3 = await db.order.findUnique({ where: { id: o.id } });
    check('orders: save internal notes', (o3.adminNotes ?? '').includes('QA internal note'), `adminNotes="${o3.adminNotes}"`);
    await b.eval(`window.__btn('Add shipment').click();`);
    await sleep(900);
    const shipFields = await b.eval(`const d = window.__dialog(); return d ? [...d.querySelectorAll('input,select,textarea')].map(e => e.name || e.id) : []`);
    await b.eval(`const d = window.__dialog(); const f = (n) => d.querySelector('[name=' + n + ']'); if (f('carrier')) window.__set(f('carrier'), f('carrier').tagName === 'SELECT' ? f('carrier').options[1].value : 'BlueDart'); if (f('trackingNumber')) window.__set(f('trackingNumber'), 'QA123456789IN'); [...d.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const ships = await db.shipment.findMany({ where: { orderId: o.id } });
    check('orders: add shipment', ships.some((s) => s.trackingNumber === 'QA123456789IN'), `fields=${shipFields.join(',')} shipments=${ships.length} messages=${JSON.stringify(await toasts())}`);
    await db.shipment.deleteMany({ where: { orderId: o.id, trackingNumber: 'QA123456789IN' } });
    await db.order.update({ where: { id: o.id }, data: { status: o.status, adminNotes: o.adminNotes } });
  });

  await run('orders: CSV export', async () => {
    const csv = await b.eval(`const r = await fetch('/api/admin/orders/export'); return { status: r.status, type: r.headers.get('content-type'), head: (await r.text()).split('\\n').slice(0, 2).join(' / ').slice(0, 300) };`);
    check('orders: CSV export', csv.status === 200 && /csv/.test(csv.type), `${csv.type} ${csv.head}`);
  });

  // ───────────── CUSTOMERS ─────────────
  await run('customers: make & remove administrator', async () => {
    const u = await db.user.findFirst({ where: { role: 'CUSTOMER' } });
    await go('/admin/customers/' + u.id);
    await b.eval(`window.__btn('Make administrator').click();`);
    await sleep(800);
    if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await sleep(2500);
    const u2 = await db.user.findUnique({ where: { id: u.id } });
    check('customers: make administrator', u2.role === 'ADMIN', `role=${u2.role} messages=${JSON.stringify(await toasts())}`);
    await go('/admin/customers/' + u.id);
    const removeLabel = await b.eval(`return [...document.querySelectorAll('button')].map(x => x.textContent.trim()).find(t => /remove admin|make customer|revoke|demote/i.test(t)) ?? null`);
    if (removeLabel) {
      await b.eval(`window.__btn(${JSON.stringify(removeLabel)}).click();`);
      await sleep(800);
      if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
      await sleep(2500);
    }
    const u3 = await db.user.findUnique({ where: { id: u.id } });
    check('customers: remove administrator', u3.role === 'CUSTOMER', `button="${removeLabel}" role=${u3.role}`);
    if (u3.role !== 'CUSTOMER') await db.user.update({ where: { id: u.id }, data: { role: 'CUSTOMER' } });
  });

  // ───────────── COUPONS ─────────────
  await run('coupons: create (₹), edit, delete', async () => {
    await go('/admin/coupons');
    await b.eval(`window.__btn('New coupon').click();`);
    await sleep(900);
    await b.eval(`const d = window.__dialog(); const f = (n) => d.querySelector('[name=' + n + ']');
      window.__set(f('code'), 'QA500'); window.__set(f('type'), 'FIXED');`);
    await sleep(300);
    await b.eval(`const d = window.__dialog(); const f = (n) => d.querySelector('[name=' + n + ']');
      window.__set(f('value'), '₹500'); window.__set(f('minSubtotal'), '₹10,000'); [...d.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const c = await db.coupon.findUnique({ where: { code: 'QA500' } });
    check('coupons: create ₹500 off over ₹10,000', !!c && c.value === 50000 && c.minSubtotal === 1000000, c ? `value=₹${c.value / 100} min=₹${c.minSubtotal / 100}` : `messages=${JSON.stringify(await toasts())} alerts=${JSON.stringify(await b.eval(`return [...document.querySelectorAll('[role=alert]')].map(n=>n.textContent.trim()).filter(Boolean)`))}`);
    if (!c) return;
    await go('/admin/coupons');
    await b.eval(`window.__btn('Edit QA500').click();`);
    await sleep(900);
    await b.eval(`const d = window.__dialog(); window.__set(d.querySelector('[name=value]'), '750'); [...d.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const c2 = await db.coupon.findUnique({ where: { code: 'QA500' } });
    check('coupons: edit', c2.value === 75000, `value=₹${c2.value / 100}`);
    await b.eval(`window.__btn('QA500 active').click();`);
    await sleep(2000);
    const c3 = await db.coupon.findUnique({ where: { code: 'QA500' } });
    check('coupons: toggle active', c3.isActive === !c2.isActive, `isActive ${c2.isActive} → ${c3.isActive}`);
    await b.eval(`window.__btn('Delete QA500').click();`);
    await sleep(800);
    await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await sleep(2500);
    check('coupons: delete', !(await db.coupon.findUnique({ where: { code: 'QA500' } })));
  });

  // ───────────── REVIEWS ─────────────
  await run('reviews: approve / reject', async () => {
    const pending = await db.review.findMany({ where: { status: 'PENDING' }, take: 2, orderBy: { createdAt: 'desc' } });
    if (pending.length < 2) { check('reviews: approve / reject', false, `only ${pending.length} pending reviews to test with`); return; }
    await go('/admin/reviews?status=PENDING');
    await b.eval(`[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Approve').click();`);
    await sleep(2500);
    await go('/admin/reviews?status=PENDING');
    await b.eval(`[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Reject').click();`);
    await sleep(800);
    if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await sleep(2500);
    const after = await db.review.findMany({ where: { id: { in: pending.map((p) => p.id) } } });
    const statuses = after.map((r) => r.status).sort();
    check('reviews: approve / reject', statuses.includes('APPROVED') && statuses.includes('REJECTED'), statuses.join(','));
    for (const r of pending) await db.review.update({ where: { id: r.id }, data: { status: 'PENDING' } });
  });

  // ───────────── BESPOKE / PARTNERS / MESSAGES ─────────────
  await run('bespoke: status & notes', async () => {
    const r = await db.bespokeRequest.findFirst({ where: { status: 'NEW' } });
    await go('/admin/bespoke/' + r.id);
    await b.eval(`window.__btn('Move to in review').click();`);
    await sleep(2500);
    const r2 = await db.bespokeRequest.findUnique({ where: { id: r.id } });
    check('bespoke: move to in review', r2.status === 'IN_REVIEW', `status=${r2.status}`);
    await go('/admin/bespoke/' + r.id);
    await b.eval(`const n = document.querySelector('[name=adminNotes]'); window.__set(n, 'QA designer note'); [...n.form.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const r3 = await db.bespokeRequest.findUnique({ where: { id: r.id } });
    check('bespoke: save notes', (r3.adminNotes ?? '').includes('QA designer note'), `adminNotes=${r3.adminNotes}`);
    await db.bespokeRequest.update({ where: { id: r.id }, data: { status: r.status, adminNotes: r.adminNotes } });
  });

  await run('partners: approve', async () => {
    const p = await db.partnerApplication.findFirst({ where: { status: { not: 'APPROVED' } } });
    await go('/admin/partners/' + p.id);
    await b.eval(`window.__btn('Approve').click();`);
    await sleep(800);
    if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await sleep(2500);
    const p2 = await db.partnerApplication.findUnique({ where: { id: p.id } });
    check('partners: approve', p2.status === 'APPROVED', `${p.status} → ${p2.status}`);
    await db.partnerApplication.update({ where: { id: p.id }, data: { status: p.status } });
  });

  await run('messages: mark all as read', async () => {
    // make sure there is something to mark as read
    const latest = await db.contactMessage.findMany({ take: 2, orderBy: { createdAt: 'desc' }, select: { id: true } });
    await db.contactMessage.updateMany({ where: { id: { in: latest.map((m) => m.id) } }, data: { isRead: false } });
    const unread = await db.contactMessage.count({ where: { isRead: false } });
    await go('/admin/messages');
    await b.eval(`window.__btn('Mark all as read').click();`);
    await sleep(800);
    if (await b.eval(`return !!window.__dialog()`)) await b.eval(`const d = window.__dialog(); [...d.querySelectorAll('button')].filter(x => !/cancel/i.test(x.textContent)).pop().click();`);
    await sleep(2500);
    const left = await db.contactMessage.count({ where: { isRead: false } });
    check('messages: mark all as read', left === 0, `unread ${unread} → ${left}`);
  });

  // ───────────── SHIPPING ─────────────
  await run('shipping: methods price in ₹ & shipment row', async () => {
    await go('/admin/shipping');
    const before = (await db.setting.findUnique({ where: { key: 'store' } })).value.shippingMethods;
    const ok = await b.eval(`const f = [...document.querySelectorAll('form')].find(f => /Save methods/.test(f.textContent)); const inputs = [...f.querySelectorAll('input')]; const price = inputs.find(i => /price/i.test((i.getAttribute('aria-label') || '') + (i.name || '') + (i.id || '')) && i.value === '1500'); if (!price) return inputs.map(i => (i.getAttribute('aria-label') || i.name || i.id) + '=' + i.value).join(' | '); window.__set(price, '1,600'); [...f.querySelectorAll('button[type=submit]')].pop().click(); return 'clicked';`);
    await sleep(2500);
    const after = (await db.setting.findUnique({ where: { key: 'store' } })).value.shippingMethods;
    const exp = after.find((m) => m.id === 'express');
    check('shipping: save Express price ₹1,600', exp?.price === 160000, ok === 'clicked' ? `express=₹${exp?.price / 100} messages=${JSON.stringify(await toasts())}` : 'inputs: ' + ok);
    const s = await db.setting.findUnique({ where: { key: 'store' } });
    await db.setting.update({ where: { key: 'store' }, data: { value: { ...s.value, shippingMethods: before } } });
    await go('/admin/shipping');
    const ship = await b.eval(`return document.querySelector('form [name=trackingNumber]').form.querySelector('[name=id]').value;`);
    const original = await db.shipment.findUnique({ where: { id: ship } });
    await b.eval(`const f = document.querySelector('form [name=trackingNumber]').form; window.__set(f.querySelector('[name=trackingNumber]'), 'QA-TRACK-1'); [...f.querySelectorAll('button[type=submit]')].pop().click();`);
    await sleep(2500);
    const sh = await db.shipment.findUnique({ where: { id: ship } });
    check('shipping: save shipment row', sh?.trackingNumber === 'QA-TRACK-1', `tracking=${sh?.trackingNumber}`);
    // put the real tracking number back
    if (original && original.trackingNumber !== 'QA-TRACK-1') await db.shipment.update({ where: { id: ship }, data: { trackingNumber: original.trackingNumber, status: original.status } });
  });

  // ───────────── SETTINGS ─────────────
  await run('settings: every form saves', async () => {
    for (const label of ['Save announcements', 'Save tax', 'Save returns', 'Save inventory', 'Save searches', 'Save hero']) {
      await go('/admin/settings');
      const before = (await db.setting.findUnique({ where: { key: 'store' } })).updatedAt;
      await b.eval(`window.__btn('${label}').click();`);
      await sleep(2500);
      const after = (await db.setting.findUnique({ where: { key: 'store' } })).updatedAt;
      const err = await anyError();
      check('settings: ' + label, after > before && !err, err ? `error="${err}"` : '');
    }
    const s = (await db.setting.findUnique({ where: { key: 'store' } })).value;
    check('settings: values intact after saves', s.taxRate === 0.03 && s.taxLabel === 'GST' && s.shippingMethods?.length === 3, `tax=${s.taxRate} label=${s.taxLabel}`);
  });

  console.log('\nconsole errors seen:', b.consoleErrors.length ? b.consoleErrors.slice(0, 15) : 'none');

  // Several tests restore data straight in the database, which bypasses the storefront caches.
  // Save once through the real admin so the settings and catalogue caches are refreshed and the
  // local shop shows the true data again (no test banner, prices or descriptions left behind).
  await go('/admin/settings');
  await b.eval(`window.__btn('Save hero').click();`);
  const settingsRefreshed = await waitToast(/saved|updated|hero/i, 15000);
  await go('/admin/categories');
  await b.eval(`window.__btn('Edit Pendants').click();`);
  await sleep(900);
  await b.eval(`const d = window.__dialog() || document; [...d.querySelectorAll('button[type=submit]')].pop().click();`);
  const catalogRefreshed = await waitToast(/saved|updated/i, 15000);
  check('cleanup: storefront caches refreshed', !!settingsRefreshed && !!catalogRefreshed, `settings="${settingsRefreshed}" catalogue="${catalogRefreshed}"`);
} finally {
  await b.close();
  await db.$disconnect();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}
