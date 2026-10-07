import 'server-only';
import { cache } from 'react';
import { Prisma, type Role } from '@prisma/client';
import { db } from '@/lib/server/db';
import { paging, sp, spEnum, type SearchParams } from '@/lib/server/admin/list';
import { REVENUE_STATUSES } from '@/components/admin/orders/status';

export const CUSTOMERS_PAGE_SIZE = 25;
export const CUSTOMER_SORTS = ['newest', 'spent', 'orders'] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];
const ROLES = ['CUSTOMER', 'ADMIN'] as const satisfies readonly Role[];

export function parseCustomerFilters(params: SearchParams) {
  return {
    q: sp(params, 'q').slice(0, 100),
    role: spEnum(params, 'role', ROLES) ?? ('' as const),
    sort: spEnum(params, 'sort', CUSTOMER_SORTS, 'newest'),
  };
}
type CustomerFilters = ReturnType<typeof parseCustomerFilters>;

function customerWhere(f: CustomerFilters): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];
  if (f.role) and.push({ role: f.role });
  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: 'insensitive' } },
        { email: { contains: f.q, mode: 'insensitive' } },
        { phone: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

/** Escape LIKE wildcards so a search for "50%" matches literally (backslash is Postgres' default escape). */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * One page of user ids ordered by lifetime spend or order count — aggregated in SQL so it scales
 * past the page (fully parameterised; the only interpolated fragments are constant SQL).
 */
async function idsByAggregate(f: CustomerFilters, sort: Exclude<CustomerSort, 'newest'>, skip: number, take: number) {
  const conds: Prisma.Sql[] = [];
  if (f.role) conds.push(Prisma.sql`u."role"::text = ${f.role}`);
  if (f.q) {
    const like = likePattern(f.q);
    conds.push(Prisma.sql`(u."name" ILIKE ${like} OR u."email" ILIKE ${like} OR u."phone" ILIKE ${like})`);
  }
  const whereSql = conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}` : Prisma.empty;
  const orderSql = sort === 'spent' ? Prisma.sql`"spend" DESC, "orderCount" DESC` : Prisma.sql`"orderCount" DESC, "spend" DESC`;
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT u."id",
           COUNT(o."id") AS "orderCount",
           COALESCE(SUM(o."total") FILTER (WHERE o."status"::text IN (${Prisma.join([...REVENUE_STATUSES])})), 0) AS "spend"
    FROM "users" u
    LEFT JOIN "orders" o ON o."userId" = u."id"
    ${whereSql}
    GROUP BY u."id"
    ORDER BY ${orderSql}, u."createdAt" DESC, u."id" DESC
    LIMIT ${take} OFFSET ${skip}`;
  return rows.map((r) => r.id);
}

/** Order count / last order / spend for a set of users (two grouped queries). */
export async function customerAggregates(userIds: string[]) {
  if (!userIds.length) return new Map<string, { orders: number; spend: number; paidOrders: number; lastOrderAt: Date | null }>();
  const [all, revenue] = await Promise.all([
    db.order.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { _all: true }, _max: { createdAt: true } }),
    db.order.groupBy({ by: ['userId'], where: { userId: { in: userIds }, status: { in: [...REVENUE_STATUSES] } }, _count: { _all: true }, _sum: { total: true } }),
  ]);
  const rev = new Map(revenue.map((r) => [r.userId, r]));
  const out = new Map<string, { orders: number; spend: number; paidOrders: number; lastOrderAt: Date | null }>();
  for (const id of userIds) out.set(id, { orders: 0, spend: 0, paidOrders: 0, lastOrderAt: null });
  for (const a of all) {
    if (!a.userId) continue;
    const r = rev.get(a.userId);
    out.set(a.userId, { orders: a._count._all, lastOrderAt: a._max.createdAt, spend: r?._sum.total ?? 0, paidOrders: r?._count._all ?? 0 });
  }
  return out;
}

export async function listCustomers(params: SearchParams) {
  const f = parseCustomerFilters(params);
  const where = customerWhere(f);
  const { page, skip, take, pageSize } = paging(params, CUSTOMERS_PAGE_SIZE);
  const [total, ids, roleCounts] = await Promise.all([
    db.user.count({ where }),
    f.sort === 'newest'
      ? db.user.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take, select: { id: true } }).then((r) => r.map((u) => u.id))
      : idsByAggregate(f, f.sort, skip, take),
    db.user.groupBy({ by: ['role'], where: customerWhere({ ...f, role: '' }), _count: { _all: true } }),
  ]);
  const [users, aggregates] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } }),
    customerAggregates(ids),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const rows = ids.flatMap((id) => {
    const u = byId.get(id);
    if (!u) return [];
    const a = aggregates.get(id) ?? { orders: 0, spend: 0, paidOrders: 0, lastOrderAt: null };
    return [{ ...u, ...a }];
  });
  const roles = Object.fromEntries(roleCounts.map((r) => [r.role, r._count._all])) as Partial<Record<Role, number>>;
  return { filters: f, total, page, pageSize, rows, roleCounts: { all: (roles.ADMIN ?? 0) + (roles.CUSTOMER ?? 0), ADMIN: roles.ADMIN ?? 0, CUSTOMER: roles.CUSTOMER ?? 0 } };
}

// ───────────────────────────── detail ─────────────────────────────

export const CUSTOMER_ORDERS_SHOWN = 25;

export const getCustomerDetail = cache(async (id: string) => {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, label: true, firstName: true, lastName: true, phone: true, line1: true, line2: true, city: true, state: true, postalCode: true, country: true, isDefault: true },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: CUSTOMER_ORDERS_SHOWN,
        select: { id: true, number: true, createdAt: true, status: true, total: true, payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } } },
      },
      _count: { select: { orders: true, reviews: true, returns: true, addresses: true } },
    },
  });
  if (!user) return null;
  const [aggregates, adminCount, withPassword] = await Promise.all([
    customerAggregates([user.id]),
    db.user.count({ where: { role: 'ADMIN' } }),
    // never load the hash itself — only whether one exists
    db.user.count({ where: { id: user.id, passwordHash: { not: null } } }),
  ]);
  return {
    ...user,
    hasPassword: withPassword > 0,
    stats: aggregates.get(user.id) ?? { orders: 0, spend: 0, paidOrders: 0, lastOrderAt: null },
    adminCount,
  };
});

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;
