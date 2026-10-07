import { redirect } from 'next/navigation';
import { pageMeta } from '@/lib/seo';
import { getSession } from '@/lib/server/auth';
import { safeCallbackUrl } from '@/components/commerce/schemas';
import { LoginForm } from '@/components/account/LoginForm';

export const metadata = pageMeta({
  title: 'Sign In',
  description: 'Sign in to track orders, save addresses and check out faster.',
  path: '/account/login',
  noIndex: true,
});

type Search = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl, '/account');
  const session = await getSession();
  // Already signed in: go straight on — unless they were bounced from the admin area.
  if (session?.user?.id && sp.error !== 'admin') redirect(callbackUrl);
  return <LoginForm callbackUrl={callbackUrl} adminNotice={sp.error === 'admin'} signedInAs={session?.user?.email ?? null} />;
}
