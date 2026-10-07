/**
 * Client-safe status vocabularies + order workflow rules, shared by the admin server actions
 * (authoritative validation) and the client forms (which statuses to offer / confirm).
 * Records keyed by the Prisma enums keep every list exhaustive at compile time.
 */
import type { OrderStatus, PaymentStatus, ReturnStatus, ShipmentStatus } from '@prisma/client';

export const ORDER_STATUS_HINT: Record<OrderStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Payment received, not yet in the workshop',
  PROCESSING: 'Being crafted or prepared for dispatch',
  SHIPPED: 'Handed to the carrier',
  DELIVERED: 'Received by the customer',
  CANCELLED: 'Will not be fulfilled',
  REFUNDED: 'Payment returned to the customer',
};
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_HINT) as OrderStatus[];

export const PAYMENT_STATUS_HINT: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting confirmation from the provider',
  CAPTURED: 'Funds captured',
  FAILED: 'Payment attempt failed',
  REFUNDED: 'Refund recorded',
};
export const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_HINT) as PaymentStatus[];

export const SHIPMENT_STATUS_HINT: Record<ShipmentStatus, string> = {
  PENDING: 'Not yet packed',
  PACKED: 'Packed, awaiting pickup',
  IN_TRANSIT: 'With the carrier',
  OUT_FOR_DELIVERY: 'Out for delivery today',
  DELIVERED: 'Delivered to the customer',
  RETURNED: 'Returned to the workshop',
};
export const SHIPMENT_STATUSES = Object.keys(SHIPMENT_STATUS_HINT) as ShipmentStatus[];

export const RETURN_STATUS_HINT: Record<ReturnStatus, string> = {
  REQUESTED: 'Waiting for review',
  APPROVED: 'Approved, awaiting the parcel',
  RECEIVED: 'Item received and inspected',
  REFUNDED: 'Refund issued',
  REJECTED: 'Return declined',
};
export const RETURN_STATUSES = Object.keys(RETURN_STATUS_HINT) as ReturnStatus[];

/**
 * The everyday forward (and one-step-back) moves. Anything else, and every move into
 * CANCELLED / REFUNDED, is still allowed but must be explicitly confirmed.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['PROCESSING', 'DELIVERED', 'REFUNDED'],
  DELIVERED: ['SHIPPED', 'REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function isStandardTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Moves that need a confirmation dialog in the UI and an explicit `confirmed` flag on the server. */
export function transitionNeedsConfirmation(from: OrderStatus, to: OrderStatus) {
  return to === 'CANCELLED' || to === 'REFUNDED' || !isStandardTransition(from, to);
}

/** Statuses in which finalizeOrder() has already decremented stock / reserved diamonds. */
export const STOCK_HELD_STATUSES: readonly OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/** Orders that count towards revenue / customer spend. */
export const REVENUE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const satisfies readonly OrderStatus[];

/** Shipment statuses that mean the parcel has left the workshop. */
export const SHIPPED_SHIPMENT_STATUSES: readonly ShipmentStatus[] = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
