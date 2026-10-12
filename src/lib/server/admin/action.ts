import 'server-only';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z, type ZodError, type ZodTypeAny } from 'zod';
import { assertAdmin } from '@/lib/server/auth';
import { UploadError } from '@/lib/server/storage';
import type { ActionResult } from './types';

/**
 * Shared plumbing for admin server actions:
 *
 *   export async function saveThing(_: FormState, fd: FormData): Promise<FormState> {
 *     return adminAction(async () => {
 *       const data = parse(thingSchema, formObject(fd));   // throws ValidationError
 *       await db.thing.update(...);
 *       await revalidateCatalog();
 *       revalidatePath('/admin/things');
 *       return ok('Saved');
 *     });
 *   }
 *
 * `adminAction` authorises first (assertAdmin), then maps validation, unique-constraint,
 * upload and auth failures to a friendly `{ ok: false, message, fieldErrors }`.
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** A user-facing failure (message is shown verbatim). */
export class ActionError extends Error {}

/**
 * Refresh every admin route (pages + the sidebar attention counts in the layout).
 * Call after every admin mutation, in addition to revalidateCatalog()/revalidateSettings().
 */
export function revalidateAdmin() {
  revalidatePath('/admin', 'layout');
}

export function ok<T>(message?: string, data?: T): ActionResult<T> {
  return { ok: true, message, data };
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

export function zodFieldErrors(err: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Parse with zod; throws ValidationError with per-field messages on failure. */
export function parse<S extends ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const res = schema.safeParse(input);
  if (!res.success) {
    const fieldErrors = zodFieldErrors(res.error);
    const first = Object.values(fieldErrors)[0];
    throw new ValidationError(first ? `Please check the form — ${/^[A-Z][a-z]/.test(first) ? first.charAt(0).toLowerCase() + first.slice(1) : first}` : 'Please check the form', fieldErrors);
  }
  return res.data;
}

function uniqueMessage(e: Prisma.PrismaClientKnownRequestError) {
  const target = (e.meta?.target as string[] | string | undefined) ?? '';
  const fields = Array.isArray(target) ? target.join(', ') : String(target);
  if (/slug/i.test(fields)) return { message: 'That slug is already in use.', field: 'slug' };
  if (/sku/i.test(fields)) return { message: 'That SKU is already in use.', field: 'sku' };
  if (/code/i.test(fields)) return { message: 'That code already exists.', field: 'code' };
  if (/number/i.test(fields)) return { message: 'That number is already in use.', field: 'number' };
  if (/email/i.test(fields)) return { message: 'That email is already in use.', field: 'email' };
  return { message: 'A record with these details already exists.', field: '_' };
}

/** Authorise + run + map errors. Never throws. */
export async function adminAction<T>(fn: (admin: Awaited<ReturnType<typeof assertAdmin>>) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  let admin: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    admin = await assertAdmin();
  } catch {
    return fail('Your session has expired or you are not an administrator. Please sign in again.');
  }
  try {
    return await fn(admin);
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message, e.fieldErrors);
    if (e instanceof ActionError || e instanceof UploadError) return fail(e.message);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        const u = uniqueMessage(e);
        return fail(u.message, { [u.field]: u.message });
      }
      if (e.code === 'P2025') return fail('This record no longer exists — it may have been deleted.');
      if (e.code === 'P2003') return fail('This record is still referenced by other data and cannot be changed this way.');
    }
    // Re-throw Next.js control-flow errors (redirect / notFound)
    if (e && typeof e === 'object' && 'digest' in e && typeof (e as { digest?: unknown }).digest === 'string' && /^NEXT_/.test((e as { digest: string }).digest)) throw e;
    console.error('[admin action]', e);
    return fail('Something went wrong while saving. Please try again.');
  }
}

// ───────────────────────────── FormData helpers ─────────────────────────────

/** FormData → plain object; repeated keys become arrays, files are skipped. Trims strings. */
export function formObject(fd: FormData) {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith('$ACTION')) continue;
    const values = fd.getAll(key).filter((v): v is string => typeof v === 'string').map((v) => v.trim());
    if (!values.length) continue;
    out[key] = values.length === 1 && !key.endsWith('[]') ? values[0] : values;
  }
  return out;
}

export function fdString(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export function fdBool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === 'on' || v === 'true' || v === '1';
}

export function fdFiles(fd: FormData, key: string) {
  return fd.getAll(key).filter((v): v is File => typeof v === 'object' && v !== null && 'arrayBuffer' in v && (v as File).size > 0);
}

// ───────────────────────────── zod building blocks ─────────────────────────────

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

/** Optional trimmed string → null when blank */
export const zOptText = (max = 500) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().trim().max(max, `Must be ${max} characters or fewer`).nullable().optional()).transform((v) => v ?? null);

export const zText = (label: string, max = 200) => z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

/** Checkbox → boolean */
export const zCheckbox = z.preprocess((v) => v === 'on' || v === 'true' || v === '1' || v === true, z.boolean());

/** Rupees (string/number, ₹ and commas allowed) → integer paise */
export const zMoney = (label = 'Amount', { min = 0, max = 10_000_000 } = {}) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/[$₹,\s]/g, '') : v),
    z.coerce
      .number({ invalid_type_error: `${label} must be a number` })
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} is too large`),
  ).transform((d) => Math.round(d * 100));

export const zOptMoney = (label = 'Amount') =>
  z.preprocess((v) => (typeof v === 'string' ? (v.replace(/[$₹,\s]/g, '') === '' ? undefined : v.replace(/[$₹,\s]/g, '')) : v), z.coerce.number({ invalid_type_error: `${label} must be a number` }).min(0, `${label} cannot be negative`).max(10_000_000).optional()).transform((d) => (d == null ? null : Math.round(d * 100)));

export const zInt = (label: string, { min = 0, max = 1_000_000 } = {}) =>
  z.preprocess(emptyToUndefined, z.coerce.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`).min(min, `${label} must be at least ${min}`).max(max, `${label} must be at most ${max}`));

export const zOptInt = (label: string, { min = 0, max = 1_000_000 } = {}) =>
  z.preprocess(emptyToUndefined, z.coerce.number({ invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`).min(min).max(max).optional()).transform((v) => v ?? null);

export const zOptFloat = (label: string, { min = 0, max = 1000 } = {}) =>
  z.preprocess(emptyToUndefined, z.coerce.number({ invalid_type_error: `${label} must be a number` }).min(min, `${label} must be at least ${min}`).max(max, `${label} must be at most ${max}`).optional()).transform((v) => v ?? null);

export const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Slug is required')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and single hyphens');

/** yyyy-mm-dd (or datetime-local) → Date | null */
export const zOptDate = z
  .preprocess(emptyToUndefined, z.coerce.date({ invalid_type_error: 'Invalid date' }).optional())
  .transform((v) => v ?? null);

/** Comma/newline separated list → unique trimmed array */
export const zList = (max = 50) =>
  z.preprocess((v) => {
    const arr = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\n]/) : [];
    return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))];
  }, z.array(z.string().max(80)).max(max));

export const zCuid = z.string().min(1).max(64);
