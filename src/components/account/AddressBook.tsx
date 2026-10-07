'use client';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, MapPin, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useUI } from '@/store/ui';
import { AddressFields, emptyAddress, type AddressDraft } from '@/components/commerce/AddressFields';
import { AddressBlock } from '@/components/commerce/OrderParts';
import { addressSchema, fieldErrors } from '@/components/commerce/schemas';
import { defaultCountry } from '@/components/commerce/countries';

export type BookAddress = AddressDraft & { id: string; isDefault: boolean };

function AddressEditor({
  initial,
  onCancel,
  onSaved,
  id,
  allowDefault,
}: {
  initial: BookAddress | null;
  onCancel: () => void;
  onSaved: (a: BookAddress) => void;
  id: string;
  allowDefault: boolean;
}) {
  const [value, setValue] = useState<AddressDraft>(initial ?? emptyAddress(defaultCountry()));
  const [makeDefault, setMakeDefault] = useState(!!initial?.isDefault);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = addressSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${id} [aria-invalid="true"]`)?.focus());
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(initial ? `/api/account/addresses/${initial.id}` : '/api/account/addresses', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, ...(makeDefault ? { isDefault: true } : {}) }),
      });
      const json = (await res.json().catch(() => ({}))) as { address?: BookAddress & { line2: string | null; label: string | null }; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.address) {
        setErrors(json.fieldErrors ?? {});
        setError(json.error ?? 'We couldn’t save this address.');
        return;
      }
      onSaved({ ...json.address, line2: json.address.line2 ?? '', label: json.address.label ?? '' });
    } catch {
      setError('We couldn’t reach our servers. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form id={id} onSubmit={submit} noValidate className="border border-ink/80 bg-white p-5 sm:p-7">
      <p className="mb-6 font-serif text-2xl">{initial ? 'Edit address' : 'New address'}</p>
      <AddressFields
        idPrefix={id}
        value={value}
        onChange={(f, v) => {
          setValue((a) => ({ ...a, [f]: v }));
          setErrors((x) => ({ ...x, [f]: '' }));
        }}
        errors={errors}
        withContact
        withLabel
      />
      {allowDefault && (
        <label className="mt-6 flex cursor-pointer items-center gap-3 text-[13.5px] text-charcoal">
          <input type="checkbox" checked={makeDefault} disabled={!!initial?.isDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-4 w-4 accent-ink" />
          Use as my default shipping address
        </label>
      )}
      {error && (
        <p role="alert" className="mt-5 flex items-start gap-2 text-[13px] text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden /> {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        <Button type="submit" loading={busy}>
          {initial ? 'Save changes' : 'Save address'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Address book: add, edit, delete and choose a default (all calls are scoped to the signed-in user). */
export function AddressBook({ initial }: { initial: BookAddress[] }) {
  const router = useRouter();
  const toast = useUI((s) => s.toast);
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | 'new' | null>(initial.length ? null : 'new');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sort = (list: BookAddress[]) => [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  const saved = (a: BookAddress) => {
    setItems((list) => {
      const others = list.filter((x) => x.id !== a.id).map((x) => (a.isDefault ? { ...x, isDefault: false } : x));
      return sort([...others, a]);
    });
    setEditing(null);
    toast({ title: 'Address saved' });
    router.refresh();
  };

  const setDefault = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) });
      if (!res.ok) throw new Error();
      setItems((list) => sort(list.map((x) => ({ ...x, isDefault: x.id === id }))));
      toast({ title: 'Default address updated' });
    } catch {
      toast({ title: 'We couldn’t update your default address', description: 'Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems((list) => {
        const wasDefault = list.find((x) => x.id === id)?.isDefault;
        const rest = list.filter((x) => x.id !== id);
        if (wasDefault && rest.length) {
          // Mirrors the server: the oldest remaining address becomes the default.
          router.refresh();
        }
        return rest;
      });
      setConfirming(null);
      toast({ title: 'Address removed' });
    } catch {
      toast({ title: 'We couldn’t remove that address', description: 'Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-light">Addresses</h2>
          <p className="mt-1 text-sm text-taupe">Saved addresses appear at checkout for one-tap delivery.</p>
        </div>
        {editing !== 'new' && (
          <Button variant="outline" size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Add address
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {editing === 'new' && (
          <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8">
            <AddressEditor id="address-new" initial={null} allowDefault={items.length > 0} onCancel={() => setEditing(null)} onSaved={saved} />
          </m.div>
        )}
      </AnimatePresence>

      {items.length === 0 && editing !== 'new' ? (
        <div className="flex flex-col items-center border border-line px-6 py-14 text-center">
          <MapPin className="h-8 w-8 text-gold" strokeWidth={1} aria-hidden />
          <p className="mt-4 font-serif text-2xl">No saved addresses</p>
          <p className="mt-2 text-sm text-taupe">Add one now, or tick “save this address” at checkout.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((a) =>
            editing === a.id ? (
              <li key={a.id} className="md:col-span-2">
                <AddressEditor id={`address-${a.id}`} initial={a} allowDefault onCancel={() => setEditing(null)} onSaved={saved} />
              </li>
            ) : (
              <li key={a.id} className={a.isDefault ? 'flex flex-col border border-ink/70 p-5 sm:p-6' : 'flex flex-col border border-line p-5 sm:p-6'}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal">{a.label || 'Address'}</p>
                  {a.isDefault && <span className="border border-gold/40 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.16em] text-gold-deep">Default</span>}
                </div>
                <AddressBlock address={a} />
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-[11px] uppercase tracking-[0.14em]">
                  <button type="button" onClick={() => setEditing(a.id)} className="text-ink underline-offset-4 hover:underline">
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button type="button" onClick={() => setDefault(a.id)} disabled={busyId === a.id} className="text-taupe underline-offset-4 hover:text-ink hover:underline disabled:opacity-50">
                      Set as default
                    </button>
                  )}
                  {confirming === a.id ? (
                    <span className="flex items-center gap-3" role="group" aria-label="Confirm removal">
                      <span className="normal-case tracking-normal text-[12.5px] text-charcoal">Remove this address?</span>
                      <button type="button" onClick={() => remove(a.id)} disabled={busyId === a.id} className="text-danger underline-offset-4 hover:underline">
                        Remove
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="text-taupe hover:text-ink">
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirming(a.id)} className="text-taupe underline-offset-4 hover:text-danger hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
