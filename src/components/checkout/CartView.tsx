'use client';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, MessageCircle, Phone, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { site } from '@/config/site';
import { computeTotals } from '@/lib/pricing';
import type { ProductCard as Card } from '@/lib/types';
import { formatMoney, pluralize } from '@/lib/utils';
import { cartCount, useCart } from '@/store/cart';
import { useMounted } from '@/hooks/use-mounted';
import { useStoreSettings } from '@/components/providers/SettingsProvider';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { ProductCard } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { bagEnquiry, lineItem } from '@/lib/whatsapp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useCoupon } from '@/components/commerce/coupon-store';
import { CouponField, validateCouponCode } from './CouponField';
import { TotalsList } from './TotalsList';
import { PaymentMarks, TrustBadges } from './TrustBadges';
import { useQuote, type CouponResult } from './use-quote';

export function CartView({ recommendations }: { recommendations: Card[] }) {
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  const settings = useStoreSettings();
  const code = useCoupon((s) => s.code);
  const setCode = useCoupon((s) => s.setCode);
  const [justApplied, setJustApplied] = useState<CouponResult | null>(null);
  const standard = settings.shippingMethods[0];

  const { quote, last, loading, error, issuesByKey } = useQuote({
    lines,
    couponCode: code,
    deliveryMethod: standard?.id,
    enabled: mounted && lines.length > 0,
  });

  const latest = quote?.coupon ?? last?.coupon ?? null;
  const coupon = code ? (latest && latest.code === code ? latest : justApplied?.code === code ? justApplied : null) : null;
  const totals = computeTotals({ lines, shippingPrice: standard?.price ?? 0, discount: coupon?.ok ? coupon.discount : 0, taxRate: settings.taxRate });
  const enquiry = (origin: string) =>
    bagEnquiry(origin, lines.map(lineItem), totals, {
      taxLabel: settings.taxLabel,
      taxRate: settings.taxRate,
      couponCode: coupon?.ok ? coupon.code : null,
    });
  const inBag = new Set(lines.map((l) => l.productId));
  const recs = recommendations.filter((p) => !inBag.has(p.id)).slice(0, 4);

  if (!mounted) {
    return (
      <div className="container-x py-12" aria-busy="true">
        <div className="h-10 w-48 animate-pulse bg-porcelain" />
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-36 w-36 animate-pulse bg-porcelain" />
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-4 w-2/3 animate-pulse bg-porcelain" />
                  <div className="h-3 w-1/3 animate-pulse bg-porcelain" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-80 animate-pulse bg-porcelain" />
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="container-x pb-24 pt-8 lg:pt-12">
        <Breadcrumbs items={[{ label: 'Shopping Bag' }]} />
        <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center sm:py-24">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line">
            <ShoppingBag className="h-8 w-8 text-gold" strokeWidth={1} aria-hidden />
          </span>
          <h1 className="mt-8 font-serif text-4xl font-light sm:text-5xl">Your bag is empty</h1>
          <p className="mt-4 max-w-md text-[17px] text-taupe">
            Every piece at {site.name} is crafted to order in our own workshop, set with a certified lab-grown diamond. Begin with an engagement ring, or explore the full collection.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/engagement-rings">Shop Engagement Rings</ButtonLink>
            <ButtonLink href="/collections/all" variant="outline">
              Explore All Jewelry
            </ButtonLink>
          </div>
          <Link href="/wishlist" className="mt-6 text-[15px] text-taupe underline-offset-4 hover:text-ink hover:underline">
            View your wishlist
          </Link>
        </div>
        {recommendations.length > 0 && (
          <section className="border-t border-line pt-16">
            <SectionHeading eyebrow="Most loved" title="Pieces Our Clients Adore" align="center" />
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {recommendations.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} sizes="(min-width:1024px) 25vw, 50vw" />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const count = cartCount(lines);

  return (
    <>
      <div className="container-x pb-32 pt-8 lg:pb-24 lg:pt-12">
        <Breadcrumbs items={[{ label: 'Shopping Bag' }]} />
        <div className="mt-6 flex items-end justify-between gap-4 border-b border-line pb-6">
          <h1 className="font-serif text-4xl font-light sm:text-5xl">Your Bag</h1>
          <p className="pb-1 text-sm text-taupe">{pluralize(count, 'piece')}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-20">
          <section aria-label="Pieces in your bag">
            <ul className="divide-y divide-line">
              {lines.map((l) => {
                const issue = issuesByKey.get(l.key);
                return (
                  <li key={l.key}>
                    <CartLineItem line={l} />
                    {issue && (
                      <p role="alert" className="-mt-1 mb-5 flex items-start gap-2 bg-danger/5 px-3 py-2.5 text-[14.5px] text-danger">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                        <span>
                          {issue.message}{' '}
                          {(issue.code === 'diamond_sold' || issue.code === 'diamond_required' || issue.code === 'option_required' || issue.code === 'size_required') && (
                            <Link href={`/products/${l.slug}?configure=1`} className="underline underline-offset-2">
                              Update selection
                            </Link>
                          )}
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <Link href="/collections/all" className="label-caps group inline-flex items-center gap-2 text-ink">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={1.5} aria-hidden />
                <span className="link-underline">Continue Shopping</span>
              </Link>
              {error && <p className="text-[14px] text-taupe">{error}</p>}
            </div>

            <div className="mt-12 grid gap-6 bg-porcelain p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
              <div>
                <p className="eyebrow">Private concierge</p>
                <p className="mt-2 font-serif text-2xl leading-tight">Questions about sizing, stones or delivery?</p>
                <p className="mt-2 text-sm text-taupe">Our diamond specialists reply within the hour during studio hours.</p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <a href={site.contact.phoneHref} className="label-caps flex items-center gap-2 hover:text-gold-deep">
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> {site.contact.phone}
                </a>
                <a href={site.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="label-caps flex items-center gap-2 hover:text-gold-deep">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> WhatsApp us
                </a>
              </div>
            </div>
          </section>

          <aside aria-labelledby="summary-title" className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-white/70 p-6 sm:p-8">
              <h2 id="summary-title" className="font-serif text-2xl">
                Order Summary
              </h2>
              <div className="mt-6 border-y border-line py-4">
                <CouponField
                  applied={code ? { code, ok: coupon?.ok ?? true, message: coupon?.message ?? 'Checking…' } : null}
                  onApply={async (c) => {
                    const r = await validateCouponCode(c, totals.subtotal);
                    if (r.ok) {
                      setJustApplied(r);
                      setCode(r.code);
                    }
                    return r;
                  }}
                  onRemove={() => {
                    setCode(null);
                    setJustApplied(null);
                  }}
                />
              </div>
              <TotalsList
                className="mt-5"
                totals={totals}
                couponCode={coupon?.ok ? coupon.code : null}
                taxLabel={settings.taxLabel}
                taxRate={settings.taxRate}
                shippingLabel="Shipping"
                shippingNote={standard ? `${standard.label} · ${standard.eta}` : undefined}
                loading={loading}
                totalLabel="Estimated total"
              />
              <WhatsAppButton className="mt-6 h-14 w-full" message={enquiry} />
              <ButtonLink href="/collections/all" variant="outline" className="mt-2 w-full">
                Continue Shopping
              </ButtonLink>
              <p className="mt-4 text-center text-[14px] text-taupe">Send us your bag on WhatsApp and our team will confirm availability, delivery and payment with you.</p>
              <PaymentMarks className="mt-5 justify-center" />
            </div>
            <TrustBadges compact returnsDays={settings.returnsDays} className="mt-8 px-1" />
          </aside>
        </div>

        {recs.length > 0 && (
          <section className="mt-24 border-t border-line pt-16" aria-label="You may also like">
            <SectionHeading eyebrow="Complete the look" title="You May Also Like" action={{ label: 'View all', href: '/collections/all' }} />
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {recs.map((p) => (
                <ProductCard key={p.id} product={p} sizes="(min-width:1024px) 25vw, 50vw" />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] uppercase tracking-[0.14em] text-taupe">Estimated total</p>
            <p className="text-lg tabular-nums" aria-live="polite">
              {formatMoney(totals.total, { exact: true })}
            </p>
          </div>
          <WhatsAppButton className="h-12 flex-1 px-3" message={enquiry}>
            Chat on WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </>
  );
}
