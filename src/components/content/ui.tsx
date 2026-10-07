import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { type ArtSpec } from '@/components/art/JewelryArt';
import { LazyJewelryArt, LazyLooseDiamond } from '@/components/art/LazyArt';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { cn } from '@/lib/utils';

/** Editorial page header: breadcrumbs, eyebrow, display title and lede. */
export function PageIntro({
  crumbs,
  eyebrow,
  title,
  intro,
  children,
  align = 'left',
  className,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <section className={cn('container-x pb-10 pt-8 md:pb-14 md:pt-12', className)}>
      <Breadcrumbs items={crumbs} />
      <div className={cn('mt-10 max-w-3xl md:mt-14', align === 'center' && 'mx-auto text-center')}>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="h-display text-balance">{title}</h1>
        {intro && <div className={cn('mt-6 max-w-2xl text-[16px] leading-relaxed text-taupe md:text-[17px]', align === 'center' && 'mx-auto')}>{intro}</div>}
        {children}
      </div>
    </section>
  );
}

const TONES = { default: 'art-tile', warm: 'art-tile-warm', cool: 'art-tile-cool' } as const;
export type ArtTone = keyof typeof TONES;

/** A framed procedural jewelry illustration for editorial layouts. */
export function ArtPanel({
  spec,
  shape = 'round',
  metal = 'yellow',
  carat = 1,
  view = 0,
  tone = 'default',
  className,
  inset = 'p-6 sm:p-10',
  title,
  caption,
  loose,
}: {
  spec?: ArtSpec;
  shape?: string;
  metal?: string;
  carat?: number;
  view?: number;
  tone?: ArtTone;
  className?: string;
  inset?: string;
  title?: string;
  caption?: ReactNode;
  /** Render a single loose diamond instead of a piece of jewelry */
  loose?: boolean;
}) {
  return (
    <figure className={cn('relative overflow-hidden', TONES[tone], className)}>
      <div className={cn('absolute inset-0 flex items-center justify-center', inset)}>
        {loose || !spec ? (
          <LazyLooseDiamond shape={shape} className="block h-full w-full" title={title} />
        ) : (
          <LazyJewelryArt spec={spec} shape={shape} metal={metal} carat={carat} view={view} className="block h-full w-full" title={title} />
        )}
      </div>
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-[11px] uppercase tracking-[0.16em] text-taupe sm:p-6">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Inline text link for long-form copy. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn('text-ink underline decoration-stone decoration-1 underline-offset-[5px] transition-colors hover:decoration-ink', className)}
      {...props}
    />
  );
}

/** Uppercase arrow link used under editorial blocks. */
export function ArrowLink({ href, children, className, tone = 'dark' }: { href: string; children: ReactNode; className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link href={href} className={cn('label-caps group inline-flex min-h-10 items-center gap-2', tone === 'light' ? 'text-ivory' : 'text-ink', className)}>
      <span className="link-underline pb-0.5">{children}</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
    </Link>
  );
}

export type Step = { title: string; text: string; icon?: ReactNode };

/** Numbered process steps — stacked on mobile, a row on desktop. */
export function NumberedSteps({ steps, className, columns = 4 }: { steps: Step[]; className?: string; columns?: 3 | 4 | 6 }) {
  return (
    <ol
      className={cn(
        'grid gap-px border border-line bg-line sm:grid-cols-2',
        columns === 4 && 'lg:grid-cols-4',
        columns === 3 && 'lg:grid-cols-3',
        columns === 6 && 'lg:grid-cols-3 xl:grid-cols-6',
        className,
      )}
    >
      {steps.map((s, i) => (
        <li key={s.title} className="flex flex-col bg-ivory p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-serif text-[2.5rem] font-light leading-none text-gold">{String(i + 1).padStart(2, '0')}</span>
            {s.icon && <span className="text-taupe">{s.icon}</span>}
          </div>
          <h3 className="mt-8 font-serif text-[1.45rem] leading-snug">{s.title}</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-taupe">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Quiet closing call-to-action band. */
export function CtaBand({
  eyebrow,
  title,
  text,
  children,
  tone = 'porcelain',
  className,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  children?: ReactNode;
  tone?: 'porcelain' | 'ink';
  className?: string;
}) {
  const dark = tone === 'ink';
  return (
    <section className={cn(dark ? 'bg-ink text-ivory' : 'border-y border-line bg-porcelain', className)}>
      <div className="container-x flex flex-col items-center py-16 text-center md:py-24">
        {eyebrow && <p className={cn('eyebrow mb-4', dark && 'text-gold-light')}>{eyebrow}</p>}
        <h2 className={cn('h-section max-w-3xl text-balance', dark && 'text-ivory')}>{title}</h2>
        {text && <p className={cn('mt-5 max-w-xl text-[15px] leading-relaxed', dark ? 'text-ivory/70' : 'text-taupe')}>{text}</p>}
        {children && <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">{children}</div>}
      </div>
    </section>
  );
}

/** Small uppercase key/value list used in contact and review panels. */
export function MetaList({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <dt className="label-caps text-taupe">{it.label}</dt>
          <dd className="text-[14px] text-ink sm:text-right">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
