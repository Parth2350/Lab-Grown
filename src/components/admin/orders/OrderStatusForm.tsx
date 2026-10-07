'use client';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { OrderStatus } from '@prisma/client';
import { Info } from 'lucide-react';
import { updateOrderStatus } from '@/lib/server/admin/actions/orders';
import { enumLabel } from '../format';
import { ConfirmDialog, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { selectChevron, selectSm } from '../ui';
import { ORDER_STATUSES, ORDER_STATUS_HINT, STOCK_HELD_STATUSES, isStandardTransition, transitionNeedsConfirmation } from './status';

const lbl = 'mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal';

export function OrderStatusForm({
  orderId,
  orderNumber,
  status,
  hasShipment,
  capturedPayments,
}: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  hasShipment: boolean;
  capturedPayments: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [target, setTarget] = useState<OrderStatus | ''>('');
  const [restock, setRestock] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { state, pending, submit } = useAdminForm(updateOrderStatus, {
    onSuccess: () => {
      setTarget('');
      setRestock(false);
      setConfirmOpen(false);
    },
  });

  const standard = ORDER_STATUSES.filter((s) => s !== status && isStandardTransition(status, s));
  const corrections = ORDER_STATUSES.filter((s) => s !== status && !isStandardTransition(status, s));
  const needsConfirm = !!target && transitionNeedsConfirmation(status, target);
  const canRestock = !!target && (target === 'CANCELLED' || target === 'REFUNDED') && STOCK_HELD_STATUSES.includes(status);
  const shipHint = !!target && (target === 'SHIPPED' || target === 'DELIVERED') && !hasShipment;

  const send = (confirmed: boolean) => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    if (confirmed) fd.set('confirmed', '1');
    submit(fd);
  };
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!target) return;
    if (needsConfirm) setConfirmOpen(true);
    else send(false);
  };

  const confirmCopy = (() => {
    if (!target) return { title: '', body: null as ReactNode };
    if (target === 'CANCELLED')
      return {
        title: `Cancel order ${orderNumber}?`,
        body: (
          <>
            The order will not be fulfilled and the customer will see it as cancelled.
            {capturedPayments > 0 && ' A payment has been captured — record the refund with “Mark refunded” once it has been issued.'}
            {canRestock && (restock ? ' Items will be returned to inventory.' : ' Inventory is left unchanged.')}
          </>
        ),
      };
    if (target === 'REFUNDED')
      return {
        title: `Refund order ${orderNumber}?`,
        body: (
          <>
            {capturedPayments > 0
              ? `${capturedPayments} captured payment${capturedPayments === 1 ? '' : 's'} will be marked refunded. Issue the money back in your payment provider's dashboard as well — this only records it.`
              : 'There is no captured payment on this order; only the order status changes.'}
            {canRestock && (restock ? ' Items will be returned to inventory.' : ' Inventory is left unchanged.')}
          </>
        ),
      };
    return {
      title: `Move ${orderNumber} back to ${enumLabel(target).toLowerCase()}?`,
      body: `This is an unusual change (from ${enumLabel(status).toLowerCase()} to ${enumLabel(target).toLowerCase()}). Payments, shipments and inventory are not changed — only the order status.`,
    };
  })();

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="from" value={status} />
      <FormBanner state={state && !state.ok ? state : null} />
      <div>
        <label htmlFor="order-status" className={lbl}>
          Change status
        </label>
        <div className="flex gap-2">
          <select
            id="order-status"
            name="status"
            value={target}
            onChange={(e) => setTarget(e.target.value as OrderStatus | '')}
            className={`${selectSm} min-w-0 flex-1`}
            style={selectChevron}
            aria-describedby="order-status-hint"
          >
            <option value="">Currently {enumLabel(status).toLowerCase()}…</option>
            {standard.length > 0 && (
              <optgroup label="Next steps">
                {standard.map((s) => (
                  <option key={s} value={s}>
                    {enumLabel(s)}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Corrections (asks to confirm)">
              {corrections.map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </optgroup>
          </select>
          <SubmitButton pending={pending} disabled={!target} variant={target === 'CANCELLED' || target === 'REFUNDED' ? 'outline' : 'primary'}>
            Update
          </SubmitButton>
        </div>
        <p id="order-status-hint" className="mt-1.5 text-xs text-taupe">
          {target ? ORDER_STATUS_HINT[target] : ORDER_STATUS_HINT[status]}
        </p>
      </div>

      {canRestock && (
        <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-charcoal">
          <input type="checkbox" name="restock" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
          <span>Return items to inventory (restock variants and release reserved diamonds)</span>
        </label>
      )}

      {shipHint && (
        <p className="flex items-start gap-2 border border-[#E6CF9E] bg-[#FBF3E1] px-3 py-2 text-xs text-[#7A5718]" role="note">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
          This order has no shipment yet. Add one under Shipments so the customer gets carrier and tracking details.
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => !pending && setConfirmOpen(false)}
        onConfirm={() => send(true)}
        pending={pending}
        title={confirmCopy.title}
        description={confirmCopy.body}
        confirmLabel={target ? `Set ${enumLabel(target).toLowerCase()}` : 'Confirm'}
        tone={target === 'CANCELLED' || target === 'REFUNDED' ? 'danger' : 'default'}
      />
    </form>
  );
}
