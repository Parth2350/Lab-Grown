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
import { DiamondDetail } from './DiamondConfigurator';
import { useConfiguration, type InitialConfig } from './useConfiguration';

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

  return (
    <div className={compact ? 'grid gap-8 md:grid-cols-2' : 'grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-16'}>
      <div className={compact ? '' : 'lg:sticky lg:top-[130px] lg:self-start'}>
        <Gallery name={p.name} art={p.art} images={p.images} metal={c.metal} shape={c.shape} carat={c.carat} compact={compact} />
      </div>
      <div>
        <ConfiguratorPanel p={p} card={card} c={c} compact={compact} initialConfigure={configure} />
        {!compact && (
          <div className="mt-4">
            <AccordionItem title="Description" defaultOpen>
              <p>{p.description}</p>
              {p.details && <p className="mt-3">{p.details}</p>}
            </AccordionItem>
            <AccordionItem title="Diamond Details">
              {c.centerOption && c.diamond ? (
                <DiamondDetail d={c.diamond} />
              ) : c.option ? (
                <dl className="space-y-1.5">
                  <div className="flex justify-between">
                    <dt className="text-taupe">Total carat weight</dt>
                    <dd>{c.option.totalCarat?.toFixed(2)} ct</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-taupe">Shape</dt>
                    <dd>{label.shape(p.shapes[0])}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-taupe">Colour / Clarity</dt>
                    <dd>
                      {c.option.color} / {c.option.clarity}+
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-taupe">Diamond type</dt>
                    <dd>Lab-grown, matched by hand</dd>
                  </div>
                  {p.settingType && (
                    <div className="flex justify-between">
                      <dt className="text-taupe">Setting</dt>
                      <dd>{label.setting(p.settingType)}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p>This design is crafted in solid gold without diamonds.</p>
              )}
            </AccordionItem>
            <AccordionItem title="Metal Details">
              <p>
                {purity?.label} {label.metal(c.metal)} — {purity?.fineness}. Cast from recycled solid gold and hand-polished. {c.metal.includes('white') && 'White gold is finished with a bright rhodium plating, which we refresh complimentary for life. '}
                Setting price for this metal: {formatMoney(c.variant?.price ?? 0)}.
              </p>
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
                Return or exchange within {settings.returnsDays} days of delivery for a full refund — return shipping is on us. Engraved and bespoke pieces are final sale. <a className="underline underline-offset-4" href="/pages/returns">Read the returns policy</a>.
              </p>
            </AccordionItem>
            <AccordionItem title="Warranty">
              <p>
                A lifetime manufacturing warranty covers every piece, along with complimentary cleaning, prong checks and rhodium refreshes. <a className="underline underline-offset-4" href="/pages/warranty">Warranty details</a>.
              </p>
            </AccordionItem>
            <AccordionItem title="Care Instructions">
              <p>
                Clean gently with warm water, mild soap and a soft brush. Remove before swimming, gym sessions or applying lotions, and store each piece separately in its pouch. <a className="underline underline-offset-4" href="/pages/care-guide">Full care guide</a>.
              </p>
            </AccordionItem>
          </div>
        )}
      </div>
    </div>
  );
}
