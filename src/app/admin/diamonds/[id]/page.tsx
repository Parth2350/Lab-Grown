import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { label } from '@/lib/catalog';
import { deleteDiamond } from '@/lib/server/admin/actions/diamonds';
import { diamondUsage, getAdminDiamond } from '@/lib/server/admin/queries/diamonds';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { ButtonLink } from '@/components/ui/Button';
import { DiamondForm } from '@/components/admin/diamonds/DiamondForm';
import { ActionButton } from '@/components/admin/forms';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/components/admin/format';
import { Badge, DescList, PageHeader, Panel, StatusBadge } from '@/components/admin/ui';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = await db.diamond.findUnique({ where: { id }, select: { sku: true } });
  return pageMeta({ title: d ? `${d.sku} · Diamond` : 'Diamond', path: `/admin/diamonds/${id}`, noIndex: true });
}

export default async function DiamondDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const d = await getAdminDiamond(id);
  if (!d) notFound();
  const usage = await diamondUsage(d);
  const shapeName = label.shape(d.shape);

  return (
    <>
      <PageHeader
        eyebrow="Diamond"
        title={
          <span className="font-mono text-[1.6rem] tracking-wide">
            {d.sku}
          </span>
        }
        description={`${d.carat.toFixed(2)} ct ${shapeName} · ${d.color} · ${d.clarity} · ${d.cut}`}
        back={{ href: '/admin/diamonds', label: 'Diamonds' }}
        actions={
          <>
            <ButtonLink href={`/admin/diamonds/new?from=${d.id}`} size="sm" variant="outline">
              <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Duplicate
            </ButtonLink>
            <ActionButton
              variant="outline"
              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
              action={deleteDiamond.bind(null, d.id, true)}
              className="border-danger/60 text-danger hover:border-danger hover:bg-danger hover:text-white"
              confirm={
                usage.orderCount
                  ? undefined
                  : {
                      title: `Delete ${d.sku}?`,
                      description: 'The stone and its certificate record will be permanently removed from inventory. To pause it instead, switch Available off.',
                      confirmLabel: 'Delete diamond',
                    }
              }
            >
              Delete
            </ActionButton>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <DiamondForm
          mode="edit"
          diamond={{
            id: d.id,
            sku: d.sku,
            shape: d.shape,
            carat: d.carat,
            color: d.color,
            clarity: d.clarity,
            cut: d.cut,
            polish: d.polish,
            symmetry: d.symmetry,
            fluorescence: d.fluorescence,
            measurements: d.measurements,
            tablePct: d.tablePct,
            depthPct: d.depthPct,
            ratio: d.ratio,
            growth: d.growth,
            price: d.price,
            isAvailable: d.isAvailable,
            certLab: d.certificate?.lab ?? 'IGI',
            certNumber: d.certificate?.number ?? '',
            certUrl: d.certificate?.url ?? '',
            certIssuedAt: d.certificate?.issuedAt?.toISOString() ?? null,
          }}
        />

        <aside className="space-y-5 xl:sticky xl:top-6">
          <Panel bodyClassName="p-0">
            <div className="art-tile flex flex-col items-center justify-center gap-2 border-b border-line px-5 py-7 text-charcoal">
              <ShapeIcon shape={d.shape} size={84} strokeWidth={0.9} />
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-taupe">{shapeName}</p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl text-ink">{formatMoney(d.price)}</p>
                <Badge tone={d.isAvailable ? 'success' : 'neutral'} dot>
                  {d.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              <DescList
                items={[
                  ['Carat', `${d.carat.toFixed(2)} ct`],
                  ['Grade', `${d.color} · ${d.clarity} · ${d.cut}`],
                  ['Finish', `${d.polish} polish · ${d.symmetry} symmetry`],
                  ['Growth', d.growth],
                  [
                    'Certificate',
                    d.certificate ? (
                      d.certificate.url ? (
                        <a href={d.certificate.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                          {d.certificate.lab} {d.certificate.number}
                          <ExternalLink className="h-3 w-3 text-taupe" strokeWidth={1.5} aria-hidden />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      ) : (
                        `${d.certificate.lab} ${d.certificate.number}`
                      )
                    ) : (
                      <Badge tone="warning">None</Badge>
                    ),
                  ],
                  ['Issued', d.certificate?.issuedAt ? formatDate(d.certificate.issuedAt) : null],
                  ['Added', formatDate(d.createdAt)],
                  ['Updated', formatDateTime(d.updatedAt)],
                ]}
              />
            </div>
          </Panel>

          <Panel title="Where it’s used" bodyClassName="space-y-4 p-5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-taupe">Settings offering it</span>
              <span>{formatNumber(usage.productCount)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-taupe">In shopping carts</span>
              <span>{formatNumber(usage.cartCount)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-taupe">Order lines</span>
              <span>{formatNumber(usage.orderCount)}</span>
            </div>
            {usage.orderItems.length > 0 && (
              <ul className="space-y-2 border-t border-line pt-4">
                {usage.orderItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/orders/${item.order.id}`} className="font-mono text-[12.5px] underline-offset-4 hover:underline">
                        {item.order.number}
                      </Link>
                      <p className="truncate text-[11.5px] text-taupe">{item.name}</p>
                    </div>
                    <StatusBadge status={item.order.status} />
                  </li>
                ))}
              </ul>
            )}
            {usage.orderCount > 0 && (
              <p className="border-t border-line pt-4 text-xs text-taupe">
                This stone is part of order history, so it can’t be deleted. Switch Available off to stop offering it.
              </p>
            )}
            {usage.productCount === 0 && (
              <p className="border-t border-line pt-4 text-xs text-taupe">
                No setting currently offers a {shapeName.toLowerCase()} centre stone in the {d.carat.toFixed(2)} ct range, so shoppers can’t select this stone yet.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
