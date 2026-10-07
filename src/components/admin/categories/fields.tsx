'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { FormState } from '@/lib/server/admin/types';
import { slugify } from '@/lib/utils';
import { CharCount, FieldMsg } from '../forms';

/** Shared label / hint classes for catalog editor forms. */
export const lbl = 'mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal';
export const hintCls = 'mt-1 text-xs text-taupe';

/** slugify, but "Men’s" → "mens" rather than "men-s". */
export const toSlug = (s: string) => slugify(s.replace(/['’‘`]/g, ''));

const invalid = (state: FormState | undefined, name: string) => (state && !state.ok && state.fieldErrors?.[name] ? true : undefined);

/**
 * Name + slug pair. On create the slug follows the name until the admin edits it by hand;
 * on edit it is locked to the saved slug (changing it changes public URLs) unless regenerated.
 */
export function NameSlugFields({
  state,
  idPrefix,
  name: initialName = '',
  slug: initialSlug = '',
  urlPrefix,
  namePlaceholder,
}: {
  state: FormState | undefined;
  idPrefix: string;
  name?: string;
  slug?: string;
  /** Shown before the slug, e.g. "/collections/" */
  urlPrefix: string;
  namePlaceholder?: string;
}) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [touched, setTouched] = useState(Boolean(initialSlug));
  const autoSlug = toSlug(name);

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-name`} className={lbl}>
          Name <span className="text-gold">*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(toSlug(e.target.value));
          }}
          required
          maxLength={80}
          autoComplete="off"
          aria-invalid={invalid(state, 'name')}
          className="field py-2.5"
          placeholder={namePlaceholder}
          data-autofocus
        />
        <FieldMsg state={state} name="name" />
      </div>
      <div>
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={`${idPrefix}-slug`} className={lbl}>
            Slug <span className="text-gold">*</span>
          </label>
          {touched && autoSlug && autoSlug !== slug && (
            <button
              type="button"
              onClick={() => {
                setSlug(autoSlug);
                setTouched(false);
              }}
              className="mb-1.5 inline-flex items-center gap-1 text-[11px] text-taupe underline-offset-4 hover:text-ink hover:underline"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              Use “{autoSlug}”
            </button>
          )}
        </div>
        <div className="flex items-stretch">
          <span className="hidden items-center border border-r-0 border-line bg-porcelain px-3 text-xs text-taupe sm:inline-flex">{urlPrefix}</span>
          <input
            id={`${idPrefix}-slug`}
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              setTouched(true);
            }}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid(state, 'slug')}
            aria-describedby={`${idPrefix}-slug-hint`}
            className="field py-2.5 font-mono text-[13px]"
            placeholder={autoSlug || 'my-slug'}
          />
        </div>
        <p id={`${idPrefix}-slug-hint`} className={hintCls}>
          {touched ? 'Lowercase letters, numbers and hyphens. Changing a live slug changes its public URL.' : 'Generated from the name — edit it to set your own.'}
        </p>
        <FieldMsg state={state} name="slug" />
      </div>
    </>
  );
}

/** SEO title + meta description with live character counters. */
export function SeoFields({
  state,
  idPrefix,
  seoTitle: initialTitle = '',
  seoDescription: initialDescription = '',
  titlePlaceholder,
}: {
  state: FormState | undefined;
  idPrefix: string;
  seoTitle?: string;
  seoDescription?: string;
  titlePlaceholder?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  return (
    <>
      <div>
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={`${idPrefix}-seo-title`} className={lbl}>
            SEO title
          </label>
          <span className="mb-1.5">
            <CharCount value={title} ideal={[30, 60]} max={70} />
          </span>
        </div>
        <input
          id={`${idPrefix}-seo-title`}
          name="seoTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          aria-invalid={invalid(state, 'seoTitle')}
          className="field py-2.5"
          placeholder={titlePlaceholder ?? 'Defaults to the name'}
        />
        <FieldMsg state={state} name="seoTitle" />
      </div>
      <div>
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={`${idPrefix}-seo-desc`} className={lbl}>
            Meta description
          </label>
          <span className="mb-1.5">
            <CharCount value={description} ideal={[120, 160]} max={160} />
          </span>
        </div>
        <textarea
          id={`${idPrefix}-seo-desc`}
          name="seoDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={320}
          rows={3}
          aria-invalid={invalid(state, 'seoDescription')}
          className="field resize-y py-2.5"
          placeholder="Shown in search results. Defaults to the description."
        />
        <FieldMsg state={state} name="seoDescription" />
      </div>
    </>
  );
}

/** Optional image URL with a small live preview. */
export function ImageUrlField({ state, idPrefix, value: initial = '' }: { state: FormState | undefined; idPrefix: string; value?: string }) {
  const [value, setValue] = useState(initial);
  const [broken, setBroken] = useState(false);
  const showPreview = /^(https?:\/\/|\/(?!\/))\S+$/.test(value.trim());
  return (
    <div>
      <label htmlFor={`${idPrefix}-image`} className={lbl}>
        Image URL
      </label>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <input
            id={`${idPrefix}-image`}
            name="image"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setBroken(false);
            }}
            maxLength={500}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid(state, 'image')}
            className="field py-2.5"
            placeholder="https://… or /images/…"
          />
          <p className={hintCls}>Optional. Used for the hero banner and navigation tiles.</p>
          <FieldMsg state={state} name="image" />
        </div>
        {showPreview && (
          <div className="art-tile flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden border border-line text-[9px] text-taupe">
            {broken ? (
              'No preview'
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.trim()} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
