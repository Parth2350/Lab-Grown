import { BASE } from './env.mjs';

/** Signs in to the LOCAL admin (the seed's demo account unless QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD are set). */
export async function login(b) {
  const email = process.env.QA_ADMIN_EMAIL ?? 'admin@aurevia.example';
  const password = process.env.QA_ADMIN_PASSWORD ?? 'Aurevia@Admin1';
  await b.goto(BASE + '/admin', 2000);
  if (await b.eval(`return location.pathname.startsWith('/admin')`)) return true;
  await b.goto(BASE + '/account/login?callbackUrl=/admin', 2500);
  await b.eval(`
    const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    set(document.querySelector('main input[type=email], form input[type=email]'), ${JSON.stringify(email)});
    set(document.querySelector('input[type=password]'), ${JSON.stringify(password)});
    [...document.querySelectorAll('button[type=submit]')].find(x => /sign in/i.test(x.textContent)).click();`);
  return b.waitFor(`location.pathname.startsWith('/admin')`, 30000);
}
