import { pageMeta } from '@/lib/seo';
import { CompareView } from '@/components/commerce/CompareView';

export const metadata = pageMeta({
  title: 'Compare Pieces',
  description: 'Compare diamond shape, carat, metal, colour, clarity and certification side by side.',
  path: '/compare',
  noIndex: true,
});

export default function ComparePage() {
  return <CompareView />;
}
