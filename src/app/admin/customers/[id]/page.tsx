import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ShieldCheck, ShieldOff, ShoppingBag } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { setCustomerRole } from '@/lib/server/admin/actions/customers';
import { CUSTOMER_ORDERS_SHOWN, getCustomerDetail } from '@/lib/server/admin/queries/customers';
import { ActionButton } from '@/components/admin/forms';
import { formatDate, formatDateTime, formatMoney, formatNumber, formatRelative } from '@/components/admin/format';
import { Badge, DescList, EmptyState, MiniStat, PageHeader, Panel, StatusBadge, table } from '@/components/admin/ui';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getCustomerDetail(id);
  return pageMeta({ title: user ? user.name || user.email : 'Customer not found', path: `/admin/customers/${id}`, noIndex: true });
}

export default async function CustomerDetailPage({ params }: Props) {
  const admin = await requireAdmin();
  const { id } = await params;
  const c = await getCustomerDetail(id);
  if (!c) notFound();

  const isSelf = admin.id === c.id;
  const isLastAdmin = c.role === 'ADMIN' && c.adminCount <= 1;
  const nextRole = c.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
  const who = c.name || c.email;
  const aov = c.stats.paidOrders ? Math.round(c.stats.spend / c.stats.paidOrders) : 0;
  const roleBlocked = isSelf ? 'You cannot change your own role.' : isLastAdmin ? 'This is the only administrator — promote someone else first.' : null;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/customers', label: 'All customers' }}
        eyebrow={`Customer since ${formatDate(c.createdAt)}`}
        title={who}
        description={
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.role} label={c.role === 'ADMIN' ? 'Administrator' : 'Customer'} />
            {isSelf && <Badge tone="info">You</Badge>}
          </span>
        }
        actions={
          c.stats.orders > 0 ? (
            <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="text-xs text-charcoal underline-offset-4 hover:underline">
              View in orders
            </Link>
          ) : undefined
        }
      />

      <Panel className="mb-6" bodyClassName="grid grid-cols-2 gap-5 p-5 md:grid-cols-4">
        <MiniStat label="Orders" value={formatNumber(c.stats.orders)} hint={`${formatNumber(c.stats.paidOrders)} paid`} />
        <MiniStat label="Total spend" value={formatMoney(c.stats.spend)} hint="Paid → delivered orders" />
        <MiniStat label="Average order" value={c.stats.paidOrders ? formatMoney(aov) : '—'} />
        <MiniStat label="Last order" value={c.stats.lastOrderAt ? formatRelative(c.stats.lastOrderAt) : '—'} hint={c.stats.lastOrderAt ? formatDate(c.stats.lastOrderAt) : undefined} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel
            title="Orders"
            description={c._count.orders > CUSTOMER_ORDERS_SHOWN ? `Latest ${CUSTOMER_ORDERS_SHOWN} of ${formatNumber(c._count.orders)}` : undefined}
            bodyClassName="p-0"
          >
            {c.orders.length === 0 ? (
              <EmptyState icon={<ShoppingBag className="h-5 w-5" strokeWidth={1.25} />} title="No orders yet" description="Orders this customer places while signed in appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className={`${table.base} min-w-[560px]`}>
                  <thead className={table.head}>
                    <tr>
                      <th scope="col" className={table.th}>Order</th>
                      <th scope="col" className={table.th}>Date</th>
                      <th scope="col" className={table.thRight}>Total</th>
                      <th scope="col" className={table.th}>Payment</th>
                      <th scope="col" className={table.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.orders.map((o) => (
                      <tr key={o.id} className={table.row}>
                        <td className={table.td}>
                          <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                            {o.number}
                          </Link>
                        </td>
                        <td className={table.tdMuted}>
                          <time dateTime={o.createdAt.toISOString()} title={formatDateTime(o.createdAt)} className="whitespace-nowrap">
                            {formatDate(o.createdAt)}
                          </time>
                        </td>
                        <td className={table.tdRight}>{formatMoney(o.total, { exact: true })}</td>
                        <td className={table.td}>{o.payments[0] ? <StatusBadge status={o.payments[0].status} /> : <span className="text-taupe">—</span>}</td>
                        <td className={table.td}>
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Addresses" description={c.addresses.length ? `${c.addresses.length} saved` : undefined}>
            {c.addresses.length === 0 ? (
              <p className="flex items-center gap-2 text-[13px] text-taupe">
                <MapPin className="h-4 w-4" strokeWidth={1.25} aria-hidden /> No saved addresses.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {c.addresses.map((a) => (
                  <li key={a.id} className="border border-line p-4">
                    <p className="mb-2 flex flex-wrap items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">
                      {a.label || 'Address'}
                      {a.isDefault && <Badge tone="gold">Default</Badge>}
                    </p>
                    <address className="text-[13px] not-italic leading-relaxed text-ink">
                      <span className="block font-medium">
                        {a.firstName} {a.lastName}
                      </span>
                      <span className="block">{a.line1}</span>
                      {a.line2 && <span className="block">{a.line2}</span>}
                      <span className="block">
                        {a.city}, {a.state} {a.postalCode}
                      </span>
                      <span className="block">{a.country}</span>
                      <span className="mt-1 block text-charcoal">{a.phone}</span>
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-6" aria-label="Customer profile">
          <Panel title="Profile">
            <DescList
              items={[
                ['Name', c.name || <span className="text-taupe">Not provided</span>],
                [
                  'Email',
                  <a key="e" href={`mailto:${c.email}`} className="break-all underline-offset-4 hover:underline">
                    {c.email}
                  </a>,
                ],
                [
                  'Phone',
                  c.phone ? (
                    <a key="p" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="underline-offset-4 hover:underline">
                      {c.phone}
                    </a>
                  ) : null,
                ],
                ['Joined', formatDateTime(c.createdAt)],
                ['Sign-in', c.hasPassword ? 'Email & password' : 'Social sign-in only'],
                ['Reviews', `${formatNumber(c._count.reviews)} written`],
                ['Returns', `${formatNumber(c._count.returns)} requested`],
              ]}
            />
          </Panel>

          <Panel title="Access" description="Administrators can open this admin panel.">
            <div className="space-y-3">
              <p className="text-[13px] text-charcoal">
                {who} is {c.role === 'ADMIN' ? 'an administrator' : 'a customer'}.
              </p>
              <ActionButton
                action={setCustomerRole.bind(null, c.id, nextRole)}
                disabled={!!roleBlocked}
                title={roleBlocked ?? undefined}
                variant="outline"
                icon={nextRole === 'ADMIN' ? <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> : <ShieldOff className="h-4 w-4" strokeWidth={1.5} />}
                confirm={{
                  title: nextRole === 'ADMIN' ? `Make ${who} an administrator?` : `Remove admin access for ${who}?`,
                  description:
                    nextRole === 'ADMIN'
                      ? 'They will be able to see every order and customer, change prices and edit store settings. The change applies the next time they sign in.'
                      : 'They will become a regular customer. Because sessions are stored in signed cookies, the change applies the next time they sign in — they keep access until then.',
                  confirmLabel: nextRole === 'ADMIN' ? 'Make admin' : 'Remove admin',
                  tone: nextRole === 'ADMIN' ? 'default' : 'danger',
                }}
              >
                {nextRole === 'ADMIN' ? 'Make administrator' : 'Remove admin access'}
              </ActionButton>
              <p className="text-[11.5px] leading-relaxed text-taupe">{roleBlocked ?? 'Role changes take effect on the user’s next sign-in.'}</p>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
