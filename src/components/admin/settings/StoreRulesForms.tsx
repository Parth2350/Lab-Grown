'use client';
import { useState } from 'react';
import Link from 'next/link';
import { saveInventorySettings, saveReturnsSettings, saveTaxSettings } from '@/lib/server/admin/actions/settings';
import type { FormState } from '@/lib/server/admin/types';
import { formatMoney } from '../format';
import { FieldMsg, SubmitButton, useAdminForm } from '../forms';
import { Panel } from '../ui';
import { Counter, PanelFooter, settingsLabel } from './shared';

const errorFlag = (state: FormState, name: string) => (state && !state.ok && state.fieldErrors?.[name] ? true : undefined);

/** Fraction (0.0725) → percent string for the input ("7.25"), without float noise. */
function toPercentInput(rate: number) {
  return String(Math.round(rate * 100_000) / 1000);
}

export function TaxForm({ taxRate, taxLabel }: { taxRate: number; taxLabel: string }) {
  const form = useAdminForm(saveTaxSettings);
  const [pct, setPct] = useState(toPercentInput(taxRate));
  const [label, setLabel] = useState(taxLabel);
  const n = Number(pct.replace(/[%\s]/g, ''));
  const valid = pct.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 30;

  return (
    <form onSubmit={form.onSubmit} noValidate className="h-full">
      <Panel
        id="tax"
        className="flex h-full flex-col"
        bodyClassName="flex-1"
        title="Tax"
        footer={
          <PanelFooter>
            <SubmitButton pending={form.pending} pendingLabel="Saving…">
              Save tax
            </SubmitButton>
          </PanelFooter>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="tax-rate" className={settingsLabel}>
              Tax rate (%)
            </label>
            <div className="relative">
              <input
                id="tax-rate"
                name="taxRatePercent"
                inputMode="decimal"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                aria-invalid={errorFlag(form.state, 'taxRatePercent')}
                aria-describedby="tax-rate-hint"
                className="field py-2.5 pr-9 tabular-nums"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-taupe" aria-hidden>
                %
              </span>
            </div>
            <FieldMsg state={form.state} name="taxRatePercent" />
            <p id="tax-rate-hint" className="mt-1.5 text-[13px] text-taupe">
              0–30%, up to 3 decimals. Applied to the subtotal after discounts.
              {valid && (
                <>
                  {' '}
                  On a {formatMoney(100_000)} order: {formatMoney(Math.round(n * 1000), { exact: true })}.
                </>
              )}
            </p>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="tax-label" className={settingsLabel}>
                Label
              </label>
              <Counter value={label.length} max={40} />
            </div>
            <input
              id="tax-label"
              name="taxLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
              aria-invalid={errorFlag(form.state, 'taxLabel')}
              aria-describedby="tax-label-hint"
              className="field py-2.5"
            />
            <FieldMsg state={form.state} name="taxLabel" />
            <p id="tax-label-hint" className="mt-1.5 text-[13px] text-taupe">
              Shown in the cart and at checkout, e.g. “Estimated taxes” or “GST”.
            </p>
          </div>
        </div>
      </Panel>
    </form>
  );
}

export function ReturnsForm({ returnsDays }: { returnsDays: number }) {
  const form = useAdminForm(saveReturnsSettings);
  return (
    <form onSubmit={form.onSubmit} noValidate className="h-full">
      <Panel
        id="returns"
        className="flex h-full flex-col"
        bodyClassName="flex-1"
        title="Returns window"
        footer={
          <PanelFooter>
            <SubmitButton pending={form.pending} pendingLabel="Saving…">
              Save returns
            </SubmitButton>
          </PanelFooter>
        }
      >
        <label htmlFor="returns-days" className={settingsLabel}>
          Days after delivery
        </label>
        <div className="relative">
          <input
            id="returns-days"
            name="returnsDays"
            type="number"
            inputMode="numeric"
            min={0}
            max={365}
            step={1}
            defaultValue={returnsDays}
            aria-invalid={errorFlag(form.state, 'returnsDays')}
            aria-describedby="returns-days-hint"
            className="field py-2.5 pr-14 tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-taupe" aria-hidden>
            days
          </span>
        </div>
        <FieldMsg state={form.state} name="returnsDays" />
        <p id="returns-days-hint" className="mt-1.5 text-[13px] text-taupe">
          0–365. Shown on product pages, the cart and checkout, and decides which delivered orders customers can still return.
        </p>
      </Panel>
    </form>
  );
}

export function InventoryForm({ lowStockThreshold }: { lowStockThreshold: number }) {
  const form = useAdminForm(saveInventorySettings);
  return (
    <form onSubmit={form.onSubmit} noValidate className="h-full">
      <Panel
        id="inventory"
        className="flex h-full flex-col"
        bodyClassName="flex-1"
        title="Inventory"
        footer={
          <PanelFooter>
            <SubmitButton pending={form.pending} pendingLabel="Saving…">
              Save inventory
            </SubmitButton>
          </PanelFooter>
        }
      >
        <label htmlFor="low-stock" className={settingsLabel}>
          Low-stock threshold
        </label>
        <div className="relative">
          <input
            id="low-stock"
            name="lowStockThreshold"
            type="number"
            inputMode="numeric"
            min={0}
            max={1000}
            step={1}
            defaultValue={lowStockThreshold}
            aria-invalid={errorFlag(form.state, 'lowStockThreshold')}
            aria-describedby="low-stock-hint"
            className="field py-2.5 pr-14 tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-taupe" aria-hidden>
            units
          </span>
        </div>
        <FieldMsg state={form.state} name="lowStockThreshold" />
        <p id="low-stock-hint" className="mt-1.5 text-[13px] text-taupe">
          0–1000. Variants at or below this stock level count toward the dashboard’s Low-stock KPI and the{' '}
          <Link href="/admin/inventory" className="underline underline-offset-4 hover:text-ink">
            Inventory
          </Link>{' '}
          low-stock filter.
        </p>
      </Panel>
    </form>
  );
}
