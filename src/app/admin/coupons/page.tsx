import { TicketPercent, Trash2 } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { deleteCoupon, setCouponActive } from '@/lib/server/admin/actions/coupons';
import { CouponEditor, type CouponRow } from '@/components/admin/coupons/CouponEditor';
import { ActionButton, ToggleAction } from '@/components/admin/forms';
import { formatDate, formatMoney, formatNumber } from '@/components/admin/format';
import { Badge, EmptyState, PageHeader, TableWrap, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Coupons', path: '/admin/coupons', noIndex: true });

function couponState(c: { isActive: boolean; startsAt: Date | null; endsAt: Date | null; maxUses: number | null; usedCount: number }, now: Date) {
  if (!c.isActive) return { label: 'Inactive', tone: 'neutral' as const };
  if (c.endsAt && c.endsAt < now) return { label: 'Expired', tone: 'danger' as const };
  if (c.startsAt && c.startsAt > now) return { label: 'Scheduled', tone: 'info' as const };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { label: 'Used up', tone: 'warning' as const };
  return { label: 'Live', tone: 'success' as const };
}

export default async function CouponsPage() {
  await requireAdmin();
  const [coupons, usage] = await Promise.all([
    db.coupon.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] }),
    db.order.groupBy({
      by: ['couponCode'],
      where: { couponCode: { not: null }, status: { notIn: ['CANCELLED', 'PENDING'] } },
      _count: { _all: true },
      _sum: { discount: true, total: true },
    }),
  ]);
  const usageBy = new Map(usage.map((u) => [u.couponCode, u]));
  const now = new Date();

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can apply in their bag. Codes are case-insensitive and stored in upper case." actions={<CouponEditor />} />
      {coupons.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState icon={<TicketPercent className="h-5 w-5" strokeWidth={1.25} />} title="No coupons yet" description="Create your first discount code to run a promotion." action={<CouponEditor />} />
        </div>
      ) : (
        <TableWrap>
          <table className={table.base}>
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Code</th>
                <th className={table.th}>Discount</th>
                <th className={table.thRight}>Min. subtotal</th>
                <th className={table.th}>Usage</th>
                <th className={table.thRight}>Orders · discount given</th>
                <th className={table.th}>Window</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>Active</th>
                <th className={table.th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const state = couponState(c, now);
                const u = usageBy.get(c.code);
                const pct = c.maxUses ? Math.min(1, c.usedCount / c.maxUses) : null;
                const row: CouponRow = {
                  id: c.id,
                  code: c.code,
                  description: c.description,
                  type: c.type,
                  value: c.value,
                  minSubtotal: c.minSubtotal,
                  maxUses: c.maxUses,
                  startsAt: c.startsAt?.toISOString() ?? null,
                  endsAt: c.endsAt?.toISOString() ?? null,
                  isActive: c.isActive,
                };
                return (
                  <tr key={c.id} className={table.row}>
                    <td className={table.td}>
                      <p className="font-medium tracking-wider">{c.code}</p>
                      {c.description && <p className="max-w-[260px] truncate text-xs text-taupe">{c.description}</p>}
                    </td>
                    <td className={table.td}>{c.type === 'PERCENT' ? `${c.value}% off` : `${formatMoney(c.value)} off`}</td>
                    <td className={table.tdRight}>{c.minSubtotal ? formatMoney(c.minSubtotal) : '—'}</td>
                    <td className={table.td}>
                      <p>
                        {formatNumber(c.usedCount)}
                        <span className="text-taupe"> / {c.maxUses != null ? formatNumber(c.maxUses) : '∞'}</span>
                      </p>
                      {pct != null && (
                        <div className="mt-1 h-1 w-24 bg-gold-pale" role="meter" aria-valuemin={0} aria-valuemax={c.maxUses ?? 0} aria-valuenow={c.usedCount} aria-label={`${c.code} usage`}>
                          <div className={pct >= 1 ? 'h-full bg-danger' : pct > 0.8 ? 'h-full bg-[#C08A1E]' : 'h-full bg-gold'} style={{ width: `${pct * 100}%` }} />
                        </div>
                      )}
                    </td>
                    <td className={table.tdRight}>
                      {u ? (
                        <>
                          {formatNumber(u._count._all)} · <span className="text-taupe">{formatMoney(u._sum.discount ?? 0)}</span>
                        </>
                      ) : (
                        <span className="text-taupe">—</span>
                      )}
                    </td>
                    <td className={table.tdMuted}>
                      {c.startsAt || c.endsAt ? (
                        <span className="whitespace-nowrap text-xs">
                          {c.startsAt ? formatDate(c.startsAt) : 'Now'} → {c.endsAt ? formatDate(c.endsAt) : 'No end'}
                        </span>
                      ) : (
                        <span className="text-xs">Always</span>
                      )}
                    </td>
                    <td className={table.td}>
                      <Badge tone={state.tone} dot>
                        {state.label}
                      </Badge>
                    </td>
                    <td className={table.td}>
                      <ToggleAction checked={c.isActive} action={setCouponActive.bind(null, c.id)} label={`${c.code} active`} onLabel="On" offLabel="Off" />
                    </td>
                    <td className={`${table.td} whitespace-nowrap text-right`}>
                      <CouponEditor coupon={row} />
                      <ActionButton
                        variant="icon"
                        title={`Delete ${c.code}`}
                        icon={<Trash2 className="h-4 w-4" strokeWidth={1.4} />}
                        action={deleteCoupon.bind(null, c.id)}
                        confirm={{
                          title: `Delete ${c.code}?`,
                          description: 'If this code has been used on orders it will be deactivated instead, so your reports stay accurate.',
                          confirmLabel: 'Delete',
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
