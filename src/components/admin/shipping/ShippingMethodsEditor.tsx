'use client';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ShippingMethod } from '@/lib/pricing';
import { saveShippingMethods } from '@/lib/server/admin/actions/shipping';
import { cn, slugify } from '@/lib/utils';
import { centsToInput, formatNumber } from '../format';
import { ConfirmDialog, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { fieldSm } from '../ui';

type Row = { key: string; id: string; label: string; description: string; eta: string; price: string; isNew: boolean; idTouched: boolean };

// Saved rows get deterministic keys (they end up in DOM ids, so SSR and hydration must agree);
// rows added in the browser get a client-only counter.
let seq = 0;
const newKey = () => `new-${++seq}`;

function toRows(methods: ShippingMethod[]): Row[] {
  return methods.map((m, i) => ({ key: `saved-${i}-${m.id}`, id: m.id, label: m.label, description: m.description ?? '', eta: m.eta ?? '', price: centsToInput(m.price) || '0', isNew: false, idTouched: true }));
}

const serialize = (rows: Row[]) => JSON.stringify(rows.map(({ id, label, description, eta, price }) => ({ id: id.trim(), label: label.trim(), description: description.trim(), eta: eta.trim(), price: price.trim() })));

const lbl = 'mb-1 block text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe';

export function ShippingMethodsEditor({ methods, usage }: { methods: ShippingMethod[]; usage: Record<string, number> }) {
  const sourceKey = JSON.stringify(methods);
  const [rows, setRows] = useState<Row[]>(() => toRows(methods));
  const [pendingRemoval, setPendingRemoval] = useState<Row | null>(null);
  const baseline = useRef(serialize(toRows(methods)));
  const { state, pending, submit } = useAdminForm(saveShippingMethods);

  // After a successful save the server re-renders with the stored methods — adopt them as the new baseline.
  useEffect(() => {
    const fresh = toRows(JSON.parse(sourceKey) as ShippingMethod[]);
    baseline.current = serialize(fresh);
    setRows(fresh);
  }, [sourceKey]);

  const dirty = useMemo(() => serialize(rows) !== baseline.current, [rows]);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const fieldError = (i: number, name: string) => errors[`methods.${i}.${name}`];

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (r.isNew && !next.idTouched && patch.label !== undefined) next.id = slugify(patch.label).slice(0, 40);
        return next;
      }),
    );
  const move = (index: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = index + dir;
      if (j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  const remove = (row: Row) => setRows((rs) => rs.filter((r) => r.key !== row.key));
  const requestRemove = (row: Row) => {
    if (!row.isNew && (usage[row.id] ?? 0) > 0) setPendingRemoval(row);
    else remove(row);
  };
  const add = () => setRows((rs) => [...rs, { key: newKey(), id: '', label: '', description: '', eta: '', price: '0', isNew: true, idTouched: false }]);

  const onSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set('methods', serialize(rows));
    submit(fd);
  };

  return (
    <form onSubmit={onSave} noValidate className="space-y-4">
      <FormBanner state={state && !state.ok ? state : null} />
      {errors.methods && (
        <p className="text-xs text-danger" role="alert">
          {errors.methods}
        </p>
      )}
      <ol className="space-y-3">
        {rows.map((r, i) => {
          const used = r.isNew ? 0 : usage[r.id] ?? 0;
          const fid = (n: string) => `sm-${r.key}-${n}`;
          return (
            <li key={r.key} className="border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-3">
                <p className="text-[14.5px] text-charcoal">
                  <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center bg-porcelain px-1 text-[13px] tabular-nums">{i + 1}</span>
                  {r.label || <span className="text-taupe">New method</span>}
                  {r.isNew ? (
                    <span className="ml-2 text-[13px] text-gold-deep">Unsaved</span>
                  ) : (
                    <span className="ml-2 text-[13px] text-taupe">
                      {used ? `Used by ${formatNumber(used)} order${used === 1 ? '' : 's'}` : 'Not used yet'}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <IconBtn label={`Move ${r.label || 'method'} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" strokeWidth={1.4} />
                  </IconBtn>
                  <IconBtn label={`Move ${r.label || 'method'} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-4 w-4" strokeWidth={1.4} />
                  </IconBtn>
                  <IconBtn label={`Remove ${r.label || 'method'}`} disabled={rows.length === 1} onClick={() => requestRemove(r)} danger>
                    <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                  </IconBtn>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)_120px]">
                <div>
                  <label htmlFor={fid('id')} className={lbl}>
                    ID <span className="text-gold">*</span>
                  </label>
                  <input
                    id={fid('id')}
                    value={r.id}
                    readOnly={!r.isNew}
                    onChange={(e) => update(r.key, { id: e.target.value, idTouched: true })}
                    maxLength={40}
                    spellCheck={false}
                    aria-invalid={fieldError(i, 'id') ? true : undefined}
                    aria-describedby={fid('id-hint')}
                    className={cn(fieldSm, 'font-mono text-[14px]', !r.isNew && 'cursor-not-allowed bg-ivory text-charcoal')}
                    placeholder="express"
                  />
                  <p id={fid('id-hint')} className={cn('mt-1 text-[13px]', fieldError(i, 'id') ? 'text-danger' : 'text-taupe')}>
                    {fieldError(i, 'id') ?? (r.isNew ? 'Lowercase letters, numbers, hyphens' : 'Fixed — orders reference it')}
                  </p>
                </div>
                <div>
                  <label htmlFor={fid('label')} className={lbl}>
                    Label <span className="text-gold">*</span>
                  </label>
                  <input
                    id={fid('label')}
                    value={r.label}
                    onChange={(e) => update(r.key, { label: e.target.value })}
                    maxLength={80}
                    aria-invalid={fieldError(i, 'label') ? true : undefined}
                    className={fieldSm}
                    placeholder="Insured Express"
                  />
                  {fieldError(i, 'label') && <p className="mt-1 text-[13px] text-danger">{fieldError(i, 'label')}</p>}
                </div>
                <div>
                  <label htmlFor={fid('eta')} className={lbl}>
                    Delivery estimate
                  </label>
                  <input id={fid('eta')} value={r.eta} onChange={(e) => update(r.key, { eta: e.target.value })} maxLength={80} aria-invalid={fieldError(i, 'eta') ? true : undefined} className={fieldSm} placeholder="3–5 business days" />
                  {fieldError(i, 'eta') && <p className="mt-1 text-[13px] text-danger">{fieldError(i, 'eta')}</p>}
                </div>
                <div>
                  <label htmlFor={fid('price')} className={lbl}>
                    Price (₹)
                  </label>
                  <input
                    id={fid('price')}
                    value={r.price}
                    onChange={(e) => update(r.key, { price: e.target.value })}
                    inputMode="decimal"
                    aria-invalid={fieldError(i, 'price') ? true : undefined}
                    aria-describedby={fid('price-hint')}
                    className={cn(fieldSm, 'tabular-nums')}
                  />
                  <p id={fid('price-hint')} className={cn('mt-1 text-[13px]', fieldError(i, 'price') ? 'text-danger' : 'text-taupe')}>
                    {fieldError(i, 'price') ?? '0 = free'}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label htmlFor={fid('description')} className={lbl}>
                    Description
                  </label>
                  <input
                    id={fid('description')}
                    value={r.description}
                    onChange={(e) => update(r.key, { description: e.target.value })}
                    maxLength={200}
                    aria-invalid={fieldError(i, 'description') ? true : undefined}
                    className={fieldSm}
                    placeholder="Optional short note"
                  />
                  {fieldError(i, 'description') && <p className="mt-1 text-[13px] text-danger">{fieldError(i, 'description')}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" size="sm" variant="ghost" onClick={add} disabled={rows.length >= 12}>
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Add method
        </Button>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-taupe">Unsaved changes</span>}
          {dirty && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setRows(toRows(JSON.parse(sourceKey) as ShippingMethod[]))}>
              Discard
            </Button>
          )}
          <SubmitButton pending={pending} disabled={!dirty} pendingLabel="Saving…">
            Save methods
          </SubmitButton>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingRemoval}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) remove(pendingRemoval);
          setPendingRemoval(null);
        }}
        title={`Remove ${pendingRemoval?.label || 'this method'}?`}
        description={
          pendingRemoval && (
            <>
              {formatNumber(usage[pendingRemoval.id] ?? 0)} existing order{(usage[pendingRemoval.id] ?? 0) === 1 ? '' : 's'} used this method. They keep the ID
              <span className="mx-1 font-mono text-[14px]">{pendingRemoval.id}</span>
              and will show it instead of the label. It is no longer offered once you save.
            </>
          )
        }
        confirmLabel="Remove method"
      />
    </form>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-ivory disabled:pointer-events-none disabled:opacity-30',
        danger ? 'hover:text-danger' : 'hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
