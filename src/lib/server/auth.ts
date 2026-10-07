import 'server-only';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';
import { db } from './db';

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/account/login' },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await db.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: { email: user.email.toLowerCase(), name: user.name, image: user.image },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        const row = await db.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { id: true, role: true, name: true } });
        if (row) {
          token.uid = row.id;
          token.role = row.role;
          token.name = row.name;
        }
      }
      if (trigger === 'update' && session?.name) token.name = session.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = (token.role as 'ADMIN' | 'CUSTOMER') ?? 'CUSTOMER';
        session.user.name = (token.name as string) ?? session.user.name;
      }
      return session;
    },
  },
};

/**
 * Session for the current request. A JWT can outlive its user (account deleted, database
 * re-seeded), so the user is confirmed to still exist — cached per request.
 */
export const getSession = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return session;
  const exists = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  return exists ? session : null;
});

export async function requireUser(callbackUrl = '/account') {
  const session = await getSession();
  if (!session?.user?.id) redirect(`/account/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return session.user;
}

/** The JWT carries the role from sign-in; admin checks re-read it so demotions apply immediately. */
async function isAdminNow(userId: string) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === 'ADMIN';
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/account/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN' || !(await isAdminNow(session.user.id))) redirect('/account?error=forbidden');
  return session.user;
}

/** For server actions / route handlers: throws instead of redirecting */
export async function assertAdmin() {
  const session = await getSession();
  if (session?.user?.role !== 'ADMIN' || !(await isAdminNow(session.user.id))) throw new Error('Unauthorized');
  return session.user;
}
