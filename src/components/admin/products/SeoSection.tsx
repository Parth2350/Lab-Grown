'use client';
import { site } from '@/config/site';
import { CharCount } from '../forms';
import { EditorSection, ErrorText, FieldLabel, inputCls, type SectionProps } from './editor-ui';

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export function SeoSection({ draft, update, errors }: SectionProps) {
  const title = `${draft.seoTitle.trim() || draft.name.trim() || 'Product name'} | ${site.name}`;
  const description = (draft.seoDescription.trim() || draft.description.trim() || 'Add a description to control how this page appears in search results.').replace(/\s+/g, ' ');
  const host = site.url.replace(/^https?:\/\//, '');
  const slug = draft.slug || 'product-slug';

  return (
    <EditorSection id="seo" title="Search engine listing" description="Leave blank to fall back to the product name and description.">
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="grid content-start gap-5">
          <div>
            <FieldLabel htmlFor="p-seo-title" aside={<CharCount value={draft.seoTitle} ideal={[30, 60]} max={70} />}>
              SEO title
            </FieldLabel>
            <input id="p-seo-title" value={draft.seoTitle} onChange={(e) => update({ seoTitle: e.target.value })} maxLength={120} aria-invalid={errors.seoTitle ? true : undefined} className={inputCls} placeholder={draft.name || 'Defaults to the product name'} />
            <ErrorText msg={errors.seoTitle} />
          </div>
          <div>
            <FieldLabel htmlFor="p-seo-desc" aside={<CharCount value={draft.seoDescription} ideal={[120, 155]} max={160} />}>
              Meta description
            </FieldLabel>
            <textarea
              id="p-seo-desc"
              value={draft.seoDescription}
              onChange={(e) => update({ seoDescription: e.target.value })}
              rows={4}
              maxLength={320}
              aria-invalid={errors.seoDescription ? true : undefined}
              className="field min-h-[96px] resize-y py-2.5 text-[13px] leading-relaxed"
              placeholder="Defaults to the product description"
            />
            <ErrorText msg={errors.seoDescription} />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-charcoal">Search preview</p>
          <div className="border border-line bg-white p-4" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#dadce0] bg-[#f1f3f4] font-serif text-[13px] text-ink" aria-hidden>
                {site.name.charAt(0)}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[14px] text-[#202124]">{site.name}</p>
                <p className="truncate text-[12px] text-[#4d5156]">
                  {host} › products › {slug}
                </p>
              </div>
            </div>
            <p className="mt-2 truncate text-[20px] leading-snug text-[#1a0dab]">{clip(title, 70)}</p>
            <p className="mt-1 line-clamp-2 text-[14px] leading-[1.58] text-[#4d5156]">{clip(description, 160)}</p>
          </div>
          <p className="mt-2 break-all text-[11px] text-taupe">
            {site.url}/products/{slug}
          </p>
        </div>
      </div>
    </EditorSection>
  );
}
