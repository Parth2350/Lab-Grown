import Link from 'next/link';
import { Copy, ExternalLink, Gem, Pencil, Plus, Trash2 } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cn } from '@/lib/utils';
import { CERT_LABS, DIAMOND_CLARITIES, DIAMOND_COLORS, DIAMOND_CUTS, SHAPES, label } from '@/lib/catalog';
import { cleanParams, pageCount, paging, type SearchParams } from '@/lib/server/admin/list';
import { deleteDiamond, setDiamondAvailable } from '@/lib/server/admin/actions/diamonds';
import { diamondSummary, hasDiamondFilters, listAdminDiamonds, parseDiamondFilters } from '@/lib/server/admin/queries/diamonds';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { Button, ButtonLink } from '@/components/ui/Button';
import { DIAMOND_SORTS } from '@/components/admin/diamonds/options';
import { ActionButton, AutoSubmitSelect, ToggleAction } from '@/components/admin/forms';
import { formatMoney, formatMoneyCompact, formatNumber } from '@/components/admin/format';
import { Badge, EmptyState, FilterBar, FilterLabel, MiniStat, PageHeader, Pagination, TableWrap, fieldSm, selectChevron, selectSm, table } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Diamonds', path: '/admin/diamonds', noIndex: true });

const PAGE_SIZE = 50;
const iconBtn = 'inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white hover:text-ink';

/** Select options for a list filter; a multi-value URL selection (color=D,E) appears as its own option. */
function listOptions(all: readonly string[], selected: string[]) {
  const value = selected.join(',');
  const extra = selected.length > 1 ? [{ value, label: selected.join(', ') }] : [];
  return { value, options: [...extra, ...all.map((v) => ({ value: v, label: v }))] };
}

export default async function DiamondsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const f = parseDiamondFilters(params);
  const pg = paging(params, PAGE_SIZE);
  const [{ rows, total }, summary] = await Promise.all([listAdminDiamonds(f, pg), diamondSummary(f)]);
  const current = cleanParams(params);
  const filtered = hasDiamondFilters(f);
  const colors = listOptions(DIAMOND_COLORS, f.colors);
  const clarities = listOptions(DIAMOND_CLARITIES, f.clarities);

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Diamonds"
        description="Loose certified lab-grown stones offered as centre stones. Availability and price changes update the “from” price of every matching setting."
        actions={
          <ButtonLink href="/admin/diamonds/new" size="sm">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Add diamond
          </ButtonLink>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <div className="bg-white px-5 py-4">
          <MiniStat label={filtered ? 'Matching stones' : 'Stones'} value={formatNumber(total)} hint={filtered ? 'For current filters' : 'In inventory'} />
        </div>
        <div className="bg-white px-5 py-4">
          <MiniStat label="Available" value={formatNumber(summary.available)} hint={total ? `${Math.round((summary.available / total) * 100)}% of ${filtered ? 'matches' : 'inventory'}` : undefined} />
        </div>
        <div className="bg-white px-5 py-4">
          <MiniStat label="Available value" value={formatMoneyCompact(summary.value)} hint={summary.value ? formatMoney(summary.value) : 'Nothing available'} />
        </div>
        <div className="bg-white px-5 py-4">
          <MiniStat label="Average price" value={summary.available ? formatMoney(summary.avgPrice) : '—'} hint={summary.available ? `Avg. ${summary.avgCarat.toFixed(2)} ct` : undefined} />
        </div>
      </div>

      <FilterBar action="/admin/diamonds">
        <div>
          <FilterLabel htmlFor="f-q">Search</FilterLabel>
          <input id="f-q" name="q" type="search" defaultValue={f.q} placeholder="SKU or certificate #" className={cn(fieldSm, 'w-48')} />
        </div>
        <div>
          <FilterLabel htmlFor="f-shape">Shape</FilterLabel>
          <AutoSubmitSelect id="f-shape" name="shape" defaultValue={f.shape ?? ''} className={cn(selectSm, 'w-32')} style={selectChevron}>
            <option value="">All shapes</option>
            {SHAPES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <fieldset>
          <legend className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">Carat</legend>
          <div className="flex items-center gap-1">
            <label htmlFor="f-cmin" className="sr-only">
              Minimum carat
            </label>
            <input id="f-cmin" name="caratMin" type="number" inputMode="decimal" step="0.01" min={0} defaultValue={f.caratMin ?? ''} placeholder="Min" className={cn(fieldSm, 'w-[72px] px-2')} />
            <span className="text-taupe" aria-hidden>
              –
            </span>
            <label htmlFor="f-cmax" className="sr-only">
              Maximum carat
            </label>
            <input id="f-cmax" name="caratMax" type="number" inputMode="decimal" step="0.01" min={0} defaultValue={f.caratMax ?? ''} placeholder="Max" className={cn(fieldSm, 'w-[72px] px-2')} />
          </div>
        </fieldset>
        <div>
          <FilterLabel htmlFor="f-color">Colour</FilterLabel>
          <AutoSubmitSelect id="f-color" name="color" defaultValue={colors.value} className={cn(selectSm, 'w-24')} style={selectChevron}>
            <option value="">All</option>
            {colors.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="f-clarity">Clarity</FilterLabel>
          <AutoSubmitSelect id="f-clarity" name="clarity" defaultValue={clarities.value} className={cn(selectSm, 'w-28')} style={selectChevron}>
            <option value="">All</option>
            {clarities.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="f-cut">Cut</FilterLabel>
          <AutoSubmitSelect id="f-cut" name="cut" defaultValue={f.cut ?? ''} className={cn(selectSm, 'w-32')} style={selectChevron}>
            <option value="">All</option>
            {DIAMOND_CUTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="f-lab">Lab</FilterLabel>
          <AutoSubmitSelect id="f-lab" name="lab" defaultValue={f.lab ?? ''} className={cn(selectSm, 'w-24')} style={selectChevron}>
            <option value="">All</option>
            {CERT_LABS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <div>
          <FilterLabel htmlFor="f-available">Availability</FilterLabel>
          <AutoSubmitSelect id="f-available" name="available" defaultValue={f.available ?? ''} className={cn(selectSm, 'w-32')} style={selectChevron}>
            <option value="">All</option>
            <option value="yes">Available</option>
            <option value="no">Unavailable</option>
          </AutoSubmitSelect>
        </div>
        <fieldset>
          <legend className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">Price ($)</legend>
          <div className="flex items-center gap-1">
            <label htmlFor="f-pmin" className="sr-only">
              Minimum price in dollars
            </label>
            <input id="f-pmin" name="priceMin" type="number" inputMode="numeric" min={0} step={1} defaultValue={f.priceMin ?? ''} placeholder="Min" className={cn(fieldSm, 'w-[84px] px-2')} />
            <span className="text-taupe" aria-hidden>
              –
            </span>
            <label htmlFor="f-pmax" className="sr-only">
              Maximum price in dollars
            </label>
            <input id="f-pmax" name="priceMax" type="number" inputMode="numeric" min={0} step={1} defaultValue={f.priceMax ?? ''} placeholder="Max" className={cn(fieldSm, 'w-[84px] px-2')} />
          </div>
        </fieldset>
        <div>
          <FilterLabel htmlFor="f-sort">Sort</FilterLabel>
          <AutoSubmitSelect id="f-sort" name="sort" defaultValue={f.sort} className={cn(selectSm, 'w-44')} style={selectChevron}>
            {DIAMOND_SORTS.map((s) => (
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
          {(filtered || f.sort !== 'newest') && (
            <Link href="/admin/diamonds" className="px-1 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
              Reset
            </Link>
          )}
        </div>
      </FilterBar>

      {rows.length === 0 ? (
        <div className="border border-line bg-white">
          <EmptyState
            icon={<Gem className="h-5 w-5" strokeWidth={1.25} />}
            title={filtered ? 'No diamonds match these filters' : 'No diamonds yet'}
            description={filtered ? 'Try widening the carat or price range, or clear a grade filter.' : 'Add your first certified stone to start selling centre-stone settings.'}
            action={
              filtered ? (
                <ButtonLink href="/admin/diamonds" size="sm" variant="outline">
                  Clear filters
                </ButtonLink>
              ) : (
                <ButtonLink href="/admin/diamonds/new" size="sm">
                  Add diamond
                </ButtonLink>
              )
            }
          />
        </div>
      ) : (
        <>
          <TableWrap>
            <table className={cn(table.base, 'min-w-[1100px]')}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Shape</th>
                  <th className={table.th}>SKU</th>
                  <th className={table.thRight}>Carat</th>
                  <th className={table.th}>Colour</th>
                  <th className={table.th}>Clarity</th>
                  <th className={table.th}>Cut</th>
                  <th className={table.th}>Certificate</th>
                  <th className={table.thRight}>Price</th>
                  <th className={table.th}>Available</th>
                  <th className={table.th}>Orders</th>
                  <th className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const ordered = d._count.orderItems;
                  const inCarts = d._count.cartItems;
                  return (
                    <tr key={d.id} className={cn(table.row, !d.isAvailable && 'bg-porcelain/40')}>
                      <td className={table.td}>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <ShapeIcon shape={d.shape} size={22} className="text-charcoal" />
                          {label.shape(d.shape)}
                        </span>
                      </td>
                      <td className={table.td}>
                        <Link href={`/admin/diamonds/${d.id}`} className="font-mono text-[12.5px] underline-offset-4 hover:underline">
                          {d.sku}
                        </Link>
                        <p className="text-[11px] text-taupe">{d.growth}</p>
                      </td>
                      <td className={table.tdRight}>{d.carat.toFixed(2)} ct</td>
                      <td className={table.td}>{d.color}</td>
                      <td className={table.td}>{d.clarity}</td>
                      <td className={table.td}>{d.cut}</td>
                      <td className={table.td}>
                        {d.certificate ? (
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Badge tone={d.certificate.lab === 'GIA' ? 'info' : 'gold'}>{d.certificate.lab}</Badge>
                            {d.certificate.url ? (
                              <a
                                href={d.certificate.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[12px] underline-offset-4 hover:underline"
                                aria-label={`${d.certificate.lab} report ${d.certificate.number} (opens in a new tab)`}
                              >
                                {d.certificate.number}
                                <ExternalLink className="h-3 w-3 text-taupe" strokeWidth={1.5} aria-hidden />
                              </a>
                            ) : (
                              <span className="font-mono text-[12px] text-charcoal">{d.certificate.number}</span>
                            )}
                          </span>
                        ) : (
                          <Badge tone="warning">No certificate</Badge>
                        )}
                      </td>
                      <td className={table.tdRight}>{formatMoney(d.price)}</td>
                      <td className={table.td}>
                        <ToggleAction checked={d.isAvailable} action={setDiamondAvailable.bind(null, d.id)} label={`${d.sku} available`} onLabel="Yes" offLabel="No" />
                      </td>
                      <td className={table.td}>
                        {ordered ? (
                          <Badge tone="info" dot title={`Appears on ${ordered} order line${ordered === 1 ? '' : 's'}`}>
                            {ordered} order{ordered === 1 ? '' : 's'}
                          </Badge>
                        ) : (
                          <span className="text-taupe">—</span>
                        )}
                        {inCarts > 0 && <p className="mt-0.5 text-[11px] text-taupe">In {inCarts} cart{inCarts === 1 ? '' : 's'}</p>}
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-right`}>
                        <Link href={`/admin/diamonds/${d.id}`} className={iconBtn} aria-label={`Edit ${d.sku}`} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={1.4} />
                        </Link>
                        <Link href={`/admin/diamonds/new?from=${d.id}`} className={iconBtn} aria-label={`Duplicate ${d.sku} as a new diamond`} title="Duplicate">
                          <Copy className="h-4 w-4" strokeWidth={1.4} />
                        </Link>
                        <ActionButton
                          variant="icon"
                          title={`Delete ${d.sku}`}
                          icon={<Trash2 className="h-4 w-4" strokeWidth={1.4} />}
                          action={deleteDiamond.bind(null, d.id, false)}
                          confirm={
                            ordered
                              ? undefined
                              : {
                                  title: `Delete ${d.sku}?`,
                                  description: 'The stone and its certificate record will be permanently removed from inventory. To pause it instead, switch Available off.',
                                  confirmLabel: 'Delete',
                                }
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          <Pagination page={pg.page} pageCount={pageCount(total, PAGE_SIZE)} total={total} pageSize={PAGE_SIZE} basePath="/admin/diamonds" params={current} noun="diamonds" />
        </>
      )}
    </>
  );
}
