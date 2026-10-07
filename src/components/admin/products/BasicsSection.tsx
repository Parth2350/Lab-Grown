'use client';
import { useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { EditorSection, ErrorText, FieldLabel, Hint, chevronStyle, inputCls, labelCls, selectCls, toggleIn, type SectionProps } from './editor-ui';
import type { EditorOptions } from './shared';

export function BasicsSection({
  draft,
  update,
  errors,
  options,
  slugTouched,
  setSlugTouched,
}: SectionProps & { options: EditorOptions; slugTouched: boolean; setSlugTouched: (v: boolean) => void }) {
  const [collectionQuery, setCollectionQuery] = useState('');
  const visibleCollections = useMemo(() => {
    const q = collectionQuery.trim().toLowerCase();
    return q ? options.collections.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)) : options.collections;
  }, [collectionQuery, options.collections]);
  const selectedCategory = options.categories.find((c) => c.id === draft.categoryId);
  const inv = (k: string) => (errors[k] ? true : undefined);

  return (
    <EditorSection id="basics" title="Basics" description="Name, identifiers, category and the copy shoppers read.">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="p-name" required>
            Name
          </FieldLabel>
          <input
            id="p-name"
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              update(slugTouched ? { name } : { name, slug: slugify(name) });
            }}
            maxLength={160}
            autoComplete="off"
            aria-invalid={inv('name')}
            aria-describedby={errors.name ? 'p-name-err' : undefined}
            className={`${inputCls} text-[15px]`}
            placeholder="e.g. Celeste Oval Halo Engagement Ring"
          />
          <ErrorText id="p-name-err" msg={errors.name} />
        </div>

        <div>
          <FieldLabel
            htmlFor="p-slug"
            required
            aside={
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(false);
                  update({ slug: slugify(draft.name) });
                }}
                disabled={!draft.name.trim()}
                className="mb-1.5 inline-flex items-center gap-1 text-[11px] text-taupe underline-offset-4 hover:text-ink hover:underline disabled:opacity-40"
              >
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                From name
              </button>
            }
          >
            Slug
          </FieldLabel>
          <div className="flex">
            <span className="hidden items-center border border-r-0 border-line bg-ivory px-3 text-xs text-taupe xs:flex" aria-hidden>
              /products/
            </span>
            <input
              id="p-slug"
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
              }}
              maxLength={120}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={inv('slug')}
              aria-describedby="p-slug-hint"
              className={`${inputCls} min-w-0 font-mono text-[12.5px]`}
            />
          </div>
          {errors.slug ? <ErrorText msg={errors.slug} /> : <Hint className="truncate">{slugTouched ? 'Changing the slug changes the product URL.' : 'Generated from the name until you edit it.'}</Hint>}
          <span id="p-slug-hint" className="sr-only">
            Lowercase letters, numbers and hyphens. Appears in the product URL.
          </span>
        </div>

        <div>
          <FieldLabel htmlFor="p-sku" required>
            SKU
          </FieldLabel>
          <input
            id="p-sku"
            value={draft.sku}
            onChange={(e) => update({ sku: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
            maxLength={48}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={inv('sku')}
            className={`${inputCls} font-mono text-[12.5px] uppercase`}
            placeholder="AUR-ENG-1042"
          />
          {errors.sku ? <ErrorText msg={errors.sku} /> : <Hint>Unique. New variant SKUs are built from it.</Hint>}
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="p-subtitle">Subtitle</FieldLabel>
          <input id="p-subtitle" value={draft.subtitle} onChange={(e) => update({ subtitle: e.target.value })} maxLength={200} aria-invalid={inv('subtitle')} className={inputCls} placeholder="Short line under the name, e.g. halo · pavé band" />
          <ErrorText msg={errors.subtitle} />
        </div>

        <div>
          <FieldLabel htmlFor="p-category" required>
            Category
          </FieldLabel>
          <select id="p-category" value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })} aria-invalid={inv('categoryId')} className={selectCls} style={chevronStyle}>
            <option value="">Choose a category…</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? '' : ' (hidden)'}
              </option>
            ))}
          </select>
          {errors.categoryId ? (
            <ErrorText msg={errors.categoryId} />
          ) : selectedCategory && !selectedCategory.isActive ? (
            <Hint className="text-[#7A5718]">This category is hidden, so the product won’t show on the store.</Hint>
          ) : null}
        </div>

        <fieldset className="sm:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <legend className={labelCls}>Collections</legend>
            <span className="text-[11px] text-taupe">
              {draft.collectionIds.length} selected
              {draft.collectionIds.length > 0 && (
                <>
                  {' · '}
                  <button type="button" onClick={() => update({ collectionIds: [] })} className="underline-offset-4 hover:text-ink hover:underline">
                    Clear
                  </button>
                </>
              )}
            </span>
          </div>
          {options.collections.length === 0 ? (
            <p className="border border-dashed border-line px-3 py-3 text-xs text-taupe">No collections yet — create them under Catalog → Collections.</p>
          ) : (
            <div className="border border-line">
              {options.collections.length > 6 && (
                <div className="relative border-b border-line">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe" strokeWidth={1.5} aria-hidden />
                  <label htmlFor="p-coll-q" className="sr-only">
                    Search collections
                  </label>
                  <input
                    id="p-coll-q"
                    type="search"
                    value={collectionQuery}
                    onChange={(e) => setCollectionQuery(e.target.value)}
                    placeholder="Search collections…"
                    className="block h-9 w-full border-0 bg-transparent pl-9 pr-3 text-[13px] focus:outline-none focus-visible:bg-ivory"
                  />
                </div>
              )}
              <ul className="grid max-h-52 gap-px overflow-y-auto p-1.5 sm:grid-cols-2">
                {visibleCollections.map((c) => {
                  const checked = draft.collectionIds.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-[13px] hover:bg-ivory">
                        <input type="checkbox" checked={checked} onChange={() => update((d) => ({ collectionIds: toggleIn(d.collectionIds, c.id) }))} className="h-4 w-4 accent-ink" />
                        <span className={checked ? 'text-ink' : 'text-charcoal'}>{c.name}</span>
                      </label>
                    </li>
                  );
                })}
                {visibleCollections.length === 0 && <li className="px-2 py-2 text-xs text-taupe">No collections match “{collectionQuery}”.</li>}
              </ul>
            </div>
          )}
          <ErrorText msg={errors.collectionIds} />
        </fieldset>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="p-desc" required aside={<span className="mb-1.5 text-[11px] tabular-nums text-taupe">{draft.description.length}/6000</span>}>
            Description
          </FieldLabel>
          <textarea
            id="p-desc"
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={5}
            maxLength={6000}
            aria-invalid={inv('description')}
            className="field min-h-[120px] resize-y py-2.5 text-[13px] leading-relaxed"
            placeholder="What makes this piece special — shown on the product page and used as the default search description."
          />
          <ErrorText msg={errors.description} />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="p-details">Details &amp; craftsmanship</FieldLabel>
          <textarea
            id="p-details"
            value={draft.details}
            onChange={(e) => update({ details: e.target.value })}
            rows={4}
            maxLength={6000}
            aria-invalid={inv('details')}
            className="field min-h-[96px] resize-y py-2.5 text-[13px] leading-relaxed"
            placeholder="Optional longer copy: materials, finishing, setting technique…"
          />
          <ErrorText msg={errors.details} />
        </div>
      </div>
    </EditorSection>
  );
}
