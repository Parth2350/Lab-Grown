'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, m } from 'framer-motion';
import { Heart, Share2, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { label } from '@/lib/catalog';
import type { ProductCard } from '@/lib/types';
import { cn, formatMoney, pluralize } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useWishlist } from '@/store/lists';
import { useUI } from '@/store/ui';
import { useMounted } from '@/hooks/use-mounted';
import { ProductMedia } from '@/components/product/ProductMedia';
import { CompareButton, productHref } from '@/components/product/ProductCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

async function fetchCards(ids: string[]) {
  if (!ids.length) return [];
  const res = await fetch(`/api/products?ids=${ids.map(encodeURIComponent).join(',')}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('products');
  return ((await res.json()) as { products: ProductCard[] }).products;
}

function WishCard({ card, onRemove, onMove, readOnly, saved, onSave }: { card: ProductCard; onRemove?: () => void; onMove: () => void; readOnly?: boolean; saved?: boolean; onSave?: () => void }) {
  const href = productHref(card, card.defaultMetalColor, card.defaultPurity);
  return (
    <m.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="group flex flex-col">
      <div className="art-tile relative aspect-square overflow-hidden">
        <Link href={href} className="absolute inset-[7%] transition-transform duration-700 ease-luxe group-hover:scale-[1.03]" aria-label={card.name}>
          <ProductMedia name={card.name} art={card.art} images={card.images} shape={card.shapes[0]} metal={card.defaultMetalColor} carat={card.centerCarat ?? card.totalCarat ?? 1} sizes="(min-width:1024px) 25vw, 50vw" />
        </Link>
        {!card.inStock && <span className="pointer-events-none absolute left-3 top-3 bg-ivory/90 px-2 py-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-ink">Made to order</span>}
        {readOnly ? (
          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? `${card.name} is in your wishlist` : `Save ${card.name} to your wishlist`}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/85 backdrop-blur-sm transition-colors hover:bg-ivory"
          >
            <Heart className={cn('h-[18px] w-[18px]', saved ? 'fill-gold text-gold' : 'text-ink/70')} strokeWidth={1.25} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${card.name} from wishlist`}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/85 text-ink/70 backdrop-blur-sm transition-colors hover:bg-ivory hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.25} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[10.5px] uppercase tracking-[0.16em] text-taupe">{card.category.name || label.style(card.category.slug)}</p>
        <Link href={href} className="mt-1 block">
          <h3 className="font-serif text-[17px] leading-snug transition-colors group-hover:text-gold-deep md:text-lg">{card.name}</h3>
        </Link>
        <p className="mt-1 text-sm text-charcoal">
          <span className="text-taupe">From </span>
          {formatMoney(card.fromPrice)}
        </p>
        <p className="mt-1 text-[12px] text-taupe">{card.metalColors.map((m) => label.metal(m).replace(' Gold', '')).join(' · ')} gold</p>
        <div className="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            onClick={onMove}
            className="label-caps flex h-11 flex-1 items-center justify-center gap-2 bg-ink text-ivory transition-colors hover:bg-charcoal"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> {readOnly ? 'Add to Bag' : 'Move to Bag'}
          </button>
          <CompareButton product={card} className="h-11 w-11 shrink-0 justify-center border border-line transition-colors hover:border-ink" />
        </div>
      </div>
    </m.article>
  );
}

/** Wishlist grid used by /wishlist and /account/wishlist (prices refreshed from the server on view). */
export function WishlistView({ variant = 'page' }: { variant?: 'page' | 'account' }) {
  const mounted = useMounted();
  const params = useSearchParams();
  const { status } = useSession();
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const add = useWishlist((s) => s.add);
  const openQuickView = useUI((s) => s.openQuickView);
  const toast = useUI((s) => s.toast);
  const [moving, setMoving] = useState<string | null>(null);
  const [shared, setShared] = useState<ProductCard[] | null>(null);
  const refreshed = useRef(false);
  const sharedIds = (params.get('items') ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
  const sharedKey = sharedIds.join(',');

  // Refresh saved cards so prices/stock are current; drop pieces that are no longer offered.
  useEffect(() => {
    if (!mounted || refreshed.current) return;
    const ids = useWishlist.getState().items.map((i) => i.id);
    if (!ids.length) return;
    refreshed.current = true;
    fetchCards(ids)
      .then((cards) => {
        const fresh = new Map(cards.map((c) => [c.id, c]));
        const requested = new Set(ids);
        const next = useWishlist.getState().items.flatMap((i) => (fresh.has(i.id) ? [fresh.get(i.id)!] : requested.has(i.id) ? [] : [i]));
        useWishlist.getState().replace(next);
      })
      .catch(() => {
        refreshed.current = false;
      });
  }, [mounted]);

  useEffect(() => {
    if (!sharedKey) return setShared(null);
    fetchCards(sharedKey.split(','))
      .then(setShared)
      .catch(() => setShared([]));
  }, [sharedKey]);

  // "Move to bag": once the quick view adds this piece to the bag, take it off the wishlist.
  useEffect(() => {
    if (!moving) return;
    const before = new Set(useCart.getState().lines.map((l) => l.key));
    const unsubCart = useCart.subscribe((s) => {
      if (s.lines.some((l) => l.productId === moving && !before.has(l.key))) {
        const card = useWishlist.getState().items.find((i) => i.id === moving);
        useWishlist.getState().remove(moving);
        setMoving(null);
        if (card) toast({ title: 'Moved to your bag', description: card.name, href: '/cart', action: 'View bag' });
      }
    });
    const unsubUI = useUI.subscribe((s) => {
      if (!s.quickView) setMoving(null);
    });
    return () => {
      unsubCart();
      unsubUI();
    };
  }, [moving, toast]);

  const share = async () => {
    const url = `${window.location.origin}/wishlist?items=${items.map((i) => i.id).join(',')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My wishlist', text: 'A few pieces I’m dreaming about', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: 'Wishlist link copied', description: 'Share it with someone who might need a hint.' });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast({ title: 'Couldn’t share just now', description: 'Please try again.' });
    }
  };

  const isAccount = variant === 'account';
  const savedIds = new Set(items.map((i) => i.id));

  const header = isAccount ? (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-3xl font-light">Wishlist</h2>
        {mounted && <p className="mt-1 text-sm text-taupe">{pluralize(items.length, 'saved piece')}</p>}
      </div>
      {mounted && items.length > 0 && (
        <Button variant="outline" size="sm" onClick={share}>
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Share
        </Button>
      )}
    </div>
  ) : (
    <>
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <div className="mb-10 mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Your Wishlist</h1>
        </div>
        {mounted && items.length > 0 && (
          <div className="flex items-center gap-4">
            <p className="text-sm text-taupe">{pluralize(items.length, 'piece')}</p>
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Share
            </Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={isAccount ? '' : 'container-x pb-24 pt-8 lg:pt-12'}>
      {header}

      {shared && shared.length > 0 && (
        <section aria-labelledby="shared-title" className="mb-16 bg-porcelain p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Shared with you</p>
              <h2 id="shared-title" className="mt-2 font-serif text-2xl sm:text-3xl">
                A wishlist from someone special
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                shared.forEach((c) => !useWishlist.getState().has(c.id) && add(c));
                toast({ title: 'Saved to your wishlist', description: pluralize(shared.length, 'piece') });
              }}
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Save all
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {shared.map((c) => (
              <WishCard
                key={c.id}
                card={c}
                readOnly
                saved={mounted && savedIds.has(c.id)}
                onSave={() => {
                  if (!savedIds.has(c.id)) add(c);
                  else remove(c.id);
                }}
                onMove={() => openQuickView(c.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {!mounted ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse bg-porcelain" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={cn('flex flex-col items-center text-center', isAccount ? 'border border-line px-6 py-16' : 'py-16 sm:py-24')}>
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line">
            <Heart className="h-8 w-8 text-gold" strokeWidth={1} aria-hidden />
          </span>
          <h2 className="mt-8 font-serif text-3xl font-light sm:text-4xl">Nothing saved — yet</h2>
          <p className="mt-3 max-w-md text-[15px] text-taupe">
            Tap the heart on any piece to keep it here. It’s the easiest way to compare favourites, or to share a not-so-subtle hint.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/engagement-rings">Engagement Rings</ButtonLink>
            <ButtonLink href="/collections/all" variant="outline">
              Explore All Jewelry
            </ButtonLink>
          </div>
          {status === 'unauthenticated' && (
            <p className="mt-6 text-[13px] text-taupe">
              <Link href="/account/login?callbackUrl=%2Fwishlist" className="text-ink underline underline-offset-4">
                Sign in
              </Link>{' '}
              to keep your wishlist in sync across devices.
            </p>
          )}
        </div>
      ) : (
        <>
          <m.div layout className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {items.map((c) => (
                <WishCard
                  key={c.id}
                  card={c}
                  onRemove={() => {
                    remove(c.id);
                    toast({ title: 'Removed from wishlist', description: c.name });
                  }}
                  onMove={() => {
                    setMoving(c.id);
                    openQuickView(c.slug);
                  }}
                />
              ))}
            </AnimatePresence>
          </m.div>
          {status === 'unauthenticated' && (
            <p className="mt-12 border-t border-line pt-6 text-center text-[13px] text-taupe">
              Your wishlist is saved on this device.{' '}
              <Link href="/account/login?callbackUrl=%2Fwishlist" className="text-ink underline underline-offset-4">
                Sign in
              </Link>{' '}
              to sync it with your account.
            </p>
          )}
        </>
      )}
    </div>
  );
}
