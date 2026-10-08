'use client';
import { useRouter } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { saveCollection } from '@/lib/server/admin/actions/collections';
import { FieldMsg, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { Panel } from '../ui';
import { hintCls, ImageUrlField, lbl, NameSlugFields, SeoFields } from '../categories/fields';

export type CollectionFormValues = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  position: number;
  isFeatured: boolean;
};

export function CollectionForm({ collection, nextPosition = 0 }: { collection?: CollectionFormValues; nextPosition?: number }) {
  const router = useRouter();
  const { state, pending, onSubmit } = useAdminForm<{ id: string }>(saveCollection, {
    onSuccess: (res) => {
      if (!collection && res.ok && res.data?.id) router.push(`/admin/collections/${res.data.id}`);
    },
  });
  const err = (n: string) => (state && !state.ok && state.fieldErrors?.[n] ? true : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {collection && <input type="hidden" name="id" value={collection.id} />}
      <FormBanner state={state && !state.ok ? state : null} />

      <Panel title="Details" bodyClassName="space-y-5 p-5">
        <NameSlugFields state={state} idPrefix="col" name={collection?.name} slug={collection?.slug} urlPrefix="/collections/" namePlaceholder="Art Deco" />
        <div>
          <label htmlFor="col-desc" className={lbl}>
            Description
          </label>
          <textarea
            id="col-desc"
            name="description"
            defaultValue={collection?.description ?? ''}
            maxLength={1000}
            rows={4}
            aria-invalid={err('description')}
            className="field resize-y py-2.5"
            placeholder="A short story for the top of the collection page."
          />
          <FieldMsg state={state} name="description" />
        </div>
        <ImageUrlField state={state} idPrefix="col" value={collection?.image ?? ''} />
      </Panel>

      <Panel title="Search engine listing" description="How this collection appears in Google and when shared." bodyClassName="space-y-5 p-5">
        <SeoFields state={state} idPrefix="col" seoTitle={collection?.seoTitle ?? ''} seoDescription={collection?.seoDescription ?? ''} />
      </Panel>

      <Panel title="Merchandising" bodyClassName="space-y-5 p-5">
        <div className="grid items-start gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <label htmlFor="col-position" className={lbl}>
              Position
            </label>
            <input
              id="col-position"
              name="position"
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              step={1}
              defaultValue={collection?.position ?? nextPosition}
              aria-invalid={err('position')}
              className="field py-2.5"
            />
            <FieldMsg state={state} name="position" />
          </div>
          <p className={`${hintCls} sm:pt-6`}>Lower numbers appear first wherever collections are listed.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 border border-line bg-ivory/60 px-4 py-3 text-[15px]">
          <input type="checkbox" name="isFeatured" defaultChecked={collection?.isFeatured ?? false} className="mt-0.5 h-4 w-4 accent-ink" />
          <span>
            <span className="font-medium text-ink">Featured</span>
            <span className="mt-0.5 block text-xs text-taupe">Marks the collection for promotion wherever the storefront highlights collections. Collections have no hidden state — every collection stays reachable at its URL and in search.</span>
          </span>
        </label>
      </Panel>

      <div className="flex flex-wrap justify-end gap-2">
        <ButtonLink href="/admin/collections" size="sm" variant="ghost">
          Cancel
        </ButtonLink>
        <SubmitButton pending={pending} pendingLabel="Saving…">
          {collection ? 'Save changes' : 'Create collection'}
        </SubmitButton>
      </div>
    </form>
  );
}
