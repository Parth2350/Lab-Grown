'use client';
import { EditorSection, ErrorText, FieldLabel, Hint, Switch, inputCls, type SectionProps } from './editor-ui';

export function MerchandisingSection({ draft, update, errors }: SectionProps) {
  return (
    <EditorSection id="merchandising" title="Merchandising" description="Visibility and where the piece is promoted on the storefront.">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Switch id="p-active" checked={draft.isActive} onChange={(v) => update({ isActive: v })} label="Active" description="Visible and purchasable on the store." />
        <Switch id="p-featured" checked={draft.isFeatured} onChange={(v) => update({ isFeatured: v })} label="Featured" description="Eligible for home-page and editorial placements." />
        <Switch id="p-trending" checked={draft.isTrending} onChange={(v) => update({ isTrending: v })} label="Trending" description="Shown in trending carousels." />
        <Switch id="p-new" checked={draft.isNew} onChange={(v) => update({ isNew: v })} label="New arrival" description="Adds the “New” badge and the new-arrivals rail." />
        <div className="sm:col-span-2 sm:max-w-[220px]">
          <FieldLabel htmlFor="p-position">Position</FieldLabel>
          <input
            id="p-position"
            inputMode="numeric"
            value={draft.position}
            onChange={(e) => update({ position: e.target.value.replace(/[^\d]/g, '') })}
            aria-invalid={errors.position ? true : undefined}
            className={`${inputCls} tabular-nums`}
          />
          {errors.position ? <ErrorText msg={errors.position} /> : <Hint>Lower numbers appear first in “Featured” sorting.</Hint>}
        </div>
      </div>
    </EditorSection>
  );
}
