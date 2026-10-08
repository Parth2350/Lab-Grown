'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeftRight, ChevronDown, Heart, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { MAIN_NAV } from '@/config/navigation';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';
import { useUI } from '@/store/ui';
import { Sheet } from '@/components/ui/Sheet';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { SocialIcon } from './SocialIcons';
import { Logo } from './Logo';

export function MobileMenu() {
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState<string | null>(null);
  const close = () => setMenu(false);

  return (
    <Sheet open={open} onClose={close} side="left" title={<Logo className="scale-90" />} label="Menu" bodyClassName="pb-10">
      <nav aria-label="Mobile" className="px-5 sm:px-7">
        <ul>
          {MAIN_NAV.map((item) => {
            const isOpen = expanded === item.href;
            return (
              <li key={item.href} className="border-b border-line">
                {item.mega ? (
                  <>
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.href)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between py-4 text-left text-[14px] font-medium uppercase tracking-[0.16em]"
                    >
                      {item.label}
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isOpen && 'rotate-180')} strokeWidth={1.25} />
                    </button>
                    <div className={cn('grid transition-all duration-500 ease-luxe', isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]')}>
                      <div className="overflow-hidden">
                        <Link href={item.href} onClick={close} className="label-caps mb-4 inline-block border-b border-ink pb-0.5">
                          Shop all {item.label}
                        </Link>
                        {item.mega.columns.map((col) => (
                          <div key={col.title} className="mb-4">
                            <p className="eyebrow mb-2">{col.title}</p>
                            <ul className={cn(col.kind === 'shapes' ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-x-3 gap-y-2')}>
                              {col.links.map((l) => (
                                <li key={l.href + l.label}>
                                  <Link
                                    href={l.href}
                                    onClick={close}
                                    className={cn(
                                      'flex items-center gap-2 text-[16px] text-charcoal',
                                      col.kind === 'shapes' && 'flex-col gap-1 border border-line py-2.5 text-[14px]',
                                    )}
                                  >
                                    {l.shape && <ShapeIcon shape={l.shape} size={26} className="text-taupe" />}
                                    {l.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link href={item.href} onClick={close} className={cn('block py-4 text-[14px] font-medium uppercase tracking-[0.16em]', item.label === 'Find Your Match' && 'text-gold-deep')}>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <ul className="mt-6 space-y-4 text-sm">
          <li>
            <Link href={session ? '/account' : '/account/login'} onClick={close} className="flex items-center gap-3">
              <User className="h-4 w-4" strokeWidth={1.25} /> {session ? 'My Account' : 'Sign In / Register'}
            </Link>
          </li>
          <li>
            <Link href="/wishlist" onClick={close} className="flex items-center gap-3">
              <Heart className="h-4 w-4" strokeWidth={1.25} /> Wishlist
            </Link>
          </li>
          <li>
            <Link href="/compare" onClick={close} className="flex items-center gap-3">
              <ArrowLeftRight className="h-4 w-4" strokeWidth={1.25} /> Compare
            </Link>
          </li>
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
      </nav>
    </Sheet>
  );
}
