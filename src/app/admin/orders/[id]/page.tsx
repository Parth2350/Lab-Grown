import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CreditCard, PackageOpen, RotateCcw, Truck, UserRound } from 'lucide-react';
import { label } from '@/lib/catalog';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { readStoreSettings } from '@/lib/server/admin/settings';
import { markOrderRefunded } from '@/lib/server/admin/actions/orders';
import { buyerOrderCount, getOrderDetail } from '@/lib/server/admin/queries/orders';
import { buttonClass } from '@/components/ui/Button';
import { ActionButton } from '@/components/admin/forms';
import { enumLabel, formatDate, formatDateTime, formatMoney, formatNumber } from '@/components/admin/format';
import { AddressBlock, OrderTimeline, Ref, type TimelineEvent } from '@/components/admin/orders/OrderParts';
import { OrderNotesForm } from '@/components/admin/orders/OrderNotesForm';
import { OrderStatusForm } from '@/components/admin/orders/OrderStatusForm';
import { ReturnStatusForm } from '@/components/admin/orders/ReturnStatusForm';
import { ShipmentEditor } from '@/components/admin/orders/ShipmentEditor';
import { readAddress } from '@/components/admin/orders/address';
import { Badge, DescList, PageHeader, Panel, StatusBadge, table } from '@/components/admin/ui';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderDetail(id);
  return pageMeta({ title: order ? `Order ${order.number}` : 'Order not found', path: `/admin/orders/${id}`, noIndex: true });
}

export default async function OrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();
  const [settings, buyerOrders] = await Promise.all([readStoreSettings(), buyerOrderCount(order)]);

  const methodLabel = (mid: string) => settings.shippingMethods.find((m) => m.id === mid)?.label ?? mid;
  const delivery = settings.shippingMethods.find((m) => m.id === order.deliveryMethod);
  const methodOptions = settings.shippingMethods.map((m) => ({ id: m.id, label: m.label }));
  const captured = order.payments.filter((p) => p.status === 'CAPTURED');
  const capturedTotal = captured.reduce((s, p) => s + p.amount, 0);
  const latestPayment = order.payments[order.payments.length - 1];
  const units = order.items.reduce((s, i) => s + i.quantity, 0);
  const billingSame = !readAddress(order.billingAddress);
  const money = (cents: number) => formatMoney(cents, { exact: true });

  const events: TimelineEvent[] = [
    { at: order.createdAt, title: 'Order placed', detail: `${formatNumber(units)} item${units === 1 ? '' : 's'} · ${money(order.total)}` },
    ...order.payments.map<TimelineEvent>((p) => ({
      at: p.status === 'PENDING' ? p.createdAt : p.updatedAt,
      title: `Payment ${enumLabel(p.status).toLowerCase()}`,
      detail: `${money(p.amount)} via ${p.provider}${p.method ? ` (${p.method})` : ''}`,
      tone: p.status === 'CAPTURED' ? 'success' : p.status === 'FAILED' || p.status === 'REFUNDED' ? 'danger' : 'default',
    })),
    ...order.shipments.flatMap<TimelineEvent>((s) => [
      ...(s.shippedAt ? [{ at: s.shippedAt, title: `Shipped with ${s.carrier}`, detail: s.trackingNumber ?? undefined, tone: 'gold' as const }] : []),
      ...(s.deliveredAt ? [{ at: s.deliveredAt, title: 'Delivered', detail: s.carrier, tone: 'success' as const }] : []),
    ]),
    ...order.returns.map<TimelineEvent>((r) => ({ at: r.createdAt, title: 'Return requested', detail: r.reason, tone: 'danger' })),
  ];
  if (order.updatedAt.getTime() - order.createdAt.getTime() > 60_000) events.push({ at: order.updatedAt, title: 'Last updated', detail: `Status ${enumLabel(order.status).toLowerCase()}` });

  return (
    <>
      <PageHeader
        back={{ href: '/admin/orders', label: 'All orders' }}
        eyebrow={`Placed ${formatDateTime(order.createdAt)}`}
        title={`Order ${order.number}`}
        description={
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            {latestPayment && <StatusBadge status={latestPayment.status} label={`Payment ${enumLabel(latestPayment.status).toLowerCase()}`} />}
            {order.returns.some((r) => r.status === 'REQUESTED') && <Badge tone="warning">Return requested</Badge>}
          </span>
        }
        actions={
          <>
            {order.userId && (
              <Link href={`/admin/customers/${order.userId}`} className={buttonClass('ghost', 'sm')}>
                <UserRound className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Customer
              </Link>
            )}
            <ActionButton
              action={markOrderRefunded.bind(null, order.id)}
              disabled={captured.length === 0}
              title={captured.length === 0 ? 'No captured payment to refund' : undefined}
              icon={<RotateCcw className="h-4 w-4" strokeWidth={1.5} />}
              confirm={{
                title: `Mark ${order.number} refunded?`,
                description: (
                  <>
                    {captured.length} captured payment{captured.length === 1 ? '' : 's'} totalling {money(capturedTotal)} will be marked refunded and the order set to
                    refunded. This records the refund only — issue the money back in your payment provider&apos;s dashboard too.
                  </>
                ),
                confirmLabel: 'Mark refunded',
              }}
            >
              Mark refunded
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Items */}
          <Panel title="Items" description={`${formatNumber(units)} piece${units === 1 ? '' : 's'} · prices as charged`} bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className={`${table.base} min-w-[640px]`}>
                <thead className={table.head}>
                  <tr>
                    <th scope="col" className={table.th}>Item</th>
                    <th scope="col" className={table.th}>Specification</th>
                    <th scope="col" className={table.thRight}>Qty</th>
                    <th scope="col" className={table.thRight}>Unit</th>
                    <th scope="col" className={table.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className={table.row}>
                      <td className={table.td}>
                        {it.productId ? (
                          <Link href={`/admin/products/${it.productId}`} className="font-medium text-ink underline-offset-4 hover:underline">
                            {it.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{it.name}</span>
                        )}
                        <p className="font-mono text-[11px] text-taupe">{it.sku}</p>
                      </td>
                      <td className={`${table.td} text-[12.5px]`}>
                        <p>
                          {it.purity} {label.metal(it.metalColor)}
                        </p>
                        {it.diamondSummary && <p className="text-taupe">{it.diamondSummary}</p>}
                        {it.ringSize && <p className="text-taupe">Ring size {it.ringSize}</p>}
                      </td>
                      <td className={table.tdRight}>{formatNumber(it.quantity)}</td>
                      <td className={table.tdRight}>{money(it.unitPrice)}</td>
                      <td className={table.tdRight}>{money(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 border-t border-line px-5 py-4 text-[13px] tabular-nums">
              <dt className="text-taupe">Subtotal</dt>
              <dd className="text-right">{money(order.subtotal)}</dd>
              {order.discount > 0 && (
                <>
                  <dt className="text-taupe">
                    Discount{order.couponCode && <span className="ml-1 font-medium tracking-wider text-gold-deep">{order.couponCode}</span>}
                  </dt>
                  <dd className="text-right text-success">−{money(order.discount)}</dd>
                </>
              )}
              <dt className="text-taupe">Shipping</dt>
              <dd className="text-right">{order.shipping ? money(order.shipping) : 'Free'}</dd>
              <dt className="text-taupe">Tax</dt>
              <dd className="text-right">{money(order.tax)}</dd>
              <dt className="border-t border-line pt-2 font-medium text-ink">Total</dt>
              <dd className="border-t border-line pt-2 text-right font-medium text-ink">
                {money(order.total)} <span className="text-[11px] font-normal text-taupe">{order.currency}</span>
              </dd>
            </dl>
          </Panel>

          {/* Payments */}
          <Panel title="Payments" bodyClassName="p-0">
            {order.payments.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-6 text-[13px] text-taupe">
                <CreditCard className="h-4 w-4" strokeWidth={1.25} aria-hidden /> No payment attempts recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={`${table.base} min-w-[640px]`}>
                  <thead className={table.head}>
                    <tr>
                      <th scope="col" className={table.th}>Date</th>
                      <th scope="col" className={table.th}>Provider</th>
                      <th scope="col" className={table.thRight}>Amount</th>
                      <th scope="col" className={table.th}>Status</th>
                      <th scope="col" className={table.th}>References</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((p) => (
                      <tr key={p.id} className={table.row}>
                        <td className={`${table.tdMuted} whitespace-nowrap`}>{formatDateTime(p.createdAt)}</td>
                        <td className={table.td}>
                          <span className="capitalize">{p.provider}</span>
                          {p.method && <span className="text-taupe"> · {p.method}</span>}
                        </td>
                        <td className={table.tdRight}>
                          {money(p.amount)} <span className="text-[11px] text-taupe">{p.currency}</span>
                        </td>
                        <td className={table.td}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td className={`${table.td} text-xs`}>
                          <p>
                            <span className="text-taupe">Order </span>
                            <Ref value={p.providerOrderId} />
                          </p>
                          <p>
                            <span className="text-taupe">Payment </span>
                            <Ref value={p.providerPaymentId} />
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Shipments */}
          <Panel
            title="Shipments"
            description={`Customer chose ${delivery?.label ?? order.deliveryMethod}${delivery?.eta ? ` · ${delivery.eta}` : ''}`}
            actions={<ShipmentEditor orderId={order.id} orderNumber={order.number} methods={methodOptions} defaultMethod={order.deliveryMethod} />}
            bodyClassName="p-0"
          >
            {order.shipments.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-6 text-[13px] text-taupe">
                <Truck className="h-4 w-4" strokeWidth={1.25} aria-hidden /> Nothing shipped yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {order.shipments.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 space-y-1 text-[13px]">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.carrier}</span>
                        <span className="text-taupe">· {methodLabel(s.method)}</span>
                        <StatusBadge status={s.status} />
                      </p>
                      <p className="text-xs text-taupe">
                        Tracking{' '}
                        {s.trackingNumber ? <span className="select-all font-mono text-[12px] text-ink">{s.trackingNumber}</span> : <span>not added</span>}
                      </p>
                      <p className="text-xs text-taupe">
                        {s.shippedAt ? `Shipped ${formatDate(s.shippedAt)}` : `Created ${formatDate(s.createdAt)}`}
                        {s.deliveredAt && ` · Delivered ${formatDate(s.deliveredAt)}`}
                      </p>
                    </div>
                    <ShipmentEditor
                      orderId={order.id}
                      orderNumber={order.number}
                      methods={methodOptions}
                      defaultMethod={order.deliveryMethod}
                      shipment={{ id: s.id, carrier: s.carrier, method: s.method, trackingNumber: s.trackingNumber, status: s.status }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Returns */}
          <Panel title="Return requests" bodyClassName="p-0">
            {order.returns.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-6 text-[13px] text-taupe">
                <PackageOpen className="h-4 w-4" strokeWidth={1.25} aria-hidden /> No return requests for this order.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {order.returns.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 text-[13px]">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.reason}</span>
                        <StatusBadge status={r.status} />
                      </p>
                      {r.details && <p className="mt-1 whitespace-pre-line text-charcoal">{r.details}</p>}
                      <p className="mt-1 text-xs text-taupe">
                        Requested {formatDateTime(r.createdAt)}
                        {r.updatedAt.getTime() !== r.createdAt.getTime() && ` · updated ${formatDateTime(r.updatedAt)}`}
                      </p>
                    </div>
                    <ReturnStatusForm id={r.id} status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Timeline">
            <OrderTimeline events={events} />
          </Panel>
        </div>

        <aside className="space-y-6" aria-label="Order actions and customer">
          <Panel title="Status">
            <OrderStatusForm orderId={order.id} orderNumber={order.number} status={order.status} hasShipment={order.shipments.length > 0} capturedPayments={captured.length} />
          </Panel>

          <Panel title="Customer">
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="font-medium text-ink">{order.customerName}</p>
                <a href={`mailto:${order.email}`} className="block break-all text-charcoal underline-offset-4 hover:underline">
                  {order.email}
                </a>
                {order.phone && (
                  <a href={`tel:${order.phone.replace(/[^\d+]/g, '')}`} className="block text-charcoal underline-offset-4 hover:underline">
                    {order.phone}
                  </a>
                )}
              </div>
              <DescList
                items={[
                  [
                    'Account',
                    order.user ? (
                      <Link href={`/admin/customers/${order.user.id}`} className="underline-offset-4 hover:underline">
                        Registered{order.user.role === 'ADMIN' ? ' (admin)' : ''}
                      </Link>
                    ) : (
                      <Badge>Guest</Badge>
                    ),
                  ],
                  ['Orders', `${formatNumber(buyerOrders)} order${buyerOrders === 1 ? '' : 's'}${order.user ? '' : ' with this email'}`],
                ]}
              />
            </div>
          </Panel>

          <Panel title="Delivery">
            <div className="space-y-4">
              <DescList items={[['Method', delivery ? `${delivery.label}${delivery.eta ? ` · ${delivery.eta}` : ''}` : order.deliveryMethod]]} />
              <div>
                <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">Ship to</p>
                <AddressBlock value={order.shippingAddress} />
              </div>
              <div>
                <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">Bill to</p>
                {billingSame ? <p className="text-[13px] text-taupe">Same as shipping address</p> : <AddressBlock value={order.billingAddress} />}
              </div>
            </div>
          </Panel>

          <Panel title="Order notes (internal)" description="Workshop, team and system notes — never shown to the customer.">
            {order.notes && (
              <div className="mb-4 border-l-2 border-gold bg-porcelain px-4 py-3 text-[13px] text-charcoal">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-taupe">Customer note</p>
                <p className="whitespace-pre-line">{order.notes}</p>
              </div>
            )}
            <OrderNotesForm orderId={order.id} notes={order.adminNotes} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
