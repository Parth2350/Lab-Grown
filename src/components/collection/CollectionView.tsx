import Link from 'next/link';
import type { ReactNode } from 'react';
import { SHAPES } from '@/lib/catalog';
import { filtersToSearch, FILTER_KEYS, type Filters, type Scope } from '@/lib/filters';
import type { Listing } from '@/lib/server/catalog';
import { itemListLd } from '@/lib/seo';
import { cn, pluralize } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { JsonLd } from '@/components/seo/JsonLd';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { FilterProvider } from './FilterContext';
import { FilterPanel } from './FilterPanel';
import { ProductGrid } from './ProductGrid';
import { ActiveChips, CollectionSearch, MobileFilters, SortSelect } from './Toolbar';

type Props = {
  title: string;
  eyebrow?: string;
  description?: string | null;
  crumbs: Crumb[];
  basePath: string;
  scope: Scope;
  /** extra API params that reproduce the scope for /api/products */
  apiScope: Record<string, string>;
  filters: Filters;
  listing: Listing;
  showShapes?: boolean;
  aside?: ReactNode;
};

export function CollectionView({ title, eyebrow = 'Collection', description, crumbs, basePath, filters, listing, apiScope, showShapes, aside }: Props) {
  const { products, total, page, pageCount, facets, scopeTotal } = listing;
  const apiParams = new URLSearchParams(apiScope);
  for (const k of FILTER_KEYS) if (filters[k].length) apiParams.set(k, filters[k].join(','));
  if (filters.q) apiParams.set('q', filters.q);
  if (filters.sort !== 'featured') apiParams.set('sort', filters.sort);
  const apiQuery = apiParams.toString();
  const nextHref = page < pageCount ? `${basePath}${filtersToSearch({ ...filters, page: page + 1 })}` : null;
  const shapeOptions = facets.shape ?? [];

  return (
    <FilterProvider filters={filters} basePath={basePath}>
      <section className="container-x pb-6 pt-8 md:pt-12">
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3">{eyebrow}</p>
            <h1 className="font-serif text-[2.4rem] font-light leading-[1.05] md:text-[3.4rem]">{title}</h1>
            {description && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-taupe">{description}</p>}
            <p className="mt-4 text-[12px] uppercase tracking-[0.16em] text-charcoal">{pluralize(scopeTotal, 'design')}</p>
          </div>
          {aside}
        </div>

        {showShapes && shapeOptions.length > 1 && (
          <ul className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Shop by shape">
            {SHAPES.filter((s) => shapeOptions.some((o) => o.value === s.slug)).map((s) => {
              const on = filters.shape.includes(s.slug);
              return (
                <li key={s.slug} className="shrink-0">
                  <Link
                    href={`${basePath}${filtersToSearch({ ...filters, page: 1, shape: on ? [] : [s.slug] })}`}
                    scroll={false}
                    aria-current={on ? 'true' : undefined}
                    className={cn('flex w-[84px] flex-col items-center gap-2 border py-3 text-[11px] uppercase tracking-[0.12em] transition-colors', on ? 'border-ink bg-white text-ink' : 'border-transparent text-taupe hover:border-line hover:text-ink')}
                  >
                    <ShapeIcon shape={s.slug} size={34} className={on ? 'text-gold' : ''} />
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="sticky top-[60px] z-30 border-y border-line bg-ivory/95 backdrop-blur-md xl:top-[108px]">
        <div className="container-x flex items-center justify-between gap-4 py-2">
          <div className="hidden flex-1 lg:block">
            <CollectionSearch />
          </div>
          <MobileFilters facets={facets} total={total} />
          <p className="hidden text-[12px] text-taupe md:block" aria-live="polite">
            {pluralize(total, 'piece')}
          </p>
          <SortSelect />
        </div>
      </div>

      <section className="container-x pt-6">
        <div className="mb-6 lg:hidden">
          <CollectionSearch />
        </div>
        <div className="grid gap-10 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-[180px] max-h-[calc(100vh-200px)] overflow-y-auto pb-10 pr-2">
              <FilterPanel facets={facets} />
            </div>
          </aside>
          <div>
            <div className="mb-6">
              <ActiveChips />
            </div>
            <h2 className="sr-only">{title} — products</h2>
            {products.length ? (
              <ProductGrid key={apiQuery} initial={products} total={total} page={page} pageCount={pageCount} apiQuery={apiQuery} nextHref={nextHref} />
            ) : (
              <div className="border border-line px-6 py-20 text-center">
                <p className="font-serif text-3xl">No pieces match those filters</p>
                <p className="mx-auto mt-3 max-w-md text-sm text-taupe">Try removing a filter, widening the price range, or speak to our concierge — we can often create exactly what you have in mind.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <ButtonLink href={basePath} variant="outline">
                    Clear filters
                  </ButtonLink>
                  <ButtonLink href="/bespoke">Design Bespoke</ButtonLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {products.length > 0 && <JsonLd data={itemListLd(title, products.slice(0, 24))} />}
    </FilterProvider>
  );
}
