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
  onLog: () => {},
  onError: (e) => console.error(String(e)),
});

const fresh = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));
if (fresh) {
  console.log(`Initialising PostgreSQL cluster in ${dataDir} …`);
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase(dbName);
  console.log(`Created database "${dbName}".`);
} catch {
  /* already exists */
}

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
