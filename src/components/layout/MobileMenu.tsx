'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { NavItem } from '@/config/navigation';
import { site } from '@/config/site';
import { useUI } from '@/store/ui';
import { Sheet } from '@/components/ui/Sheet';
import { SocialIcon } from './SocialIcons';
import { NavMarker } from './Header';
import { Logo } from './Logo';

const row = 'flex w-full items-center justify-between py-3.5 text-left text-[17px] text-ink';

/** Phone menu as on brilliancecarat.com: categories open their own panel of shapes, metals and styles */
export function MobileMenu({ nav }: { nav: NavItem[] }) {
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const { data: session } = useSession();
  const [current, setCurrent] = useState<NavItem | null>(null);
  const close = () => setMenu(false);
  // switching panels starts the new one at its top
  const show = (item: NavItem | null, from: HTMLElement) => {
    setCurrent(item);
    from.closest('.overflow-y-auto')?.scrollTo(0, 0);
  };
  // every time the menu opens it starts from the category list
  useEffect(() => {
    if (open) setCurrent(null);
  }, [open]);

  const categories = nav.filter((i) => i.mega);
  const pages = nav.filter((i) => !i.mega);

  return (
    <Sheet open={open} onClose={close} side="left" title={<Logo className="scale-90" />} label="Menu" bodyClassName="pb-10">
      <nav aria-label="Mobile" className="px-5 sm:px-7">
        {current?.mega ? (
          <div>
            <button onClick={(e) => show(null, e.currentTarget)} className="flex items-center gap-2 py-4 font-serif text-[1.6rem] leading-tight text-ink">
              <ChevronLeft className="h-5 w-5" strokeWidth={1.25} aria-hidden />
              {current.label}
              <span className="sr-only">— back to all categories</span>
            </button>
            <Link href={current.href} onClick={close} className="mb-6 flex items-center gap-2 rounded-lg bg-porcelain px-4 py-4 text-[16px] font-semibold text-ink">
              View all {current.label} <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
            {current.mega.columns.map((col) => (
              <div key={col.title} className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-luxe text-gold-deep">{col.title}</p>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.value}>
                      <Link href={l.href} onClick={close} className="flex items-center gap-4 py-2.5 text-[16px] text-ink">
                        {col.kind !== 'style' && <NavMarker kind={col.kind} value={l.value} size={26} />}
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <>
            <ul className="border-b border-line py-2">
              {categories.map((item) => (
                <li key={item.href}>
                  <button onClick={(e) => show(item, e.currentTarget)} className={row}>
                    {item.label}
                    <ChevronRight className="h-4 w-4 text-taupe" strokeWidth={1.25} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <ul className="py-2">
              {pages.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} className={row}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={session ? '/account' : '/account/login'} onClick={close} className={row}>
                  {session ? 'My Account' : 'Sign In / Register'}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" onClick={close} className={row}>
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/compare" onClick={close} className={row}>
                  Compare
                </Link>
              </li>
            </ul>

            <ul className="mt-4 space-y-4 border-t border-line pt-6 text-sm">
              <li>
                <a href={site.contact.phoneHref} className="flex items-center gap-3">
                  <Phone className="h-4 w-4" strokeWidth={1.25} /> {site.contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`} className="flex items-center gap-3">
                  <Mail className="h-4 w-4" strokeWidth={1.25} /> {site.contact.email}
                </a>
              </li>
            </ul>
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="label-caps mt-8 flex h-12 items-center justify-center gap-2 bg-ink text-ivory"
            >
              <SocialIcon name="whatsapp" /> Chat with a Concierge
            </a>
          </>
        )}
      </nav>
    </Sheet>
  );
}
