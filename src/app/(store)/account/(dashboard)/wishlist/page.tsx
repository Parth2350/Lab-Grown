import { Suspense } from 'react';
import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';
import { WishlistView } from '@/components/commerce/WishlistView';

export const metadata = pageMeta({ title: 'Wishlist', description: 'Pieces you have saved.', path: '/account/wishlist', noIndex: true });

export default async function AccountWishlistPage() {
  await requireUser('/account/wishlist');
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      <WishlistView variant="account" />
    </Suspense>
  );
}
