import { site } from '@/config/site';
import { MATCH_CATEGORIES } from '@/config/quiz';
import { pageMeta } from '@/lib/seo';
import { getProductsWhere } from '@/lib/server/catalog';
import { MatchQuiz } from '@/components/content/quiz/MatchQuiz';

export const revalidate = 3600;

export const metadata = pageMeta({
  title: 'Find Your Match — a 60-second diamond style quiz',
  description: `Answer four quick questions and ${site.name} will match you with natural and lab-grown diamond jewelry chosen for your occasion, budget and taste.`,
  path: '/find-your-match',
});

export default async function FindYourMatchPage() {
  // each "What for" card shows that category's first product
  const firsts = await Promise.all(MATCH_CATEGORIES.map((c) => getProductsWhere({ category: c.slug }, {}, 1)));
  const categoryImages = Object.fromEntries(MATCH_CATEGORIES.map((c, i) => [c.slug, firsts[i][0]?.images.find((m) => m.kind === 'image')?.url]));
  return <MatchQuiz categoryImages={categoryImages} />;
}
