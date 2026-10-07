import Link from 'next/link';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';

/** Wordmark: letter-spaced serif name with a small faceted diamond glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M6 4h12l4 5-10 12L2 9z" />
      <path d="M2 9h20M9 4l-2 5 5 12 5-12-2-5M7 9l5-5 5 5" opacity=".7" />
    </svg>
  );
}

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link href="/" aria-label={`${site.name} — home`} className={cn('group inline-flex flex-col items-center leading-none', tone === 'light' ? 'text-ivory' : 'text-ink', className)}>
      <span className="flex items-center gap-2">
        <LogoMark className="hidden h-[15px] w-[15px] text-gold xs:block transition-transform duration-700 group-hover:rotate-[360deg]" />
        <span className="font-serif text-[18px] font-normal uppercase tracking-[0.18em] xs:text-[24px] xs:tracking-[0.28em] sm:text-[28px] sm:tracking-[0.32em]">{site.name}</span>
      </span>
      <span className={cn('mt-1 hidden pl-6 text-[8.5px] font-medium uppercase tracking-[0.42em] sm:block', tone === 'light' ? 'text-ivory/60' : 'text-taupe')}>
        Fine Jewelry · Est. {site.foundedYear}
      </span>
    </Link>
  );
}
