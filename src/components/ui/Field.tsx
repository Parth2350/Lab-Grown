import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Label({ children, htmlFor, required }: { children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal">
      {children}
      {required && <span className="ml-0.5 text-gold">*</span>}
    </label>
  );
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-danger" role="alert">
      {children}
    </p>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn('field', className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn('field min-h-[120px] resize-y', className)} {...p} />;
});

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23141311' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, style, ...p }, ref) {
  return (
    <select
      ref={ref}
      className={cn('field cursor-pointer appearance-none pr-10', className)}
      style={{ backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '12px', ...style }}
      {...p}
    >
      {children}
    </select>
  );
});

type FieldProps = {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

/** Label + input + hint/error in one */
export function Field({ label, name, required, error, hint, className, children, id, ...input }: FieldProps) {
  const fid = id ?? name;
  const describedBy = error ? `${fid}-error` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={fid} required={required}>
        {label}
      </Label>
      {children ?? <Input id={fid} name={name} required={required} aria-invalid={!!error} aria-describedby={describedBy} {...input} />}
      {hint && !error && (
        <p id={`${fid}-hint`} className="mt-1.5 text-xs text-taupe">
          {hint}
        </p>
      )}
      <FieldError id={`${fid}-error`}>{error}</FieldError>
    </div>
  );
}
