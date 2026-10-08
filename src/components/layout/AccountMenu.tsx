'use client';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { AnimatePresence, m } from 'framer-motion';
import { User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'My Account', href: '/account' },
  { label: 'Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Saved Addresses', href: '/account/addresses' },
  { label: 'Recently Viewed', href: '/account/recently-viewed' },
];

export function AccountMenu({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const user = session?.user;
  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      onMouseEnter={() => {
        clearTimeout(timer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        timer.current = setTimeout(() => setOpen(false), 180);
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-porcelain"
      >
        <User className="h-[19px] w-[19px]" strokeWidth={1.25} />
        {user && <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-gold" />}
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 border border-line bg-ivory p-5 shadow-lift"
          >
            {status === 'loading' ? (
              <div className="h-24 animate-pulse bg-porcelain" />
            ) : user ? (
              <>
                <p className="eyebrow">Welcome back</p>
                <p className="mb-4 mt-1 truncate font-serif text-lg">{user.name ?? user.email}</p>
                <ul className="space-y-2.5 border-t border-line pt-4 text-sm">
                  {LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => setOpen(false)} className="link-underline text-charcoal hover:text-ink" role="menuitem">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {user.role === 'ADMIN' && (
                    <li>
                      <Link href="/admin" onClick={() => setOpen(false)} className="link-underline font-medium text-gold-deep" role="menuitem">
                        Admin Dashboard
                      </Link>
                    </li>
                  )}
                </ul>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="label-caps mt-5 w-full border border-line py-2.5 transition-colors hover:border-ink" role="menuitem">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <p className="font-serif text-xl">Your Account</p>
                <p className="mb-4 mt-1 text-[15px] text-taupe">Track orders, save favourites and check out faster.</p>
                <Link href="/account/login" onClick={() => setOpen(false)} className="label-caps flex h-11 items-center justify-center bg-ink text-ivory transition-colors hover:bg-charcoal" role="menuitem">
                  Sign In
                </Link>
                <Link href="/account/register" onClick={() => setOpen(false)} className="label-caps mt-2 flex h-11 items-center justify-center border border-ink/30 transition-colors hover:border-ink" role="menuitem">
                  Create Account
                </Link>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
