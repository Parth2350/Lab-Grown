import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Small-caps form label used across the settings panels. */
export const settingsLabel = 'mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal';

/** Square icon button for list editors (move / remove). */
export function IconButton({
  label,
  onClick,
  disabled,
  children,
  tone = 'default',
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  tone?: 'default' | 'danger';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-8 shrink-0 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white disabled:pointer-events-none disabled:opacity-30',
        tone === 'danger' ? 'hover:text-danger' : 'hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** "12/120" style counter that warns near the limit. */
export function Counter({ value, max, id, className }: { value: number; max: number; id?: string; className?: string }) {
  return (
    <span id={id} className={cn('text-[11px] tabular-nums', value > max ? 'text-danger' : value >= max * 0.9 ? 'text-[#7A5718]' : 'text-taupe', className)}>
      {value}/{max}
    </span>
  );
}

/** Footer row for a settings panel: helper text on the left, actions on the right. */
export function PanelFooter({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 text-xs text-taupe">{note}</div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
