'use client';
import Link from 'next/link';
import { ArrowLeftRight, Plus, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { PURITIES, label } from '@/lib/catalog';
import type { ProductCard, ProductDetail } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { COMPARE_MAX, useCompare } from '@/store/lists';
import { useUI } from '@/store/ui';
import { useMounted } from '@/hooks/use-mounted';
import { ProductMedia } from '@/components/product/ProductMedia';
import { WishlistButton, productHref } from '@/components/product/ProductCard';
import { Stars } from '@/components/ui/Stars';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';

type Row = { id: string; label: string; value: (c: ProductCard, d: ProductDetail | null | undefined) => { text: string; node?: ReactNode } };

const dash = '—';

function quality(d: ProductDetail | null | undefined) {
  if (!d) return null;
  if (d.defaultDiamond) return { color: d.defaultDiamond.color, clarity: d.defaultDiamond.clarity, lab: d.defaultDiamond.certificate?.lab ?? null, total: null as number | null };
  const tw = d.diamondOptions.find((o) => o.kind === 'TOTAL_WEIGHT' && o.isDefault) ?? d.diamondOptions.find((o) => o.kind === 'TOTAL_WEIGHT');
  return tw ? { color: tw.color, clarity: tw.clarity, lab: null, total: tw.totalCarat } : null;
}

const ROWS: Row[] = [
  { id: 'price', label: 'Price', value: (c) => ({ text: `From ${formatMoney(c.fromPrice)}` }) },
  {
    id: 'metal',
    label: 'Metal options',
    value: (c) => {
      const purities = PURITIES.filter((p) => c.purities.includes(p.slug)).map((p) => p.label).join(' · ');
      const colors = c.metalColors.map((m) => label.metal(m)).join(', ');
      return { text: `${purities} ${colors}`, node: <><span className="block">{colors}</span><span className="block text-taupe">{purities}</span></> };
    },
  },
  { id: 'shape', label: 'Diamond shape', value: (c) => ({ text: c.shapes.map((s) => label.shape(s)).join(', ') || dash }) },
  { id: 'center', label: 'Centre carat', value: (c, d) => ({ text: c.centerCarat != null ? `${(d?.defaultDiamond?.carat ?? c.centerCarat).toFixed(2)} ct` : dash }) },
  { id: 'color', label: 'Colour', value: (_c, d) => ({ text: quality(d)?.color ?? (d === undefined ? '…' : dash) }) },
  { id: 'clarity', label: 'Clarity', value: (_c, d) => ({ text: quality(d)?.clarity ?? (d === undefined ? '…' : dash) }) },
  { id: 'setting', label: 'Setting type', value: (c) => ({ text: c.settingType ? label.setting(c.settingType) : dash }) },
  {
    id: 'total',
    label: 'Total carat',
    value: (c, d) => {
      const t = quality(d)?.total ?? c.totalCarat;
      return { text: t != null ? `${t.toFixed(2)} ct tw` : c.centerCarat != null ? `${c.centerCarat.toFixed(2)} ct centre` : dash };
    },
  },
  { id: 'cert', label: 'Certification', value: (_c, d) => ({ text: d === undefined ? '…' : `${quality(d)?.lab ?? 'IGI'} certified` }) },
  { id: 'availability', label: 'Availability', value: (c) => ({ text: c.inStock ? 'In stock · ships when crafted' : 'Made to order' }) },
  {
    id: 'rating',
    label: 'Rating',
    value: (c) =>
      c.reviewCount > 0
        ? {
            text: c.rating.toFixed(1),
            node: (
              <span className="flex items-center gap-2">
                <Stars rating={c.rating} size={11} /> <span className="text-taupe">({c.reviewCount})</span>
              </span>
            ),
          }
        : { text: 'No reviews yet' },
  },
];

/** Side-by-side comparison for up to four pieces (sticky attribute column, scrolls on mobile). */
export function CompareView() {
  const mounted = useMounted();
  const items = useCompare((s) => s.items);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const toast = useUI((s) => s.toast);
  const [details, setDetails] = useState<Record<string, ProductDetail | null>>({});
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const missing = items.filter((i) => !(i.id in details));
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(
      missing.map((i) =>
        fetch(`/api/products/${encodeURIComponent(i.slug)}`)
          .then((r) => (r.ok ? (r.json() as Promise<ProductDetail>) : null))
          .catch(() => null)
          .then((d) => [i.id, d] as const),
      ),
    ).then((pairs) => {
      if (!cancelled) setDetails((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      cancelled = true;
    };
  }, [items, details]);

  if (!mounted) {
    return (
      <div className="container-x py-12" aria-busy="true">
        <div className="h-[420px] animate-pulse bg-porcelain" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-x pb-24 pt-8 lg:pt-12">
        <Breadcrumbs items={[{ label: 'Compare' }]} />
        <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center sm:py-24">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line">
            <ArrowLeftRight className="h-8 w-8 text-gold" strokeWidth={1} aria-hidden />
          </span>
          <h1 className="mt-8 font-serif text-4xl font-light sm:text-5xl">Nothing to compare yet</h1>
          <p className="mt-4 max-w-md text-[15px] text-taupe">
            Select the compare icon on up to {COMPARE_MAX} pieces to see shape, carat, metal and certification side by side.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/engagement-rings">Engagement Rings</ButtonLink>
            <ButtonLink href="/collections/all" variant="outline">
              Explore All Jewelry
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const placeholders = Math.max(0, COMPARE_MAX - items.length);
  const cols = items.length + placeholders;

  return (
    <div className="container-x pb-24 pt-8 lg:pt-12">
      <Breadcrumbs items={[{ label: 'Compare' }]} />
      <div className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Side by side</p>
          <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Compare Pieces</h1>
        </div>
        <div className="flex items-center gap-5">
          <label className="flex cursor-pointer items-center gap-3 text-[13px] text-charcoal">
            <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
              <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} className="peer sr-only" />
              <span className="absolute inset-0 rounded-full bg-stone transition-colors peer-checked:bg-ink peer-focus-visible:ring-1 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2" />
              <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-transform peer-checked:translate-x-4" />
            </span>
            Highlight differences
          </label>
          <button
            type="button"
            onClick={() => {
              clear();
              toast({ title: 'Compare list cleared' });
            }}
            className="text-[12px] uppercase tracking-[0.14em] text-taupe underline-offset-4 hover:text-ink hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <p className="mb-3 text-[12px] text-taupe md:hidden" aria-hidden>
        Swipe to see every piece →
      </p>
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:px-0" role="region" aria-label="Comparison table" tabIndex={0}>
        <table className="w-full border-collapse text-left text-[13px]" style={{ minWidth: `${130 + cols * 190}px` }}>
          <caption className="sr-only">Comparison of {items.length} pieces</caption>
          <colgroup>
            <col className="w-[130px] sm:w-[170px]" />
            {Array.from({ length: cols }).map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          <thead>
            <tr className="align-top">
              <th scope="col" className="sticky left-0 z-10 bg-ivory pb-6 pr-4 text-left align-bottom">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                  {items.length} of {COMPARE_MAX}
                </span>
              </th>
              {items.map((c) => (
                <th key={c.id} scope="col" className="px-3 pb-6 font-normal sm:px-4">
                  <div className="group relative">
                    <Link href={productHref(c)} className="art-tile block aspect-square overflow-hidden p-[8%]" aria-label={c.name}>
                      <ProductMedia name={c.name} art={c.art} images={c.images} shape={c.shapes[0]} metal={c.defaultMetalColor} carat={c.centerCarat ?? c.totalCarat ?? 1} sizes="240px" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      aria-label={`Remove ${c.name} from compare`}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/90 text-ink/70 transition-colors hover:bg-ivory hover:text-ink"
                    >
                      <X className="h-4 w-4" strokeWidth={1.25} />
                    </button>
                    <WishlistButton product={c} className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/90" />
                  </div>
                  <Link href={productHref(c)} className="mt-4 block font-serif text-[17px] leading-snug hover:text-gold-deep">
                    {c.name}
                  </Link>
                  <p className="mt-1 text-[12px] text-taupe">{c.category.name}</p>
                </th>
              ))}
              {Array.from({ length: placeholders }).map((_, i) => (
                <td key={`ph-${i}`} className="px-3 pb-6 align-top sm:px-4">
                  <Link
                    href="/collections/all"
                    className="flex aspect-square flex-col items-center justify-center gap-3 border border-dashed border-stone text-taupe transition-colors hover:border-ink hover:text-ink"
                  >
                    <Plus className="h-5 w-5" strokeWidth={1} aria-hidden />
                    <span className="text-[11px] uppercase tracking-[0.16em]">Add a piece</span>
                  </Link>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const values = items.map((c) => row.value(c, details[c.id] === undefined ? undefined : details[c.id]));
              const differs = new Set(values.map((v) => v.text)).size > 1;
              const mark = highlight && differs;
              return (
                <tr key={row.id} className={cn('border-t border-line align-top transition-colors', mark && 'bg-gold-pale/40')}>
                  <th scope="row" className={cn('sticky left-0 z-10 py-4 pr-4 text-[11px] font-medium uppercase tracking-[0.14em] text-taupe', mark ? 'bg-[#F6EFE1]' : 'bg-ivory')}>
                    {row.label}
                    {mark && <span className="sr-only"> (differs)</span>}
                  </th>
                  {values.map((v, i) => (
                    <td key={items[i].id} className={cn('px-3 py-4 text-charcoal sm:px-4', row.id === 'price' && 'text-[14px] text-ink')}>
                      {v.node ?? v.text}
                    </td>
                  ))}
                  {Array.from({ length: placeholders }).map((_, i) => (
                    <td key={`ph-${i}`} className="px-3 py-4 sm:px-4" />
                  ))}
                </tr>
              );
            })}
            <tr className="border-t border-line">
              <th scope="row" className="sticky left-0 z-10 bg-ivory py-5 pr-4">
                <span className="sr-only">Actions</span>
              </th>
              {items.map((c) => (
                <td key={c.id} className="px-3 py-5 sm:px-4">
                  <Link
                    href={productHref(c, undefined, undefined, true)}
                    className="label-caps flex h-11 w-full items-center justify-center border border-ink/80 px-3 text-center transition-colors hover:bg-ink hover:text-ivory"
                  >
                    View diamond options
                  </Link>
                </td>
              ))}
              {Array.from({ length: placeholders }).map((_, i) => (
                <td key={`ph-${i}`} />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-[12px] text-taupe">
        Prices shown are starting prices; the final price depends on the metal and the certified diamond you choose. Colour and clarity reflect the default stone or diamond package.
      </p>
    </div>
  );
}
