import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';
import { getReturnsOverview } from '@/lib/server/orders';
import { ReturnsPanel } from '@/components/account/ReturnsPanel';

export const metadata = pageMeta({ title: 'Returns', description: 'Request and follow returns.', path: '/account/returns', noIndex: true });

type Search = Promise<{ order?: string }>;

export default async function ReturnsPage({ searchParams }: { searchParams: Search }) {
  const user = await requireUser('/account/returns');
  const sp = await searchParams;
  const overview = await getReturnsOverview(user.id);
  return (
    <ReturnsPanel
      eligible={overview.eligible}
      requests={overview.requests}
      returnsDays={overview.returnsDays}
      preselect={sp.order ? sp.order.toUpperCase() : null}
    />
  );
}
