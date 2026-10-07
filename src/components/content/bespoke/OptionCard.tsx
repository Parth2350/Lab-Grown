'use client';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A visual radio option. Native radio inputs give arrow-key navigation, form semantics
 * and screen-reader support for free; the card is purely presentational.
 */
export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  children,
  className,
  describedBy,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
  className?: string;
  describedBy?: string;
}) {
  return (
    <label className={cn('relative block cursor-pointer', className)}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex h-full flex-col border bg-white transition-[border-color,box-shadow] duration-300 ease-luxe',
          'peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-gold',
          checked ? 'border-ink shadow-[inset_0_0_0_1px_#141311]' : 'border-line hover:border-stone',
        )}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-ivory transition-all duration-300',
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        )}
      >
        <Check className="h-3 w-3" strokeWidth={2} />
      </span>
    </label>
  );
}
