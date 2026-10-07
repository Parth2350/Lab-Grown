'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ProductDraft } from './shared';

/** Partial update (or updater) applied to the draft; the editor re-normalises after every change. */
export type DraftUpdate = (patch: Partial<ProductDraft> | ((d: ProductDraft) => Partial<ProductDraft>)) => void;
export type FieldErrors = Record<string, string>;
export type SectionProps = { draft: ProductDraft; update: DraftUpdate; errors: FieldErrors };

export const labelCls = 'mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal';
export const inputCls = 'field py-2.5 text-[13px]';
export const selectCls = 'field cursor-pointer appearance-none py-2.5 pl-4 pr-9 text-[13px]';
export const chevronStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23141311' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '11px',
} as const;

export function EditorSection({ id, title, description, actions, children, className }: { id: string; title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-32 border border-line bg-white xl:scroll-mt-20', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-ink">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-taupe">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function FieldLabel({ htmlFor, children, required, aside }: { htmlFor?: string; children: ReactNode; required?: boolean; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className={labelCls}>
        {children}
        {required && <span className="ml-0.5 text-gold">*</span>}
      </label>
      {aside}
    </div>
  );
}

export function ErrorText({ msg, id }: { msg?: string; id?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1 text-xs text-danger" role="alert">
      {msg}
    </p>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-1 text-xs text-taupe', className)}>{children}</p>;
}

/** Labelled on/off switch (button role="switch"). */
export function Switch({ checked, onChange, label, description, id, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; id: string; disabled?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[18px] w-8 shrink-0 items-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-ink bg-ink' : 'border-stone bg-white',
        )}
      >
        <span className="sr-only">{label}</span>
        <span className={cn('absolute h-3 w-3 transition-all', checked ? 'left-[16px] bg-ivory' : 'left-[2px] bg-stone')} />
      </button>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[13px] text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-xs text-taupe">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/** Group of toggle chips (multi-select) with a fieldset legend. */
export function ChipGroup({ legend, required, children, error, hint, aside }: { legend: string; required?: boolean; children: ReactNode; error?: string; hint?: ReactNode; aside?: ReactNode }) {
  return (
    <fieldset>
      <div className="flex items-baseline justify-between gap-2">
        <legend className={labelCls}>
          {legend}
          {required && <span className="ml-0.5 text-gold">*</span>}
        </legend>
        {aside}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
      {hint && !error && <Hint>{hint}</Hint>}
      <ErrorText msg={error} />
    </fieldset>
  );
}

export function Chip({ selected, onClick, children, swatch, disabled, title }: { selected: boolean; onClick: () => void; children: ReactNode; swatch?: string; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex h-8 items-center gap-2 border px-3 text-[12.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50',
        selected ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-charcoal hover:border-ink hover:text-ink',
      )}
    >
      {swatch && <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: swatch }} aria-hidden />}
      {children}
    </button>
  );
}

export function toggleIn<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** "$" prefixed money input wrapper */
export function MoneyInput({ id, value, onChange, invalid, describedBy, className, placeholder, label }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; describedBy?: string; className?: string; placeholder?: string; label?: string }) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[13px] text-taupe" aria-hidden>
        $
      </span>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        placeholder={placeholder}
        className="field py-2.5 pl-7 text-[13px] tabular-nums"
      />
    </div>
  );
}
