// Production build used by Vercel (`npm run vercel-build`):
//   1. generate the Prisma client
//   2. apply pending migrations
//   3. on the very first deploy (empty database) set the store up — production: settings, categories, collections and
//      the admin only (no demo data); previews: the demo catalogue
//   4. production: import the partner catalogue (data/catalog) — once per catalogue version, in one transaction
//   5. build Next.js
//
// Works with DATABASE_URL directly or with the variables Vercel's Postgres
// integrations inject (Neon / Supabase: POSTGRES_PRISMA_URL + an unpooled URL). A Supabase database connected with
// the prefix "SUPABASE" (beside the old Neon one) takes precedence.
import { execSync } from 'node:child_process';

const env = process.env;
const supabase = !!env.SUPABASE_POSTGRES_PRISMA_URL;
const pooled = env.SUPABASE_POSTGRES_PRISMA_URL || env.POSTGRES_PRISMA_URL || env.DATABASE_URL;
// Supabase's transaction pooler (port 6543) can't run migrations — use the session pooler (5432) on the same host
const sessionPooler = (u) => {
  try {
    const x = new URL(u);
    if (!x.hostname.endsWith('.pooler.supabase.com') || x.port !== '6543') return u;
    x.port = '5432';
    x.searchParams.delete('pgbouncer');
    return x.toString();
  } catch {
    return u;
  }
};
const direct = sessionPooler((supabase ? env.SUPABASE_POSTGRES_URL_NON_POOLING : env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DIRECT_URL) || pooled);
console.log(`Database: ${supabase ? 'Supabase' : env.NEON_PROJECT_ID ? 'Neon' : 'DATABASE_URL'}`);

const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};
if (!pooled) fail('No database configured. Connect a Postgres database to this project (or set DATABASE_URL) and redeploy.');
// catch the usual copy-paste slips with a plain message instead of a Prisma stack trace
for (const [name, u] of [['DATABASE_URL', pooled], ['DIRECT_URL', direct]]) {
  if (/PASTE-FROM-SUPABASE|\[YOUR-PASSWORD\]|YOUR-PASSWORD/.test(u)) fail(`${name} still contains a placeholder — paste the line from Supabase (Connect → ORMs → Prisma) with your database password in it.`);
  if (/^\s|\s$|^["']|["']$/.test(u)) fail(`${name} has quotes or spaces around it — in Vercel the value must start with postgresql:// and end without a quote.`);
  let x;
  try {
    x = new URL(u);
  } catch {
    fail(`${name} is not a valid postgresql:// link. If your database password has symbols (@ # / ? % :), reset it in Supabase to letters and numbers only.`);
  }
  if (!/^postgres(ql)?:$/.test(x.protocol)) fail(`${name} must start with postgresql:// (copy only the part inside the quotes).`);
  if (/^db\..+\.supabase\.co$/.test(x.hostname)) fail(`${name} uses Supabase's direct host (${x.hostname}), which Vercel can't reach — use the pooler lines from Supabase → Connect → ORMs → Prisma.`);
}
const where = new URL(direct);
console.log(`Migrations via ${where.hostname}:${where.port || 5432} as ${decodeURIComponent(where.username)}`);

const run = (cmd, extra = {}) => execSync(cmd, { stdio: 'inherit', env: { ...env, DATABASE_URL: pooled, ...extra } });

run('npx prisma generate');
// migrations need a direct (non-pooled) connection
run('npx prisma migrate deploy', { DATABASE_URL: direct });

const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient({ datasourceUrl: direct });
const products = await db.product.count().catch(() => 0);
await db.$disconnect();

if (products === 0) {
  if (!env.SEED_ADMIN_PASSWORD) {
    console.error('\n✖ First deploy: set SEED_ADMIN_PASSWORD (and optionally SEED_ADMIN_EMAIL) so the admin account is not created with the public demo password.\n');
    process.exit(1);
  }
  const live = env.VERCEL_ENV === 'production';
  console.log(live ? 'Empty database — setting up the store (no demo data) …' : 'Empty database — loading the demo catalogue …');
  run(`npx tsx prisma/seed.ts${live ? ' --store' : ''}`, { DATABASE_URL: direct });
} else {
  console.log(`Database already has ${products} products — skipping seed.`);
}

// Preview deployments never import, so they can't change live data.
if (env.VERCEL_ENV === 'production' || env.CATALOG_IMPORT === '1') run('node scripts/catalog/import.mjs', { DATABASE_URL: direct });

run('npx next build');
