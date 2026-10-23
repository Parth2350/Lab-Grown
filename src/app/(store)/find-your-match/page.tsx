import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { getQuizDefinition } from '@/lib/server/recommend';
import { getCurrency } from '@/lib/server/currency';
import { localizeRupees } from '@/lib/utils';
import { QuizWizard } from '@/components/content/quiz/QuizWizard';
import { PageIntro, TextLink } from '@/components/content/ui';

export const revalidate = 3600;

export const metadata = pageMeta({
  title: 'Find Your Match — Jewelry Quiz',
  description: `Answer a few quick questions and ${site.name} will recommend lab-grown diamond jewelry matched to your style, occasion, metal, diamond shape and budget.`,
  path: '/find-your-match',
});

export default async function FindYourMatchPage() {
  const [quiz, currency] = await Promise.all([getQuizDefinition(), getCurrency()]);
  // budget answers read in the shopper's currency
  const questions = quiz.questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o, label: localizeRupees(o.label, currency) })) }));
  return (
    <>
      <PageIntro
        crumbs={[{ label: 'Find Your Match', href: '/find-your-match' }]}
        eyebrow="Personal Recommendations"
        title={quiz.title}
        intro={
          <>
            Shopping for an engagement ring, a gift or a little something for yourself? Answer a few questions and we will match you with pieces from our
            collection. Prefer to talk to a person? <TextLink href="/contact">Our concierge is here</TextLink>.
          </>
        }
        className="pb-8 md:pb-10"
      />
      <section aria-label="Find your match quiz" className="container-x pb-16 md:pb-24">
        <QuizWizard questions={questions} />
      </section>
    </>
  );
}
