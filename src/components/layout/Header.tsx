'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeftRight, Heart, Menu, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MegaColumn, NavItem } from '@/config/navigation';
import { METAL_COLORS } from '@/lib/catalog';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';
import { cartCount, useCart } from '@/store/cart';
import { useCompare, useWishlist } from '@/store/lists';
import { useUI } from '@/store/ui';
import { useMounted } from '@/hooks/use-mounted';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { CurrencySwitcher } from '@/components/providers/CurrencyProvider';
import { Logo } from './Logo';
import { AccountMenu } from './AccountMenu';

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1.5 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gold px-1 text-[11.5px] font-medium leading-none text-white">
      {n > 99 ? '99+' : n}
    </span>
  );
}

const iconBtn = 'relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-porcelain xs:h-10 xs:w-10';

/** Ten links to a column, as on brilliancecarat.com */
const columnsOf = <T,>(links: T[]) => Array.from({ length: Math.ceil(links.length / 10) }, (_, i) => links.slice(i * 10, i * 10 + 10));

/** The marker beside a menu link: the diamond's outline for shapes, a gold swatch for metals */
export function NavMarker({ kind, value, size = 18 }: { kind: MegaColumn['kind']; value: string; size?: number }) {
  if (kind === 'shape') return <ShapeIcon shape={value} size={size} strokeWidth={1.3} className="shrink-0 text-ink" />;
  if (kind === 'metal')
    return <span className="shrink-0 rounded-full ring-1 ring-line" style={{ width: size - 2, height: size - 2, background: METAL_COLORS.find((m) => m.slug === value)?.swatch }} />;
  return null;
}

function MegaPanel({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const mega = item.mega!;
  return (
    <div className="mx-auto flex max-w-[1408px] gap-8 px-4 py-8">
      <div className="flex flex-1 flex-wrap gap-x-10 gap-y-6">
        {mega.columns.map((col) => (
          <div key={col.title} className="flex flex-col">
            <p className="mb-3 text-xs font-semibold uppercase tracking-luxe text-ink">{col.title}</p>
            <div className="flex gap-x-8">
              {columnsOf(col.links).map((links, i) => (
                <ul key={i} className="min-w-[8.5rem] space-y-2 text-sm text-ink">
                  {links.map((l) => (
                    <li key={l.value}>
                      <Link href={l.href} onClick={onNavigate} className="flex items-center gap-2 whitespace-nowrap transition hover:font-semibold hover:text-black">
                        <NavMarker kind={col.kind} value={l.value} />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Link href={item.href} onClick={onNavigate} className="group/promo relative hidden min-h-[300px] w-64 shrink-0 overflow-hidden rounded-xl bg-porcelain xl:block" aria-label={`Shop all ${item.label}`}>
        <Image src={mega.promo.image} alt={mega.promo.alt} fill sizes="256px" unoptimized className="object-cover transition-transform duration-700 ease-luxe group-hover/promo:scale-105" />
      </Link>
    </div>
  );
}

export function Header({ nav }: { nav: NavItem[] }) {
  const mounted = useMounted();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lines = useCart((s) => s.lines);
  const wish = useWishlist((s) => s.items.length);
  const compare = useCompare((s) => s.items.length);
  const { setCart, setSearch, setMenu } = useUI();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setActive(null), [pathname]);

  const open = (i: number | null, delay = 90) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(i), delay);
  };

  const activeItem = active != null ? nav[active] : null;

  return (
    <header
      className={cn('sticky top-0 z-50 border-b bg-ivory/95 backdrop-blur-md transition-[box-shadow,border-color] duration-300', scrolled ? 'border-line shadow-[0_8px_30px_-20px_rgba(20,19,17,0.25)]' : 'border-transparent')}
      onMouseLeave={() => open(null, 160)}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <div className="container-x">
        <div className={cn('grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-300', scrolled ? 'h-[60px] xl:h-[64px]' : 'h-[64px] xl:h-[78px]')}>
          <div className="flex items-center gap-1">
            <button className={cn(iconBtn, 'xl:hidden')} onClick={() => setMenu(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button
              onClick={() => setSearch(true)}
              className="group hidden h-10 items-center gap-3 border-b border-line pr-6 text-[15px] text-taupe transition-colors hover:border-ink hover:text-ink xl:flex"
              aria-label="Search"
            >
              <Search className="h-4 w-4" strokeWidth={1.25} />
              <span>Search ‘2ct oval halo’</span>
            </button>
            <button className={cn(iconBtn, 'xl:hidden')} onClick={() => setSearch(true)} aria-label="Search">
              <Search className="h-[19px] w-[19px]" strokeWidth={1.25} />
            </button>
          </div>

          <Logo />

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <a href={site.contact.phoneHref} className="label-caps mr-3 hidden text-taupe transition-colors hover:text-ink 2xl:block">
              {site.contact.phone}
            </a>
            <AccountMenu className="hidden sm:block" />
            {/* phones: the wishlist is in the menu, making room for the currency (as on brilliancecarat.com) */}
            <Link href="/wishlist" className={cn(iconBtn, 'hidden sm:flex')} aria-label={`Wishlist (${mounted ? wish : 0})`}>
              <Heart className="h-[19px] w-[19px]" strokeWidth={1.25} />
              {mounted && <Badge n={wish} />}
            </Link>
            <Link href="/compare" className={cn(iconBtn, 'hidden md:flex')} aria-label={`Compare (${mounted ? compare : 0})`}>
              <ArrowLeftRight className="h-[18px] w-[18px]" strokeWidth={1.25} />
              {mounted && <Badge n={compare} />}
            </Link>
            <button className={iconBtn} onClick={() => setCart(true)} aria-label={`Shopping bag (${mounted ? cartCount(lines) : 0} items)`}>
              <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.25} />
              {mounted && <Badge n={cartCount(lines)} />}
            </button>
            <CurrencySwitcher className="ml-1 sm:ml-2" />
          </div>
        </div>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex h-11 items-center justify-center gap-4 2xl:gap-5">
            {nav.map((item, i) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href} onMouseEnter={() => open(item.mega ? i : null)} onFocus={() => open(item.mega ? i : null, 0)}>
                  <Link
                    href={item.href}
                    aria-expanded={item.mega ? active === i : undefined}
                    aria-current={current ? 'page' : undefined}
                    className={cn('flex h-11 items-center whitespace-nowrap text-[14.5px] text-ink transition-colors hover:text-gold-deep', (active === i || current) && 'text-gold-deep')}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <AnimatePresence>
        {activeItem?.mega && (
          <m.div
            key={activeItem.href}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-[0_30px_60px_-40px_rgba(20,19,17,0.35)] xl:block"
            onMouseEnter={() => clearTimeout(timer.current)}
            onKeyDown={(e) => e.key === 'Escape' && setActive(null)}
          >
            <MegaPanel item={activeItem} onNavigate={() => setActive(null)} />
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
