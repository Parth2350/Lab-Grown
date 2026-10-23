'use client';
import { Check, ChevronDown, Gem, RefreshCcw, Ruler, Share2, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { METAL_COLORS, PURITIES, SHAPE_SLUGS, label } from '@/lib/catalog';
import { fmtCarat } from '@/lib/variant';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import type { ProductCard, ProductDetail } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUI } from '@/store/ui';
import { Sheet } from '@/components/ui/Sheet';
import { CompareButton, WishlistButton } from '@/components/product/ProductCard';
import { useStoreSettings } from '@/components/providers/SettingsProvider';
import { CenterDiamondPicker } from './CenterDiamondPicker';
import { OptionGroup, optionBtn, optionLabel } from './Options';
import { ENGRAVING_MAX, diamondSummary, type Configuration } from './useConfiguration';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { productEnquiry } from '@/lib/whatsapp';
import { useCurrency, useFormatMoney } from '@/components/providers/CurrencyProvider';

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

/** "28 Oct": the latest dispatch date in India time — 5 business days in stock, 10 when made to order */
function shipBy(madeToOrder: boolean) {
  const d = new Date(Date.now() + 5.5 * 36e5);
  for (let n = 0; n < (madeToOrder ? 10 : 5); ) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() % 6 !== 0) n++;
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function ConfiguratorPanel({ p, card, c, compact, initialConfigure }: { p: ProductDetail; card: ProductCard; c: Configuration; compact?: boolean; initialConfigure?: boolean }) {
  const formatMoney = useFormatMoney();
  const currency = useCurrency();
  const toast = useUI((s) => s.toast);
  const settings = useStoreSettings();
  const [sizeGuide, setSizeGuide] = useState(false);
  const [sizePicker, setSizePicker] = useState(false);
  const settingPrice = c.variant?.price ?? 0;
  const tagline = p.subtitle ? p.subtitle[0].toUpperCase() + p.subtitle.slice(1) : null;

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
      {compact ? <h2 className="font-serif text-2xl font-semibold leading-tight">{p.name}</h2> : <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-[1.75rem]">{p.name}</h1>}
      {tagline && <p className="mt-2 font-serif text-[17px] italic text-gold">{tagline}</p>}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-5 sm:pb-6">
        <p className="font-serif text-[1.75rem] font-semibold leading-none text-ink sm:text-[2rem]" aria-live="polite">
          {formatMoney(c.price)}
        </p>
        <p className="text-[14px] text-taupe">{c.centerOption ? 'Setting + centre diamond · ' : ''}Taxes extra</p>
      </div>

      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <OptionGroup label="Metal" value={label.metal(c.metal)}>
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
                className={cn('h-9 w-9 rounded-full border-2 transition', c.metal === m ? 'border-ink ring-2 ring-gold' : 'border-line hover:border-gold')}
                style={{ background: mc?.swatch }}
              />
            );
          })}
        </OptionGroup>

        <OptionGroup label="Gold Purity" value={c.purity}>
          {PURITIES.filter((x) => p.purities.includes(x.slug)).map((x) => (
            <button key={x.slug} type="button" aria-pressed={c.purity === x.slug} onClick={() => c.setPurity(x.slug)} className={optionBtn(c.purity === x.slug)}>
              <span className="text-sm font-medium leading-none">{x.label}</span>
            </button>
          ))}
        </OptionGroup>

        {c.choices.shapes.length > 0 && (
          <OptionGroup label="Shape" value={label.shape(c.shape)}>
            {c.choices.shapes.map((s) => {
              const classic = (SHAPE_SLUGS as string[]).includes(s);
              return (
                <button key={s} type="button" title={label.shape(s)} aria-label={label.shape(s)} aria-pressed={s === c.shape} onClick={() => c.setShape(s)} className={cn(optionBtn(s === c.shape), !classic && 'gap-1')}>
                  <ShapeIcon shape={s} size={24} className={s === c.shape ? 'text-ink' : 'text-charcoal/70'} />
                  {!classic && <span className="max-w-[5.5rem] text-[11px] leading-tight">{label.shape(s)}</span>}
                </button>
              );
            })}
          </OptionGroup>
        )}

        {c.choices.carats.length > 0 && (
          <OptionGroup label={p.caratKind === 'total' ? 'Total Carat' : 'Center Carat'} value={c.selectedCarat != null ? `${fmtCarat(c.selectedCarat)} ct` : undefined}>
            {c.choices.carats.map((ct) => (
              <button key={ct} type="button" aria-pressed={ct === c.selectedCarat} onClick={() => c.setCarat(ct)} className={optionBtn(ct === c.selectedCarat)}>
                <span className="text-sm font-medium leading-none">{fmtCarat(ct)}</span>
              </button>
            ))}
          </OptionGroup>
        )}

        {c.choices.lengths.length > 0 && (
          <OptionGroup label="Length" value={c.selectedLength ? `${c.selectedLength} in` : undefined}>
            {c.choices.lengths.map((l) => (
              <button key={l} type="button" aria-pressed={l === c.selectedLength} onClick={() => c.setLength(l)} className={optionBtn(l === c.selectedLength)}>
                <span className="text-sm font-medium leading-none">{l} in</span>
              </button>
            ))}
          </OptionGroup>
        )}

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
          <OptionGroup
            label="Diamond Weight"
            value={c.option ? `${c.option.totalCarat != null ? `${c.option.totalCarat.toFixed(2)} ct` : c.option.label} · ${c.option.color} colour · ${c.option.clarity}+` : undefined}
            className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
          >
            {c.totalWeightOptions.map((o) => (
              <button key={o.id} type="button" aria-pressed={c.option?.id === o.id} onClick={() => c.setOption(o)} className={optionBtn(c.option?.id === o.id)}>
                <span className="text-sm font-medium leading-none">{o.totalCarat != null ? `${o.totalCarat} ct` : o.label}</span>
              </button>
            ))}
          </OptionGroup>
        )}
      </div>

      {/* ring size, picked from a side drawer */}
      {p.requiresSize && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span id={`ring-size-label-${p.id}`} className={optionLabel}>
              Ring Size (US)
            </span>
            <button type="button" onClick={() => setSizeGuide(true)} className="flex items-center gap-1 text-xs font-medium text-ink hover:text-gold">
              <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} /> Size guide
            </button>
          </div>
          <button
            id={`ring-size-${p.id}`}
            type="button"
            aria-haspopup="dialog"
            aria-labelledby={`ring-size-label-${p.id} ring-size-${p.id}`}
            aria-invalid={c.sizeError}
            onClick={() => setSizePicker(true)}
            className={cn('flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors hover:border-gold', c.sizeError ? 'border-danger' : 'border-line')}
          >
            <span className={c.ringSize ? 'font-medium text-ink' : 'text-taupe'}>{c.ringSize ? `Size ${c.ringSize}` : 'Select your size'}</span>
            <ChevronDown className="h-4 w-4 text-taupe" strokeWidth={1.5} aria-hidden />
          </button>
          {c.sizeError && <p className="mt-1.5 text-xs text-danger">Please choose a ring size — first resize within 60 days is complimentary.</p>}
          <Sheet open={sizePicker} onClose={() => setSizePicker(false)} title="Select your size" label="Select your ring size" bodyClassName="px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between border-b border-line px-2 pb-3">
              <span className="text-xs text-taupe">US sizing · made to order</span>
              <button
                type="button"
                onClick={() => {
                  setSizePicker(false);
                  setSizeGuide(true);
                }}
                className="flex items-center gap-1 text-xs font-medium text-ink hover:text-gold"
              >
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} /> Size guide
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {c.sizes.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={c.ringSize === s}
                    onClick={() => {
                      c.setRingSize(s);
                      setSizePicker(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium text-ink transition-colors',
                      c.ringSize === s ? 'border-ink bg-ink/5' : 'border-transparent hover:border-gold',
                    )}
                  >
                    {c.ringSize === s && <Check className="h-4 w-4 text-gold" strokeWidth={2} aria-hidden />}
                    Size {s}
                  </button>
                </li>
              ))}
            </ul>
          </Sheet>
          <SizeGuide open={sizeGuide} onClose={() => setSizeGuide(false)} />
        </div>
      )}

      {/* free engraving */}
      {p.showEngraving && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`engraving-${p.id}`} className="text-sm font-semibold text-ink">
              Free engraving <span className="font-normal text-taupe">(optional)</span>
            </label>
            <span className="text-2xs text-taupe">
              {c.engraving.length}/{ENGRAVING_MAX}
            </span>
          </div>
          <input
            id={`engraving-${p.id}`}
            type="text"
            maxLength={ENGRAVING_MAX}
            value={c.engraving}
            onChange={(e) => c.setEngraving(e.target.value)}
            placeholder="Initials, a date, a few words…"
            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-taupe/70 focus:border-gold"
          />
          <p className="mt-1.5 text-2xs text-taupe">Hand-engraved inside the band at no charge, up to {ENGRAVING_MAX} characters. Engraved pieces are final sale.</p>
        </div>
      )}

      {/* CTAs, pinned to the bottom of the screen on phones */}
      <div
        data-mobile-bar={compact ? undefined : ''}
        className={cn(
          'mt-6 flex items-stretch gap-3',
          !compact &&
            'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none',
        )}
      >
        {/* orders are placed over WhatsApp: the message carries this exact configuration */}
        <WhatsAppButton
          className="shrink-0 py-3.5"
          message={(origin) =>
            productEnquiry(origin, {
              name: p.name,
              slug: p.slug,
              sku: c.variant?.sku ?? p.sku,
              purity: c.purity,
              metalColor: c.metal,
              diamond: c.centerOption
                ? c.diamond
                  ? `${diamondSummary(c.diamond)}${c.diamond.certificate ? ` · ${c.diamond.certificate.lab} #${c.diamond.certificate.number}` : ''}`
                  : 'to be chosen'
                : null,
              option: !c.centerOption ? c.option?.label ?? null : null,
              details: c.details,
              shape: c.shape,
              carat: c.catalog ? c.selectedCarat : null,
              length: c.selectedLength,
              ringSize: c.ringSize || null,
              requiresSize: p.requiresSize,
              engraving: c.engraving.trim() || null,
              quantity: c.quantity,
              unitPrice: c.price,
              priceNote: c.needsDiamond ? 'setting only, diamond extra' : null,
            }, currency)
          }
        >
          Enquire
        </WhatsAppButton>
        <button
          type="button"
          onClick={() => c.addToCart()}
          disabled={c.needsDiamond}
          className="flex flex-1 items-center justify-center rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-ivory transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <WishlistButton product={card} withLabel />
        <CompareButton product={card} withLabel />
        <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-2xs font-semibold uppercase tracking-luxe text-ink transition-colors hover:border-ink">
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Share
        </button>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl bg-porcelain px-5 py-4">
        <Truck className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold">
            Ships by <span suppressHydrationWarning>{shipBy(c.madeToOrder)}</span>
          </span>
          <br />
          {!c.madeToOrder ? (
            <>
              <span className="font-semibold">In stock</span> — ready to ship in 3–5 business days.
            </>
          ) : (
            <>
              <span className="font-semibold">Made to order</span> — crafted for you by hand.
            </>
          )}
        </p>
      </div>

      <ul className="mt-6 grid grid-cols-4 gap-2 border-y border-line py-5">
        {[
          { icon: ShieldCheck, text: 'IGI / GIA Certified' },
          { icon: Truck, text: 'Free Insured Shipping' },
          { icon: RefreshCcw, text: `${settings.returnsDays}-Day Returns` },
          { icon: Gem, text: 'Lifetime Warranty' },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex flex-col items-center gap-1.5 text-center">
            <Icon className="h-6 w-6 text-gold" strokeWidth={1.25} aria-hidden />
            <span className="text-2xs font-medium leading-tight text-taupe">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
