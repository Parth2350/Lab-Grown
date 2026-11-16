import 'server-only';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Vercel's Postgres integrations expose a pooled, Prisma-ready URL as POSTGRES_PRISMA_URL; everywhere else DATABASE_URL
// is used. Supabase connected beside the old Neon database (prefix "SUPABASE") takes precedence.
const configured = process.env.SUPABASE_POSTGRES_PRISMA_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

// Room for the burst of reads an empty cache causes (e.g. right after a deploy): Prisma's default of a few connections and
// a 10-second wait timed out when the database is far away. Values already in the URL win.
function withPool(url?: string) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '10');
    if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '60');
    return u.toString();
  } catch {
    return url;
  }
}
const datasourceUrl = withPool(configured);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
