import Link from 'next/link';
import type { ReactNode } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { site } from '@/config/site';
import type { Crumb } from '@/components/ui/Breadcrumbs';
import { cn, formatDate } from '@/lib/utils';
import { PageIntro } from '../ui';
import { PAGE_NAV } from './registry';

export type DocSection = { id: string; title: string; body: ReactNode };

/** Shared layout for client-care, craft and legal pages: intro, side navigation, content, help card. */
export function InfoShell({
  currentHref,
  crumbs,
  eyebrow,
  title,
  intro,
  updated,
  hero,
  sections,
  children,
}: {
  currentHref: string;
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  updated?: string;
  hero?: ReactNode;
  sections?: DocSection[];
  children?: ReactNode;
}) {
  return (
    <>
      <PageIntro crumbs={crumbs} eyebrow={eyebrow} title={title} intro={intro}>
        {updated && (
          <p className="mt-6 text-[13px] uppercase tracking-[0.16em] text-taupe">
            Last updated <time dateTime={updated}>{formatDate(updated, { dateStyle: 'long' })}</time>
          </p>
        )}
      </PageIntro>
      {hero}
      <div className="container-x pb-8">
        <div className="grid gap-10 border-t border-line pt-8 lg:grid-cols-12 lg:gap-12 lg:pt-14">
          <aside className="min-w-0 lg:col-span-3">
            <SideNav currentHref={currentHref} />
          </aside>
          <div className="min-w-0 lg:col-span-9 xl:col-span-8">
            {sections && sections.length >= 4 && <OnThisPage sections={sections} />}
            {sections && <DocSections sections={sections} />}
            {children}
            <HelpCard />
          </div>
        </div>
      </div>
    </>
  );
}

export function SideNav({ currentHref }: { currentHref: string }) {
  return (
    <nav aria-label="Client care, craft and legal pages">
      {/* mobile & tablet: a single scrollable row */}
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        {PAGE_NAV.flatMap((g) => g.links).map((l) => {
          const on = l.href === currentHref;
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center border px-4 text-[13px] uppercase tracking-[0.14em] transition-colors',
                  on ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-charcoal hover:border-ink',
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* desktop: grouped, sticky */}
      <div className="sticky top-32 hidden space-y-9 lg:block">
        {PAGE_NAV.map((g) => (
          <div key={g.title}>
            <p className="eyebrow mb-4">{g.title}</p>
            <ul className="space-y-1 border-l border-line">
              {g.links.map((l) => {
                const on = l.href === currentHref;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        '-ml-px flex min-h-9 items-center border-l py-1.5 pl-4 text-[16px] transition-colors',
                        on ? 'border-ink text-ink' : 'border-transparent text-taupe hover:border-stone hover:text-ink',
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function OnThisPage({ sections }: { sections: DocSection[] }) {
  return (
    <nav aria-label="On this page" className="mb-12 border border-line bg-white p-6 sm:p-8">
      <p className="eyebrow mb-4">On this page</p>
      <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {sections.map((s, i) => (
          <li key={s.id} className="flex gap-3 text-[16px]">
            <span className="w-5 shrink-0 tabular-nums text-taupe">{String(i + 1).padStart(2, '0')}</span>
            <a href={`#${s.id}`} className="text-charcoal underline-offset-4 transition-colors hover:text-ink hover:underline">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function DocSections({ sections }: { sections: DocSection[] }) {
  return (
    <div className="prose-luxe max-w-3xl text-[17px] [&>section:first-child>h2]:mt-0">
      {sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-32">
          <h2 id={`${s.id}-title`}>{s.title}</h2>
          {s.body}
        </section>
      ))}
    </div>
  );
}

function HelpCard() {
  const c = site.contact;
  return (
    <aside aria-label="Contact client care" className="mt-16 grid gap-6 border border-line bg-porcelain p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-serif text-2xl">Still have a question?</p>
        <p className="mt-2 max-w-md text-[16px] leading-relaxed text-taupe">
          Our client care team replies within one business day — or reach us instantly on WhatsApp during studio hours.
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-[15px] sm:flex-row sm:flex-wrap md:flex-col">
        <li>
          <a href={c.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-ink hover:underline hover:underline-offset-4">
            <MessageCircle className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden /> WhatsApp {c.whatsapp}
          </a>
        </li>
        <li>
          <a href={`mailto:${c.email}`} className="inline-flex min-h-10 items-center gap-2 text-ink hover:underline hover:underline-offset-4">
            <Mail className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden /> {c.email}
          </a>
        </li>
        <li>
          <a href={c.phoneHref} className="inline-flex min-h-10 items-center gap-2 text-ink hover:underline hover:underline-offset-4">
            <Phone className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden /> {c.phone}
          </a>
        </li>
        <li>
          <Link href="/contact" className="label-caps inline-flex min-h-10 items-center text-ink underline underline-offset-4">
            Contact form
          </Link>
        </li>
      </ul>
    </aside>
  );
}

/** Ordered list styled for prose (prose-luxe only styles unordered lists). */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className="mb-4 list-decimal space-y-2 pl-5 text-charcoal/90 marker:text-gold">{children}</ol>;
}

/** Simple, responsive data table for policy pages. */
export function DataTable({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="mb-6 overflow-x-auto border border-line bg-white">
      <table className="w-full min-w-[480px] text-left text-[16px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line bg-porcelain">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-[13px] font-medium uppercase tracking-[0.14em] text-charcoal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-4 py-3 align-top font-normal text-ink">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="px-4 py-3 align-top text-charcoal/90">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A quiet highlighted note inside long-form content. */
export function Note({ children }: { children: ReactNode }) {
  return <div className="my-6 border-l-2 border-gold bg-white px-5 py-4 text-[16px] leading-relaxed text-charcoal">{children}</div>;
}
