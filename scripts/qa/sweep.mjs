// Opens every admin page and the main storefront pages on desktop and on a 390px phone,
// reporting crashes, console errors and sideways overflow.   npm run qa:sweep
import { launch } from './cdp.mjs';
import { login } from './login.mjs';
import { BASE, TMP, projectRequire } from './env.mjs';

const { PrismaClient } = projectRequire('@prisma/client');
const db = new PrismaClient();
const one = async (model, where = {}) => (await db[model].findFirst({ where, select: { id: true } }))?.id;
const [bespoke, collection, customer, diamond, order, partner, product] = await Promise.all([
  one('bespokeRequest'),
  one('collection'),
  one('user', { role: 'CUSTOMER' }),
  one('diamond'),
  one('order'),
  one('partnerApplication'),
  one('product'),
]);
const slugOf = async (where) => (await db.product.findFirst({ where: { isActive: true, ...where }, orderBy: { position: 'asc' }, select: { slug: true } }))?.slug;
const productSlug = await slugOf({ optionAxes: { hasEvery: ['shape', 'carat'] } });
const ringSlug = await slugOf({ requiresSize: true, NOT: { ringSizes: { isEmpty: true } } });
const lengthSlug = await slugOf({ optionAxes: { has: 'length' } });
await db.$disconnect();

const admin = [
  '/admin', '/admin/analytics', '/admin/bespoke', '/admin/categories', '/admin/collections', '/admin/collections/new', '/admin/coupons',
  '/admin/customers', '/admin/diamonds', '/admin/diamonds/new', '/admin/inventory', '/admin/messages', '/admin/orders', '/admin/partners',
  '/admin/payments', '/admin/products', '/admin/products/new', '/admin/reviews', '/admin/settings', '/admin/shipping',
  `/admin/bespoke/${bespoke}`, `/admin/collections/${collection}`, `/admin/customers/${customer}`, `/admin/diamonds/${diamond}`,
  `/admin/orders/${order}`, `/admin/partners/${partner}`, `/admin/products/${product}`,
];
const store = [
  '/', '/engagement-rings', '/wedding-bands', '/necklaces', '/collections/all?shape=round', '/collections/gifts-under-50000',
  `/products/${productSlug}`, `/products/${ringSlug}`, `/products/${lengthSlug}`, '/search?q=oval', '/cart', '/wishlist', '/compare', '/gifts', '/bespoke', '/find-your-match',
  '/about', '/contact', '/partner-program', '/pages/faq', '/pages/lab-grown-diamonds', '/account',
];

let problems = 0;
for (const mobile of [false, true]) {
  const b = await launch({ profile: TMP + '/chrome-sweep', port: mobile ? 9338 : 9337, mobile });
  try {
    await login(b);
    for (const p of [...admin, ...store]) {
      const before = b.consoleErrors.length;
      await b.goto(BASE + p, 1800);
      const r = await b.eval(`return { crashed: /Something went wrong|Application error|could not be found/.test(document.body.innerText), overflow: document.documentElement.scrollWidth - innerWidth }`);
      const errs = b.consoleErrors.slice(before);
      if (r.crashed || errs.length || (mobile && r.overflow > 1)) {
        problems++;
        console.log(`PROBLEM ${mobile ? 'phone' : 'desktop'} ${p}: crashed=${r.crashed} overflowPx=${r.overflow} errors=${errs.join(' || ').slice(0, 300)}`);
      }
    }
    console.log(`${mobile ? 'PHONE 390px' : 'DESKTOP'}: ${admin.length + store.length} pages checked`);
  } finally {
    await b.close();
  }
}
console.log(problems ? `${problems} page problem(s) found` : 'No page problems found');
if (problems) process.exitCode = 1;
