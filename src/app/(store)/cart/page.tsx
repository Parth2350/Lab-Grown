import { pageMeta } from '@/lib/seo';
import { getTrending } from '@/lib/server/catalog';
import { CartView } from '@/components/checkout/CartView';

export const metadata = pageMeta({
  title: 'Your Bag',
  description: 'Review the pieces in your bag, apply a promo code and continue to secure checkout.',
  path: '/cart',
  noIndex: true,
});

export default async function CartPage() {
  const recommendations = await getTrending(8).catch(() => []);
  return <CartView recommendations={recommendations} />;
}
