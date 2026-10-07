'use server';
import 'server-only';
import { OrderStatus, ReturnStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { enumLabel } from '@/components/admin/format';
import { STOCK_HELD_STATUSES, transitionNeedsConfirmation } from '@/components/admin/orders/status';
import { shipmentTimestamps } from '../queries/shipping';
import { ActionError, adminAction, formObject, ok, parse, revalidateAdmin, zCheckbox, zCuid, zOptText } from '../action';
import type { ActionResult, FormState } from '../types';

const statusSchema = z.object({
  id: zCuid,
  from: z.nativeEnum(OrderStatus, { errorMap: () => ({ message: 'Unknown current status' }) }),
  status: z.nativeEnum(OrderStatus, { errorMap: () => ({ message: 'Choose a valid status' }) }),
  confirmed: zCheckbox,
  restock: zCheckbox,
});

/** Put the order's items back on the shelf: variant stock + release certified diamonds. */
async function restockOrder(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, diamondId: true, quantity: true } });
  const qtyByVariant = new Map<string, number>();
  for (const it of items) if (it.variantId) qtyByVariant.set(it.variantId, (qtyByVariant.get(it.variantId) ?? 0) + it.quantity);
  for (const [variantId, qty] of qtyByVariant) await tx.productVariant.updateMany({ where: { id: variantId }, data: { stock: { increment: qty } } });
  const diamondIds = items.map((i) => i.diamondId).filter((d): d is string => !!d);
  if (diamondIds.length) await tx.diamond.updateMany({ where: { id: { in: diamondIds } }, data: { isAvailable: true } });
  return { variants: qtyByVariant.size, diamonds: diamondIds.length };
}

/**
 * Change an order's status. Everyday moves go straight through; cancellations, refunds and
 * unusual corrections require `confirmed` (the UI shows a dialog first). Uses the status the admin
 * saw (`from`) as an optimistic lock so two people can't silently overwrite each other.
 */
export async function updateOrderStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const input = parse(statusSchema, formObject(fd));
    if (input.from === input.status) throw new ActionError(`This order is already ${enumLabel(input.status).toLowerCase()}.`);
    if (transitionNeedsConfirmation(input.from, input.status) && !input.confirmed)
      throw new ActionError(`Moving an order from ${enumLabel(input.from)} to ${enumLabel(input.status)} needs confirmation.`);

    const notes: string[] = [];
    const number = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: input.id }, select: { number: true, status: true } });
      if (!order) throw new ActionError('This order no longer exists.');
      const claimed = await tx.order.updateMany({ where: { id: input.id, status: input.from }, data: { status: input.status } });
      if (!claimed.count) throw new ActionError(`Order ${order.number} was updated elsewhere (it is now ${enumLabel(order.status).toLowerCase()}). Refresh and try again.`);

      // Keep the latest parcel in step with the order.
      if (input.status === 'SHIPPED' || input.status === 'DELIVERED') {
        const latest = await tx.shipment.findFirst({ where: { orderId: input.id }, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, shippedAt: true, deliveredAt: true } });
        const next = input.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT';
        const shouldMove = latest && latest.status !== 'RETURNED' && (input.status === 'DELIVERED' ? latest.status !== 'DELIVERED' : latest.status === 'PENDING' || latest.status === 'PACKED');
        if (latest && shouldMove) {
          await tx.shipment.update({ where: { id: latest.id }, data: { status: next, ...shipmentTimestamps(latest, next) } });
          notes.push(`latest shipment marked ${enumLabel(next).toLowerCase()}`);
        }
      }

      // Refunding the order also records the refund on captured payments.
      if (input.status === 'REFUNDED') {
        const r = await tx.payment.updateMany({ where: { orderId: input.id, status: 'CAPTURED' }, data: { status: 'REFUNDED' } });
        if (r.count) notes.push(`${r.count} payment${r.count === 1 ? '' : 's'} marked refunded`);
      }

      if (input.restock && (input.status === 'CANCELLED' || input.status === 'REFUNDED') && STOCK_HELD_STATUSES.includes(input.from)) {
        const r = await restockOrder(tx, input.id);
        notes.push(`${r.variants} variant${r.variants === 1 ? '' : 's'} restocked${r.diamonds ? `, ${r.diamonds} diamond${r.diamonds === 1 ? '' : 's'} released` : ''}`);
      }
      return order.number;
    });

    revalidateAdmin();
    return ok(`Order ${number} is now ${enumLabel(input.status).toLowerCase()}${notes.length ? ` — ${notes.join('; ')}` : ''}.`);
  });
}

/** Records a full refund: every CAPTURED payment → REFUNDED and the order → REFUNDED, atomically. */
export async function markOrderRefunded(orderId: string): Promise<ActionResult> {
  return adminAction(async () => {
    const id = parse(zCuid, orderId);
    const res = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, select: { number: true } });
      if (!order) throw new ActionError('This order no longer exists.');
      const payments = await tx.payment.updateMany({ where: { orderId: id, status: 'CAPTURED' }, data: { status: 'REFUNDED' } });
      if (!payments.count) throw new ActionError(`Order ${order.number} has no captured payment to refund.`);
      await tx.order.update({ where: { id }, data: { status: 'REFUNDED' } });
      return { number: order.number, count: payments.count };
    });
    revalidateAdmin();
    return ok(`Order ${res.number} marked refunded (${res.count} payment${res.count === 1 ? '' : 's'}).`);
  });
}

const notesSchema = z.object({ id: zCuid, notes: zOptText(5000) });

export async function saveOrderNotes(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { id, notes } = parse(notesSchema, formObject(fd));
    const order = await db.order.update({ where: { id }, data: { adminNotes: notes }, select: { number: true } });
    revalidateAdmin();
    return ok(notes ? `Notes saved on ${order.number}` : `Notes cleared on ${order.number}`);
  });
}

const returnSchema = z.object({
  id: zCuid,
  status: z.nativeEnum(ReturnStatus, { errorMap: () => ({ message: 'Choose a valid return status' }) }),
});

export async function updateReturnStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { id, status } = parse(returnSchema, formObject(fd));
    const current = await db.returnRequest.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw new ActionError('This return request no longer exists.');
    if (current.status === status) throw new ActionError(`The return is already ${enumLabel(status).toLowerCase()}.`);
    await db.returnRequest.update({ where: { id }, data: { status } });
    revalidateAdmin();
    return ok(`Return marked ${enumLabel(status).toLowerCase()}`);
  });
}
