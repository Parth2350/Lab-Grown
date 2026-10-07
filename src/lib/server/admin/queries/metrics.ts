import 'server-only';
import { Prisma, type OrderStatus } from '@prisma/client';
import { db } from '@/lib/server/db';

/**
 * Reporting primitives shared by the dashboard and analytics.
 * Revenue is recognised for orders that were paid and not cancelled/refunded.
 * Time buckets are UTC calendar months / ISO weeks (Monday) — the same buckets Postgres date_trunc produces.
 */
export const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const REVENUE_SQL = Prisma.sql`o.status::text IN ('PAID','PROCESSING','SHIPPED','DELIVERED')`;

export type Bucket = { key: string; label: string; title: string };

const MONTH_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const MONTH_LONG = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const DAY_MONTH = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const pad = (n: number) => String(n).padStart(2, '0');

/** Start (UTC) of the month `back` months before the current one */
export function monthStart(back = 0, now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
}

/** The last `n` calendar months, oldest first; the current month is flagged "month to date". */
export function monthBuckets(n: number, now = new Date()): Bucket[] {
  return Array.from({ length: n }, (_, i) => {
    const d = monthStart(n - 1 - i, now);
    const key = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    const current = i === n - 1;
    const short = MONTH_SHORT.format(d);
    return { key, label: d.getUTCMonth() === 0 || i === 0 ? `${short} ’${String(d.getUTCFullYear()).slice(2)}` : short, title: `${MONTH_LONG.format(d)}${current ? ' · month to date' : ''}` };
  });
}

/** Monday 00:00 UTC of the ISO week containing `d` */
function weekStartUTC(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}

export function weekBuckets(n: number, now = new Date()): (Bucket & { start: Date })[] {
  const thisWeek = weekStartUTC(now);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(thisWeek.getTime() - (n - 1 - i) * 7 * 86_400_000);
    const key = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    return { key, start: d, label: DAY_MONTH.format(d), title: `Week of ${DAY_MONTH.format(d)}${i === n - 1 ? ' · to date' : ''}` };
  });
}

const num = (v: unknown) => (typeof v === 'bigint' ? Number(v) : typeof v === 'number' ? v : v == null ? 0 : Number(v));

// ───────────────────────────── series ─────────────────────────────

export type MonthRow = { key: string; revenue: number; orders: number; discount: number; units: number };

/** Revenue, paid orders, discounts per month since `since` */
export async function revenueByMonth(since: Date): Promise<Map<string, MonthRow>> {
  const rows = await db.$queryRaw<{ m: string; revenue: bigint; orders: number; discount: bigint }[]>(Prisma.sql`
    SELECT to_char(date_trunc('month', o."createdAt"), 'YYYY-MM') AS m,
           COALESCE(SUM(o.total), 0)::bigint AS revenue,
           COUNT(*)::int AS orders,
           COALESCE(SUM(o.discount), 0)::bigint AS discount
    FROM orders o
    WHERE ${REVENUE_SQL} AND o."createdAt" >= ${since}
    GROUP BY 1`);
  const units = await db.$queryRaw<{ m: string; units: bigint }[]>(Prisma.sql`
    SELECT to_char(date_trunc('month', o."createdAt"), 'YYYY-MM') AS m, COALESCE(SUM(oi.quantity), 0)::bigint AS units
    FROM order_items oi JOIN orders o ON o.id = oi."orderId"
    WHERE ${REVENUE_SQL} AND o."createdAt" >= ${since}
    GROUP BY 1`);
  const unitsBy = new Map(units.map((u) => [u.m, num(u.units)]));
  return new Map(rows.map((r) => [r.m, { key: r.m, revenue: num(r.revenue), orders: num(r.orders), discount: num(r.discount), units: unitsBy.get(r.m) ?? 0 }]));
}

/** All orders placed (any status) per ISO week since `since` */
export async function ordersByWeek(since: Date): Promise<Map<string, { placed: number; paid: number }>> {
  const rows = await db.$queryRaw<{ w: string; placed: number; paid: number }[]>(Prisma.sql`
    SELECT to_char(date_trunc('week', o."createdAt"), 'YYYY-MM-DD') AS w,
           COUNT(*)::int AS placed,
           (COUNT(*) FILTER (WHERE ${REVENUE_SQL}))::int AS paid
    FROM orders o
    WHERE o."createdAt" >= ${since}
    GROUP BY 1`);
  return new Map(rows.map((r) => [r.w, { placed: num(r.placed), paid: num(r.paid) }]));
}

/** New customer accounts per month */
export async function signupsByMonth(since: Date): Promise<Map<string, number>> {
  const rows = await db.$queryRaw<{ m: string; n: number }[]>(Prisma.sql`
    SELECT to_char(date_trunc('month', u."createdAt"), 'YYYY-MM') AS m, COUNT(*)::int AS n
    FROM users u
    WHERE u.role::text = 'CUSTOMER' AND u."createdAt" >= ${since}
    GROUP BY 1`);
  return new Map(rows.map((r) => [r.m, num(r.n)]));
}

/** Distinct buying customers per month split into first-time vs returning (by email, across all history) */
export async function newVsReturningByMonth(since: Date): Promise<Map<string, { newCustomers: number; returning: number }>> {
  const rows = await db.$queryRaw<{ m: string; new_customers: number; returning_customers: number }[]>(Prisma.sql`
    WITH paid AS (
      SELECT lower(o.email) AS e, o."createdAt" AS at FROM orders o WHERE ${REVENUE_SQL}
    ), firsts AS (
      SELECT e, MIN(at) AS first_at FROM paid GROUP BY e
    )
    SELECT to_char(date_trunc('month', p.at), 'YYYY-MM') AS m,
           (COUNT(DISTINCT p.e) FILTER (WHERE date_trunc('month', f.first_at) = date_trunc('month', p.at)))::int AS new_customers,
           (COUNT(DISTINCT p.e) FILTER (WHERE date_trunc('month', f.first_at) < date_trunc('month', p.at)))::int AS returning_customers
    FROM paid p JOIN firsts f ON f.e = p.e
    WHERE p.at >= ${since}
    GROUP BY 1`);
  return new Map(rows.map((r) => [r.m, { newCustomers: num(r.new_customers), returning: num(r.returning_customers) }]));
}

// ───────────────────────────── breakdowns ─────────────────────────────

export type ProductSales = { productId: string | null; name: string; slug: string | null; revenue: number; units: number; orders: number };

/** Top products by merchandise revenue (line totals, before order-level discounts) */
export async function topProducts(since: Date | null, limit: number): Promise<ProductSales[]> {
  const rows = await db.$queryRaw<{ product_id: string | null; name: string; slug: string | null; revenue: bigint; units: bigint; orders: number }[]>(Prisma.sql`
    SELECT MAX(oi."productId") AS product_id,
           COALESCE(MAX(p.name), MAX(oi.name)) AS name,
           COALESCE(MAX(p.slug), MAX(oi.slug)) AS slug,
           SUM(oi."lineTotal")::bigint AS revenue,
           SUM(oi.quantity)::bigint AS units,
           COUNT(DISTINCT oi."orderId")::int AS orders
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    LEFT JOIN products p ON p.id = oi."productId"
    WHERE ${REVENUE_SQL} ${since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty}
    GROUP BY COALESCE(oi."productId", oi.name)
    ORDER BY revenue DESC
    LIMIT ${limit}`);
  return rows.map((r) => ({ productId: r.product_id, name: r.name, slug: r.slug, revenue: num(r.revenue), units: num(r.units), orders: num(r.orders) }));
}

export type Slice = { key: string; label: string; revenue: number; units: number };

export async function salesByCategory(since: Date | null): Promise<Slice[]> {
  const rows = await db.$queryRaw<{ slug: string | null; name: string | null; revenue: bigint; units: bigint }[]>(Prisma.sql`
    SELECT c.slug, c.name, SUM(oi."lineTotal")::bigint AS revenue, SUM(oi.quantity)::bigint AS units
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    LEFT JOIN products p ON p.id = oi."productId"
    LEFT JOIN categories c ON c.id = p."categoryId"
    WHERE ${REVENUE_SQL} ${since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty}
    GROUP BY c.slug, c.name
    ORDER BY revenue DESC`);
  return rows.map((r) => ({ key: r.slug ?? 'unassigned', label: r.name ?? 'Deleted products', revenue: num(r.revenue), units: num(r.units) }));
}

/** Merchandise sales grouped by an order-item snapshot column (metal colour or purity) */
export async function salesByItemField(field: 'metalColor' | 'purity', since: Date | null): Promise<Slice[]> {
  const col = field === 'metalColor' ? Prisma.sql`oi."metalColor"` : Prisma.sql`oi.purity`;
  const rows = await db.$queryRaw<{ k: string; revenue: bigint; units: bigint }[]>(Prisma.sql`
    SELECT ${col} AS k, SUM(oi."lineTotal")::bigint AS revenue, SUM(oi.quantity)::bigint AS units
    FROM order_items oi
    JOIN orders o ON o.id = oi."orderId"
    WHERE ${REVENUE_SQL} ${since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty}
    GROUP BY 1
    ORDER BY revenue DESC`);
  return rows.map((r) => ({ key: r.k, label: r.k, revenue: num(r.revenue), units: num(r.units) }));
}

/** Repeat-purchase stats by customer email (guests included) */
export async function buyerStats(since: Date | null) {
  const [row] = await db.$queryRaw<{ buyers: number; returning: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS buyers, (COUNT(*) FILTER (WHERE c >= 2))::int AS returning
    FROM (
      SELECT lower(o.email) AS e, COUNT(*) AS c FROM orders o
      WHERE ${REVENUE_SQL} ${since ? Prisma.sql`AND o."createdAt" >= ${since}` : Prisma.empty}
      GROUP BY 1
    ) t`);
  return { buyers: num(row?.buyers), returning: num(row?.returning) };
}
