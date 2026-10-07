'use client';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Input, Label } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /** Replace the default <Input> (e.g. a <Select>); it should use `id` and the provided describedBy. */
  children?: (a11y: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
  trailing?: ReactNode;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'id'>;

/** Label + control + hint/error, with the error programmatically linked for screen readers. */
export const FormField = forwardRef<HTMLInputElement, Props>(function FormField({ id, label, error, hint, required, className, children, trailing, inputClassName, ...input }, ref) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const a11y = { id, 'aria-invalid': !!error, ...(describedBy ? { 'aria-describedby': describedBy } : {}) };
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        {children ? children(a11y) : <Input ref={ref} required={required} {...a11y} {...input} className={cn('aria-[invalid=true]:border-danger/70', trailing && 'pr-12', inputClassName)} />}
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-taupe">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
