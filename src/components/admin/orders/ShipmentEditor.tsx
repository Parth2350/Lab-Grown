'use client';
import { useState } from 'react';
import type { ShipmentStatus } from '@prisma/client';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { saveShipment } from '@/lib/server/admin/actions/shipping';
import { enumLabel } from '../format';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { selectChevron } from '../ui';
import { SHIPMENT_STATUSES, SHIPMENT_STATUS_HINT } from './status';

export type ShipmentFormValue = {
  id: string;
  carrier: string;
  method: string;
  trackingNumber: string | null;
  status: ShipmentStatus;
};

export type MethodOption = { id: string; label: string };

const lbl = 'mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal';

function ShipmentForm({
  orderId,
  shipment,
  methods,
  defaultMethod,
  onDone,
}: {
  orderId: string;
  shipment?: ShipmentFormValue;
  methods: MethodOption[];
  defaultMethod: string;
  onDone: () => void;
}) {
  const { state, pending, onSubmit } = useAdminForm(saveShipment, { onSuccess: onDone });
  const [status, setStatus] = useState<ShipmentStatus>(shipment?.status ?? 'PENDING');
  const err = (n: string) => (state && !state.ok && state.fieldErrors?.[n] ? true : undefined);
  const current = shipment?.method ?? defaultMethod;
  const options = methods.some((m) => m.id === current) || !current ? methods : [...methods, { id: current, label: `${current} (retired)` }];

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col" noValidate>
      <input type="hidden" name="orderId" value={orderId} />
      {shipment && <input type="hidden" name="id" value={shipment.id} />}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <FormBanner state={state && !state.ok ? state : null} />
        <div>
          <label htmlFor="s-carrier" className={lbl}>
            Carrier <span className="text-gold">*</span>
          </label>
          <input
            id="s-carrier"
            name="carrier"
            defaultValue={shipment?.carrier ?? 'Insured Courier'}
            required
            maxLength={80}
            aria-invalid={err('carrier')}
            className="field py-2.5"
            placeholder="FedEx Priority, Malca-Amit…"
            data-autofocus
          />
          <FieldMsg state={state} name="carrier" />
        </div>
        <div>
          <label htmlFor="s-method" className={lbl}>
            Shipping method <span className="text-gold">*</span>
          </label>
          <select id="s-method" name="method" defaultValue={current} aria-invalid={err('method')} className="field cursor-pointer appearance-none py-2.5 pr-8" style={selectChevron}>
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <FieldMsg state={state} name="method" />
        </div>
        <div>
          <label htmlFor="s-tracking" className={lbl}>
            Tracking number
          </label>
          <input
            id="s-tracking"
            name="trackingNumber"
            defaultValue={shipment?.trackingNumber ?? ''}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={err('trackingNumber')}
            className="field py-2.5 font-mono text-[13px]"
          />
          <FieldMsg state={state} name="trackingNumber" />
        </div>
        <div>
          <label htmlFor="s-status" className={lbl}>
            Status
          </label>
          <select
            id="s-status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
            className="field cursor-pointer appearance-none py-2.5 pr-8"
            style={selectChevron}
            aria-describedby="s-status-hint"
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {enumLabel(s)}
              </option>
            ))}
          </select>
          <p id="s-status-hint" className="mt-1.5 text-xs text-taupe">
            {SHIPMENT_STATUS_HINT[status]}. Ship and delivery dates are recorded automatically; in-transit and delivered parcels move the order forward.
          </p>
          <FieldMsg state={state} name="status" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton pending={pending} pendingLabel="Saving…">
          {shipment ? 'Save shipment' : 'Add shipment'}
        </SubmitButton>
      </div>
    </form>
  );
}

export function ShipmentEditor({
  orderId,
  orderNumber,
  shipment,
  methods,
  defaultMethod,
}: {
  orderId: string;
  orderNumber: string;
  shipment?: ShipmentFormValue;
  methods: MethodOption[];
  defaultMethod: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {shipment ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center text-taupe transition-colors hover:bg-ivory hover:text-ink"
          aria-label={`Edit shipment ${shipment.trackingNumber ?? ''}`.trim()}
          title="Edit shipment"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.4} />
        </button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Add shipment
        </Button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={shipment ? `Edit shipment · ${orderNumber}` : `New shipment · ${orderNumber}`} bodyClassName="flex flex-col">
        {open && <ShipmentForm orderId={orderId} shipment={shipment} methods={methods} defaultMethod={defaultMethod} onDone={() => setOpen(false)} />}
      </Sheet>
    </>
  );
}
