import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Zero-JS accessible accordion built on <details>. */
export function AccordionItem({
  title,
  children,
  defaultOpen,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details className={cn('group border-b border-line', className)} open={defaultOpen}>
      <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-left">
        <span className="label-caps text-ink">{title}</span>
        <Plus className="h-4 w-4 shrink-0 text-ink/70 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.25} />
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-charcoal/90">{children}</div>
    </details>
  );
}
