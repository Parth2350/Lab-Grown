'use server';
import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { ActionError, adminAction, ok, parse, revalidateAdmin, zCuid, zInt } from '../action';
import type { ActionResult } from '../types';

const MAX_STOCK = 100_000;

export async function updateVariantStock(variantId: string, stock: number): Promise<ActionResult> {
  return adminAction(async () => {
    const id = parse(zCuid, variantId);
    const value = parse(zInt('Stock', { min: 0, max: MAX_STOCK }), stock);
    const row = await db.productVariant.update({ where: { id }, data: { stock: value }, select: { sku: true, stock: true } });
    await revalidateCatalog();
    revalidateAdmin();
    return ok(`${row.sku}: ${row.stock} in stock`);
  });
}

const bulkSchema = z
  .object({
    ids: z.array(zCuid).min(1, 'Select at least one variant').max(200, 'Update at most 200 variants at a time'),
    mode: z.enum(['add', 'set'], { errorMap: () => ({ message: 'Choose add or set' }) }),
    amount: z.coerce.number({ invalid_type_error: 'Amount must be a number' }).int('Amount must be a whole number'),
  })
  .superRefine((d, ctx) => {
    if (d.mode === 'add' && (d.amount < 1 || d.amount > 10_000)) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Add between 1 and 10,000 units' });
    if (d.mode === 'set' && (d.amount < 0 || d.amount > MAX_STOCK)) ctx.addIssue({ code: 'custom', path: ['amount'], message: `Set a stock level between 0 and ${MAX_STOCK.toLocaleString('en-US')}` });
  });

export async function bulkAdjustStock(variantIds: string[], mode: 'add' | 'set', amount: number): Promise<ActionResult<{ count: number }>> {
  return adminAction(async () => {
    const { ids, mode: m, amount: n } = parse(bulkSchema, { ids: Array.isArray(variantIds) ? [...new Set(variantIds)] : variantIds, mode, amount });
    const count = await db.$transaction(async (tx) => {
      const res =
        m === 'add'
          ? await tx.productVariant.updateMany({ where: { id: { in: ids } }, data: { stock: { increment: n } } })
          : await tx.productVariant.updateMany({ where: { id: { in: ids } }, data: { stock: n } });
      if (m === 'add') await tx.productVariant.updateMany({ where: { id: { in: ids }, stock: { gt: MAX_STOCK } }, data: { stock: MAX_STOCK } });
      return res.count;
    });
    if (count === 0) throw new ActionError('None of the selected variants exist any more — refresh the page and try again.');
    await revalidateCatalog();
    revalidateAdmin();
    const noun = `${count} variant${count === 1 ? '' : 's'}`;
    return ok(m === 'add' ? `Added ${n} unit${n === 1 ? '' : 's'} to ${noun}` : `Set ${noun} to ${n} in stock`, { count });
  });
}
