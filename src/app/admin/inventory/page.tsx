import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cn } from '@/lib/utils';
import { METAL_COLORS, PURITIES, label } from '@/lib/catalog';
import { cleanParams, pageCount, paging, type SearchParams } from '@/lib/server/admin/list';
import { readStoreSettings } from '@/lib/server/admin/settings';
import { categoryOptions } from '@/lib/server/admin/queries/categories';
import { INVENTORY_SORTS, inventoryStats, inventoryTabCounts, listInventory, parseInventoryFilters } from '@/lib/server/admin/queries/inventory';
import { Button, ButtonLink } from '@/components/ui/Button';
import { InventoryGrid, type InventoryRow } from '@/components/admin/inventory/InventoryGrid';
import { AutoSubmitSelect } from '@/components/admin/forms';
import { formatNumber } from '@/components/admin/format';
import { EmptyState, FilterBar, FilterLabel, MiniStat, PageHeader, Pagination, Tabs, fieldSm, selectChevron, selectSm } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Inventory', path: '/admin/inventory', noIndex: true });

const PAGE_SIZE = 50;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const f = parseInventoryFilters(params);
  const pg = paging(params, PAGE_SIZE);
  const settings = await readStoreSettings();
  const threshold = Math.max(0, Math.floor(settings.lowStockThreshold));

  const [{ rows, total }, stats, tabs, categories] = await Promise.all([
    listInventory(f, threshold, pg),
    inventoryStats(threshold),
    inventoryTabCounts(f, threshold),
    categoryOptions(),
  ]);
  const current = cleanParams(params);
  const filtered = Boolean(f.q || f.category || f.metal || f.purity);

  const gridRows: InventoryRow[] = rows.map((v) => ({
    id: v.id,
    sku: v.sku,
    purity: v.purity,
    metal: label.metal(v.metalColor),
    price: v.price,
    stock: v.stock,
    isActive: v.isActive,
    productId: v.product.id,
    productName: v.product.name,
    productSku: v.product.sku,
    productActive: v.product.isActive,
    categoryName: v.product.category.name,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Inventory"
        description={
          <>
            Stock per metal variant. Variants at or below the low-stock threshold ({formatNumber(threshold)}) are flagged; at 0 they show as sold out in the store. The threshold is set in{' '}
            <Link href="/admin/settings" className="underline underline-offset-4 hover:text-ink">
              Settings
            </Link>
            .
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <div className="bg-white px-5 py-4">
          <MiniStat label="Units in stock" value={formatNumber(stats.units)} hint={`Across ${formatNumber(stats.variants)} variants`} />
        </div>
        <div className="bg-white px-5 py-4">
          <MiniStat label="Low stock" value={formatNumber(stats.low)} hint={`≤ ${formatNumber(threshold)} units, incl. sold out`} />
        </div>
        <div className="bg-white px-5 py-4">
          <MiniStat label="Out of stock" value={<span className={stats.out ? 'text-danger' : undefined}>{formatNumber(stats.out)}</span>} hint="0 units" />
        </div>
        <div className="bg-white px-5 py-4">
          <MiniStat label="Healthy" value={formatNumber(stats.variants - stats.low)} hint={`Above ${formatNumber(threshold)} units`} />
        </div>
      </div>

      <Tabs
        param="stock"
        basePath="/admin/inventory"
        params={current}
        active={f.stock === 'all' ? '' : f.stock}
        tabs={[
          { value: '', label: 'All variants', count: tabs.all },
          { value: 'low', label: 'Low stock', count: tabs.low },
          { value: 'out', label: 'Out of stock', count: tabs.out },
        ]}
      />

      <FilterBar action="/admin/inventory">
        {f.stock !== 'all' && <input type="hidden" name="stock" value={f.stock} />}
        <div>
          <FilterLabel htmlFor="i-q">Search</FilterLabel>
          <input id="i-q" name="q" type="search" defaultValue={f.q} placeholder="Product, product SKU or variant SKU" className={cn(fieldSm, 'w-64')} />
        </div>
        <div>
          <FilterLabel htmlFor="i-category">Category</FilterLabel>
          <AutoSubmitSelect id="i-category" name="category" defaultValue={f.category ?? ''} className={cn(selectSm, 'w-44')} style={selectChevron}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="i-metal">Metal</FilterLabel>
          <AutoSubmitSelect id="i-metal" name="metal" defaultValue={f.metal ?? ''} className={cn(selectSm, 'w-48')} style={selectChevron}>
            <option value="">All metals</option>
            {METAL_COLORS.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="i-purity">Purity</FilterLabel>
          <AutoSubmitSelect id="i-purity" name="purity" defaultValue={f.purity ?? ''} className={cn(selectSm, 'w-24')} style={selectChevron}>
            <option value="">All</option>
            {PURITIES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="i-sort">Sort</FilterLabel>
          <AutoSubmitSelect id="i-sort" name="sort" defaultValue={f.sort} className={cn(selectSm, 'w-48')} style={selectChevron}>
            {INVENTORY_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" variant="outline">
            Apply
          </Button>
          {(filtered || params.sort) && (
            <Link href={f.stock === 'all' ? '/admin/inventory' : `/admin/inventory?stock=${f.stock}`} className="px-1 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
              Reset
            </Link>
          )}
        </div>
      </FilterBar>

      {gridRows.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<Boxes className="h-5 w-5" strokeWidth={1.25} />}
            title={f.stock === 'out' && !filtered ? 'Nothing is out of stock' : f.stock === 'low' && !filtered ? 'No low-stock variants' : 'No variants match'}
            description={
              f.stock !== 'all' && !filtered
                ? `Every variant has more than ${f.stock === 'low' ? formatNumber(threshold) : '0'} units. Nice.`
                : 'Try a different search term or clear the filters.'
            }
            action={
              <ButtonLink href="/admin/inventory" size="sm" variant="outline">
                View all variants
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <InventoryGrid rows={gridRows} threshold={threshold} />
          <Pagination page={pg.page} pageCount={pageCount(total, PAGE_SIZE)} total={total} pageSize={PAGE_SIZE} basePath="/admin/inventory" params={current} noun="variants" />
        </>
      )}
    </>
  );
}
