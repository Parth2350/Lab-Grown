import type { ReactNode } from 'react';
import { AccordionItem } from '@/components/ui/Accordion';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqLd } from '@/lib/seo';
import { cn } from '@/lib/utils';

export type Faq = { q: string; a: string };

/** Plain-text answers keep the visible copy and the FAQPage JSON-LD identical. */
export function FaqList({ items, className, withSchema = true }: { items: Faq[]; className?: string; withSchema?: boolean }) {
  return (
    <>
      <div className={cn('border-t border-line', className)}>
        {items.map((f, i) => (
          <AccordionItem key={f.q} title={f.q} defaultOpen={i === 0}>
            <p className="max-w-2xl text-[15px] leading-relaxed">{f.a}</p>
          </AccordionItem>
        ))}
      </div>
      {withSchema && <JsonLd data={faqLd(items)} />}
    </>
  );
}

/** Two-column FAQ block: heading on the left, accordion on the right. */
export function FaqSection({
  id = 'faq',
  eyebrow = 'Questions',
  title = 'Frequently Asked Questions',
  intro,
  items,
  footer,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: ReactNode;
  items: Faq[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('container-x scroll-mt-32 py-16 md:py-24', className)}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 id={`${id}-title`} className="h-section">
            {title}
          </h2>
          {intro && <div className="mt-4 max-w-sm text-[15px] leading-relaxed text-taupe">{intro}</div>}
          {footer && <div className="mt-6">{footer}</div>}
        </div>
        <div className="lg:col-span-8">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
