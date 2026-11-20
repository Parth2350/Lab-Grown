// Loads a database file made from the live shop (schema + all rows) into an EMPTY Postgres database, e.g. a new
// Supabase project — in one transaction, so a failure leaves the database untouched.
//
//   node scripts/db-restore.mjs backups/thevjewels-database-2026-11-20.sql
//
// The target comes from DIRECT_URL (else DATABASE_URL) in the environment or in .env.newvercel.local — the
// Supabase "Connect → ORMs → Prisma" lines. Afterwards the admin password is set to SEED_ADMIN_PASSWORD if given.
import { readFileSync, existsSync } from 'node:fs';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const file = process.argv[2];
if (!file || !existsSync(file)) throw new Error('Usage: node scripts/db-restore.mjs <database.sql>');

const local = existsSync('.env.newvercel.local')
  ? Object.fromEntries(
      readFileSync('.env.newvercel.local', 'utf8')
        .split(/\r?\n/)
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]),
    )
  : {};
const get = (k) => process.env[k] || local[k];
const target = get('DIRECT_URL') || get('DATABASE_URL');
if (!target || !/^postgres(ql)?:\/\//.test(target)) throw new Error('Put your Supabase DIRECT_URL (port 5432) into .env.newvercel.local first.');

const url = new URL(target);
url.search = ''; // drop ?pgbouncer=true&sslmode=… (Prisma-only options)
const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
const db = new pg.Client({ connectionString: url.toString(), ssl: isLocal ? false : { rejectUnauthorized: false } });
await db.connect();
console.log(`Connected to ${url.hostname}`);

const { rows: existing } = await db.query(`select count(*)::int n from pg_tables where schemaname = 'public' and tablename in ('products', '_prisma_migrations')`);
if (existing[0].n) throw new Error('This database already has the shop tables — refusing to overwrite. Use a new, empty project.');

const sql = readFileSync(file, 'utf8');
const expected = JSON.parse(sql.match(/^-- expected-rows (.+)$/m)[1]);
console.log('Loading … (about a minute)');
// schema, then one statement per data line (each INSERT is a single line), then the closing statements
const lines = sql.split('\n');
const first = lines.findIndex((l) => l.startsWith('INSERT INTO'));
const last = lines.findLastIndex((l) => l.startsWith('INSERT INTO'));
await db.query('BEGIN');
try {
  await db.query(lines.slice(0, first).join('\n'));
  for (let i = first; i <= last; i++) {
    if (lines[i].startsWith('INSERT INTO')) await db.query(lines[i]);
    if (i % 10 === 0) process.stdout.write('.');
  }
  process.stdout.write('\n');
  await db.query(lines.slice(last + 1).join('\n'));
  for (const [table, n] of Object.entries(expected)) {
    const { rows } = await db.query(`select count(*)::int n from public."${table}"`);
    if (rows[0].n !== n) throw new Error(`${table}: expected ${n} rows, found ${rows[0].n}`);
  }
  const password = get('SEED_ADMIN_PASSWORD');
  if (password) {
    const email = get('SEED_ADMIN_EMAIL');
    const { rowCount } = await db.query(`update users set "passwordHash" = $1 where role = 'ADMIN'${email ? ' and email = $2' : ''}`, email ? [await bcrypt.hash(password, 10), email] : [await bcrypt.hash(password, 10)]);
    console.log(rowCount ? 'Admin password set to SEED_ADMIN_PASSWORD.' : 'Note: no admin with SEED_ADMIN_EMAIL found — admin password unchanged.');
  }
  await db.query('COMMIT');
} catch (e) {
  await db.query('ROLLBACK');
  throw e;
}
const total = Object.values(expected).reduce((a, b) => a + b, 0);
console.log(`Done — ${Object.keys(expected).length} tables, ${total.toLocaleString()} rows, all counts match.`);
await db.end();
