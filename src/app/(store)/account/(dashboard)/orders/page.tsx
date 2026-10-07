import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { formatDate, formatMoney, pluralize } from '@/lib/utils';
import { StatusBadge } from '@/components/commerce/OrderParts';
import { ProductMedia } from '@/components/product/ProductMedia';
import { ButtonLink } from '@/components/ui/Button';
import type { ArtSpec } from '@/components/art/JewelryArt';

export const metadata = pageMeta({ title: 'Your Orders', description: 'Track and review your orders.', path: '/account/orders', noIndex: true });

export default async function OrdersPage() {
  const user = await requireUser('/account/orders');
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      number: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          name: true,
          quantity: true,
          metalColor: true,
          diamond: { select: { shape: true, carat: true } },
          product: { select: { art: true, shapes: true, centerCarat: true, totalCarat: true } },
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-light">Orders</h2>
        <p className="mt-1 text-sm text-taupe">{orders.length ? pluralize(orders.length, 'order') : 'Your order history will appear here.'}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center border border-line px-6 py-16 text-center">
          <Package className="h-9 w-9 text-gold" strokeWidth={1} aria-hidden />
          <p className="mt-5 font-serif text-2xl">No orders yet</p>
          <p className="mt-2 max-w-sm text-sm text-taupe">Every piece is crafted to order in our workshop — when you place one, you can follow its journey here.</p>
          <ButtonLink href="/collections/all" className="mt-6">
            Explore the Collection
          </ButtonLink>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {orders.map((o) => {
            const first = o.items[0];
            const qty = o.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={o.number}>
                <Link href={`/account/orders/${o.number}`} className="group grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-5 transition-colors hover:bg-porcelain/50 sm:grid-cols-[72px_minmax(0,1fr)_auto_auto_20px] sm:gap-x-6 sm:px-2">
                  <div className="art-tile h-16 w-16 p-1.5 sm:h-[72px] sm:w-[72px]">
                    {first && (
                      <ProductMedia
                        name={first.name}
                        art={(first.product?.art as ArtSpec | null) ?? null}
                        shape={first.diamond?.shape ?? first.product?.shapes[0] ?? 'round'}
                        metal={first.metalColor}
                        carat={first.diamond?.carat ?? first.product?.centerCarat ?? first.product?.totalCarat ?? 1}
                        sizes="72px"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] text-ink">{o.number}</p>
                    <p className="truncate text-[12.5px] text-taupe">
                      {first?.name}
                      {o.items.length > 1 ? ` + ${o.items.length - 1} more` : ''}
                    </p>
                    <p className="text-[12px] text-taupe">
                      {formatDate(o.createdAt)} · {pluralize(qty, 'piece')}
                    </p>
                  </div>
                  <div className="text-right sm:order-none">
                    <p className="text-[14px] tabular-nums">{formatMoney(o.total, { exact: true })}</p>
                    <StatusBadge status={o.status} className="mt-1.5 sm:hidden" />
                  </div>
                  <StatusBadge status={o.status} className="hidden justify-self-end sm:inline-flex" />
                  <ArrowRight className="hidden h-4 w-4 text-stone transition-colors group-hover:text-ink sm:block" strokeWidth={1.25} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
