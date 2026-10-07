import { Suspense } from 'react';
import { pageMeta } from '@/lib/seo';
import { getSession } from '@/lib/server/auth';
import { SuccessView } from '@/components/checkout/SuccessView';

export const metadata = pageMeta({
  title: 'Order Confirmed',
  description: 'Thank you for your order.',
  path: '/checkout/success',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage() {
  const session = await getSession();
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] py-24" aria-busy="true" />}>
      <SuccessView signedIn={!!session?.user?.id} />
    </Suspense>
  );
}
