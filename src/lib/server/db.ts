import 'server-only';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Vercel's Postgres integrations (Neon, Supabase) expose a pooled, Prisma-ready URL as
// POSTGRES_PRISMA_URL; everywhere else DATABASE_URL is used.
const datasourceUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
