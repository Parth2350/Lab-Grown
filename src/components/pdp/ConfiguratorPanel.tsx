'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gem, RefreshCcw, Ruler, Share2, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { METAL_COLORS, PURITIES, RING_SIZES, label } from '@/lib/catalog';
import type { ProductCard, ProductDetail } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { useUI } from '@/store/ui';
import { Stars } from '@/components/ui/Stars';
import { Sheet } from '@/components/ui/Sheet';
import { QtyStepper } from '@/components/cart/CartLineItem';
import { CompareButton, WishlistButton } from '@/components/product/ProductCard';
import { CenterDiamondPicker } from './CenterDiamondPicker';
import type { Configuration } from './useConfiguration';

const SIZE_CHART = [
  ['4', '14.9', '46.8'],
  ['5', '15.7', '49.3'],
  ['6', '16.5', '51.9'],
  ['7', '17.3', '54.4'],
  ['8', '18.1', '57.0'],
  ['9', '18.9', '59.5'],
  ['10', '19.8', '62.1'],
];

function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Ring size guide" bodyClassName="px-5 py-6 sm:px-7">
      <p className="text-sm text-charcoal">
        Measure the inside diameter of a ring that already fits, or wrap a strip of paper around the base of your finger and measure the circumference. Fingers are largest at the end of the day.
      </p>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[13px] uppercase tracking-[0.14em] text-taupe">
            <th className="py-2 font-medium">US size</th>
            <th className="py-2 font-medium">Diameter (mm)</th>
            <th className="py-2 font-medium">Circumference (mm)</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map(([s, d, c]) => (
            <tr key={s} className="border-b border-line">
              <td className="py-2.5">{s}</td>
              <td className="py-2.5">{d}</td>
              <td className="py-2.5">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 bg-porcelain p-4 text-[15px] text-charcoal">
        Not sure? Choose your best estimate — your first resize within 60 days is complimentary, or request a free reusable ring sizer from our concierge.
      </p>
    </Sheet>
  );
}

export function ConfiguratorPanel({ p, card, c, compact, initialConfigure }: { p: ProductDetail; card: ProductCard; c: Configuration; compact?: boolean; initialConfigure?: boolean }) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);
  const [sizeGuide, setSizeGuide] = useState(false);
  const settingPrice = c.variant?.price ?? 0;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: 'Share it with someone special.' });
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div>
      <p className="eyebrow mb-3">
        <Link href={`/${p.category.slug}`} className="hover:text-ink">
          {p.category.name}
        </Link>
      </p>
      {compact ? <h2 className="font-serif text-3xl font-light leading-tight">{p.name}</h2> : <h1 className="font-serif text-[2rem] font-light leading-[1.1] md:text-[2.5rem]">{p.name}</h1>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-taupe">
        {p.reviewCount > 0 ? (
          <a href="#reviews" className="flex items-center gap-2 hover:text-ink">
            <Stars rating={p.rating} /> {p.rating.toFixed(1)} ({p.reviewCount} reviews)
          </a>
        ) : (
          <span>New design</span>
        )}
        <span>SKU {c.variant?.sku ?? p.sku}</span>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <p className="font-serif text-[2rem] leading-none text-ink" aria-live="polite">
          {formatMoney(c.price)}
        </p>
        <p className="pb-1 text-[14px] text-taupe">From {formatMoney(p.fromPrice)}</p>
      </div>
      <p className="mt-1.5 text-[14px] text-taupe">{c.centerOption ? 'Setting + centre diamond. ' : ''}Taxes calculated at checkout · Complimentary insured shipping</p>

      {/* metal purity */}
      <fieldset className="mt-8">
        <legend className="label-caps mb-3 flex w-full justify-between">
          <span>Metal purity</span>
          <span className="font-normal normal-case tracking-normal text-taupe">{PURITIES.find((x) => x.slug === c.purity)?.fineness}</span>
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {PURITIES.filter((x) => p.purities.includes(x.slug)).map((x) => (
            <button
              key={x.slug}
              type="button"
              aria-pressed={c.purity === x.slug}
              onClick={() => c.setPurity(x.slug)}
              className={cn('h-11 border text-[15px] transition-colors', c.purity === x.slug ? 'border-ink bg-ink text-ivory' : 'border-line bg-white hover:border-ink')}
            >
              {x.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* metal colour */}
      <fieldset className="mt-6">
        <legend className="label-caps mb-3">
          Metal colour: <span className="font-normal normal-case tracking-normal text-taupe">{label.metal(c.metal)}</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {p.metalColors.map((m) => {
            const mc = METAL_COLORS.find((x) => x.slug === m);
            return (
              <button
                key={m}
                type="button"
                aria-pressed={c.metal === m}
                aria-label={mc?.label ?? m}
                title={mc?.label ?? m}
                onClick={() => c.setMetal(m)}
                className={cn('h-10 w-10 rounded-full border-2 border-white ring-1 transition-all', c.metal === m ? 'ring-ink ring-offset-2' : 'ring-line hover:ring-stone')}
                style={{ background: mc?.swatch }}
              />
            );
          })}
        </div>
      </fieldset>

      {/* ring size */}
      {p.requiresSize && (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor={`ring-size-${p.id}`} className="label-caps">
              Ring size (US)
            </label>
            <button type="button" onClick={() => setSizeGuide(true)} className="flex items-center gap-1.5 text-[14px] text-taupe underline-offset-4 hover:text-ink hover:underline">
              <Ruler className="h-3.5 w-3.5" strokeWidth={1.25} /> Size guide
            </button>
          </div>
          <select
            id={`ring-size-${p.id}`}
            value={c.ringSize}
            onChange={(e) => c.setRingSize(e.target.value)}
            aria-invalid={c.sizeError}
            className={cn('field h-12 cursor-pointer py-0', c.sizeError && 'border-danger')}
          >
            <option value="">Select your size</option>
            {RING_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {c.sizeError && <p className="mt-1.5 text-xs text-danger">Please choose a ring size — first resize within 60 days is complimentary.</p>}
          <SizeGuide open={sizeGuide} onClose={() => setSizeGuide(false)} />
        </div>
      )}

      {/* centre diamond */}
      {c.centerOption && (
        <CenterDiamondPicker
          option={c.centerOption}
          shape={c.shape}
          onShape={c.setShape}
          diamond={c.diamond}
          onDiamond={c.setDiamond}
          settingPrice={settingPrice}
          defaultCarat={p.centerCarat ?? 1}
          scrollIntoView={initialConfigure}
        />
      )}
      {!c.centerOption && c.totalWeightOptions.length > 0 && (
        <fieldset className="mt-7">
          <legend className="label-caps mb-3">Diamond weight & quality</legend>
          <div className="space-y-2">
            {c.totalWeightOptions.map((o) => {
              const on = c.option?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => c.setOption(o)}
                  className={cn('flex w-full items-center justify-between gap-3 border px-4 py-3 text-left text-[15.5px] transition-colors', on ? 'border-ink bg-white' : 'border-line hover:border-stone')}
                >
                  <span>
                    <span className="capitalize text-ink">{o.label}</span>
                    <span className="block text-[14px] text-taupe">
                      {o.color} colour · {o.clarity}+ clarity · {label.shape(p.shapes[0])} · IGI certified
                    </span>
                  </span>
                  <span className="shrink-0 text-taupe">{formatMoney((c.variant?.price ?? 0) + o.priceDelta)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* quantity + CTAs */}
      <div className="mt-7 flex items-center gap-4">
        <span className="label-caps">Quantity</span>
        <QtyStepper value={c.quantity} onChange={(n) => c.setQuantity(Math.max(1, Math.min(10, n)))} size="md" />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => c.addToCart()} disabled={c.needsDiamond} className="label-caps h-14 bg-ink text-ivory transition-colors hover:bg-charcoal disabled:opacity-50">
          Add to Cart · {formatMoney(c.price * c.quantity)}
        </button>
        <button
          type="button"
          onClick={() => {
            if (c.addToCart({ silent: true })) router.push('/checkout');
          }}
          disabled={c.needsDiamond}
          className="label-caps h-14 border border-ink transition-colors hover:bg-ink hover:text-ivory disabled:opacity-50"
        >
          Buy It Now
        </button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-6 border-b border-line pb-6">
        <WishlistButton product={card} withLabel />
        <CompareButton product={card} withLabel />
        <button type="button" onClick={share} className="inline-flex items-center gap-2">
          <Share2 className="h-4 w-4 text-ink/70" strokeWidth={1.25} /> <span className="label-caps">Share</span>
        </button>
      </div>

      <p className={cn('mt-5 flex items-center gap-2 text-[15px]', c.inStock ? 'text-success' : 'text-charcoal')}>
        <span className={cn('h-2 w-2 rounded-full', c.inStock ? 'bg-success' : 'bg-gold')} />
        {c.inStock ? 'In stock — ready to ship in 3–5 business days' : 'Made to order — ships in 2–3 weeks'}
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-3 text-[14px] text-charcoal">
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.25} /> IGI / GIA Certified
        </li>
        <li className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gold" strokeWidth={1.25} /> Free insured shipping
        </li>
        <li className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-gold" strokeWidth={1.25} /> 30-day easy returns
        </li>
        <li className="flex items-center gap-2">
          <Gem className="h-4 w-4 text-gold" strokeWidth={1.25} /> Lifetime warranty
        </li>
      </ul>
    </div>
  );
}
