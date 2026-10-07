'use client';
import { useState } from 'react';
import type { ReturnStatus } from '@prisma/client';
import { updateReturnStatus } from '@/lib/server/admin/actions/orders';
import { enumLabel } from '../format';
import { SubmitButton, useAdminForm } from '../forms';
import { selectChevron, selectSm } from '../ui';
import { RETURN_STATUSES } from './status';

export function ReturnStatusForm({ id, status }: { id: string; status: ReturnStatus }) {
  const [value, setValue] = useState<ReturnStatus>(status);
  const { pending, onSubmit } = useAdminForm(updateReturnStatus);
  const selectId = `return-status-${id}`;
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2" noValidate>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={selectId} className="sr-only">
        Return status
      </label>
      <select id={selectId} name="status" value={value} onChange={(e) => setValue(e.target.value as ReturnStatus)} className={`${selectSm} w-40`} style={selectChevron}>
        {RETURN_STATUSES.map((s) => (
          <option key={s} value={s}>
            {enumLabel(s)}
          </option>
        ))}
      </select>
      <SubmitButton pending={pending} disabled={value === status} variant="outline">
        Save
      </SubmitButton>
    </form>
  );
}
