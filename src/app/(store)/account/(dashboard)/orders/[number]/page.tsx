import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Truck } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { site } from '@/config/site';
import { requireUser } from '@/lib/server/auth';
import { getSettings } from '@/lib/server/settings';
import { getOwnedOrder } from '@/lib/server/orders';
import { formatDate } from '@/lib/utils';
import { AddressBlock, OrderTotals, StatusBadge, estimateArrival, paymentLabel } from '@/components/commerce/OrderParts';
import { SummaryLine } from '@/components/checkout/SummaryLine';
import { OrderTimeline } from '@/components/account/OrderTimeline';
import { ButtonLink } from '@/components/ui/Button';

type Params = Promise<{ number: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { number } = await params;
  return pageMeta({ title: `Order ${number.toUpperCase()}`, description: 'Order details and delivery progress.', path: `/account/orders/${number}`, noIndex: true });
}

const SHIPMENT_LABEL: Record<string, string> = {
  PENDING: 'Preparing',
  PACKED: 'Packed',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
};

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { number: raw } = await params;
  const number = decodeURIComponent(raw).toUpperCase();
  const user = await requireUser(`/account/orders/${number}`);
  const order = await getOwnedOrder(number, user.id);
  if (!order) notFound();
  const settings = await getSettings();

  const payment = order.payments.find((p) => p.status === 'CAPTURED' || p.status === 'REFUNDED') ?? order.payments[0];
  const shipment = order.shipments[0];
  const delivered = shipment?.deliveredAt ?? (order.status === 'DELIVERED' ? order.updatedAt : null);
  const returnDeadline = delivered ? new Date(new Date(delivered).getTime() + settings.returnsDays * 86_400_000) : null;
  const canReturn = order.status === 'DELIVERED' && returnDeadline && returnDeadline.getTime() > Date.now();
  const arrival = !delivered && ['PAID', 'PROCESSING', 'SHIPPED'].includes(order.status) ? estimateArrival(order.delivery.eta, shipment?.shippedAt ?? order.createdAt) : null;

  return (
    <div className="space-y-12">
      <div>
        <Link href="/account/orders" className="label-caps group inline-flex items-center gap-2 text-taupe hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} aria-hidden /> All orders
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-light sm:text-4xl">Order {order.number}</h2>
            <p className="mt-1 text-sm text-taupe">Placed {formatDate(order.createdAt, { dateStyle: 'long' })}</p>
          </div>
          <StatusBadge status={order.status} className="text-[13px]" />
        </div>
      </div>

      <section aria-labelledby="progress-title" className="border border-line p-5 sm:p-8">
        <h3 id="progress-title" className="sr-only">
          Order progress
        </h3>
        <OrderTimeline
          status={order.status}
          dates={{ PENDING: order.createdAt, PAID: payment?.status === 'CAPTURED' ? payment.createdAt : null, SHIPPED: shipment?.shippedAt ?? null, DELIVERED: delivered }}
        />
        {(shipment || arrival) && (
          <div className="mt-8 flex flex-wrap items-start gap-x-10 gap-y-4 border-t border-line pt-6 text-[15px]">
            {shipment && (
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-ink">
                    {shipment.carrier} · {SHIPMENT_LABEL[shipment.status] ?? shipment.status}
                  </p>
                  {shipment.trackingNumber && (
                    <p className="text-taupe">
                      Tracking number <span className="select-all font-medium text-charcoal">{shipment.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            {arrival && (
              <div>
                <p className="text-taupe">Estimated arrival</p>
                <p className="text-ink">{arrival}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="pieces-title">
          <h3 id="pieces-title" className="font-serif text-2xl">
            Pieces
          </h3>
          <ul className="mt-2 divide-y divide-line border-b border-line">
            {order.items.map((i) => (
              <SummaryLine
                key={i.id}
                line={{
                  key: i.id,
                  name: i.name,
                  purity: i.purity,
                  metalColor: i.metalColor,
                  details: [i.diamondSummary, i.ringSize ? `Ring size ${i.ringSize}` : null, `SKU ${i.sku}`],
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
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {order.items
              .filter((i) => i.slug)
              .slice(0, 3)
              .map((i) => (
                <Link key={i.id} href={`/products/${i.slug}`} className="inline-flex items-center gap-1.5 text-[14.5px] text-taupe underline-offset-4 hover:text-ink hover:underline">
                  View {i.name} <ExternalLink className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                </Link>
              ))}
          </div>
        </section>

        <aside className="space-y-8">
          <div className="border border-line bg-white/60 p-6">
            <h3 className="font-serif text-xl">Summary</h3>
            <OrderTotals order={order} className="mt-4" />
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <h3 className="label-caps text-taupe">Shipping address</h3>
              <AddressBlock address={order.shippingAddress} className="mt-3" />
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="label-caps text-taupe">Delivery</h3>
                <p className="mt-3 text-[15.5px] text-ink">{order.delivery.label}</p>
                {order.delivery.eta && <p className="text-[15px] text-taupe">{order.delivery.eta}</p>}
              </div>
              <div>
                <h3 className="label-caps text-taupe">Payment</h3>
                <p className="mt-3 text-[15.5px] text-ink">{order.status === 'PENDING' ? 'Awaiting payment' : paymentLabel(payment)}</p>
                {payment?.providerPaymentId && order.status !== 'PENDING' && <p className="break-all text-[14px] text-taupe">Ref. {payment.providerPaymentId}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t border-line pt-6">
            {canReturn && (
              <ButtonLink href={`/account/returns?order=${order.number}`} variant="outline" className="w-full">
                Request a return
              </ButtonLink>
            )}
            <p className="text-[14.5px] text-taupe">
              Questions about this order? Call{' '}
              <a href={site.contact.phoneHref} className="text-ink underline-offset-4 hover:underline">
                {site.contact.phone}
              </a>{' '}
              or{' '}
              <Link href="/account/support" className="text-ink underline-offset-4 hover:underline">
                contact our concierge
              </Link>
              , quoting {order.number}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
