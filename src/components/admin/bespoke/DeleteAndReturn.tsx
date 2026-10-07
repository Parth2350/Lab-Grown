'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import type { BoundAction } from '@/lib/server/admin/types';
import { cn } from '@/lib/utils';
import { ActionButton } from '../forms';

/**
 * Destructive button for detail views: confirms, runs the bound delete action, toasts the result
 * and — on success — navigates back to the list (the record's own page no longer exists).
 */
export function DeleteAndReturn({
  action,
  href,
  title,
  description,
  confirmLabel = 'Delete',
  children = 'Delete',
  variant = 'outline',
  className,
}: {
  action: BoundAction;
  href: string;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  children?: ReactNode;
  variant?: 'outline' | 'icon' | 'text';
  className?: string;
}) {
  const router = useRouter();
  return (
    <ActionButton
      action={action}
      variant={variant}
      title={variant === 'icon' ? title : undefined}
      icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
      className={cn(variant === 'outline' && 'border-danger/50 text-danger hover:border-danger hover:bg-danger hover:text-white', variant === 'text' && 'text-danger hover:text-danger', className)}
      confirm={{ title, description, confirmLabel }}
      onDone={(res) => {
        if (res.ok) router.replace(href);
      }}
    >
      {variant === 'icon' ? null : children}
    </ActionButton>
  );
}
