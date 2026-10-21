import Link from 'next/link';
import { Package, Plus, Search } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProductMedia } from '@/components/product/ProductMedia';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { deleteProduct, duplicateProduct, setProductActive } from '@/lib/server/admin/actions/products';
import { cleanParams, type SearchParams } from '@/lib/server/admin/list';
import { listProducts } from '@/lib/server/admin/queries/products';
import { AutoSubmitSelect, ToggleAction } from '@/components/admin/forms';
import { formatMoney, formatNumber } from '@/components/admin/format';
import { ProductActions } from '@/components/admin/products/ProductActions';
import { ProductObjectButton } from '@/components/admin/products/ProductObjectButton';
import { METAL_COLORS } from '@/lib/catalog';
import { PRODUCT_SORTS } from '@/components/admin/products/shared';
import { Badge, EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, TableWrap, Tabs, fieldSm, selectChevron, selectSm, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Products', path: '/admin/products', noIndex: true });

const BASE = '/admin/products';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const data = await listProducts(params);
  const { filters, counts, lowStockThreshold } = data;
  const current = cleanParams({ q: filters.q, category: filters.category, status: filters.status, sort: filters.sort === 'position' ? '' : filters.sort, page: String(data.page) });
  const filtered = !!(filters.q || filters.category || filters.status);
  const activeCategory = data.categories.find((c) => c.slug === filters.category);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${formatNumber(counts.all)} product${counts.all === 1 ? '' : 's'}${filters.q || filters.category ? ' matching your filters' : ' in the catalog'} · ${formatNumber(counts.active)} live on the store.`}
        actions={
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            New product
          </ButtonLink>
        }
      />

      <Tabs
        basePath={BASE}
        params={current}
        active={filters.status}
        tabs={[
          { value: '', label: 'All', count: counts.all },
          { value: 'active', label: 'Active', count: counts.active },
          { value: 'inactive', label: 'Hidden', count: counts.inactive },
          { value: 'featured', label: 'Featured', count: counts.featured },
          { value: 'out-of-stock', label: 'Out of stock', count: counts['out-of-stock'] },
        ]}
      />

      <FilterBar action={BASE}>
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <div className="min-w-[220px] flex-1 sm:max-w-sm">
          <FilterLabel htmlFor="f-q">Search</FilterLabel>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe" strokeWidth={1.5} aria-hidden />
            <input id="f-q" name="q" type="search" defaultValue={filters.q} placeholder="Name, SKU or variant SKU" className={`${fieldSm} pl-8`} />
          </div>
        </div>
        <div>
          <FilterLabel htmlFor="f-category">Category</FilterLabel>
          <AutoSubmitSelect id="f-category" name="category" defaultValue={filters.category} className={selectSm} style={selectChevron}>
            <option value="">All categories</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
                {c.isActive ? '' : ' (hidden)'}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="f-sort">Sort</FilterLabel>
          <AutoSubmitSelect id="f-sort" name="sort" defaultValue={filters.sort} className={selectSm} style={selectChevron}>
            {PRODUCT_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
        {(filters.q || filters.category || filters.sort !== 'position') && (
          <Link href={filters.status ? `${BASE}?status=${filters.status}` : BASE} className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
            Clear
          </Link>
        )}
      </FilterBar>

      {activeCategory && !activeCategory.isActive && (
        <p className="mb-4 border border-[#E6CF9E] bg-[#FBF3E1] px-3 py-2 text-xs text-[#7A5718]">The {activeCategory.name} category is hidden, so none of these products are visible on the store.</p>
      )}

      {data.items.length === 0 ? (
        <div className="border border-line bg-white">
          {counts.all === 0 && !filtered ? (
            <EmptyState
              icon={<Package className="h-5 w-5" strokeWidth={1.25} />}
              title="No products yet"
              description="Create your first piece — variants, diamond options and imagery are all set up in one place."
              action={
                <ButtonLink href="/admin/products/new" size="sm">
                  <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  New product
                </ButtonLink>
              }
            />
          ) : (
            <EmptyState
              icon={<Search className="h-5 w-5" strokeWidth={1.25} />}
              title="No products match"
              description="Try a different search term, category or status."
              action={
                <ButtonLink href={BASE} size="sm" variant="outline">
                  Clear filters
                </ButtonLink>
              }
            />
          )}
        </div>
      ) : (
        <>
          <TableWrap>
            <table className={`${table.base} min-w-[1180px]`}>
              <thead className={table.head}>
                <tr>
                  <th scope="col" className={table.th}>
                    Product
                  </th>
                  <th scope="col" className={table.thRight}>
                    Price
                  </th>
                  <th scope="col" className={table.th}>
                    Metal &amp; purity
                  </th>
                  <th scope="col" className={table.th}>
                    Shapes &amp; carats
                  </th>
                  <th scope="col" className={table.thRight}>
                    Variants
                  </th>
                  <th scope="col" className={table.th}>
                    Flags
                  </th>
                  <th scope="col" className={table.th}>
                    Active
                  </th>
                  <th scope="col" className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => {
                  const o = p.object;
                  const inactiveVariants = p.totalVariants - p.activeVariants;
                  const carats = o.centerCarats.length ? o.centerCarats : o.totalCarats;
                  const caratKind = o.centerCarats.length ? 'Centre' : 'Total';
                  const range = (xs: number[]) => (xs.length > 1 ? `${xs[0]}–${xs[xs.length - 1]} ct` : `${xs[0]} ct`);
                  const stockTone = p.stock === 0 ? 'text-danger' : p.stock <= lowStockThreshold ? 'text-[#7A5718]' : 'text-taupe';
                  return (
                    <tr key={p.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-start gap-3">
                          <Link href={`/admin/products/${p.id}`} className="group/img art-tile relative block h-16 w-16 shrink-0 overflow-hidden border border-line" tabIndex={-1} aria-hidden>
                            <ProductMedia name={p.name} art={p.art} images={p.images} metal={p.metal} shape={p.shape} carat={p.carat} sizes="64px" />
                            {o.hoverImage && (
                              <span className="absolute inset-0 opacity-0 transition-opacity group-hover/img:opacity-100">
                                <ProductMedia name={p.name} art={p.art} images={p.images} metal={p.metal} shape={p.shape} carat={p.carat} view={1} sizes="64px" />
                              </span>
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link href={`/admin/products/${p.id}`} className="block max-w-[340px] truncate font-medium text-ink underline-offset-4 hover:underline">
                              {o.displayTitle}
                            </Link>
                            {o.title !== o.displayTitle && (
                              <p className="max-w-[340px] truncate text-[13px] text-taupe" title={o.title}>
                                {o.title}
                              </p>
                            )}
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-taupe">
                              <span className="font-mono text-[12.5px]">{o.familyKey}</span>
                              <span aria-hidden>·</span>
                              <span>{o.productType}</span>
                              <span aria-hidden>·</span>
                              <Link href={`${BASE}?category=${p.category.slug}`} className="hover:text-ink">
                                {p.category.name}
                              </Link>
                              {!p.category.isActive && <span className="text-[#7A5718]">(category hidden)</span>}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {p.catalog && <Badge tone="info">Catalogue</Badge>}
                              <ProductObjectButton object={o} name={o.displayTitle} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${table.tdRight} whitespace-nowrap`}>
                        <p>
                          {formatMoney(p.fromPrice)}
                          {o.priceTo > o.priceFrom && <span className="text-taupe"> – {formatMoney(o.priceTo * 100)}</span>}
                        </p>
                        {o.defaultPrice != null && <p className="text-[13px] text-taupe">Default {formatMoney(o.defaultPrice * 100)}</p>}
                      </td>
                      <td className={table.td}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {o.metalTypes.map((m) => {
                            const img = (o.colorImages as Record<string, string>)[m];
                            const swatch = METAL_COLORS.find((x) => x.label === m)?.swatch;
                            const isDefault = m === o.defaultMetalType;
                            return img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={m} src={img} alt={m} title={m} loading="lazy" className={`h-8 w-8 border object-cover ${isDefault ? 'border-ink' : 'border-line'}`} />
                            ) : (
                              <span key={m} title={m} className={`h-5 w-5 rounded-full border ${isDefault ? 'border-ink' : 'border-line'}`} style={{ background: swatch }} />
                            );
                          })}
                        </div>
                        <p className="mt-1 flex flex-wrap gap-1 text-[12.5px]">
                          {o.metalStamps.map((s) => (
                            <span key={s} className={`border px-1.5 ${s === o.defaultMetalStamp ? 'border-ink text-ink' : 'border-line text-taupe'}`}>
                              {s}
                            </span>
                          ))}
                        </p>
                      </td>
                      <td className={table.td}>
                        <p className="max-w-[220px] truncate text-[14px]" title={o.shapes.join(', ')}>
                          {o.shapes.slice(0, 3).join(', ') || '—'}
                          {o.shapes.length > 3 && <span className="text-taupe"> +{o.shapes.length - 3}</span>}
                        </p>
                        {carats.length > 0 && (
                          <p className="text-[13px] text-taupe">
                            {caratKind} {range(carats)}
                            {carats.length > 1 && ` · ${carats.length} sizes`}
                          </p>
                        )}
                        {o.lengths.length > 0 && <p className="text-[13px] text-taupe">{o.lengths.join(' / ')} in</p>}
                      </td>
                      <td className={table.tdRight}>
                        <p>{formatNumber(p.activeVariants)}</p>
                        {inactiveVariants > 0 && <p className="text-[13px] text-taupe">+{inactiveVariants} inactive</p>}
                        {o.defaultItemCode && <p className="font-mono text-[12px] text-taupe">{o.defaultItemCode}</p>}
                        {!p.catalog && <p className={`text-[13px] ${stockTone}`}>{formatNumber(p.stock)} in stock</p>}
                      </td>
                      <td className={table.td}>
                        <div className="flex flex-wrap gap-1">
                          {p.isFeatured && <Badge tone="gold">Featured</Badge>}
                          {p.isTrending && <Badge tone="info">Trending</Badge>}
                          {p.isNew && <Badge tone="success">New</Badge>}
                          {!p.isFeatured && !p.isTrending && !p.isNew && <span className="text-xs text-taupe">—</span>}
                        </div>
                      </td>
                      <td className={table.td}>
                        <ToggleAction checked={p.isActive} action={setProductActive.bind(null, p.id)} label={`${p.name} visible on store`} onLabel="Live" offLabel="Hidden" />
                      </td>
                      <td className={`${table.td} whitespace-nowrap`}>
                        <ProductActions id={p.id} slug={p.slug} name={p.name} isActive={p.isActive} duplicate={p.catalog ? undefined : duplicateProduct.bind(null, p.id)} remove={deleteProduct.bind(null, p.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          <Pagination page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} basePath={BASE} params={current} noun="products" />
        </>
      )}
    </>
  );
}
