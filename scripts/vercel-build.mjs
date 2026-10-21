// Production build used by Vercel (`npm run vercel-build`):
//   1. generate the Prisma client
//   2. apply pending migrations
//   3. on the very first deploy (empty database) load the demo catalogue
//   4. production: import the partner catalogue (data/catalog) — once per catalogue version, in one transaction
//   5. build Next.js
//
// Works with DATABASE_URL directly or with the variables Vercel's Postgres
// integrations inject (Neon / Supabase: POSTGRES_PRISMA_URL + an unpooled URL).
import { execSync } from 'node:child_process';

const env = process.env;
const pooled = env.POSTGRES_PRISMA_URL || env.DATABASE_URL;
const direct = env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DIRECT_URL || pooled;

if (!pooled) {
  console.error('\n✖ No database configured. Connect a Postgres database to this project (or set DATABASE_URL) and redeploy.\n');
  process.exit(1);
}

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
  console.log('Empty database — loading the demo catalogue …');
  run('npx tsx prisma/seed.ts', { DATABASE_URL: direct });
} else {
  console.log(`Database already has ${products} products — skipping seed.`);
}

// Preview deployments never import, so they can't change live data.
if (env.VERCEL_ENV === 'production' || env.CATALOG_IMPORT === '1') run('node scripts/catalog/import.mjs', { DATABASE_URL: direct });

run('npx next build');
