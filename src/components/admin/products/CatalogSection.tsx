'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { METAL_COLORS, label } from '@/lib/catalog';
import { formatMoney } from '@/lib/utils';
import { variantSummary } from '@/lib/variant';
import { Badge } from '../ui';
import { EditorSection, inputCls } from './editor-ui';
import { ProductObjectButton } from './ProductObjectButton';
import type { CatalogMeta } from './shared';

const PAGE = 50;

/**
 * Partner-catalogue products: everything the catalogue owns (prices, options, item codes, catalogue photos)
 * is shown read-only here and refreshed by each catalogue import.
 */
export function CatalogSection({ catalog, media }: { catalog: CatalogMeta; media: ReactNode }) {
  const o = catalog.object;
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(PAGE);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return catalog.variants;
    return catalog.variants.filter((v) => [v.sku, v.purity, label.metal(v.metalColor), variantSummary(v) ?? ''].join(' ').toLowerCase().includes(t));
  }, [catalog.variants, q]);
  const carats = o.centerCarats.length ? o.centerCarats : o.totalCarats;

  const facts: [string, ReactNode][] = [
    ['Family key', <span key="k" className="font-mono text-[13.5px]">{o.familyKey}</span>],
    ['Catalogue title', o.title],
    ['Product type', o.productType],
    ['Default item', <span key="d" className="font-mono text-[13.5px]">{o.defaultItemCode}</span>],
    ['Price', `${formatMoney(o.priceFrom * 100)}${o.priceTo > o.priceFrom ? ` – ${formatMoney(o.priceTo * 100)}` : ''}${o.defaultPrice != null ? ` · default ${formatMoney(o.defaultPrice * 100)}` : ''}`],
    ['Variants', `${o.variantCount}`],
    [
      'Metals',
      <span key="m" className="flex flex-wrap items-center gap-1.5">
        {o.metalTypes.map((m) => (
          <span key={m} className="inline-flex items-center gap-1">
            <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: METAL_COLORS.find((x) => x.label === m)?.swatch }} />
            {m}
            {m === o.defaultMetalType && <span className="text-taupe">(default)</span>}
          </span>
        ))}
      </span>,
    ],
    ['Purities', o.metalStamps.map((s) => (s === o.defaultMetalStamp ? `${s} (default)` : s)).join(', ')],
    ['Shapes', o.shapes.join(', ') || '—'],
    [o.centerCarats.length ? 'Centre carats' : 'Total carats', carats.length ? carats.join(', ') : '—'],
    ...(o.lengths.length ? ([['Lengths', `${o.lengths.join(', ')} in`]] as [string, ReactNode][]) : []),
    ...(catalog.ringSizes.length ? ([['Ring sizes', catalog.ringSizes.join(', ')]] as [string, ReactNode][]) : []),
    ['Engraving', catalog.showEngraving ? 'Offered (free)' : 'Not offered'],
  ];

  return (
    <EditorSection
      id="catalogue"
      title="Partner catalogue"
      description="Prices, options, item codes and catalogue photos come from the BrillianceCarat catalogue and are refreshed each time it is imported. Edit the name, description, category, collections, visibility and SEO above and below."
      actions={<ProductObjectButton object={o} name={o.displayTitle} />}
    >
      <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[minmax(140px,auto)_1fr]">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-taupe">{k}</dt>
            <dd className="min-w-0 break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal">
            Variants <span className="font-normal normal-case tracking-normal text-taupe">({rows.length})</span>
          </p>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Item code, metal, shape, carat…"
            aria-label="Search variants"
            className={`${inputCls} max-w-xs py-1.5`}
          />
        </div>
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="bg-[#FBFAF7] text-[12px] uppercase tracking-[0.12em] text-taupe">
              <tr>
                <th className="px-3 py-2 font-medium">Item code</th>
                <th className="px-3 py-2 font-medium">Metal</th>
                <th className="px-3 py-2 font-medium">Options</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map((v) => (
                <tr key={v.sku} className="border-t border-line">
                  <td className="px-3 py-1.5 font-mono text-[13px]">{v.sku}</td>
                  <td className="px-3 py-1.5">
                    {v.purity} {label.metal(v.metalColor)}
                  </td>
                  <td className="px-3 py-1.5 text-taupe">{variantSummary(v) ?? '—'}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(v.price)}</td>
                  <td className="px-3 py-1.5">{v.isActive ? <Badge tone="success">Live</Badge> : <Badge>Retired</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > shown && (
          <button type="button" onClick={() => setShown((n) => n + PAGE * 4)} className="mt-2 text-[14px] text-taupe underline underline-offset-4 hover:text-ink">
            Show more ({rows.length - shown} left)
          </button>
        )}
      </div>

      <div className="mt-8">
        <p className="mb-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal">Photos &amp; video</p>
        {media}
      </div>
    </EditorSection>
  );
}
