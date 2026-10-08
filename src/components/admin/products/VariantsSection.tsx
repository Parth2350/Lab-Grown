'use client';
import { useState } from 'react';
import { Archive, Sparkles, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { METAL_COLORS, PURITIES } from '@/lib/catalog';
import { cn, formatMoney } from '@/lib/utils';
import { toast } from '../toast';
import { EditorSection, ErrorText, labelCls, type SectionProps } from './editor-ui';
import { centsToDollarInput, gridVariants, orphanVariants, parseMoneyInput, suggestedVariantPrice, variantErrKey, variantKey, type VariantDraft } from './shared';

const cell = 'field h-9 px-2.5 py-0 text-[14.5px] tabular-nums';
const metalOf = (slug: string) => METAL_COLORS.find((m) => m.slug === slug);

export function VariantsSection({ draft, update, errors, lowStock }: SectionProps & { lowStock: number }) {
  const [bulkStock, setBulkStock] = useState('');
  const rows = gridVariants(draft);
  const orphans = orphanVariants(draft);
  const base = parseMoneyInput(draft.basePrice);

  const patchVariant = (v: VariantDraft, patch: Partial<VariantDraft>) =>
    update((d) => ({ variants: d.variants.map((x) => (variantKey(x.purity, x.metalColor) === variantKey(v.purity, v.metalColor) ? { ...x, ...patch } : x)) }));

  const generatePrices = () => {
    if (base == null) {
      toast.error('Enter a valid base price first');
      return;
    }
    update((d) => ({ variants: d.variants.map((v) => ({ ...v, priceAuto: true, price: centsToDollarInput(suggestedVariantPrice(base, v.purity, v.metalColor)) })) }));
    toast.success('Prices refreshed from the base price', 'Review them, then save the product.');
  };

  const regenerateSkus = () => update((d) => ({ variants: d.variants.map((v) => ({ ...v, skuAuto: true })) }));

  const applyBulkStock = () => {
    const n = Number(bulkStock);
    if (bulkStock === '' || !Number.isInteger(n) || n < 0) {
      toast.error('Enter a whole number of 0 or more');
      return;
    }
    const keys = new Set(rows.map((r) => variantKey(r.purity, r.metalColor)));
    update((d) => ({ variants: d.variants.map((v) => (keys.has(variantKey(v.purity, v.metalColor)) ? { ...v, stock: String(n) } : v)) }));
    setBulkStock('');
  };

  const totalStock = rows.filter((r) => r.isActive).reduce((s, r) => s + (Number(r.stock) || 0), 0);
  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <EditorSection
      id="variants"
      title="Variants"
      description={rows.length ? `${activeCount} of ${rows.length} active · ${totalStock.toLocaleString()} in stock across active variants` : 'One variant per purity × metal combination.'}
      actions={
        rows.length > 0 && (
          <>
            <Button type="button" size="sm" variant="ghost" onClick={regenerateSkus} title="Rebuild every variant SKU from the product SKU">
              Reset SKUs
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={generatePrices} disabled={base == null} title={base == null ? 'Enter a base price first' : 'Fill every price from the base price'}>
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Generate prices
            </Button>
          </>
        )
      }
    >
      {errors.variants && <ErrorText msg={errors.variants} />}
      {rows.length === 0 ? (
        <p className="border border-dashed border-line px-4 py-6 text-center text-[15px] text-taupe">Choose at least one metal colour and one purity under Attributes to create variants.</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-taupe">
            Suggested price = base × purity multiplier (+5% for two-tone), rounded to a retail price. Prices follow the base price until you edit them.
          </p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] border-collapse text-left text-[15px] tabular-nums">
              <thead className="border-b border-line bg-ivory/70">
                <tr>
                  <th scope="col" className="px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                    Variant
                  </th>
                  <th scope="col" className="px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                    SKU
                  </th>
                  <th scope="col" className="w-[150px] px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                    Price ($)
                  </th>
                  <th scope="col" className="w-[100px] px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                    Stock
                  </th>
                  <th scope="col" className="w-[70px] px-3 py-2 text-center text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v, i) => {
                  const metal = metalOf(v.metalColor);
                  const purity = PURITIES.find((p) => p.slug === v.purity);
                  const id = `v-${v.purity}-${v.metalColor}`;
                  const errSku = errors[variantErrKey(v.purity, v.metalColor, 'sku')];
                  const errPrice = errors[variantErrKey(v.purity, v.metalColor, 'price')];
                  const errStock = errors[variantErrKey(v.purity, v.metalColor, 'stock')];
                  const suggested = base != null ? suggestedVariantPrice(base, v.purity, v.metalColor) : null;
                  const current = parseMoneyInput(v.price);
                  const stock = Number(v.stock);
                  const groupStart = i === 0 || rows[i - 1].purity !== v.purity;
                  const label = `${purity?.label ?? v.purity} ${metal?.label ?? v.metalColor}`;
                  return (
                    <tr key={id} className={cn('border-b border-line/70 last:border-0', groupStart && i > 0 && 'border-t border-t-line', !v.isActive && 'bg-ivory/60')}>
                      <th scope="row" className="px-3 py-2 text-left align-top font-normal">
                        <div className="flex items-center gap-2 pt-1.5">
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: metal?.swatch }} aria-hidden />
                          <span className={cn('whitespace-nowrap', !v.isActive && 'text-taupe')}>
                            <span className="font-medium">{purity?.label ?? v.purity}</span> {metal?.short ?? v.metalColor}
                          </span>
                          {!v.id && <span className="border border-gold/30 bg-gold-pale px-1 text-[12px] uppercase tracking-wider text-gold-deep">New</span>}
                        </div>
                      </th>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`${id}-sku`} className="sr-only">
                          SKU for {label}
                        </label>
                        <input
                          id={`${id}-sku`}
                          value={v.sku}
                          onChange={(e) => patchVariant(v, { sku: e.target.value.toUpperCase().replace(/\s+/g, '-'), skuAuto: false })}
                          maxLength={48}
                          spellCheck={false}
                          aria-invalid={errSku ? true : undefined}
                          className={cn(cell, 'min-w-[190px] font-mono text-[13.5px] uppercase')}
                        />
                        <ErrorText msg={errSku} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`${id}-price`} className="sr-only">
                          Price for {label} in dollars
                        </label>
                        <input
                          id={`${id}-price`}
                          inputMode="decimal"
                          value={v.price}
                          onChange={(e) => patchVariant(v, { price: e.target.value, priceAuto: false })}
                          aria-invalid={errPrice ? true : undefined}
                          className={cell}
                          placeholder={suggested != null ? centsToDollarInput(suggested) : 'Auto'}
                        />
                        {errPrice ? (
                          <ErrorText msg={errPrice} />
                        ) : suggested != null && current !== suggested ? (
                          <button type="button" onClick={() => patchVariant(v, { price: centsToDollarInput(suggested), priceAuto: true })} className="mt-1 text-[13px] text-taupe underline-offset-4 hover:text-ink hover:underline">
                            Use {formatMoney(suggested)}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label htmlFor={`${id}-stock`} className="sr-only">
                          Stock for {label}
                        </label>
                        <input
                          id={`${id}-stock`}
                          inputMode="numeric"
                          value={v.stock}
                          onChange={(e) => patchVariant(v, { stock: e.target.value.replace(/[^\d]/g, '') })}
                          aria-invalid={errStock ? true : undefined}
                          className={cn(cell, v.isActive && v.stock !== '' && stock === 0 && 'border-danger/50 text-danger', v.isActive && stock > 0 && stock <= lowStock && 'border-[#E6CF9E]')}
                        />
                        {errStock ? <ErrorText msg={errStock} /> : v.isActive && v.stock !== '' && stock <= lowStock ? <p className={cn('mt-1 text-[13px]', stock === 0 ? 'text-danger' : 'text-[#7A5718]')}>{stock === 0 ? 'Sold out' : 'Low stock'}</p> : null}
                      </td>
                      <td className="px-3 py-2 text-center align-top">
                        <label className="inline-flex h-9 cursor-pointer items-center justify-center">
                          <input type="checkbox" checked={v.isActive} onChange={(e) => patchVariant(v, { isActive: e.target.checked })} className="h-4 w-4 accent-ink" />
                          <span className="sr-only">{label} active</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="bulk-stock" className={labelCls}>
                Set stock for all
              </label>
              <input
                id="bulk-stock"
                inputMode="numeric"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyBulkStock();
                  }
                }}
                className="field h-9 w-28 px-3 py-0 text-[15px] tabular-nums"
                placeholder="e.g. 10"
              />
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={applyBulkStock} disabled={bulkStock === ''}>
              Apply
            </Button>
          </div>
        </>
      )}

      {orphans.length > 0 && (
        <div className="mt-5 border border-[#E6CF9E] bg-[#FBF3E1]/60 p-4">
          <p className="text-[14px] font-medium uppercase tracking-[0.12em] text-[#7A5718]">Retired combinations</p>
          <p className="mt-1 text-xs text-charcoal">These saved variants are no longer in the purities × metals you offer. On save, variants used by orders or carts are kept but deactivated; the rest are deleted.</p>
          <ul className="mt-3 divide-y divide-[#E6CF9E]/70">
            {orphans.map((v) => {
              const keep = v.orderCount + v.cartCount > 0;
              return (
                <li key={variantKey(v.purity, v.metalColor)} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[15px]">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: metalOf(v.metalColor)?.swatch }} aria-hidden />
                    {v.purity} {metalOf(v.metalColor)?.short ?? v.metalColor}
                    <span className="font-mono text-[13px] text-taupe">{v.sku}</span>
                  </span>
                  <span className={cn('inline-flex items-center gap-1.5 text-xs', keep ? 'text-[#7A5718]' : 'text-danger')}>
                    {keep ? <Archive className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> : <Trash className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
                    {keep
                      ? `Kept inactive — on ${[v.orderCount ? `${v.orderCount} order line${v.orderCount === 1 ? '' : 's'}` : '', v.cartCount ? `${v.cartCount} cart${v.cartCount === 1 ? '' : 's'}` : ''].filter(Boolean).join(' & ')}`
                      : 'Will be deleted'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </EditorSection>
  );
}
