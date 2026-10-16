import { cn } from '@/lib/utils';

/** small caps label used above every product option ("METAL Yellow Gold") */
export const optionLabel = 'text-xs font-semibold uppercase tracking-wide text-taupe';

/** square-ish choice button (purity, shape, carat, quality) */
export const optionBtn = (on: boolean) =>
  cn(
    'flex min-w-[2.75rem] flex-col items-center justify-center overflow-hidden rounded-md border-2 px-2.5 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-40',
    on ? 'border-ink text-ink' : 'border-line text-taupe enabled:hover:border-gold',
  );

export function OptionGroup({ label, value, className, children }: { label: string; value?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <fieldset className={cn('mt-6 min-w-0', className)}>
      <legend className={cn(optionLabel, 'mb-2')}>
        {label}
        {value && <span className="ml-1.5 font-normal normal-case tracking-normal text-ink">{value}</span>}
      </legend>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </fieldset>
  );
}
