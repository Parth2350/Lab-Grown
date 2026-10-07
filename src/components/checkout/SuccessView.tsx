'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { m } from 'framer-motion';
import { Check, Clock, Gem, Package, ShieldCheck, Truck, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { site } from '@/config/site';
import { formatDate } from '@/lib/utils';
import { useCart } from '@/store/cart';
import type { OrderView } from '@/lib/server/orders';
import { ButtonLink } from '@/components/ui/Button';
import { useCoupon } from '@/components/commerce/coupon-store';
import { AddressBlock, OrderTotals, estimateArrival, paymentLabel } from '@/components/commerce/OrderParts';
import { SummaryLine } from './SummaryLine';
import { LAST_ORDER_KEY } from './constants';

type State = { status: 'loading' } | { status: 'missing' } | { status: 'ok'; order: OrderView; justPlaced: boolean };

export function SuccessView({ signedIn }: { signedIn: boolean }) {
  const params = useSearchParams();
  const number = (params.get('order') ?? '').toUpperCase();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let token: string | null = null;
    let justPlaced = false;
    try {
      const saved = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) ?? 'null') as { number?: string; token?: string } | null;
      if (saved?.number === number) {
        token = saved.token ?? null;
        justPlaced = true;
      }
    } catch {
      /* storage unavailable */
    }
    if (!/^AUR-\d{6}$/.test(number)) {
      setState({ status: 'missing' });
      return;
    }
    fetch('/api/checkout/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber: number, token }) })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) return setState({ status: 'missing' });
        const { order } = (await res.json()) as { order: OrderView };
        if (justPlaced && order.status !== 'PENDING' && order.status !== 'CANCELLED') {
          useCart.getState().clear();
          useCoupon.getState().setCode(null);
        }
        setState({ status: 'ok', order, justPlaced });
      })
      .catch(() => !cancelled && setState({ status: 'missing' }));
    return () => {
      cancelled = true;
    };
  }, [number]);

  if (state.status === 'loading') {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24" role="status" aria-live="polite">
        <span className="h-8 w-8 animate-spin rounded-full border border-gold border-t-transparent" aria-hidden />
        <p className="mt-5 text-sm text-taupe">Retrieving your order…</p>
      </div>
    );
  }

  if (state.status === 'missing') {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <Package className="h-10 w-10 text-gold" strokeWidth={1} aria-hidden />
        <h1 className="mt-6 font-serif text-4xl font-light">We can’t show this order here</h1>
        <p className="mt-3 max-w-md text-[15px] text-taupe">
          For your privacy, order details are only visible in the browser that placed the order or to the account holder. Sign in to see your order history, or contact our concierge.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={signedIn ? '/account/orders' : `/account/login?callbackUrl=${encodeURIComponent('/account/orders')}`}>{signedIn ? 'View My Orders' : 'Sign In'}</ButtonLink>
          <ButtonLink href="/contact" variant="outline">
            Contact Concierge
          </ButtonLink>
        </div>
      </div>
    );
  }

  const { order, justPlaced } = state;
  const firstName = order.customerName.split(' ')[0];
  const pending = order.status === 'PENDING';
  const arrival = estimateArrival(order.delivery.eta, order.createdAt);
  const payment = order.payments.find((p) => p.status === 'CAPTURED') ?? order.payments[0];

  const steps = [
    { icon: Gem, title: 'Crafted for you', text: 'Our artisans begin setting your piece in the workshop, by hand.' },
    { icon: ShieldCheck, title: 'Inspected & certified', text: 'A multi-point quality check, then packed with its grading certificate.' },
    { icon: Truck, title: 'Insured delivery', text: `${order.delivery.label}${order.delivery.eta ? ` · ${order.delivery.eta}` : ''}. A signature is required on arrival.` },
  ];

  return (
    <div className="container-x pb-24 pt-10 lg:pt-16">
      <m.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-2xl text-center">
        <span className={pending ? 'mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-stone' : 'mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-gold-pale/40'}>
          {pending ? <Clock className="h-7 w-7 text-taupe" strokeWidth={1} aria-hidden /> : <Check className="h-7 w-7 text-gold-deep" strokeWidth={1.1} aria-hidden />}
        </span>
        <p className="eyebrow mt-6">{pending ? 'Awaiting payment' : 'Order confirmed'}</p>
        <h1 className="mt-3 font-serif text-4xl font-light leading-tight sm:text-5xl">{pending ? 'Your order is on hold' : `Thank you, ${firstName}.`}</h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-taupe">
          {pending
            ? 'We haven’t received payment for this order yet, so nothing has been charged. Return to checkout to complete your purchase.'
            : `Your order is confirmed and already on its way to our workshop. We’ll keep you updated at ${order.email}.`}
        </p>
        <p className="mt-6 inline-flex items-center gap-3 border border-line bg-white px-4 py-2 text-sm">
          <span className="text-[11px] uppercase tracking-[0.16em] text-taupe">Order number</span>
          <span className="font-medium tracking-wide">{order.number}</span>
        </p>
        {pending && (
          <div className="mt-6">
            <ButtonLink href="/checkout">Return to Checkout</ButtonLink>
          </div>
        )}
      </m.header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-20">
        <div className="min-w-0 space-y-12">
          {!pending && (
            <section aria-labelledby="next-title">
              <h2 id="next-title" className="font-serif text-2xl">
                What happens next
              </h2>
              <ol className="mt-6 grid gap-6 sm:grid-cols-3">
                {steps.map((s, i) => (
                  <li key={s.title} className="border-t border-line pt-5">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-[11px] font-medium tracking-[0.18em] text-gold">{String(i + 1).padStart(2, '0')}</span>
                      <s.icon className="h-4 w-4 text-charcoal" strokeWidth={1.25} aria-hidden />
                    </div>
                    <p className="mt-3 text-[14px] text-ink">{s.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-taupe">{s.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="items-title">
            <h2 id="items-title" className="font-serif text-2xl">
              Your pieces
            </h2>
            <ul className="mt-2 divide-y divide-line border-b border-line">
              {order.items.map((i) => (
                <SummaryLine
                  key={i.id}
                  line={{
                    key: i.id,
                    name: i.name,
                    purity: i.purity,
                    metalColor: i.metalColor,
                    details: [i.diamondSummary, i.ringSize ? `Ring size ${i.ringSize}` : null],
                    quantity: i.quantity,
                    lineTotal: i.lineTotal,
                    art: i.art,
                    image: i.image,
                    shape: i.shape,
                    carat: i.carat,
                  }}
                />
              ))}
            </ul>
          </section>

          <section className="grid gap-8 sm:grid-cols-3" aria-label="Delivery and payment details">
            <div>
              <h3 className="label-caps text-taupe">Shipping to</h3>
              <AddressBlock address={order.shippingAddress} className="mt-3" />
            </div>
            <div>
              <h3 className="label-caps text-taupe">Delivery</h3>
              <p className="mt-3 text-[13.5px] text-ink">{order.delivery.label}</p>
              {order.delivery.eta && <p className="text-[13px] text-taupe">{order.delivery.eta} after dispatch</p>}
              {arrival && !pending && <p className="mt-2 text-[13px] text-charcoal">Estimated arrival from {arrival}</p>}
            </div>
            <div>
              <h3 className="label-caps text-taupe">Payment</h3>
              <p className="mt-3 text-[13.5px] text-ink">{pending ? 'Not completed' : paymentLabel(payment)}</p>
              <p className="text-[13px] text-taupe">Placed {formatDate(order.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-line bg-white/70 p-6 sm:p-8">
            <h2 className="font-serif text-2xl">Order Total</h2>
            <OrderTotals order={order} className="mt-5" />
          </div>

          {!signedIn && order.isGuest && justPlaced && !pending ? (
            <div className="mt-6 bg-porcelain p-6 sm:p-8">
              <UserPlus className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
              <p className="mt-4 font-serif text-xl">Save this order to an account</p>
              <p className="mt-2 text-[13px] leading-relaxed text-taupe">Track delivery, request returns and check out faster next time. We’ll attach order {order.number} to your new account.</p>
              <ButtonLink href={`/account/register?claim=${encodeURIComponent(order.number)}`} variant="outline" className="mt-5 w-full">
                Create Account
              </ButtonLink>
            </div>
          ) : signedIn && !order.isGuest ? (
            <ButtonLink href={`/account/orders/${order.number}`} variant="outline" className="mt-6 w-full">
              Track in My Account
            </ButtonLink>
          ) : null}

          <div className="mt-6 space-y-2 text-center">
            <ButtonLink href="/collections/all" variant="link">
              Continue Shopping
            </ButtonLink>
            <p className="text-[12.5px] text-taupe">
              Questions? Call{' '}
              <a href={site.contact.phoneHref} className="text-ink underline-offset-4 hover:underline">
                {site.contact.phone}
              </a>{' '}
              or{' '}
              <a href={site.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-ink underline-offset-4 hover:underline">
                WhatsApp us
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
