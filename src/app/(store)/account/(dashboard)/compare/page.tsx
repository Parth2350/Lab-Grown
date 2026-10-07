import { redirect } from 'next/navigation';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({ title: 'Compare', path: '/account/compare', noIndex: true });

/** The comparison table lives at /compare (shared by guests and signed-in clients). */
export default function AccountComparePage() {
  redirect('/compare');
}
