import Link from 'next/link';
import { Truck } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { readStoreSettings } from '@/lib/server/admin/settings';
import { cleanParams, pageCount, type SearchParams } from '@/lib/server/admin/list';
import { deliveryMethodUsage, listShipments } from '@/lib/server/admin/queries/shipping';
import { buttonClass } from '@/components/ui/Button';
import { SHIPMENT_STATUSES } from '@/components/admin/orders/status';
import { ShipmentRowForm } from '@/components/admin/shipping/ShipmentRowForm';
import { ShippingMethodsEditor } from '@/components/admin/shipping/ShippingMethodsEditor';
import { enumLabel, formatDate } from '@/components/admin/format';
import { EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, Panel, StatusBadge, TableWrap, Tabs, fieldSm, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Shipping', path: '/admin/shipping', noIndex: true });

export default async function ShippingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const [data, settings, usage] = await Promise.all([listShipments(params), readStoreSettings(), deliveryMethodUsage()]);
  const current = cleanParams(params);
  const { filters } = data;
  const methodLabel = (id: string) => settings.shippingMethods.find((m) => m.id === id)?.label ?? id;

  const tabs = [{ value: '', label: 'All', count: data.all }, ...SHIPMENT_STATUSES.map((s) => ({ value: s, label: enumLabel(s), count: data.counts[s] }))];

  return (
    <>
      <PageHeader
        title="Shipping"
        description="Track parcels and update their status inline. Moving a parcel in transit or delivered moves its order forward; ship and delivery dates are recorded automatically."
        actions={
          <a href="#shipping-methods" className={buttonClass('outline', 'sm')}>
            Shipping methods
          </a>
        }
      />

      <Tabs tabs={tabs} active={filters.status} basePath="/admin/shipping" params={current} />

      <FilterBar action="/admin/shipping">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <div className="min-w-[220px] flex-1 sm:max-w-sm">
          <FilterLabel htmlFor="shipping-q">Search</FilterLabel>
          <input id="shipping-q" name="q" type="search" defaultValue={filters.q} placeholder="Tracking number, order number or carrier" className={fieldSm} maxLength={100} />
        </div>
        <button type="submit" className={buttonClass('primary', 'sm')}>
          Search
        </button>
        {filters.q && (
          <Link
            href={filters.status ? `/admin/shipping?status=${filters.status}` : '/admin/shipping'}
            className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline"
          >
            Clear search
          </Link>
        )}
      </FilterBar>

      {data.rows.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<Truck className="h-5 w-5" strokeWidth={1.25} />}
            title={filters.q || filters.status ? 'No matching shipments' : 'No shipments yet'}
            description={filters.q || filters.status ? 'Try another search or status.' : 'Add a shipment from an order page once it is ready to leave the workshop.'}
          />
        </div>
      ) : (
        <TableWrap>
          <table className={`${table.base} min-w-[1080px]`}>
            <caption className="sr-only">Shipments, newest first</caption>
            <thead className={table.head}>
              <tr>
                <th scope="col" className={table.th}>Order</th>
                <th scope="col" className={table.th}>Carrier</th>
                <th scope="col" className={table.th}>Status</th>
                <th scope="col" className={table.th}>Dates</th>
                <th scope="col" className={table.th}>Update status &amp; tracking</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((s) => (
                <tr key={s.id} className={table.row}>
                  <td className={table.td}>
                    <Link href={`/admin/orders/${s.order.id}`} className="font-medium underline-offset-4 hover:underline">
                      {s.order.number}
                    </Link>
                    <p className="max-w-[180px] truncate text-xs text-taupe">{s.order.customerName}</p>
                  </td>
                  <td className={table.td}>
                    <p>{s.carrier}</p>
                    <p className="text-xs text-taupe">{methodLabel(s.method)}</p>
                  </td>
                  <td className={table.td}>
                    <StatusBadge status={s.status} />
                    <p className="mt-1 text-[13px] text-taupe">Order {enumLabel(s.order.status).toLowerCase()}</p>
                  </td>
                  <td className={`${table.tdMuted} whitespace-nowrap text-xs`}>
                    <p>{s.shippedAt ? `Shipped ${formatDate(s.shippedAt)}` : `Created ${formatDate(s.createdAt)}`}</p>
                    {s.deliveredAt && <p>Delivered {formatDate(s.deliveredAt)}</p>}
                  </td>
                  <td className={table.td}>
                    <ShipmentRowForm id={s.id} status={s.status} trackingNumber={s.trackingNumber} orderNumber={s.order.number} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <Pagination page={data.page} pageCount={pageCount(data.total, data.pageSize)} total={data.total} pageSize={data.pageSize} basePath="/admin/shipping" params={current} noun="shipments" />

      <Panel
        id="shipping-methods"
        className="mt-10 scroll-mt-24"
        title="Shipping methods"
        description="The delivery options offered at checkout, in this order. IDs are stored on orders, so they can't be changed once saved."
        bodyClassName="bg-ivory/50 p-5"
      >
        <ShippingMethodsEditor methods={settings.shippingMethods} usage={usage} />
      </Panel>
    </>
  );
}
