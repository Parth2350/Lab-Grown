'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Gift, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { site } from '@/config/site';
import { CopyCode } from './CopyCode';

/** Announces the new-account welcome code once, right after the sign-in that issued it. */
export function WelcomeOffer() {
  const { data, update } = useSession();
  const code = data?.welcome;
  const [closed, setClosed] = useState(false);
  const first = useRef<HTMLAnchorElement>(null);
  const open = !!code && !closed;

  const close = () => {
    setClosed(true);
    void update({ welcomeSeen: true });
  };

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close only changes with the session
  }, [open]);

  if (!open) return null;
  return (
    // scrolls on short screens instead of cutting the card off
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-ink/50" onClick={close}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-ivory px-6 py-9 text-center shadow-lift sm:px-10">
          <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 text-taupe hover:text-ink">
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
            <Gift className="h-6 w-6" strokeWidth={1.25} aria-hidden />
          </span>
          <p className="eyebrow mt-5 text-gold-deep">Welcome gift</p>
          <h2 id="welcome-title" className="mt-2 font-serif text-[2rem] leading-tight text-ink">
            15% off your first order
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-taupe">Thank you for joining {site.name}. Enter this code in your bag when you place your first order. It’s also saved in your account.</p>
          <CopyCode code={code} className="mt-6" />
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link ref={first} href="/collections/all" onClick={close} className="label-caps inline-flex h-12 items-center justify-center bg-ink px-7 text-ivory transition-colors hover:bg-charcoal">
              Start shopping
            </Link>
            <Link href="/account" onClick={close} className="label-caps inline-flex h-12 items-center justify-center border border-ink px-7 text-ink transition-colors hover:bg-ink hover:text-ivory">
              My account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
