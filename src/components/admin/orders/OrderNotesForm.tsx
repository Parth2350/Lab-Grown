'use client';
import { useState } from 'react';
import { saveOrderNotes } from '@/lib/server/admin/actions/orders';
import { FieldMsg, SubmitButton, useAdminForm } from '../forms';

const MAX = 5000;

export function OrderNotesForm({ orderId, notes }: { orderId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? '');
  const { state, pending, onSubmit } = useAdminForm(saveOrderNotes);
  const dirty = value.trim() !== (notes ?? '').trim();
  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <input type="hidden" name="id" value={orderId} />
      <label htmlFor="order-notes" className="sr-only">
        Order notes (internal)
      </label>
      <textarea
        id="order-notes"
        name="notes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX}
        rows={5}
        className="field min-h-[110px] resize-y px-3 py-2 text-[13px] leading-relaxed"
        placeholder="Workshop instructions, follow-ups, gift messages…"
        aria-describedby="order-notes-hint"
      />
      <FieldMsg state={state} name="notes" />
      <div className="flex items-center justify-between gap-3">
        <p id="order-notes-hint" className="text-[11px] text-taupe">
          Never shown to the customer. {value.length}/{MAX}
        </p>
        <SubmitButton pending={pending} disabled={!dirty} variant="outline">
          Save notes
        </SubmitButton>
      </div>
    </form>
  );
}
