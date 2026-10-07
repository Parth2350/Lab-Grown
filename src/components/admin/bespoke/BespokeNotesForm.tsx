'use client';
import { useState } from 'react';
import { saveBespokeNotes } from '@/lib/server/admin/actions/bespoke';
import { cn } from '@/lib/utils';
import { formatNumber } from '../format';
import { FieldMsg, SubmitButton, useAdminForm } from '../forms';

const MAX = 5000;

/** Internal (admin-only) notes on a bespoke request. */
export function BespokeNotesForm({ id, notes }: { id: string; notes: string | null }) {
  const form = useAdminForm(saveBespokeNotes);
  const [value, setValue] = useState(notes ?? '');
  const dirty = value.trim() !== (notes ?? '').trim();
  return (
    <form onSubmit={form.onSubmit} noValidate>
      <input type="hidden" name="id" value={id} />
      <label htmlFor="bespoke-admin-notes" className="sr-only">
        Internal notes
      </label>
      <textarea
        id="bespoke-admin-notes"
        name="adminNotes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        maxLength={MAX}
        placeholder="Quotes sent, design decisions, follow-ups… Only visible to the admin team."
        aria-invalid={form.state && !form.state.ok && form.state.fieldErrors?.adminNotes ? true : undefined}
        aria-describedby="bespoke-admin-notes-count"
        className="field min-h-[140px] resize-y px-3 py-2.5 text-[13px] leading-relaxed"
      />
      <FieldMsg state={form.state} name="adminNotes" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span id="bespoke-admin-notes-count" className={cn('text-[11px] tabular-nums', value.length > MAX * 0.95 ? 'text-[#7A5718]' : 'text-taupe')}>
          {formatNumber(value.length)}/{formatNumber(MAX)}
          {dirty && <span className="ml-2 text-gold-deep">· Unsaved changes</span>}
        </span>
        <SubmitButton pending={form.pending} pendingLabel="Saving…" disabled={!dirty}>
          Save notes
        </SubmitButton>
      </div>
    </form>
  );
}
