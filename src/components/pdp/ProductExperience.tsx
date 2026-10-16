'use client';
import { useEffect, useMemo } from 'react';
import { PURITIES, label } from '@/lib/catalog';
import type { ProductCard, ProductDetail } from '@/lib/types';
import { formatMoney } from '@/lib/utils';
import { useRecentlyViewed } from '@/store/lists';
import { AccordionItem } from '@/components/ui/Accordion';
import { useStoreSettings } from '@/components/providers/SettingsProvider';
import { Gallery } from './Gallery';
import { ConfiguratorPanel } from './ConfiguratorPanel';
import { useConfiguration, type InitialConfig } from './useConfiguration';

const SPEC_GRID = 'grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-1';

function Spec({ k, v }: { k: string; v: React.ReactNode }) {
  if (v == null || v === '') return null;
  return (
    <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
      <dt className="text-taupe">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}

/** Strip detail-only fields so wishlist / compare / recently-viewed stay small in localStorage */
export function toCard(p: ProductDetail): ProductCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    category: p.category,
    fromPrice: p.fromPrice,
    priceByPurity: p.priceByPurity,
    metalColors: p.metalColors,
    purities: p.purities,
    defaultMetalColor: p.defaultMetalColor,
    defaultPurity: p.defaultPurity,
    shapes: p.shapes,
    centerCarat: p.centerCarat,
    totalCarat: p.totalCarat,
    settingType: p.settingType,
    styles: p.styles,
    art: p.art,
    images: p.images,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isNew: p.isNew,
    hasCenterStone: p.hasCenterStone,
    inStock: p.inStock,
  };
}

export function ProductExperience({ p, init, configure, compact }: { p: ProductDetail; init?: InitialConfig; configure?: boolean; compact?: boolean }) {
  const c = useConfiguration(p, init);
  const card = useMemo(() => toCard(p), [p]);
  const addRecent = useRecentlyViewed((s) => s.add);
  const settings = useStoreSettings();

  useEffect(() => {
    if (!compact) addRecent(card);
  }, [card, compact, addRecent]);

  // keep the URL shareable as the configuration changes (no navigation / re-render)
  useEffect(() => {
    if (compact) return;
    const u = new URL(window.location.href);
    u.searchParams.set('metal', c.metal);
    u.searchParams.set('purity', c.purity);
    if (c.centerOption) u.searchParams.set('shape', c.shape);
    u.searchParams.delete('configure');
    window.history.replaceState(window.history.state, '', u.toString());
  }, [c.metal, c.purity, c.shape, c.centerOption, compact]);

  const purity = PURITIES.find((x) => x.slug === c.purity);
  const d = c.centerOption ? c.diamond : null;
  const o = !c.centerOption ? c.option : null;

  return (
    <div className={compact ? 'grid gap-8 md:grid-cols-2' : 'grid gap-8 lg:grid-cols-5 lg:gap-12 xl:gap-14'}>
      <div className={compact ? '' : 'min-w-0 lg:col-span-3'}>
        <Gallery name={p.name} art={p.art} images={p.images} metal={c.metal} shape={c.shape} carat={c.carat} compact={compact} />
      </div>
      <div className={compact ? '' : 'min-w-0 lg:col-span-2'}>
        <ConfiguratorPanel p={p} card={card} c={c} compact={compact} initialConfigure={configure} />
        {!compact && (
          <>
            <div className="mt-7 space-y-6">
              <div>
                <h2 className="mb-3 font-serif text-xl font-semibold">Product Details</h2>
                <dl className={SPEC_GRID}>
                  <Spec k="SKU" v={c.variant?.sku ?? p.sku} />
                  <Spec k="Metal" v={`${purity?.label} ${label.metal(c.metal)}`} />
                  <Spec k="Gold content" v={purity?.fineness} />
                  <Spec k="Diamond type" v="Lab-grown" />
                  {p.settingType && <Spec k="Setting" v={label.setting(p.settingType)} />}
                  {o?.totalCarat != null && <Spec k="Total carat" v={`${o.totalCarat.toFixed(2)} ctw`} />}
                </dl>
              </div>
              {d && (
                <div>
                  <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-gold">Center Stone</h3>
                  <dl className={SPEC_GRID}>
                    <Spec k="Shape" v={label.shape(d.shape)} />
                    <Spec k="Carat" v={`${d.carat.toFixed(2)} ct`} />
                    <Spec k="Colour" v={d.color} />
                    <Spec k="Clarity" v={d.clarity} />
                    <Spec k="Cut" v={d.cut} />
                    <Spec k="Polish / Symmetry" v={`${d.polish} / ${d.symmetry}`} />
                    {d.measurements && <Spec k="Measurements" v={d.measurements} />}
                    <Spec
                      k="Certificate"
                      v={
                        d.certificate ? (
                          d.certificate.url ? (
                            <a href={d.certificate.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-gold">
                              {d.certificate.lab} #{d.certificate.number}
                            </a>
                          ) : (
                            `${d.certificate.lab} #${d.certificate.number}`
                          )
                        ) : (
                          'Pending'
                        )
                      }
                    />
                  </dl>
                </div>
              )}
              {o && (
                <div>
                  <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-gold">Diamonds</h3>
                  <dl className={SPEC_GRID}>
                    <Spec k="Shape" v={label.shape(p.shapes[0])} />
                    {o.totalCarat != null && <Spec k="Total carat" v={`${o.totalCarat.toFixed(2)} ctw`} />}
                    <Spec k="Colour" v={o.color} />
                    <Spec k="Clarity" v={o.clarity ? `${o.clarity}+` : null} />
                  </dl>
                </div>
              )}
            </div>

            <div className="mt-8">
              <AccordionItem title="Description" defaultOpen>
                <p>{p.description}</p>
                {p.details && <p className="mt-3">{p.details}</p>}
              </AccordionItem>
              <AccordionItem title="Certification">
                <p>
                  Every diamond over 0.30 ct is independently graded by IGI or GIA and ships with its original report. {c.diamond?.certificate && `This diamond: ${c.diamond.certificate.lab} report #${c.diamond.certificate.number}. `}
                  Smaller accent diamonds are matched by our gemologists to the same colour and clarity standard.
                </p>
              </AccordionItem>
              <AccordionItem title="Shipping">
                <ul className="space-y-1">
                  {settings.shippingMethods.map((m) => (
                    <li key={m.id} className="flex justify-between gap-4">
                      <span>
                        {m.label} <span className="text-taupe">· {m.eta}</span>
                      </span>
                      <span>{m.price ? formatMoney(m.price) : 'Complimentary'}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">Every order is fully insured, discreetly packaged and requires a signature on delivery.</p>
              </AccordionItem>
              <AccordionItem title="Returns">
                <p>
                  Return or exchange within {settings.returnsDays} days of delivery for a full refund — return shipping is on us. Engraved and bespoke pieces are final sale.{' '}
                  <a className="underline underline-offset-4" href="/pages/returns">
                    Read the returns policy
                  </a>
                  .
                </p>
              </AccordionItem>
              <AccordionItem title="Warranty">
                <p>
                  A lifetime manufacturing warranty covers every piece, along with complimentary cleaning, prong checks and rhodium refreshes.{' '}
                  <a className="underline underline-offset-4" href="/pages/warranty">
                    Warranty details
                  </a>
                  .
                </p>
              </AccordionItem>
              <AccordionItem title="Care Instructions">
                <p>
                  Clean gently with warm water, mild soap and a soft brush. Remove before swimming, gym sessions or applying lotions, and store each piece separately in its pouch.{' '}
                  {c.metal.includes('white') && 'White gold is finished with a bright rhodium plating, which we refresh complimentary for life. '}
                  <a className="underline underline-offset-4" href="/pages/care-guide">
                    Full care guide
                  </a>
                  .
                </p>
              </AccordionItem>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
