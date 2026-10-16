import { redirect } from 'next/navigation';
import { pageMeta } from '@/lib/seo';
import { getSession } from '@/lib/server/auth';
import { safeCallbackUrl } from '@/components/commerce/schemas';
import { RegisterForm } from '@/components/account/RegisterForm';

export const metadata = pageMeta({
  title: 'Create an Account',
  description: 'Create an account to track orders and keep a wishlist.',
  path: '/account/register',
  noIndex: true,
});

type Search = Promise<{ callbackUrl?: string; claim?: string }>;

export default async function RegisterPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const claim = sp.claim && /^[A-Z]{3}-\d{6}$/.test(sp.claim) ? sp.claim : null;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl, claim ? `/account/orders/${claim}` : '/account');
  const session = await getSession();
  if (session?.user?.id) redirect(safeCallbackUrl(sp.callbackUrl, '/account'));
  return <RegisterForm callbackUrl={callbackUrl} claim={claim} />;
}
