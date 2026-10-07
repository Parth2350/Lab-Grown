'use server';
import 'server-only';
import { ShipmentStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { enumLabel } from '@/components/admin/format';
import { readStoreSettings, updateStoreSettings } from '../settings';
import { advanceOrderForShipment, shipmentTimestamps } from '../queries/shipping';
import { ActionError, ValidationError, adminAction, fdString, formObject, ok, parse, revalidateAdmin, zCuid, zMoney, zOptText, zSlug, zText } from '../action';
import type { FormState } from '../types';

const zShipmentStatus = z.nativeEnum(ShipmentStatus, { errorMap: () => ({ message: 'Choose a valid shipment status' }) });

const shipmentSchema = z.object({
  id: zCuid.optional(),
  orderId: zCuid,
  carrier: zText('Carrier', 80),
  method: z.string({ required_error: 'Choose a shipping method' }).trim().min(1, 'Choose a shipping method').max(60),
  trackingNumber: zOptText(80),
  status: zShipmentStatus,
});

function orderNote(advanced: string | null) {
  return advanced ? ` Order moved to ${enumLabel(advanced).toLowerCase()}.` : '';
}

/** Create or edit a shipment from the order detail page. */
export async function saveShipment(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const data = parse(shipmentSchema, formObject(fd));
    const settings = await readStoreSettings();

    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: data.orderId }, select: { number: true } });
      if (!order) throw new ActionError('This order no longer exists.');
      const existing = data.id
        ? await tx.shipment.findFirst({ where: { id: data.id, orderId: data.orderId }, select: { id: true, method: true, shippedAt: true, deliveredAt: true } })
        : null;
      if (data.id && !existing) throw new ActionError('This shipment no longer exists.');
      // Current methods are valid; a legacy method already on the shipment may be kept.
      const allowed = new Set([...settings.shippingMethods.map((m) => m.id), ...(existing ? [existing.method] : [])]);
      if (!allowed.has(data.method)) throw new ValidationError('Please choose one of the shipping methods', { method: 'Choose one of the shipping methods' });

      const fields = { carrier: data.carrier, method: data.method, trackingNumber: data.trackingNumber, status: data.status, ...shipmentTimestamps(existing, data.status) };
      if (existing) await tx.shipment.update({ where: { id: existing.id }, data: fields });
      else await tx.shipment.create({ data: { orderId: data.orderId, ...fields } });
      const advanced = await advanceOrderForShipment(tx, data.orderId, data.status);
      return { number: order.number, advanced };
    });

    revalidateAdmin();
    return ok(`${data.id ? 'Shipment updated' : 'Shipment added'} on ${result.number}.${orderNote(result.advanced)}`);
  });
}

const quickSchema = z.object({ id: zCuid, status: zShipmentStatus, trackingNumber: zOptText(80) });

/** Inline status / tracking update from the shipments list. */
export async function quickUpdateShipment(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const data = parse(quickSchema, formObject(fd));
    const result = await db.$transaction(async (tx) => {
      const current = await tx.shipment.findUnique({
        where: { id: data.id },
        select: { id: true, orderId: true, status: true, trackingNumber: true, shippedAt: true, deliveredAt: true, order: { select: { number: true } } },
      });
      if (!current) throw new ActionError('This shipment no longer exists.');
      if (current.status === data.status && (current.trackingNumber ?? null) === data.trackingNumber) return null;
      await tx.shipment.update({
        where: { id: current.id },
        data: { status: data.status, trackingNumber: data.trackingNumber, ...shipmentTimestamps(current, data.status) },
      });
      const advanced = current.status !== data.status ? await advanceOrderForShipment(tx, current.orderId, data.status) : null;
      return { number: current.order.number, advanced };
    });
    if (!result) return ok('No changes to save');
    revalidateAdmin();
    return ok(`Shipment for ${result.number} updated.${orderNote(result.advanced)}`);
  });
}

const methodSchema = z.object({
  id: zSlug.max(40, 'ID must be 40 characters or fewer'),
  label: zText('Label', 80),
  description: z.string().trim().max(200, 'Description must be 200 characters or fewer').default(''),
  eta: z.string().trim().max(80, 'Delivery estimate must be 80 characters or fewer').default(''),
  price: zMoney('Price', { max: 100_000 }),
});

const methodsSchema = z
  .object({ methods: z.array(methodSchema).min(1, 'Keep at least one shipping method').max(12, 'Up to 12 shipping methods') })
  .superRefine((d, ctx) => {
    const seen = new Set<string>();
    d.methods.forEach((m, i) => {
      if (seen.has(m.id)) ctx.addIssue({ code: 'custom', path: ['methods', i, 'id'], message: `The ID "${m.id}" is used twice` });
      seen.add(m.id);
    });
  });

/** Replace settings.shippingMethods (checkout reads them via the settings cache, revalidated here). */
export async function saveShippingMethods(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    let raw: unknown;
    try {
      raw = JSON.parse(fdString(fd, 'methods') || 'null');
    } catch {
      throw new ActionError('The shipping methods could not be read. Please reload the page and try again.');
    }
    const { methods } = parse(methodsSchema, { methods: raw });
    await updateStoreSettings({ shippingMethods: methods });
    revalidateAdmin();
    return ok(`Saved ${methods.length} shipping method${methods.length === 1 ? '' : 's'}. Checkout is updated.`);
  });
}
