'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ProductMedia } from '@/components/product/ProductMedia';
import { saveProduct } from '@/lib/server/admin/actions/products';
import { cn, formatMoney } from '@/lib/utils';
import { ConfirmDialog, FormBanner, SubmitButton, useAdminForm } from '../forms';
import { Badge, DescList } from '../ui';
import { AttributesSection } from './AttributesSection';
import { MetalSwitcher } from './ArtPreview';
import { BasicsSection } from './BasicsSection';
import { DiamondSection, type Eligible } from './DiamondSection';
import type { DraftUpdate } from './editor-ui';
import { ImagerySection } from './ImagerySection';
import { MediaManager } from './MediaManager';
import { MerchandisingSection } from './MerchandisingSection';
import { SeoSection } from './SeoSection';
import { VariantsSection } from './VariantsSection';
import {
  gridVariants,
  normalizeDraft,
  parseFloatInput,
  parseMoneyInput,
  toArtSpec,
  toPayload,
  type EditorOptions,
  type MediaItem,
  type ProductDraft,
  type ProductMeta,
  type SaveProductResult,
} from './shared';

const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'merchandising', label: 'Merchandising' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'imagery', label: 'Imagery' },
  { id: 'variants', label: 'Variants' },
  { id: 'diamonds', label: 'Diamond options' },
  { id: 'seo', label: 'SEO' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

const SECTION_FIELDS: Record<SectionId, string[]> = {
  basics: ['name', 'slug', 'sku', 'subtitle', 'categoryId', 'collectionIds', 'description', 'details'],
  merchandising: ['isActive', 'isFeatured', 'isTrending', 'isNew', 'position'],
  attributes: ['metalColors', 'purities', 'defaultMetalColor', 'defaultPurity', 'shapes', 'styles', 'settingType', 'centerCarat', 'totalCarat', 'hasCenterStone', 'requiresSize', 'tags', 'basePrice'],
  imagery: ['art'],
  variants: ['variants'],
  diamonds: ['diamondMode', 'center', 'options'],
  seo: ['seoTitle', 'seoDescription'],
};

function sectionOf(errorKey: string): SectionId {
  const root = errorKey.split('.')[0];
  for (const s of SECTIONS) if (SECTION_FIELDS[s.id].includes(root)) return s.id;
  return 'basics';
}

/** Warn before leaving with unsaved edits — full unloads and in-app link clicks. */
function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!(a instanceof HTMLAnchorElement) || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm('You have unsaved changes. Leave this page without saving?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}

function useActiveSection() {
  const [active, setActive] = useState<SectionId>('basics');
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id as SectionId);
      },
      { rootMargin: '-96px 0px -55% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}

function SectionLinks({ active, errorCounts, orientation }: { active: SectionId; errorCounts: Partial<Record<SectionId, number>>; orientation: 'vertical' | 'horizontal' }) {
  return (
    <ul className={orientation === 'vertical' ? 'space-y-px' : 'flex gap-1'}>
      {SECTIONS.map((s) => {
        const n = errorCounts[s.id] ?? 0;
        const isActive = active === s.id;
        return (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                'flex items-center gap-2 text-[12.5px] transition-colors',
                orientation === 'vertical' ? 'border-l-2 px-3 py-1.5' : 'border-b-2 px-2.5 py-2.5',
                isActive ? 'border-ink text-ink' : 'border-transparent text-taupe hover:text-ink',
              )}
            >
              {s.label}
              {n > 0 && (
                <span className="ml-auto min-w-[18px] bg-danger px-1 text-center text-[10px] font-medium leading-[16px] text-white" title={`${n} field${n === 1 ? '' : 's'} need attention`}>
                  {n}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  productId: string | null;
  initial: ProductDraft;
  meta: ProductMeta | null;
  media: MediaItem[];
  options: EditorOptions;
  lowStock: number;
};

export function ProductEditor({ productId, initial, meta, media, options, lowStock }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(productId != null);
  const [previewMetal, setPreviewMetal] = useState(initial.defaultMetalColor || 'yellow');
  const [eligible, setEligible] = useState<Eligible>({ status: 'idle', count: 0, cheapest: null });
  const [mediaItems, setMediaItems] = useState(media);
  const [discardOpen, setDiscardOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const savedJson = useMemo(() => JSON.stringify(saved), [saved]);
  const dirty = useMemo(() => JSON.stringify(draft) !== savedJson, [draft, savedJson]);
  useUnsavedGuard(dirty);
  const active = useActiveSection();

  const update: DraftUpdate = useCallback((patch) => setDraft((d) => normalizeDraft({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })), []);

  const form = useAdminForm<SaveProductResult>(saveProduct, {
    onSuccess: (res) => {
      const data = res.ok ? res.data : undefined;
      if (!data) return;
      if (data.created) {
        setSaved(draft);
        router.push(`/admin/products/${data.id}`);
        return;
      }
      if (data.editor) {
        setDraft(data.editor.draft);
        setSaved(data.editor.draft);
        setMediaItems(data.editor.media);
      }
    },
  });
  const errors = useMemo(() => (form.state && !form.state.ok ? form.state.fieldErrors ?? {} : {}), [form.state]);
  const errorCounts = useMemo(() => {
    const out: Partial<Record<SectionId, number>> = {};
    for (const k of Object.keys(errors)) {
      const s = sectionOf(k);
      out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  }, [errors]);
  const errorCount = Object.keys(errors).length;

  const submit = () => {
    if (form.pending) return;
    const fd = new FormData();
    if (productId) fd.set('id', productId);
    fd.set('payload', JSON.stringify(toPayload(draft)));
    form.submit(fd);
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  // Ctrl/⌘ + S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Bring the first invalid field into view after a failed save
  useEffect(() => {
    if (!form.state || form.state.ok) return;
    const raf = requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [form.state]);

  // ── preview inputs ──
  const metal = draft.metalColors.includes(previewMetal) ? previewMetal : draft.defaultMetalColor || 'yellow';
  const defaultOption = draft.options.find((o) => o.isDefault);
  const previewShape = draft.diamondMode === 'CENTER_STONE' ? draft.center.shape || 'round' : draft.shapes[0] ?? 'round';
  const previewCarat =
    (draft.diamondMode === 'CENTER_STONE'
      ? parseFloatInput(draft.centerCarat) ?? parseFloatInput(draft.center.minCarat)
      : draft.diamondMode === 'TOTAL_WEIGHT'
        ? parseFloatInput(defaultOption?.totalCarat ?? '') ?? parseFloatInput(draft.totalCarat)
        : parseFloatInput(draft.centerCarat) ?? parseFloatInput(draft.totalCarat)) ?? 1;
  const spec = toArtSpec(draft.art);

  // ── summary ──
  const activeVariants = gridVariants(draft).filter((v) => v.isActive);
  const prices = activeVariants.map((v) => parseMoneyInput(v.price)).filter((p): p is number => p != null);
  const minVariant = prices.length ? Math.min(...prices) : null;
  const optionPrices = draft.options.map((o) => parseMoneyInput(o.priceDelta) ?? 0);
  const diamondFrom = draft.diamondMode === 'TOTAL_WEIGHT' ? (optionPrices.length ? Math.min(...optionPrices) : 0) : draft.diamondMode === 'CENTER_STONE' ? (eligible.status === 'done' ? eligible.cheapest : null) : 0;
  const fromEstimate = minVariant != null && diamondFrom != null ? minVariant + diamondFrom : null;
  const totalStock = activeVariants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const photoCount = mediaItems.filter((m) => m.kind === 'image').length;

  const discard = () => {
    setDraft(saved);
    if (!productId) setSlugTouched(false);
    setDiscardOpen(false);
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-label={productId ? `Edit ${saved.name}` : 'New product'}>
      <nav aria-label="Editor sections" className="no-scrollbar sticky top-14 z-30 -mx-4 mb-4 overflow-x-auto border-b border-line bg-[#F7F4EE]/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:hidden">
        <SectionLinks active={active} errorCounts={errorCounts} orientation="horizontal" />
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-6">
          <FormBanner state={form.state && !form.state.ok ? form.state : null} />
          <BasicsSection draft={draft} update={update} errors={errors} options={options} slugTouched={slugTouched} setSlugTouched={setSlugTouched} />
          <MerchandisingSection draft={draft} update={update} errors={errors} />
          <AttributesSection draft={draft} update={update} errors={errors} />
          <ImagerySection
            draft={draft}
            update={update}
            errors={errors}
            previewMetal={metal}
            setPreviewMetal={setPreviewMetal}
            previewShape={previewShape}
            previewCarat={previewCarat}
            media={
              productId ? (
                <MediaManager productId={productId} productName={saved.name} items={mediaItems} onItemsChange={setMediaItems} metals={saved.metalColors} />
              ) : (
                <p className="border border-dashed border-line bg-ivory/60 px-4 py-4 text-[13px] text-taupe">
                  Save the product first, then upload photos and video here. Uploaded photos replace the illustration on the storefront.
                </p>
              )
            }
          />
          <VariantsSection draft={draft} update={update} errors={errors} lowStock={lowStock} />
          <DiamondSection draft={draft} update={update} errors={errors} eligible={eligible} setEligible={setEligible} />
          <SeoSection draft={draft} update={update} errors={errors} />
        </div>

        <aside className="hidden xl:block" aria-label="Product summary">
          <div className="no-scrollbar sticky top-[76px] max-h-[calc(100vh-150px)] space-y-4 overflow-y-auto">
            <nav aria-label="Editor sections" className="border border-line bg-white py-2">
              <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-taupe">On this page</p>
              <SectionLinks active={active} errorCounts={errorCounts} orientation="vertical" />
            </nav>

            <div className="border border-line bg-white">
              <div className="art-tile relative aspect-square w-full overflow-hidden border-b border-line">
                <ProductMedia name={draft.name || 'Product'} art={spec} images={mediaItems} shape={previewShape} metal={metal} carat={previewCarat} sizes="320px" />
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="font-serif text-lg leading-snug text-ink">{draft.name || 'Untitled product'}</p>
                  <p className="font-mono text-[11px] text-taupe">{draft.sku || 'No SKU yet'}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={draft.isActive ? 'success' : 'neutral'} dot>
                    {draft.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                  {draft.isFeatured && <Badge tone="gold">Featured</Badge>}
                  {draft.isTrending && <Badge tone="info">Trending</Badge>}
                  {draft.isNew && <Badge tone="neutral">New</Badge>}
                </div>
                <MetalSwitcher metals={draft.metalColors} value={metal} onChange={setPreviewMetal} />
                <DescList
                  className="grid-cols-[minmax(84px,auto)_1fr] text-[12.5px]"
                  items={[
                    [
                      'From',
                      fromEstimate != null ? (
                        <span key="from">
                          {formatMoney(fromEstimate)} <span className="text-[11px] text-taupe">est.</span>
                        </span>
                      ) : (
                        <span key="from" className="text-taupe">
                          {minVariant != null ? `${formatMoney(minVariant)} + diamond` : '—'}
                        </span>
                      ),
                    ],
                    ['Variants', `${activeVariants.length} active`],
                    ['Stock', <span key="stock" className={totalStock === 0 && activeVariants.length ? 'text-danger' : undefined}>{totalStock.toLocaleString()} units</span>],
                    ['Photos', productId ? (photoCount ? `${photoCount} — replaces illustration` : 'Illustration only') : 'After first save'],
                    ...(meta
                      ? ([
                          ['Rating', meta.reviewCount ? `${meta.rating.toFixed(1)} ★ (${meta.reviewCount})` : 'No reviews'],
                          ['Ordered', `${meta.orderCount} line${meta.orderCount === 1 ? '' : 's'}`],
                        ] as [string, string][])
                      : []),
                  ]}
                />
                {meta && !meta.categoryActive && <p className="text-xs text-[#7A5718]">Its category is hidden, so it won’t appear on the store.</p>}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-[13px]" aria-live="polite">
            {form.pending ? (
              <span className="text-taupe">Saving…</span>
            ) : errorCount > 0 ? (
              <span className="text-danger">
                {errorCount} field{errorCount === 1 ? ' needs' : 's need'} attention
              </span>
            ) : dirty ? (
              <span className="flex items-center gap-2 text-ink">
                <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
                Unsaved changes
              </span>
            ) : productId ? (
              <span className="text-taupe">All changes saved</span>
            ) : (
              <span className="text-taupe">New product — not saved yet</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-taupe xl:inline">Ctrl / ⌘ + S</span>
            {dirty && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setDiscardOpen(true)} disabled={form.pending}>
                Discard
              </Button>
            )}
            <SubmitButton pending={form.pending} pendingLabel="Saving…" disabled={!dirty && !!productId}>
              {productId ? 'Save changes' : 'Create product'}
            </SubmitButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={discard}
        title="Discard unsaved changes?"
        description={productId ? 'The form goes back to the last saved version of this product.' : 'The form will be cleared.'}
        confirmLabel="Discard"
      />
    </form>
  );
}
