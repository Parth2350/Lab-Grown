'use client';
import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { saveCoupon } from '@/lib/server/admin/actions/coupons';
import { centsToInput, toDateInput } from '../format';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { selectChevron } from '../ui';

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

const lbl = 'mb-1.5 block text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal';

function CouponForm({ coupon, onDone }: { coupon?: CouponRow; onDone: () => void }) {
  const { state, pending, onSubmit } = useAdminForm(saveCoupon, { onSuccess: onDone });
  const [type, setType] = useState<'PERCENT' | 'FIXED'>(coupon?.type ?? 'PERCENT');
  const err = (n: string) => (state && !state.ok && state.fieldErrors?.[n] ? true : undefined);
  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col" noValidate>
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <FormBanner state={state && !state.ok ? state : null} />
        <div>
          <label htmlFor="c-code" className={lbl}>
            Code <span className="text-gold">*</span>
          </label>
          <input id="c-code" name="code" defaultValue={coupon?.code} required maxLength={32} autoComplete="off" aria-invalid={err('code')} className="field py-2.5 font-medium uppercase tracking-wider" placeholder="WELCOME10" data-autofocus />
          <FieldMsg state={state} name="code" />
        </div>
        <div>
          <label htmlFor="c-desc" className={lbl}>
            Description
          </label>
          <input id="c-desc" name="description" defaultValue={coupon?.description ?? ''} maxLength={200} className="field py-2.5" placeholder="Internal note" />
          <FieldMsg state={state} name="description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="c-type" className={lbl}>
              Type
            </label>
            <select id="c-type" name="type" value={type} onChange={(e) => setType(e.target.value as 'PERCENT' | 'FIXED')} className="field cursor-pointer appearance-none py-2.5 pr-8" style={selectChevron}>
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Fixed amount off</option>
            </select>
          </div>
          <div>
            <label htmlFor="c-value" className={lbl}>
              {type === 'PERCENT' ? 'Percent (%)' : 'Amount (₹)'} <span className="text-gold">*</span>
            </label>
            <input
              id="c-value"
              name="value"
              inputMode="decimal"
              defaultValue={coupon ? (coupon.type === 'PERCENT' ? String(coupon.value) : centsToInput(coupon.value)) : ''}
              aria-invalid={err('value')}
              className="field py-2.5"
              placeholder={type === 'PERCENT' ? '10' : '150'}
            />
            <FieldMsg state={state} name="value" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="c-min" className={lbl}>
              Minimum subtotal (₹)
            </label>
            <input id="c-min" name="minSubtotal" inputMode="decimal" defaultValue={coupon ? centsToInput(coupon.minSubtotal) : '0'} aria-invalid={err('minSubtotal')} className="field py-2.5" />
            <FieldMsg state={state} name="minSubtotal" />
          </div>
          <div>
            <label htmlFor="c-max" className={lbl}>
              Max uses
            </label>
            <input id="c-max" name="maxUses" inputMode="numeric" defaultValue={coupon?.maxUses ?? ''} aria-invalid={err('maxUses')} className="field py-2.5" placeholder="Unlimited" />
            <FieldMsg state={state} name="maxUses" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="c-start" className={lbl}>
              Starts
            </label>
            <input id="c-start" type="date" name="startsAt" defaultValue={toDateInput(coupon?.startsAt)} className="field py-2" />
            <FieldMsg state={state} name="startsAt" />
          </div>
          <div>
            <label htmlFor="c-end" className={lbl}>
              Ends (inclusive)
            </label>
            <input id="c-end" type="date" name="endsAt" defaultValue={toDateInput(coupon?.endsAt)} aria-invalid={err('endsAt')} className="field py-2" />
            <FieldMsg state={state} name="endsAt" />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-[15px]">
          <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="h-4 w-4 accent-ink" />
          Active — customers can redeem this code
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton pending={pending} pendingLabel="Saving…">{coupon ? 'Save changes' : 'Create coupon'}</SubmitButton>
      </div>
    </form>
  );
}

export function CouponEditor({ coupon }: { coupon?: CouponRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {coupon ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-8 w-8 items-center justify-center text-taupe hover:bg-white hover:text-ink" aria-label={`Edit ${coupon.code}`} title="Edit">
          <Pencil className="h-4 w-4" strokeWidth={1.4} />
        </button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.5} /> New coupon
        </Button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={coupon ? `Edit ${coupon.code}` : 'New coupon'} bodyClassName="flex flex-col">
        {open && <CouponForm coupon={coupon} onDone={() => setOpen(false)} />}
      </Sheet>
    </>
  );
}
