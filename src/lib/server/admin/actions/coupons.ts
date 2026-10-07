'use server';
import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { ActionError, adminAction, formObject, ok, parse, revalidateAdmin, zCheckbox, zCuid, zMoney, zOptDate, zOptInt, zOptText } from '../action';
import type { ActionResult, FormState } from '../types';

const couponSchema = z
  .object({
    id: zCuid.optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Code must be at least 3 characters')
      .max(32, 'Code must be 32 characters or fewer')
      .regex(/^[A-Z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens and underscores'),
    description: zOptText(200),
    type: z.enum(['PERCENT', 'FIXED'], { errorMap: () => ({ message: 'Choose a discount type' }) }),
    value: z.preprocess(
      (v) => {
        if (typeof v !== 'string') return v;
        const t = v.replace(/[$,%\s]/g, '');
        return t === '' ? undefined : Number(t);
      },
      z.number({ required_error: 'Value is required', invalid_type_error: 'Value must be a number' }).positive('Value must be greater than 0'),
    ),
    minSubtotal: zMoney('Minimum subtotal'),
    maxUses: zOptInt('Max uses', { min: 1, max: 1_000_000 }),
    startsAt: zOptDate,
    endsAt: zOptDate,
    isActive: zCheckbox,
  })
  .superRefine((d, ctx) => {
    if (d.type === 'PERCENT' && (d.value > 100 || !Number.isInteger(d.value)))
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Percent must be a whole number between 1 and 100' });
    if (d.startsAt && d.endsAt && d.endsAt < d.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date must be after the start date' });
  })
  .transform((d) => ({
    ...d,
    // PERCENT: whole percent; FIXED: dollars → cents
    value: d.type === 'PERCENT' ? Math.round(d.value) : Math.round(d.value * 100),
    // inclusive end date: end of that day
    endsAt: d.endsAt ? new Date(d.endsAt.getTime() + 86_399_999) : null,
  }));

export async function saveCoupon(_prev: FormState, fd: FormData): Promise<FormState<{ id: string }>> {
  return adminAction(async () => {
    const { id, ...data } = parse(couponSchema, formObject(fd));
    const row = id ? await db.coupon.update({ where: { id }, data }) : await db.coupon.create({ data });
    revalidateAdmin();
    return ok(id ? `Coupon ${row.code} updated` : `Coupon ${row.code} created`, { id: row.id });
  });
}

export async function setCouponActive(id: string, isActive: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.coupon.update({ where: { id: parse(zCuid, id) }, data: { isActive: parse(z.boolean(), isActive) } });
    revalidateAdmin();
    return ok(`${row.code} ${row.isActive ? 'activated' : 'deactivated'}`);
  });
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const coupon = await db.coupon.findUnique({ where: { id: parse(zCuid, id) } });
    if (!coupon) throw new ActionError('Coupon not found.');
    const used = await db.order.count({ where: { couponCode: coupon.code } });
    if (used > 0) {
      // Keep the record for reporting — just retire it.
      await db.coupon.update({ where: { id: coupon.id }, data: { isActive: false } });
      revalidateAdmin();
      return ok(`${coupon.code} has been used on ${used} order${used === 1 ? '' : 's'}, so it was deactivated instead of deleted.`);
    }
    await db.coupon.delete({ where: { id: coupon.id } });
    revalidateAdmin();
    return ok(`Coupon ${coupon.code} deleted`);
  });
}
