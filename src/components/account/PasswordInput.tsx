'use client';
import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { FormField } from '@/components/commerce/FormField';

type Props = { id: string; label: string; error?: string; hint?: string; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'children'>;

export function PasswordInput({ id, label, error, hint, className, ...input }: Props) {
  const [show, setShow] = useState(false);
  return (
    <FormField
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      type={show ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      maxLength={72}
      {...input}
      trailing={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="flex h-9 w-9 items-center justify-center text-taupe transition-colors hover:text-ink"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          aria-controls={id}
        >
          {show ? <EyeOff className="h-4 w-4" strokeWidth={1.25} /> : <Eye className="h-4 w-4" strokeWidth={1.25} />}
        </button>
      }
    />
  );
}
