'use client';
import Link from 'next/link';
import { ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useUI } from '@/store/ui';
import { cartCount, useCart } from '@/store/cart';
import { computeTotals } from '@/lib/pricing';

import { Sheet } from '@/components/ui/Sheet';
import { ButtonLink } from '@/components/ui/Button';
import { useStoreSettings } from '@/components/providers/SettingsProvider';
import { CartLineItem } from './CartLineItem';
import { useMounted } from '@/hooks/use-mounted';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { bagEnquiry, lineItem } from '@/lib/whatsapp';
import { useCurrency, useFormatMoney } from '@/components/providers/CurrencyProvider';

export function CartDrawer() {
  const formatMoney = useFormatMoney();
  const currency = useCurrency();
  const open = useUI((s) => s.cartOpen);
  const setCart = useUI((s) => s.setCart);
  const lines = useCart((s) => s.lines);
  const settings = useStoreSettings();
  const mounted = useMounted();
  const close = () => setCart(false);
  const standard = settings.shippingMethods[0];
  const totals = computeTotals({ lines, shippingPrice: standard?.price ?? 0, taxRate: settings.taxRate });
  const n = mounted ? cartCount(lines) : 0;

  return (
    <Sheet
      open={open}
      onClose={close}
      title={
        <span>
          Your Bag <span className="font-sans text-sm text-taupe">({n})</span>
        </span>
      }
      label="Shopping bag"
      bodyClassName="px-5 sm:px-7"
      footer={
        lines.length > 0 ? (
          <div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-taupe">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-taupe">Shipping</dt>
                <dd>{totals.shipping ? formatMoney(totals.shipping) : 'Complimentary'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-taupe">
                  {settings.taxLabel} ({Math.round(settings.taxRate * 1000) / 10}%)
                </dt>
                <dd className="tabular-nums">{formatMoney(totals.tax, { exact: true })}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-serif text-lg">Total</dt>
                <dd className="font-medium tabular-nums">{formatMoney(totals.total, { exact: true })}</dd>
              </div>
            </dl>
            <div className="mt-4 grid gap-2">
              <WhatsAppButton
                className="h-12"
                message={(origin) =>
                  bagEnquiry(origin, lines.map(lineItem), totals, { taxLabel: settings.taxLabel, taxRate: settings.taxRate, currency })
                }
              />
              <button onClick={close} className="label-caps h-12 border border-ink/30 transition-colors hover:border-ink">
                Continue Shopping
              </button>
            </div>
            <Link href="/cart" onClick={close} className="mt-3 block text-center text-[14px] text-taupe underline-offset-4 hover:text-ink hover:underline">
              View full bag
            </Link>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-stone" strokeWidth={1} />
          <p className="mt-5 font-serif text-2xl">Your bag is empty</p>
          <p className="mt-2 max-w-xs text-sm text-taupe">Discover certified lab-grown diamond jewelry, crafted in our own workshop.</p>
          <div className="mt-6 flex flex-col gap-2">
            <ButtonLink href="/engagement-rings" onClick={close}>
              Shop Engagement Rings
            </ButtonLink>
            <ButtonLink href="/collections/all" variant="outline" onClick={close}>
              Shop All Jewelry
            </ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3 bg-porcelain px-4 py-3 text-[14.5px] text-charcoal">
            <Truck className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} />
            Complimentary insured shipping & {settings.returnsDays}-day returns on every order.
          </div>
          <div className="divide-y divide-line">
            {lines.map((l) => (
              <CartLineItem key={l.key} line={l} compact onNavigate={close} />
            ))}
          </div>
          <p className="flex items-center gap-2 pb-6 text-[14px] text-taupe">
            <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.25} /> Every diamond ships with its IGI or GIA certificate.
          </p>
        </>
      )}
    </Sheet>
  );
}
