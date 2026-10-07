'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { buttonClass } from '@/components/ui/Button';
import type { ActionResult } from '@/lib/server/admin/types';
import { cn } from '@/lib/utils';
import { ActionButton } from '../forms';

type Props = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  duplicate: () => Promise<ActionResult<{ id: string }>>;
  remove: () => Promise<ActionResult<{ deleted: boolean }>>;
  /** row = compact icon buttons in a table; header = labelled buttons on the edit page */
  layout?: 'row' | 'header';
};

function dataField<K extends string>(res: ActionResult, key: K): unknown {
  return res.ok && res.data && typeof res.data === 'object' && key in res.data ? (res.data as Record<K, unknown>)[key] : undefined;
}

const iconLink = 'inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white hover:text-ink';

export function ProductActions({ id, slug, name, isActive, duplicate, remove, layout = 'row' }: Props) {
  const router = useRouter();
  const onDuplicated = (res: ActionResult) => {
    const newId = dataField(res, 'id');
    if (typeof newId === 'string') router.push(`/admin/products/${newId}`);
  };
  const onRemoved = (res: ActionResult) => {
    if (layout === 'header' && dataField(res, 'deleted') === true) router.push('/admin/products');
  };
  const confirmDelete = {
    title: `Delete ${name}?`,
    description: (
      <>
        <p>Variants, photos and diamond options are deleted with it. This can’t be undone.</p>
        <p className="mt-2 text-taupe">If the product appears on past orders it is hidden from the store instead, so order history stays intact.</p>
      </>
    ),
    confirmLabel: 'Delete product',
  };
  const storeHref = `/products/${slug}`;

  if (layout === 'header') {
    return (
      <>
        {isActive ? (
          <a href={storeHref} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'sm')}>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            View on store
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span className="px-2 text-xs text-taupe">Hidden from store</span>
        )}
        <ActionButton action={duplicate} variant="outline" icon={<Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />} onDone={onDuplicated} successMessage="Product duplicated">
          Duplicate
        </ActionButton>
        <ActionButton
          action={remove}
          variant="ghost"
          className="text-danger hover:bg-danger/[0.06]"
          icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
          onDone={onRemoved}
          confirm={confirmDelete}
        >
          Delete
        </ActionButton>
      </>
    );
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={`/admin/products/${id}`} className={iconLink} aria-label={`Edit ${name}`} title="Edit">
        <Pencil className="h-4 w-4" strokeWidth={1.4} />
      </Link>
      <ActionButton action={duplicate} variant="icon" title={`Duplicate ${name}`} icon={<Copy className="h-4 w-4" strokeWidth={1.4} />} onDone={onDuplicated} successMessage="Product duplicated" />
      {isActive ? (
        <a href={storeHref} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label={`View ${name} on the store (opens in a new tab)`} title="View on store">
          <ExternalLink className="h-4 w-4" strokeWidth={1.4} />
        </a>
      ) : (
        <span className={cn(iconLink, 'pointer-events-none opacity-30')} aria-hidden title="Hidden from store">
          <ExternalLink className="h-4 w-4" strokeWidth={1.4} />
        </span>
      )}
      <ActionButton action={remove} variant="icon" title={`Delete ${name}`} icon={<Trash2 className="h-4 w-4" strokeWidth={1.4} />} className="hover:text-danger" confirm={confirmDelete} />
    </div>
  );
}
