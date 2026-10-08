'use client';
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { bulkAdjustStock, updateVariantStock } from '@/lib/server/admin/actions/inventory';
import { cn } from '@/lib/utils';
import { formatMoney, formatNumber } from '../format';
import { ConfirmDialog } from '../forms';
import { toast } from '../toast';
import { ActiveBadge, Badge, TableWrap, selectChevron, selectSm, table } from '../ui';

export type InventoryRow = {
  id: string;
  sku: string;
  purity: string;
  metal: string;
  price: number;
  stock: number;
  isActive: boolean;
  productId: string;
  productName: string;
  productSku: string;
  productActive: boolean;
  categoryName: string;
};

const MAX_STOCK = 100_000;
const failed = { ok: false as const, message: 'Something went wrong. Please try again.' };

/** Inline stock editor: Save enables only when the value changed; Enter saves, Escape reverts. */
function StockCell({ id, sku, stock }: { id: string; sku: string; stock: number }) {
  const [value, setValue] = useState(String(stock));
  const [pending, start] = useTransition();
  useEffect(() => setValue(String(stock)), [stock]);

  const n = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= MAX_STOCK;
  const dirty = valid && n !== stock;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending) return;
    start(async () => {
      const res = await updateVariantStock(id, n).catch(() => failed);
      toast.result(res);
      if (!res.ok) setValue(String(stock));
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center justify-end gap-1.5">
      <label htmlFor={`stock-${id}`} className="sr-only">
        Stock for {sku}
      </label>
      <input
        id={`stock-${id}`}
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_STOCK}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setValue(String(stock));
        }}
        aria-invalid={!valid || undefined}
        className={cn('field h-8 w-20 px-2 text-right text-[15px] tabular-nums', !valid && 'border-danger', dirty && 'border-gold')}
      />
      <button
        type="submit"
        disabled={!dirty || pending}
        aria-label={`Save stock for ${sku}`}
        title={dirty ? 'Save (Enter)' : 'Change the number to save'}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center border transition-colors',
          dirty ? 'border-ink bg-ink text-ivory hover:bg-charcoal' : 'border-line bg-white text-stone',
          'disabled:cursor-not-allowed',
        )}
      >
        {pending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" aria-hidden /> : <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
      </button>
    </form>
  );
}

function BulkBar({ ids, onDone, onClear }: { ids: string[]; onDone: () => void; onClear: () => void }) {
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [amount, setAmount] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();

  const n = Number(amount);
  const valid = amount.trim() !== '' && Number.isInteger(n) && (mode === 'add' ? n >= 1 && n <= 10_000 : n >= 0 && n <= MAX_STOCK);
  const count = ids.length;

  const run = () =>
    start(async () => {
      const res = await bulkAdjustStock(ids, mode, n).catch(() => failed);
      toast.result(res);
      setConfirmOpen(false);
      if (res.ok) {
        setAmount('');
        onDone();
      }
    });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid || !count || pending) return;
    if (mode === 'set') setConfirmOpen(true);
    else run();
  };

  return (
    <div className={cn('mb-3 flex min-h-[52px] flex-wrap items-center gap-3 border px-4 py-2 text-[15px] transition-colors', count ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-taupe')} aria-live="polite">
      {count === 0 ? (
        <p className="text-xs">Select variants with the checkboxes to add or set stock in bulk (up to 200 at a time).</p>
      ) : (
        <>
          <p className="font-medium">
            {formatNumber(count)} selected
            <button type="button" onClick={onClear} className="ml-3 text-xs font-normal text-ivory/70 underline-offset-4 hover:text-ivory hover:underline">
              Clear
            </button>
          </p>
          <form onSubmit={onSubmit} className="ml-auto flex flex-wrap items-center gap-2">
            <label htmlFor="bulk-mode" className="sr-only">
              Bulk action
            </label>
            <select
              id="bulk-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'add' | 'set')}
              className={cn(selectSm, 'h-8 w-36 border-ivory/30 bg-ink text-ivory focus:border-ivory')}
              style={{ ...selectChevron, backgroundImage: selectChevron.backgroundImage.replace('%23141311', '%23FBF9F5') }}
            >
              <option value="add">Add stock (+N)</option>
              <option value="set">Set stock to N</option>
            </select>
            <label htmlFor="bulk-amount" className="sr-only">
              {mode === 'add' ? 'Units to add' : 'New stock level'}
            </label>
            <input
              id="bulk-amount"
              type="number"
              inputMode="numeric"
              min={mode === 'add' ? 1 : 0}
              max={mode === 'add' ? 10_000 : MAX_STOCK}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === 'add' ? '+N' : 'N'}
              aria-invalid={amount !== '' && !valid ? true : undefined}
              className="field h-8 w-24 border-ivory/30 bg-ink px-2 text-right text-[15px] text-ivory placeholder:text-ivory/40 focus:border-ivory"
            />
            <button
              type="submit"
              disabled={!valid || pending}
              className="inline-flex h-8 items-center gap-2 border border-ivory bg-ivory px-4 text-[12.5px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-transparent hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />}
              Apply to {formatNumber(count)}
            </button>
          </form>
        </>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => !pending && setConfirmOpen(false)}
        onConfirm={run}
        pending={pending}
        tone="default"
        title={`Set ${formatNumber(count)} variant${count === 1 ? '' : 's'} to ${valid ? formatNumber(n) : '—'}?`}
        description={
          n === 0
            ? 'They will show as out of stock in the store immediately.'
            : 'The current stock levels of the selected variants will be replaced, not added to.'
        }
        confirmLabel="Set stock"
      />
    </div>
  );
}

export function InventoryGrid({ rows, threshold }: { rows: InventoryRow[]; threshold: number }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const headerBox = useRef<HTMLInputElement>(null);
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);

  // Drop selections that are no longer on the page (after paging / filtering / revalidation).
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set(rowIds.filter((id) => prev.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rowIds]);

  const allSelected = rows.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <BulkBar ids={[...selected]} onDone={() => setSelected(new Set())} onClear={() => setSelected(new Set())} />
      <TableWrap>
        <table className={cn(table.base, 'min-w-[1080px]')}>
          <thead className={table.head}>
            <tr>
              <th className={cn(table.th, 'w-10 pr-0')}>
                <input
                  ref={headerBox}
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(rowIds))}
                  aria-label="Select all variants on this page"
                  className="h-4 w-4 cursor-pointer accent-ink align-middle"
                />
              </th>
              <th className={table.th}>Product</th>
              <th className={table.th}>Variant SKU</th>
              <th className={table.th}>Purity</th>
              <th className={table.th}>Metal</th>
              <th className={table.thRight}>Price</th>
              <th className={table.thRight}>Stock</th>
              <th className={table.th}>Level</th>
              <th className={table.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const out = r.stock <= 0;
              const low = !out && r.stock <= threshold;
              const isSelected = selected.has(r.id);
              return (
                <tr key={r.id} className={cn(table.row, out && 'bg-danger/[0.035]', low && 'bg-[#FBF3E1]/50', isSelected && 'bg-gold-pale/50 hover:bg-gold-pale/60')}>
                  <td className={cn(table.td, 'w-10 pr-0')}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(r.id)}
                      aria-label={`Select ${r.sku}`}
                      className="h-4 w-4 cursor-pointer accent-ink align-middle"
                    />
                  </td>
                  <td className={table.td}>
                    <Link href={`/admin/products/${r.productId}`} className="block max-w-[280px] truncate underline-offset-4 hover:underline">
                      {r.productName}
                    </Link>
                    <p className="text-[13.5px] text-taupe">
                      {r.categoryName} · <span className="font-mono">{r.productSku}</span>
                    </p>
                  </td>
                  <td className={cn(table.td, 'whitespace-nowrap font-mono text-[14px]')}>{r.sku}</td>
                  <td className={table.td}>{r.purity}</td>
                  <td className={cn(table.td, 'whitespace-nowrap')}>{r.metal}</td>
                  <td className={cn(table.tdRight, 'whitespace-nowrap')}>{formatMoney(r.price)}</td>
                  <td className={cn(table.tdRight, 'py-2')}>
                    <StockCell id={r.id} sku={r.sku} stock={r.stock} />
                  </td>
                  <td className={table.td}>
                    {out ? (
                      <Badge tone="danger" dot>
                        Out of stock
                      </Badge>
                    ) : low ? (
                      <Badge tone="warning" dot>
                        Low
                      </Badge>
                    ) : (
                      <Badge tone="success" dot>
                        In stock
                      </Badge>
                    )}
                  </td>
                  <td className={table.td}>
                    {!r.productActive ? (
                      <Badge tone="neutral" title="The product is hidden, so this variant is not sold">
                        Product hidden
                      </Badge>
                    ) : (
                      <ActiveBadge active={r.isActive} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
