'use client';
import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { saveCategory } from '@/lib/server/admin/actions/categories';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { hintCls, ImageUrlField, lbl, NameSlugFields, SeoFields } from './fields';

export type CategoryFormValues = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  position: number;
  isActive: boolean;
};

function CategoryForm({ category, nextPosition, onDone }: { category?: CategoryFormValues; nextPosition: number; onDone: () => void }) {
  const { state, pending, onSubmit } = useAdminForm(saveCategory, { onSuccess: onDone });
  const err = (n: string) => (state && !state.ok && state.fieldErrors?.[n] ? true : undefined);
  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <FormBanner state={state && !state.ok ? state : null} />
        <NameSlugFields state={state} idPrefix="cat" name={category?.name} slug={category?.slug} urlPrefix="/" namePlaceholder="Engagement Rings" />
        <div>
          <label htmlFor="cat-desc" className={lbl}>
            Description
          </label>
          <textarea
            id="cat-desc"
            name="description"
            defaultValue={category?.description ?? ''}
            maxLength={1000}
            rows={4}
            aria-invalid={err('description')}
            className="field resize-y py-2.5"
            placeholder="Intro copy shown at the top of the category page."
          />
          <FieldMsg state={state} name="description" />
        </div>
        <ImageUrlField state={state} idPrefix="cat" value={category?.image ?? ''} />

        <fieldset className="space-y-5 border-t border-line pt-5">
          <legend className="sr-only">Search engine listing</legend>
          <p className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">Search engine listing</p>
          <SeoFields state={state} idPrefix="cat" seoTitle={category?.seoTitle ?? ''} seoDescription={category?.seoDescription ?? ''} />
        </fieldset>

        <div className="grid grid-cols-[120px_1fr] items-start gap-4 border-t border-line pt-5">
          <div>
            <label htmlFor="cat-position" className={lbl}>
              Position
            </label>
            <input
              id="cat-position"
              name="position"
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              step={1}
              defaultValue={category?.position ?? nextPosition}
              aria-invalid={err('position')}
              className="field py-2.5"
            />
            <FieldMsg state={state} name="position" />
          </div>
          <p className={`${hintCls} pt-6`}>Lower numbers appear first in navigation and category listings.</p>
        </div>

        <div className="border border-line bg-white px-4 py-3">
          <label className="flex cursor-pointer items-start gap-3 text-[15px]">
            <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="mt-0.5 h-4 w-4 accent-ink" />
            <span>
              <span className="font-medium text-ink">Active — visible in the store</span>
              <span className="mt-0.5 block text-xs text-taupe">
                Deactivating hides the category page and removes all of its products from collections, search and filters. Products themselves are not changed.
              </span>
            </span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <SubmitButton pending={pending} pendingLabel="Saving…">
          {category ? 'Save changes' : 'Create category'}
        </SubmitButton>
      </div>
    </form>
  );
}

export function CategoryEditor({ category, nextPosition = 0 }: { category?: CategoryFormValues; nextPosition?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {category ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white hover:text-ink"
          aria-label={`Edit ${category.name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.4} />
        </button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.5} /> New category
        </Button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={category ? `Edit ${category.name}` : 'New category'} bodyClassName="flex flex-col" className="max-w-[520px]">
        {open && <CategoryForm category={category} nextPosition={nextPosition} onDone={() => setOpen(false)} />}
      </Sheet>
    </>
  );
}
