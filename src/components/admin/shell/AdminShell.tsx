'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, LogOut, Menu } from 'lucide-react';
import { site } from '@/config/site';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/utils';
import { ADMIN_NAV, COUNT_HINTS, currentSection, isActive, type NavCounts } from './nav';

type AdminUser = { name?: string | null; email?: string | null };

function NavList({ counts, pathname, onNavigate }: { counts: NavCounts; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.label} className="mt-5 first:mt-2">
          <p className="mb-1.5 px-3 text-[12px] font-medium uppercase tracking-[0.2em] text-taupe/80">{group.label}</p>
          <ul className="space-y-px">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const count = item.count ? counts[item.count] ?? 0 : 0;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 text-[15px] transition-colors',
                      active ? 'bg-ink text-ivory' : 'text-charcoal hover:bg-porcelain hover:text-ink',
                    )}
                  >
                    {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-gold-light" aria-hidden />}
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-gold-light' : 'text-taupe group-hover:text-ink')} strokeWidth={1.4} aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                    {count > 0 && item.count && (
                      <span
                        className={cn('min-w-5 px-1.5 text-center text-[12.5px] font-medium leading-[18px] tabular-nums', active ? 'bg-gold-light text-ink' : 'bg-gold-pale text-gold-deep')}
                        title={`${count} ${COUNT_HINTS[item.count]}`}
                      >
                        {count > 99 ? '99+' : count}
                        <span className="sr-only"> {COUNT_HINTS[item.count]}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2 px-6 py-5">
      <span className="font-serif text-2xl tracking-[0.08em] text-ink">{site.name}</span>
      <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-gold">Admin</span>
    </Link>
  );
}

export function AdminShell({ user, counts, children }: { user: AdminUser; counts: NavCounts; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const section = currentSection(pathname);

  useEffect(() => setOpen(false), [pathname]);

  const initials = (user.name ?? user.email ?? 'A')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[16px] font-normal leading-normal text-ink lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-ivory lg:flex">
        <Brand />
        <NavList counts={counts} pathname={pathname} />
      </aside>

      <Sheet open={open} onClose={() => setOpen(false)} side="left" label="Admin navigation" className="max-w-[290px]" bodyClassName="flex flex-col">
        <Brand />
        <NavList counts={counts} pathname={pathname} onNavigate={() => setOpen(false)} />
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-ivory/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="-ml-1 inline-flex h-9 w-9 items-center justify-center text-ink hover:bg-porcelain lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" strokeWidth={1.4} />
          </button>
          <div className="min-w-0 flex-1 truncate text-[15px]">
            {section ? (
              <>
                <span className="text-taupe">{section.group}</span>
                <span className="mx-2 text-stone" aria-hidden>
                  /
                </span>
                <span className="text-ink">{section.item.label}</span>
              </>
            ) : (
              <span className="text-ink">Admin</span>
            )}
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 text-xs text-charcoal transition-colors hover:text-ink sm:inline-flex">
            View store
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <div className="hidden h-6 w-px bg-line sm:block" aria-hidden />
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-medium tracking-wider text-gold-light" aria-hidden>
              {initials}
            </span>
            <div className="hidden min-w-0 leading-tight md:block">
              <p className="max-w-[160px] truncate text-[15px] text-ink">{user.name ?? 'Administrator'}</p>
              <p className="max-w-[160px] truncate text-[13px] text-taupe">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/account/login' })}
            className="inline-flex h-9 items-center gap-1.5 px-2 text-xs text-charcoal transition-colors hover:bg-porcelain hover:text-ink"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.4} aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
