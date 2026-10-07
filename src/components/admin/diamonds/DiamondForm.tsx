'use client';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { ButtonLink } from '@/components/ui/Button';
import { CERT_LABS, DIAMOND_CLARITIES, DIAMOND_COLORS, DIAMOND_CUTS, SHAPES } from '@/lib/catalog';
import { saveDiamond } from '@/lib/server/admin/actions/diamonds';
import type { FormState } from '@/lib/server/admin/types';
import { centsToInput, toDateInput } from '../format';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { Panel, selectChevron } from '../ui';
import { CARAT_LIMITS, FINISH_GRADES, FLUORESCENCE, GROWTH_METHODS } from './options';

export type DiamondFormValues = {
  id?: string;
  sku: string;
  shape: string;
  carat: number | null;
  color: string;
  clarity: string;
  cut: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
  measurements: string | null;
  tablePct: number | null;
  depthPct: number | null;
  ratio: number | null;
  growth: string;
  /** cents */
  price: number | null;
  isAvailable: boolean;
  certLab: string;
  certNumber: string;
  certUrl: string;
  certIssuedAt: string | null;
};

const lbl = 'mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal';
const hint = 'mt-1 text-xs text-taupe';

function Field({ id, label, required, state, name, children, help }: { id: string; label: string; required?: boolean; state: FormState; name: string; children: ReactNode; help?: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={lbl}>
        {label}
        {required && <span className="ml-0.5 text-gold">*</span>}
      </label>
      {children}
      {help && <p className={hint}>{help}</p>}
      <FieldMsg state={state} name={name} />
    </div>
  );
}

function Select({
  id,
  name,
  defaultValue,
  value,
  onChange,
  options,
  invalid,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
  invalid?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      {...(value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value) } : { defaultValue })}
      aria-invalid={invalid}
      className="field cursor-pointer appearance-none py-2.5 pr-8"
      style={selectChevron}
    >
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function DiamondForm({ diamond, mode, duplicateOf }: { diamond: DiamondFormValues; mode: 'create' | 'edit'; duplicateOf?: string }) {
  const router = useRouter();
  const { state, pending, onSubmit } = useAdminForm<{ id: string }>(saveDiamond, {
    onSuccess: (res) => {
      if (mode === 'create' && res.ok && res.data?.id) router.push(`/admin/diamonds/${res.data.id}`);
    },
  });
  const [shape, setShape] = useState(diamond.shape);
  const err = (n: string) => (state && !state.ok && state.fieldErrors?.[n] ? true : undefined);
  const shapeLabel = SHAPES.find((s) => s.slug === shape)?.label ?? shape;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {diamond.id && <input type="hidden" name="id" value={diamond.id} />}
      {duplicateOf && (
        <p className="border border-gold/30 bg-gold-pale px-4 py-2.5 text-[13px] text-gold-deep">
          Duplicating <span className="font-medium">{duplicateOf}</span> — grading is copied; enter a new SKU and certificate number.
        </p>
      )}
      <FormBanner state={state && !state.ok ? state : null} />

      <Panel title="Stone" bodyClassName="grid gap-5 p-5 sm:grid-cols-2">
        <Field id="d-sku" label="SKU" required state={state} name="sku" help="Unique. Letters, numbers and hyphens — saved in upper case.">
          <input
            id="d-sku"
            name="sku"
            defaultValue={diamond.sku}
            required
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={err('sku')}
            onBlur={(e) => (e.currentTarget.value = e.currentTarget.value.trim().toUpperCase())}
            className="field py-2.5 font-mono uppercase tracking-wider"
            placeholder="LGD-00001"
            data-autofocus
          />
        </Field>
        <Field id="d-shape" label="Shape" required state={state} name="shape">
          <div className="flex items-center gap-3">
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center border border-line bg-ivory text-charcoal" title={shapeLabel}>
              <ShapeIcon shape={shape} size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <Select id="d-shape" name="shape" value={shape} onChange={setShape} options={SHAPES.map((s) => ({ value: s.slug, label: s.label }))} invalid={err('shape')} />
            </div>
          </div>
        </Field>
        <Field id="d-carat" label="Carat" required state={state} name="carat" help={`${CARAT_LIMITS.min}–${CARAT_LIMITS.max} ct`}>
          <input
            id="d-carat"
            name="carat"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={CARAT_LIMITS.min}
            max={CARAT_LIMITS.max}
            defaultValue={diamond.carat ?? ''}
            aria-invalid={err('carat')}
            className="field py-2.5"
            placeholder="1.05"
          />
        </Field>
        <Field id="d-growth" label="Growth method" required state={state} name="growth">
          <Select id="d-growth" name="growth" defaultValue={diamond.growth} options={GROWTH_METHODS} invalid={err('growth')} />
        </Field>
      </Panel>

      <Panel title="Grading" bodyClassName="grid gap-5 p-5 sm:grid-cols-3">
        <Field id="d-color" label="Colour" required state={state} name="color">
          <Select id="d-color" name="color" defaultValue={diamond.color} options={DIAMOND_COLORS} invalid={err('color')} />
        </Field>
        <Field id="d-clarity" label="Clarity" required state={state} name="clarity">
          <Select id="d-clarity" name="clarity" defaultValue={diamond.clarity} options={DIAMOND_CLARITIES} invalid={err('clarity')} />
        </Field>
        <Field id="d-cut" label="Cut" required state={state} name="cut">
          <Select id="d-cut" name="cut" defaultValue={diamond.cut} options={DIAMOND_CUTS} invalid={err('cut')} />
        </Field>
        <Field id="d-polish" label="Polish" required state={state} name="polish">
          <Select id="d-polish" name="polish" defaultValue={diamond.polish} options={FINISH_GRADES} invalid={err('polish')} />
        </Field>
        <Field id="d-symmetry" label="Symmetry" required state={state} name="symmetry">
          <Select id="d-symmetry" name="symmetry" defaultValue={diamond.symmetry} options={FINISH_GRADES} invalid={err('symmetry')} />
        </Field>
        <Field id="d-fluor" label="Fluorescence" required state={state} name="fluorescence">
          <Select id="d-fluor" name="fluorescence" defaultValue={diamond.fluorescence} options={FLUORESCENCE} invalid={err('fluorescence')} />
        </Field>
      </Panel>

      <Panel title="Proportions" description="Optional — shown on the diamond’s detail sheet." bodyClassName="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Field id="d-meas" label="Measurements" state={state} name="measurements">
            <input id="d-meas" name="measurements" defaultValue={diamond.measurements ?? ''} maxLength={80} aria-invalid={err('measurements')} className="field py-2.5" placeholder="6.45 × 6.47 × 3.98 mm" />
          </Field>
        </div>
        <Field id="d-table" label="Table %" state={state} name="tablePct">
          <input id="d-table" name="tablePct" type="number" inputMode="decimal" step="0.1" min={40} max={90} defaultValue={diamond.tablePct ?? ''} aria-invalid={err('tablePct')} className="field py-2.5" placeholder="57.5" />
        </Field>
        <Field id="d-depth" label="Depth %" state={state} name="depthPct">
          <input id="d-depth" name="depthPct" type="number" inputMode="decimal" step="0.1" min={40} max={90} defaultValue={diamond.depthPct ?? ''} aria-invalid={err('depthPct')} className="field py-2.5" placeholder="61.8" />
        </Field>
        <Field id="d-ratio" label="L/W ratio" state={state} name="ratio">
          <input id="d-ratio" name="ratio" type="number" inputMode="decimal" step="0.01" min={0.8} max={3} defaultValue={diamond.ratio ?? ''} aria-invalid={err('ratio')} className="field py-2.5" placeholder="1.00" />
        </Field>
      </Panel>

      <Panel title="Certificate" description="Leave the number blank to remove the certificate from this stone." bodyClassName="grid gap-5 p-5 sm:grid-cols-2">
        <Field id="d-lab" label="Grading lab" required state={state} name="certLab">
          <Select id="d-lab" name="certLab" defaultValue={diamond.certLab} options={CERT_LABS} invalid={err('certLab')} />
        </Field>
        <Field id="d-certno" label="Certificate number" state={state} name="certNumber" help="Must be unique across inventory.">
          <input
            id="d-certno"
            name="certNumber"
            defaultValue={diamond.certNumber}
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={err('certNumber')}
            className="field py-2.5 font-mono uppercase"
            placeholder="LG612345678"
          />
        </Field>
        <Field id="d-certurl" label="Report link" state={state} name="certUrl" help="Optional https:// link to the lab’s online report.">
          <input id="d-certurl" name="certUrl" type="url" inputMode="url" defaultValue={diamond.certUrl} maxLength={500} autoComplete="off" aria-invalid={err('certUrl')} className="field py-2.5" placeholder="https://www.igi.org/verify-your-report/?r=…" />
        </Field>
        <Field id="d-certdate" label="Issued" state={state} name="certIssuedAt">
          <input id="d-certdate" name="certIssuedAt" type="date" defaultValue={toDateInput(diamond.certIssuedAt)} aria-invalid={err('certIssuedAt')} className="field py-2" />
        </Field>
      </Panel>

      <Panel title="Pricing & availability" bodyClassName="grid items-start gap-5 p-5 sm:grid-cols-2">
        <Field id="d-price" label="Price ($)" required state={state} name="price" help="Loose stone price. Ring prices add the setting.">
          <input id="d-price" name="price" inputMode="decimal" defaultValue={centsToInput(diamond.price)} aria-invalid={err('price')} className="field py-2.5" placeholder="1450" />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 border border-line bg-ivory/60 px-4 py-3 text-[13px] sm:mt-6">
          <input type="checkbox" name="isAvailable" defaultChecked={diamond.isAvailable} className="mt-0.5 h-4 w-4 accent-ink" />
          <span>
            <span className="font-medium text-ink">Available for sale</span>
            <span className="mt-0.5 block text-xs text-taupe">Offered in the diamond picker of every {shapeLabel.toLowerCase()} setting whose carat range fits. “From” prices update automatically.</span>
          </span>
        </label>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ivory/95 px-1 py-3 backdrop-blur">
        <ButtonLink href="/admin/diamonds" size="sm" variant="ghost">
          Cancel
        </ButtonLink>
        <SubmitButton pending={pending} pendingLabel="Saving…">
          {mode === 'edit' ? 'Save changes' : 'Add diamond'}
        </SubmitButton>
      </div>
    </form>
  );
}
