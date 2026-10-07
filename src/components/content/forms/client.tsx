'use client';
import { AlertCircle } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Input, Label, Select, Textarea } from '@/components/ui/Field';
import type { FieldErrors } from './schemas';
import { cn } from '@/lib/utils';

type Common = { label: string; name: string; error?: string; hint?: ReactNode; className?: string; required?: boolean; id?: string };

function describe(fid: string, error?: string, hint?: ReactNode) {
  return [error && `${fid}-error`, hint && !error && `${fid}-hint`].filter(Boolean).join(' ') || undefined;
}

function Messages({ fid, error, hint, extra }: { fid: string; error?: string; hint?: ReactNode; extra?: ReactNode }) {
  if (!error && !hint && !extra) return null;
  return (
    <div className="mt-1.5 flex items-start justify-between gap-4 text-xs">
      {error ? (
        <p id={`${fid}-error`} className="text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="text-taupe">
          {hint}
        </p>
      ) : (
        <span />
      )}
      {extra}
    </div>
  );
}

/** Label + input with errors/hints wired up via aria-describedby. */
export function TextField({ label, name, error, hint, className, required, id, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const fid = id ?? `f-${name}`;
  return (
    <div className={className}>
      <Label htmlFor={fid} required={required}>
        {label}
      </Label>
      <Input id={fid} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={describe(fid, error, hint)} {...rest} />
      <Messages fid={fid} error={error} hint={hint} />
    </div>
  );
}

export function TextareaField({ label, name, error, hint, className, required, id, counter, ...rest }: Common & { counter?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fid = id ?? `f-${name}`;
  const len = typeof rest.value === 'string' ? rest.value.length : 0;
  return (
    <div className={className}>
      <Label htmlFor={fid} required={required}>
        {label}
      </Label>
      <Textarea id={fid} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={describe(fid, error, hint)} {...rest} />
      <Messages
        fid={fid}
        error={error}
        hint={hint}
        extra={
          counter && rest.maxLength ? (
            <span className="ml-auto shrink-0 text-[11px] text-taupe" aria-hidden>
              {len.toLocaleString('en-US')}/{rest.maxLength.toLocaleString('en-US')}
            </span>
          ) : undefined
        }
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  required,
  id,
  placeholder,
  options,
  ...rest
}: Common & { placeholder?: string; options: readonly { value: string; label: string }[] | readonly string[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  const fid = id ?? `f-${name}`;
  return (
    <div className={className}>
      <Label htmlFor={fid} required={required}>
        {label}
      </Label>
      <Select
        id={fid}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(fid, error, hint)}
        className={rest.value ? '' : 'text-taupe'}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const v = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={v.value} value={v.value} className="text-ink">
              {v.label}
            </option>
          );
        })}
      </Select>
      <Messages fid={fid} error={error} hint={hint} />
    </div>
  );
}

export type PostResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; fieldErrors: FieldErrors };

/** JSON POST with consistent error handling for every content form. */
export async function postJson<T>(url: string, body: unknown): Promise<PostResult<T>> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data: json as T };
    return {
      ok: false,
      status: res.status,
      error:
        typeof json.error === 'string'
          ? json.error
          : res.status === 429
            ? 'You have sent several requests in a short time. Please wait a few minutes and try again.'
            : 'Something went wrong on our side. Please try again in a moment.',
      fieldErrors: normalizeFieldErrors(json.fieldErrors),
    };
  } catch {
    return { ok: false, status: 0, error: 'We could not reach our servers. Please check your connection and try again.', fieldErrors: {} };
  }
}

function normalizeFieldErrors(raw: unknown): FieldErrors {
  if (!raw || typeof raw !== 'object') return {};
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
    else if (Array.isArray(v) && typeof v[0] === 'string') out[k] = v[0];
  }
  return out;
}

/** Focus the first invalid control after a failed submit. */
export function focusFirstError(form: HTMLElement | null, errors: FieldErrors) {
  if (!form) return;
  const first = Object.keys(errors)[0];
  if (!first) return;
  const el = form.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`);
  el?.focus();
}

/** Form-level status message, announced to assistive technology. */
export function FormAlert({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div role="alert" aria-live="assertive" className={cn(children ? 'block' : 'hidden', className)}>
      {children && (
        <p className="flex items-start gap-3 border border-danger/30 bg-danger/[0.04] px-4 py-3 text-[13px] leading-relaxed text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>{children}</span>
        </p>
      )}
    </div>
  );
}

/** Honeypot input — invisible to people, tempting to bots. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export const COUNTRY_SUGGESTIONS = [
  'United States',
  'India',
  'United Kingdom',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Singapore',
  'Germany',
  'France',
  'Netherlands',
  'Switzerland',
  'Italy',
  'Spain',
  'Ireland',
  'New Zealand',
  'Saudi Arabia',
  'Qatar',
  'Hong Kong',
  'Japan',
  'South Africa',
];

export function CountryDatalist({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {COUNTRY_SUGGESTIONS.map((c) => (
        <option key={c} value={c} />
      ))}
    </datalist>
  );
}
