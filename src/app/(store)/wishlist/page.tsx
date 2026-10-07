import { Suspense } from 'react';
import { pageMeta } from '@/lib/seo';
import { WishlistView } from '@/components/commerce/WishlistView';

export const metadata = pageMeta({
  title: 'Your Wishlist',
  description: 'The pieces you have saved — compare, share and move them to your bag when you are ready.',
  path: '/wishlist',
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="container-x min-h-[50vh] py-16" aria-busy="true" />}>
      <WishlistView />
    </Suspense>
  );
}
