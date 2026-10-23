'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeftRight, Heart, Menu, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MAIN_NAV, type NavItem } from '@/config/navigation';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';
import { cartCount, useCart } from '@/store/cart';
import { useCompare, useWishlist } from '@/store/lists';
import { useUI } from '@/store/ui';
import { useMounted } from '@/hooks/use-mounted';
import { JewelryArt } from '@/components/art/JewelryArt';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { CurrencySwitcher, useLocalize } from '@/components/providers/CurrencyProvider';
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

function MegaPanel({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const mega = item.mega!;
  const localize = useLocalize();
  return (
    <div className="container-x grid grid-cols-12 gap-10 py-10">
      <div className="col-span-8 grid grid-cols-3 gap-10">
        {mega.columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-5">{col.title}</p>
            <ul className={cn(col.kind === 'shapes' ? 'grid grid-cols-2 gap-x-4 gap-y-3' : 'space-y-3')}>
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} onClick={onNavigate} className="group/link flex items-center gap-3 text-[16px] text-charcoal transition-colors hover:text-ink">
                    {l.shape && <ShapeIcon shape={l.shape} size={22} className="text-taupe transition-colors group-hover/link:text-gold" />}
                    {l.metal && (
                      <span
                        className="h-4 w-4 rounded-full ring-1 ring-line"
                        style={{ background: l.metal === 'yellow' ? 'linear-gradient(135deg,#F6E2A8,#A87F33)' : l.metal === 'white' ? 'linear-gradient(135deg,#fff,#A9AEB4)' : 'linear-gradient(135deg,#F7D2C0,#B06F58)' }}
                      />
                    )}
                    <span className={cn('link-underline', l.label.startsWith('View All') && 'label-caps text-ink')}>{localize(l.label)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {mega.feature && (
        <Link href={mega.feature.href} onClick={onNavigate} className="group/feat col-span-4 grid grid-cols-2 items-center gap-6 bg-porcelain p-6">
          <div className="art-tile aspect-square overflow-hidden">
            <JewelryArt spec={mega.feature.art} shape={mega.feature.shape} metal={mega.feature.metal} carat={mega.feature.carat ?? 1} className="h-full w-full transition-transform duration-700 ease-luxe group-hover/feat:scale-105" />
          </div>
          <div>
            <p className="eyebrow mb-2">{mega.feature.eyebrow}</p>
            <p className="font-serif text-2xl leading-tight">{mega.feature.title}</p>
            <span className="label-caps mt-4 inline-block border-b border-ink pb-1">{mega.feature.cta}</span>
          </div>
        </Link>
      )}
    </div>
  );
}

export function Header() {
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

  const activeItem = active != null ? MAIN_NAV[active] : null;

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
          <ul className="flex h-11 items-center justify-center gap-5 2xl:gap-9">
            {MAIN_NAV.map((item, i) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href} onMouseEnter={() => open(item.mega ? i : null)} onFocus={() => open(item.mega ? i : null, 0)}>
                  <Link
                    href={item.href}
                    aria-expanded={item.mega ? active === i : undefined}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'relative flex h-11 items-center whitespace-nowrap text-[12.5px] font-medium uppercase tracking-[0.1em] text-charcoal transition-colors hover:text-ink 2xl:text-[13px] 2xl:tracking-[0.16em]',
                      (active === i || current) && 'text-ink',
                      item.label === 'Find Your Match' && 'text-gold-deep',
                    )}
                  >
                    {item.label}
                    <span className={cn('absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-transform duration-500 ease-luxe', active === i || current ? 'scale-x-100' : 'scale-x-0')} />
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
            className="absolute inset-x-0 top-full hidden border-b border-t border-line bg-ivory shadow-[0_30px_60px_-40px_rgba(20,19,17,0.35)] xl:block"
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
