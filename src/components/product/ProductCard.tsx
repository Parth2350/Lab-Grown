'use client';
import Link from 'next/link';
import { m } from 'framer-motion';
import { ArrowLeftRight, Eye, Heart } from 'lucide-react';
import { useState } from 'react';
import { METAL_COLORS, PURITIES } from '@/lib/catalog';
import type { ProductCard as Card } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCompare, useWishlist, COMPARE_MAX } from '@/store/lists';
import { useUI } from '@/store/ui';
import { useMounted } from '@/hooks/use-mounted';
import { ProductMedia } from './ProductMedia';
import { Stars } from '@/components/ui/Stars';
import { LazyMount } from '@/components/ui/LazyMount';
import { useFormatMoney } from '@/components/providers/CurrencyProvider';

type Props = { product: Card; priority?: boolean; sizes?: string; className?: string };

export function productHref(p: Pick<Card, 'slug'>, metal?: string, purity?: string, configure?: boolean) {
  const q = new URLSearchParams();
  if (metal) q.set('metal', metal);
  if (purity) q.set('purity', purity);
  if (configure) q.set('configure', '1');
  const s = q.toString();
  return `/products/${p.slug}${s ? `?${s}` : ''}`;
}

export function WishlistButton({ product, className, withLabel }: { product: Card; className?: string; withLabel?: boolean }) {
  const mounted = useMounted();
  const toggle = useWishlist((s) => s.toggle);
  const active = useWishlist((s) => s.items.some((i) => i.id === product.id)) && mounted;
  const toast = useUI((s) => s.toast);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(product);
        toast({ title: added ? 'Saved to your wishlist' : 'Removed from wishlist', description: product.name, href: '/wishlist', action: 'View wishlist' });
      }}
      className={cn('group/heart inline-flex items-center gap-2', className)}
    >
      <m.span key={String(active)} initial={{ scale: active ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }} className="inline-flex">
        <Heart className={cn('h-[18px] w-[18px] transition-colors', active ? 'fill-gold text-gold' : 'text-ink/70 group-hover/heart:text-ink')} strokeWidth={1.25} />
      </m.span>
      {withLabel && <span className="label-caps">{active ? 'Saved' : 'Add to Wishlist'}</span>}
    </button>
  );
}

export function CompareButton({ product, className, withLabel }: { product: Card; className?: string; withLabel?: boolean }) {
  const mounted = useMounted();
  const items = useCompare((s) => s.items);
  const toggle = useCompare((s) => s.toggle);
  const toast = useUI((s) => s.toast);
  const active = mounted && items.some((i) => i.id === product.id);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from compare` : `Add ${product.name} to compare`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active && items.length >= COMPARE_MAX) {
          toast({ title: `Compare holds up to ${COMPARE_MAX} pieces`, description: 'Remove one to add another.', href: '/compare', action: 'Open compare' });
          return;
        }
        const added = toggle(product);
        toast({ title: added ? 'Added to compare' : 'Removed from compare', description: product.name, href: '/compare', action: 'Compare now' });
      }}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <ArrowLeftRight className={cn('h-4 w-4 transition-colors', active ? 'text-gold' : 'text-ink/70 hover:text-ink')} strokeWidth={1.25} />
      {withLabel && <span className="label-caps">{active ? 'Comparing' : 'Compare'}</span>}
    </button>
  );
}

export function ProductCard({ product, priority, sizes, className }: Props) {
  const formatMoney = useFormatMoney();
  const [metal, setMetal] = useState(product.defaultMetalColor);
  // cards open on the lowest purity so the "From" price matches price sorting & filters
  const [purity, setPurity] = useState(PURITIES.find((x) => product.purities.includes(x.slug))?.slug ?? product.defaultPurity);
  const openQuickView = useUI((s) => s.openQuickView);
  const price = product.priceByPurity[purity] ?? product.fromPrice;
  const href = productHref(product, metal, purity);
  const shape = product.shapes[0] ?? 'round';
  const carat = product.centerCarat ?? product.totalCarat ?? 1;
  const hasOptions = product.hasCenterStone || product.totalCarat != null;
  // the alternate (hover) view is only rendered once the shopper actually hovers
  const [hovered, setHovered] = useState(false);
  // phones show two pictures side by side (front + side view of the illustration, or the first two
  // photos for this metal); a product with exactly one photo keeps a single square picture
  const photos = product.images.filter((i) => i.kind === 'image');
  const metalPhotos = photos.filter((i) => !i.metalColor || i.metalColor === metal);
  const twoUp = (metalPhotos.length ? metalPhotos : photos).length !== 1;
  // photographs fill the tile edge to edge on white; the drawn illustration keeps its framed backdrop
  const inset = photos.length ? 'inset-0' : 'inset-[6%]';

  return (
    // the whole card is one box: picture on top, details and the call to action inside the same border
    <article
      className={cn('group relative flex h-full flex-col overflow-hidden border border-line bg-white transition-shadow duration-500 hover:shadow-soft', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
    >
      <div className={cn('relative overflow-hidden', photos.length ? 'bg-white' : 'art-tile', twoUp ? 'aspect-[2/1] sm:aspect-square' : 'aspect-square')}>
        <Link href={href} className="absolute inset-0 flex" aria-label={product.name}>
          <span className="relative block h-full flex-1">
            {/* the main view only fades out once the alternate view exists, so the tile can never go blank */}
            <LazyMount eager={priority} className={cn('absolute transition-all duration-700 ease-luxe', inset, hovered && 'group-hover:scale-[1.04] group-hover:opacity-0')}>
              <ProductMedia name={product.name} art={product.art} images={product.images} shape={shape} metal={metal} carat={carat} priority={priority} sizes={sizes} />
            </LazyMount>
            {hovered && (
              <span className={cn('absolute scale-[0.98] opacity-0 transition-all duration-700 ease-luxe group-hover:scale-100 group-hover:opacity-100', inset)}>
                <ProductMedia name={product.name} art={product.art} images={product.images} shape={shape} metal={metal} carat={carat} view={1} sizes={sizes} />
              </span>
            )}
          </span>
          {/* phones only: the second picture beside the first (never mounted on larger screens) */}
          {twoUp && (
            <span className="relative block h-full flex-1 sm:hidden">
              <LazyMount className={cn('absolute', inset)}>
                <ProductMedia name={product.name} art={product.art} images={product.images} shape={shape} metal={metal} carat={carat} view={1} sizes="50vw" />
              </LazyMount>
            </span>
          )}
        </Link>

        {product.isNew && <span className="pointer-events-none absolute left-3 top-3 bg-ivory/90 px-2 py-1 text-[11.5px] font-medium uppercase tracking-[0.2em] text-ink">New</span>}

        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <WishlistButton product={product} className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/80 backdrop-blur-sm transition-colors hover:bg-ivory" />
          <CompareButton
            product={product}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/80 backdrop-blur-sm transition-all hover:bg-ivory lg:translate-x-2 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100"
          />
        </div>

        <button
          type="button"
          onClick={() => openQuickView(product.slug)}
          className="label-caps absolute inset-x-3 bottom-3 hidden h-10 items-center justify-center gap-2 bg-ivory/95 text-ink opacity-0 transition-all duration-500 ease-luxe hover:bg-ink hover:text-ivory group-hover:translate-y-0 group-hover:opacity-100 lg:flex lg:translate-y-2"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Quick View
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3 pt-3.5 sm:px-4">
        <Link href={href} className="block">
          <h3 className="font-sans text-[16px] leading-snug text-ink transition-colors group-hover:text-gold-deep">{product.name}</h3>
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-sm text-charcoal">
            <span className="text-taupe">From </span>
            <span className="font-serif text-lg font-bold text-ink">{formatMoney(price)}</span>
          </p>
          {product.reviewCount > 0 && (
            <span className="flex items-center gap-1.5 text-[13px] text-taupe">
              <Stars rating={product.rating} size={10} /> ({product.reviewCount})
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Metal colour">
            {product.metalColors.map((m) => {
              const mc = METAL_COLORS.find((x) => x.slug === m);
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={metal === m}
                  aria-label={mc?.label ?? m}
                  title={mc?.label ?? m}
                  onClick={() => setMetal(m)}
                  className={cn('h-[18px] w-[18px] rounded-full border border-white ring-1 transition-all', metal === m ? 'ring-ink ring-offset-1' : 'ring-line hover:ring-stone')}
                  style={{ background: mc?.swatch }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Metal purity">
            {PURITIES.filter((p) => product.purities.includes(p.slug)).map((p) => (
              <button
                key={p.slug}
                type="button"
                role="radio"
                aria-checked={purity === p.slug}
                onClick={() => setPurity(p.slug)}
                className={cn(
                  'h-7 min-w-[30px] border px-1 text-[12.5px] tracking-wide transition-colors sm:min-w-[34px] sm:px-1.5',
                  purity === p.slug ? 'border-ink bg-ink text-ivory' : 'border-line text-charcoal hover:border-ink',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-3 mt-auto pt-4 sm:-mx-4">
          <Link
            href={productHref(product, metal, purity, hasOptions)}
            className="label-caps flex min-h-11 w-full items-center justify-center border-t border-line px-2 py-2 text-center text-[12px] leading-snug tracking-[0.1em] text-ink transition-colors duration-300 hover:bg-ink hover:text-ivory sm:text-[13px] sm:tracking-[0.16em]"
          >
            {product.hasCenterStone ? 'View Diamond Options' : hasOptions ? 'View Diamond Options' : 'View Details'}
          </Link>
        </div>
      </div>
    </article>
  );
}
