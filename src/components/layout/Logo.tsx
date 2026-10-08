import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';

/** Small faceted diamond glyph used as a decorative separator. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M6 4h12l4 5-10 12L2 9z" />
      <path d="M2 9h20M9 4l-2 5 5 12 5-12-2-5M7 9l5-5 5 5" opacity=".7" />
    </svg>
  );
}

/**
 * Brand logo from /public/brand (transparent PNGs cut from the master artwork).
 * `inline` = V monogram beside the wordmark (header, menus); `stacked` = the full logo (footer).
 */
export function Logo({ className, tone = 'dark', variant = 'inline' }: { className?: string; tone?: 'dark' | 'light'; variant?: 'inline' | 'stacked' }) {
  const v = tone === 'light' ? '-light' : '';
  return (
    <Link href="/" aria-label={`${site.name} — home`} className={cn('inline-flex shrink-0 items-center', className)}>
      {variant === 'stacked' ? (
        <Image src={`/brand/logo${v}.png`} alt={site.name} width={898} height={600} className="h-auto w-[210px]" />
      ) : (
        <span className="flex items-center gap-2 sm:gap-3">
          <Image src={`/brand/monogram${v}.png`} alt="" width={217} height={240} priority className="h-10 w-auto xl:h-12" />
          <Image src={`/brand/wordmark${v}.png`} alt={site.name} width={869} height={96} priority className="h-[11px] w-auto xs:h-[13px] sm:h-[16px] xl:h-[18px]" />
        </span>
      )}
    </Link>
  );
}
