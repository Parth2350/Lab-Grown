import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { faqLd, pageMeta } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqList } from '@/components/content/FaqSection';
import { InfoShell, type DocSection } from '@/components/content/pages/InfoShell';
import { CONTENT_SLUGS, getContentPage, type ContentSlug } from '@/components/content/pages/registry';
import { careIntro, careSections, refundIntro, refundSections, returnsIntro, returnsSections, shippingIntro, shippingSections, warrantyIntro, warrantySections } from '@/components/content/pages/care';
import { cookieIntro, cookieSections, privacyIntro, privacySections, termsIntro, termsSections } from '@/components/content/pages/legal';
import { ALL_FAQS, FAQ_GROUPS } from '@/components/content/pages/faq-data';
import { ManufacturingBody, ManufacturingHero } from '@/components/content/pages/Manufacturing';
import { site } from '@/config/site';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CONTENT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) return {};
  return pageMeta({ title: page.title, description: page.description, path: `/pages/${page.slug}`, type: 'article' });
}

const DOCS: Partial<Record<ContentSlug, { intro: string; sections: DocSection[] }>> = {
  'shipping-policy': { intro: shippingIntro, sections: shippingSections },
  returns: { intro: returnsIntro, sections: returnsSections },
  'refund-policy': { intro: refundIntro, sections: refundSections },
  warranty: { intro: warrantyIntro, sections: warrantySections },
  'care-guide': { intro: careIntro, sections: careSections },
  'privacy-policy': { intro: privacyIntro, sections: privacySections },
  terms: { intro: termsIntro, sections: termsSections },
  'cookie-policy': { intro: cookieIntro, sections: cookieSections },
};

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) notFound();

  const href = `/pages/${page.slug}`;
  const crumbs = [{ label: page.title, href }];
  const doc = DOCS[page.slug as ContentSlug];

  if (doc) {
    return <InfoShell currentHref={href} crumbs={crumbs} eyebrow={page.eyebrow} title={page.title} intro={doc.intro} updated={page.updated} sections={doc.sections} />;
  }

  let body: ReactNode = null;
  let intro: string = page.description;
  let hero: ReactNode = null;

  if (page.slug === 'faq') {
    intro = `Everything you might like to know about our diamonds, orders and craftsmanship. If your question is not here, our concierge is always happy to help.`;
    body = (
      <>
        <nav aria-label="FAQ topics" className="mb-12 flex flex-wrap gap-2">
          {FAQ_GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="inline-flex h-10 items-center border border-line bg-white px-4 text-[11px] uppercase tracking-[0.14em] text-charcoal transition-colors hover:border-ink">
              {g.title}
            </a>
          ))}
        </nav>
        <div className="space-y-14">
          {FAQ_GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-32">
              <h2 id={`${g.id}-title`} className="mb-4 font-serif text-[1.75rem] font-light">
                {g.title}
              </h2>
              <FaqList items={g.items} withSchema={false} />
            </section>
          ))}
        </div>
        <JsonLd data={faqLd(ALL_FAQS)} />
      </>
    );
  } else if (page.slug === 'manufacturing') {
    intro = `Every ${site.name} piece is created by our own artisans, in our own workshop — from the first pencil sketch to the moment it is placed in its box.`;
    hero = <ManufacturingHero />;
    body = <ManufacturingBody />;
  }

  return (
    <InfoShell currentHref={href} crumbs={crumbs} eyebrow={page.eyebrow} title={page.title} intro={intro} updated={page.updated} hero={hero}>
      {body}
    </InfoShell>
  );
}
