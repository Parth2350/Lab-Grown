import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';
import { RecentlyViewed } from '@/components/account/RecentlyViewed';

export const metadata = pageMeta({ title: 'Recently Viewed', description: 'Pieces you have recently viewed.', path: '/account/recently-viewed', noIndex: true });

export default async function RecentlyViewedPage() {
  await requireUser('/account/recently-viewed');
  return <RecentlyViewed />;
}
