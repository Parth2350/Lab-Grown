// New-account welcome offer: signing up issues a personal 15% code, announced once and saved in the account;
// the code works only for its own customer.   npm run qa:welcome   (removes the test accounts it creates)
import { launch } from './cdp.mjs';
import { BASE, TMP, projectRequire } from './env.mjs';

const { PrismaClient } = projectRequire('@prisma/client');
const db = new PrismaClient();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const stamp = Date.now();
const emails = [`qa.welcome.${stamp}@example.com`, `qa.welcome.${stamp}.b@example.com`];
const b = await launch({ profile: TMP + '/chrome-welcome', port: 9339 });

const register = async (email) => {
  await b.send('Network.clearBrowserCookies');
  await b.goto(BASE + '/account/register', 2500);
  // fill only once React has taken over the form, or the click just reloads the page
  await b.waitFor(`Object.keys(document.getElementById('register-name') || {}).some((k) => k.startsWith('__reactProps'))`, 30000);
  await b.eval(`
    const set = (id, v) => { const el = document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('register-name', 'QA Welcome'); set('register-email', ${JSON.stringify(email)}); set('register-password', 'Welcome@Test123');
    document.getElementById('register-name').form.querySelector('button[type=submit]').click(); return 1;`);
  return b.waitFor(`!!document.querySelector('[role=dialog][aria-labelledby=welcome-title]')`, 30000);
};
const validate = (code) =>
  b.eval(
    `const r = await fetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: ${JSON.stringify(code)}, subtotal: 100000 }) }); return r.json();`,
  );

try {
  const shown = await register(emails[0]);
  const code = shown ? await b.eval(`return document.querySelector('[role=dialog] .font-mono')?.textContent`) : null;
  const user = await db.user.findUnique({ where: { email: emails[0] }, include: { coupon: true } });
  const c = user?.coupon;
  check('sign-up shows the welcome gift with a code', shown && /^WELCOME15-[A-Z2-9]{5}$/.test(code ?? ''), `code=${code}`);
  check('the code is a personal, single-use 15% coupon', !!c && c.code === code && c.type === 'PERCENT' && c.value === 15 && c.maxUses === 1, c ? `${c.type} ${c.value} maxUses=${c.maxUses}` : 'no coupon');

  // the notice appears once; the code stays in the account
  await b.eval(`[...document.querySelectorAll('[role=dialog] a')].find(a => /My account/.test(a.textContent)).click(); return 1;`);
  await b.waitFor(`location.pathname === '/account'`, 15000);
  await sleep(1500);
  await b.goto(BASE + '/account', 2500);
  const account = await b.eval(`return { card: document.getElementById('welcome-gift-title')?.closest('section')?.textContent ?? '', dialog: !!document.querySelector('[role=dialog][aria-labelledby=welcome-title]') };`);
  check('the account shows the code; the notice does not come back', account.card.includes(code) && !account.dialog, `dialog again=${account.dialog}`);

  const own = await validate(code);
  check('the owner gets 15% off', own.ok && own.discount === 15000, JSON.stringify(own));

  await b.send('Network.clearBrowserCookies');
  const guest = await validate(code);
  check('signed out, the code is refused', !guest.ok && /sign in/i.test(guest.message), guest.message);

  await register(emails[1]);
  const other = await validate(code);
  check('another account cannot use it', !other.ok && /another account/i.test(other.message), other.message);
} finally {
  await db.user.deleteMany({ where: { email: { in: emails } } }); // their coupons go with them
  await b.close();
  await db.$disconnect();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
