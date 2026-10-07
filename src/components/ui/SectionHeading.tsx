import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  action?: { label: string; href: string };
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  tone?: 'dark' | 'light';
};

export function SectionHeading({ eyebrow, title, subtitle, align = 'left', action, className, as: Tag = 'h2', tone = 'dark' }: Props) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 md:mb-12', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className={cn('eyebrow mb-3', tone === 'light' && 'text-gold-light')}>{eyebrow}</p>}
        <Tag className={cn('h-section', tone === 'light' && 'text-ivory')}>{title}</Tag>
        {subtitle && <p className={cn('mt-3 text-[15px] text-taupe', tone === 'light' && 'text-ivory/70')}>{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn('label-caps group inline-flex shrink-0 items-center gap-2 pb-1', tone === 'light' ? 'text-ivory' : 'text-ink')}
        >
          <span className="link-underline">{action.label}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}
