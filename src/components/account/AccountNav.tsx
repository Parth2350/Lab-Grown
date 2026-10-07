'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ArrowLeftRight, Clock, Heart, LayoutGrid, LifeBuoy, LogOut, MapPin, Package, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/account', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight },
  { href: '/account/recently-viewed', label: 'Recently Viewed', icon: Clock },
  { href: '/account/returns', label: 'Returns', icon: RotateCcw },
  { href: '/account/support', label: 'Support', icon: LifeBuoy },
];

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className={cn('label-caps inline-flex items-center gap-2 text-taupe transition-colors hover:text-ink', className)}
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Sign out
    </button>
  );
}

/** Sidebar on desktop, horizontally scrolling tabs on mobile. */
export function AccountNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      {/* Mobile tabs */}
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6 lg:hidden">
        {NAV.map((n) => {
          const active = isActive(n.href, n.exact);
          return (
            <li key={n.href} className="shrink-0">
              <Link
                ref={active ? activeRef : undefined}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center whitespace-nowrap border-b-2 px-3 text-[12px] uppercase tracking-[0.14em] transition-colors',
                  active ? 'border-ink text-ink' : 'border-transparent text-taupe hover:text-ink',
                )}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="flex h-12 items-center whitespace-nowrap px-3 text-[12px] uppercase tracking-[0.14em] text-taupe hover:text-ink">
            Sign out
          </button>
        </li>
      </ul>

      {/* Desktop sidebar */}
      <ul className="hidden space-y-0.5 lg:block">
        {NAV.map((n) => {
          const active = isActive(n.href, n.exact);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 border-l py-2.5 pl-4 text-[14px] transition-colors',
                  active ? 'border-ink text-ink' : 'border-line text-taupe hover:border-stone hover:text-ink',
                )}
              >
                <n.icon className={cn('h-4 w-4', active ? 'text-gold' : 'text-stone')} strokeWidth={1.25} aria-hidden />
                {n.label}
              </Link>
            </li>
          );
        })}
        {isAdmin && (
          <li className="pt-4">
            <Link href="/admin" className="flex items-center gap-3 border-l border-gold py-2.5 pl-4 text-[14px] text-gold-deep hover:text-ink">
              <Shield className="h-4 w-4" strokeWidth={1.25} aria-hidden /> Admin dashboard
            </Link>
          </li>
        )}
        <li className="pt-6">
          <SignOutButton className="pl-4" />
        </li>
      </ul>
    </nav>
  );
}
