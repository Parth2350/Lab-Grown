'use client';
import { useState } from 'react';
import type { ShipmentStatus } from '@prisma/client';
import { quickUpdateShipment } from '@/lib/server/admin/actions/shipping';
import { enumLabel } from '../format';
import { SubmitButton, useAdminForm } from '../forms';
import { fieldSm, selectChevron, selectSm } from '../ui';
import { SHIPMENT_STATUSES } from '../orders/status';

/** Inline status + tracking editor for one shipments-table row. */
export function ShipmentRowForm({ id, status, trackingNumber, orderNumber }: { id: string; status: ShipmentStatus; trackingNumber: string | null; orderNumber: string }) {
  const [nextStatus, setNextStatus] = useState<ShipmentStatus>(status);
  const [tracking, setTracking] = useState(trackingNumber ?? '');
  const { state, pending, onSubmit } = useAdminForm(quickUpdateShipment);
  const dirty = nextStatus !== status || tracking.trim() !== (trackingNumber ?? '');
  const err = state && !state.ok ? state.fieldErrors?.trackingNumber ?? state.fieldErrors?.status : undefined;

  return (
    <form onSubmit={onSubmit} className="flex min-w-[420px] items-start gap-2" noValidate aria-label={`Update shipment for ${orderNumber}`}>
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={`ss-${id}`} className="sr-only">
          Shipment status for {orderNumber}
        </label>
        <select id={`ss-${id}`} name="status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ShipmentStatus)} className={`${selectSm} w-[150px]`} style={selectChevron}>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={`st-${id}`} className="sr-only">
          Tracking number for {orderNumber}
        </label>
        <input
          id={`st-${id}`}
          name="trackingNumber"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          maxLength={80}
          placeholder="Tracking number"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={err ? true : undefined}
          className={`${fieldSm} font-mono text-[12px]`}
        />
        {err && (
          <p className="mt-1 text-[11px] text-danger" role="alert">
            {err}
          </p>
        )}
      </div>
      <SubmitButton pending={pending} disabled={!dirty} variant="outline" className="h-9 px-3">
        Save
      </SubmitButton>
    </form>
  );
}
