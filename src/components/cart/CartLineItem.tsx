'use client';
import Link from 'next/link';
import { Heart, Minus, Plus } from 'lucide-react';
import { label } from '@/lib/catalog';
import { cn, formatMoney } from '@/lib/utils';
import { useCart, type CartLine } from '@/store/cart';
import { useWishlist } from '@/store/lists';
import { useUI } from '@/store/ui';
import type { ProductCard } from '@/lib/types';
import { ProductMedia } from '@/components/product/ProductMedia';

/** Minimal ProductCard rebuilt from a cart line (for "move to wishlist") */
export function lineToCard(l: CartLine): ProductCard {
  return {
    id: l.productId,
    slug: l.slug,
    name: l.name,
    sku: l.sku,
    category: { slug: l.category, name: '' },
    fromPrice: l.unitPrice,
    priceByPurity: { [l.purity]: l.unitPrice },
    metalColors: [l.metalColor],
    purities: [l.purity],
    defaultMetalColor: l.metalColor,
    defaultPurity: l.purity,
    shapes: [l.shape],
    centerCarat: l.diamond ? l.carat : null,
    totalCarat: l.diamond ? null : l.carat,
    settingType: null,
    styles: [],
    art: l.art,
    images: l.image ? [{ url: l.image, alt: l.name, kind: 'image', metalColor: null }] : [],
    rating: 0,
    reviewCount: 0,
    isNew: false,
    hasCenterStone: !!l.diamond,
    inStock: true,
  };
}

export function QtyStepper({ value, onChange, size = 'sm' }: { value: number; onChange: (n: number) => void; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  return (
    <div className={cn('inline-flex items-center border border-line', h)}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} className={cn('flex w-8 items-center justify-center disabled:opacity-30', h)} aria-label="Decrease quantity">
        <Minus className="h-3 w-3" strokeWidth={1.5} />
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 10} className={cn('flex w-8 items-center justify-center disabled:opacity-30', h)} aria-label="Increase quantity">
        <Plus className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function CartLineItem({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const addWish = useWishlist((s) => s.add);
  const toast = useUI((s) => s.toast);
  const href = `/products/${line.slug}?metal=${line.metalColor}&purity=${line.purity}`;

  return (
    <div className="flex gap-4 py-5">
      <Link href={href} onClick={onNavigate} className={cn('art-tile shrink-0 overflow-hidden p-2', compact ? 'h-24 w-24' : 'h-28 w-28 sm:h-36 sm:w-36')}>
        <ProductMedia name={line.name} art={line.art} images={line.image ? [{ url: line.image, alt: line.name, kind: 'image', metalColor: null }] : []} shape={line.shape} metal={line.metalColor} carat={line.carat} sizes="150px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} onClick={onNavigate} className="font-serif text-[19px] leading-snug hover:text-gold-deep">
            {line.name}
          </Link>
          <p className="shrink-0 text-sm tabular-nums">{formatMoney(line.unitPrice * line.quantity)}</p>
        </div>
        <dl className="mt-1.5 space-y-0.5 text-[14.5px] text-taupe">
          <div>
            <dt className="sr-only">Metal</dt>
            <dd>
              {line.purity} {label.metal(line.metalColor)}
            </dd>
          </div>
          {line.diamond && (
            <div>
              <dt className="sr-only">Diamond</dt>
              <dd>{line.diamond.summary}</dd>
            </div>
          )}
          {line.option && (
            <div>
              <dt className="sr-only">Diamonds</dt>
              <dd className="capitalize">{line.option.label}</dd>
            </div>
          )}
          {line.ringSize && (
            <div>
              <dt className="sr-only">Ring size</dt>
              <dd>Ring size {line.ringSize}</dd>
            </div>
          )}
          {line.quantity > 1 && <dd>{formatMoney(line.unitPrice)} each</dd>}
        </dl>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <QtyStepper value={line.quantity} onChange={(n) => setQty(line.key, n)} />
          <div className="flex items-center gap-4 text-[13px] uppercase tracking-[0.12em] text-taupe">
            <button
              type="button"
              onClick={() => {
                addWish(lineToCard(line));
                remove(line.key);
                toast({ title: 'Moved to wishlist', description: line.name, href: '/wishlist', action: 'View' });
              }}
              className="flex items-center gap-1.5 hover:text-ink"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={1.25} /> <span className="hidden xs:inline">Save</span>
            </button>
            <button type="button" onClick={() => remove(line.key)} className="underline-offset-4 hover:text-ink hover:underline">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
