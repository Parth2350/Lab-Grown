import type { ReactNode } from 'react';
import { filtersToSearch, FILTER_KEYS, type Filters, type Scope } from '@/lib/filters';
import type { Listing } from '@/lib/server/catalog';
import { itemListLd } from '@/lib/seo';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { JsonLd } from '@/components/seo/JsonLd';
import { FilterProvider } from './FilterContext';
import { ProductGrid } from './ProductGrid';
import { ActiveChips, CollectionSearch, FilterBar, PhoneBar } from './Toolbar';

type Props = {
  title: string;
  description?: string | null;
  crumbs: Crumb[];
  basePath: string;
  scope: Scope;
  /** extra API params that reproduce the scope for /api/products */
  apiScope: Record<string, string>;
  filters: Filters;
  listing: Listing;
  /** category pages show a removable "Category: …" chip, as on brilliancecarat.com */
  category?: string;
  aside?: ReactNode;
};

/** Every product listing (categories, collections, shapes, search), laid out like brilliancecarat.com's. */
export function CollectionView({ title, description, crumbs, basePath, filters, listing, apiScope, category, aside }: Props) {
  const { products, total, page, pageCount, facets } = listing;
  const apiParams = new URLSearchParams(apiScope);
  for (const k of FILTER_KEYS) if (filters[k].length) apiParams.set(k, filters[k].join(','));
  if (filters.q) apiParams.set('q', filters.q);
  if (filters.sort !== 'featured') apiParams.set('sort', filters.sort);
  const apiQuery = apiParams.toString();
  const nextHref = page < pageCount ? `${basePath}${filtersToSearch({ ...filters, page: page + 1 })}` : null;

  return (
    <FilterProvider filters={filters} basePath={basePath}>
      <section className="container-x pt-6 md:pt-8">
        <Breadcrumbs items={crumbs} />
        <div className="mt-3 flex items-start justify-between gap-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink sm:text-[2.25rem]">{title}</h1>
            {description && <p className="mt-1.5 max-w-2xl text-[15.5px] leading-relaxed text-taupe">{description}</p>}
          </div>
          {aside}
        </div>
      </section>

      {/* the phone's Sort | Filters bar sticks to the bottom while this block is on screen */}
      <div>
        <section className="container-x pb-10 pt-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-2">
            <CollectionSearch className="w-full lg:w-[384px]" />
            <FilterBar facets={facets} />
          </div>
          <ActiveChips category={category} className="mt-4" />
          <h2 className="sr-only">{title} — products</h2>
          {products.length ? (
            <ProductGrid key={apiQuery} initial={products} total={total} page={page} pageCount={pageCount} apiQuery={apiQuery} nextHref={nextHref} />
          ) : (
            <div className="mt-6 border border-line px-6 py-20 text-center">
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
        </section>
        <PhoneBar facets={facets} />
      </div>
      {products.length > 0 && <JsonLd data={itemListLd(title, products.slice(0, 24))} />}
    </FilterProvider>
  );
}
