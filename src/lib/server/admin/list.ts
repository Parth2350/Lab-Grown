import 'server-only';

/** Next 15 page searchParams (already awaited) */
export type SearchParams = Record<string, string | string[] | undefined>;

export function sp(params: SearchParams, key: string): string {
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? '';
}

export function spList(params: SearchParams, key: string): string[] {
  const v = params[key];
  const arr = Array.isArray(v) ? v : v ? v.split(',') : [];
  return arr.map((s) => s.trim()).filter(Boolean);
}

export function spNumber(params: SearchParams, key: string): number | undefined {
  const raw = sp(params, key);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** One of an allowed set, else the fallback */
export function spEnum<T extends string>(params: SearchParams, key: string, allowed: readonly T[], fallback: T): T;
export function spEnum<T extends string>(params: SearchParams, key: string, allowed: readonly T[]): T | undefined;
export function spEnum<T extends string>(params: SearchParams, key: string, allowed: readonly T[], fallback?: T) {
  const v = sp(params, key) as T;
  return allowed.includes(v) ? v : fallback;
}

/** yyyy-mm-dd → Date at local start (or end) of day */
export function spDate(params: SearchParams, key: string, endOfDay = false): Date | undefined {
  const raw = sp(params, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function paging(params: SearchParams, pageSize = 25) {
  const page = Math.max(1, Math.floor(spNumber(params, 'page') ?? 1));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Strip undefined/empty values — used to build pagination & filter links */
export function cleanParams(params: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    const val = Array.isArray(v) ? v.join(',') : v;
    if (val) out[k] = val;
  }
  return out;
}
