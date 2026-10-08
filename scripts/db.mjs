// Starts a local, embedded PostgreSQL server for development — no install or Docker needed.
// Production should point DATABASE_URL at a managed PostgreSQL instance instead.
//
//   npm run db:start          (leave running in its own terminal)
//
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const port = Number(process.env.PG_PORT ?? 5433);
// Keep the data directory OUT of synced folders (OneDrive/Dropbox lock database files).
const dataDir = process.env.PG_DATA_DIR ?? path.join(os.homedir(), '.aurevia', 'pgdata');
const dbName = process.env.PG_DATABASE ?? 'aurevia';

fs.mkdirSync(path.dirname(dataDir), { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port,
  persistent: true,
  // UTF-8 regardless of the Windows locale (the default WIN1252 cannot store ₹)
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: (e) => console.error(String(e)),
});

const fresh = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));
if (fresh) {
  console.log(`Initialising PostgreSQL cluster in ${dataDir} …`);
  await pg.initialise();
}
await pg.start();
const admin = pg.getPgClient();
await admin.connect();
const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
if (!rowCount) {
  await admin.query(`CREATE DATABASE "${dbName}" ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0`);
  console.log(`Created database "${dbName}".`);
}
await admin.end();

console.log(`\n  PostgreSQL ready → postgresql://postgres:postgres@localhost:${port}/${dbName}\n  Press Ctrl+C to stop.\n`);

const shutdown = async () => {
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
setInterval(() => {}, 1 << 30);
