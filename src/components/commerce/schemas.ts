/**
 * Validation schemas shared by the API routes (authoritative) and the client forms
 * (instant feedback). Pure module — safe to import on both sides.
 */
import { z } from 'zod';
import { COUNTRY_NAMES } from './countries';

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

export const emailSchema = z.string().trim().toLowerCase().min(1, 'Enter your email address').max(160).email('Enter a valid email address');

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Enter a phone number')
  .max(24, 'Enter a valid phone number')
  .regex(/^\+?[\d\s().-]+$/, 'Enter a valid phone number')
  .refine((v) => v.replace(/\D/g, '').length >= 7, 'Enter a valid phone number');

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or fewer')
  .regex(/\d/, 'Include at least one number')
  .regex(/[A-Za-z]/, 'Include at least one letter');

export const addressSchema = z.object({
  label: optionalText(40),
  firstName: text(60).min(1, 'Enter a first name'),
  lastName: text(60).min(1, 'Enter a last name'),
  phone: phoneSchema,
  line1: text(120).min(3, 'Enter a street address'),
  line2: optionalText(120),
  city: text(80).min(2, 'Enter a city'),
  state: text(80).min(2, 'Enter a state, province or region'),
  postalCode: text(16)
    .min(3, 'Enter a postal code')
    .regex(/^[A-Za-z0-9][A-Za-z0-9 -]*$/, 'Enter a valid postal code'),
  country: z.string().trim().refine((c) => COUNTRY_NAMES.has(c), 'Select a country'),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const addressUpdateSchema = addressSchema.partial().extend({ isDefault: z.boolean().optional() });

export const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'All payment options', description: 'UPI, cards, net banking & wallets in one secure window' },
  { id: 'upi', label: 'UPI', description: 'Google Pay, PhonePe, Paytm & any UPI app' },
  { id: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, American Express, RuPay' },
  { id: 'netbanking', label: 'Net Banking', description: 'All major banks' },
  { id: 'wallet', label: 'Wallets', description: 'Paytm, Mobikwik, Freecharge & more' },
] as const;
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];
const paymentIds = PAYMENT_METHODS.map((m) => m.id) as [PaymentMethodId, ...PaymentMethodId[]];

const id = z.string().trim().min(1).max(40);

export const lineInputSchema = z.object({
  productId: id,
  variantId: id,
  diamondId: id.nullish().transform((v) => v ?? null),
  diamondOptionId: id.nullish().transform((v) => v ?? null),
  ringSize: z.string().trim().max(8).nullish().transform((v) => v || null),
  quantity: z.number().int().min(1).max(10),
});
export type LineInput = z.infer<typeof lineInputSchema>;

export const customerSchema = z.object({
  name: text(120).min(2, 'Enter your full name'),
  email: emailSchema,
  phone: phoneSchema,
});

export const checkoutSchema = z
  .object({
    customer: customerSchema,
    addressId: id.nullish(),
    address: addressSchema.nullish(),
    saveAddress: z.boolean().optional().default(false),
    deliveryMethod: z.string().trim().min(1, 'Choose a delivery method').max(40),
    paymentMethod: z.enum(paymentIds, { errorMap: () => ({ message: 'Choose a payment method' }) }),
    couponCode: z.string().trim().max(40).nullish().transform((v) => (v ? v.toUpperCase() : null)),
    notes: optionalText(500),
    lines: z.array(lineInputSchema).min(1, 'Your bag is empty').max(25, 'Your bag holds up to 25 pieces per order'),
  })
  .superRefine((v, ctx) => {
    if (!v.addressId && !v.address) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Add a shipping address' });
  });
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const quoteSchema = z.object({
  lines: z.array(lineInputSchema).max(25),
  couponCode: z.string().trim().max(40).nullish(),
  deliveryMethod: z.string().trim().max(40).nullish(),
});

export const registerSchema = z.object({
  name: text(80).min(2, 'Enter your name'),
  email: emailSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: text(80).min(2, 'Enter your name'),
  phone: z
    .union([phoneSchema, z.literal('')])
    .nullish()
    .transform((v) => (v ? v : null)),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(72).optional().default(''),
  newPassword: passwordSchema,
});

export const RETURN_REASONS = [
  { id: 'size', label: 'Ring size or fit is not right' },
  { id: 'style', label: 'Style is not what I expected' },
  { id: 'quality', label: 'Quality concern' },
  { id: 'damaged', label: 'Arrived damaged' },
  { id: 'wrong-item', label: 'Received the wrong item' },
  { id: 'changed-mind', label: 'Changed my mind' },
  { id: 'other', label: 'Something else' },
] as const;
type ReasonId = (typeof RETURN_REASONS)[number]['id'];
const reasonIds = RETURN_REASONS.map((r) => r.id) as [ReasonId, ...ReasonId[]];

export const returnRequestSchema = z.object({
  orderNumber: z.string().trim().min(1).max(20),
  reason: z.enum(reasonIds, { errorMap: () => ({ message: 'Choose a reason' }) }),
  details: optionalText(1000),
});

export const stateSchema = z.object({
  cart: z.array(lineInputSchema).max(50),
  wishlist: z.array(id).max(100),
  compare: z.array(id).max(4),
});

/** Flattens zod issues into { "address.city": "message" } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const BACKSLASH = String.fromCharCode(92);

/** Safe relative redirect target (blocks protocol-relative and absolute URLs, before and after decoding). */
export function safeCallbackUrl(raw: string | null | undefined, fallback = '/account') {
  if (!raw) return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  const safe = (v: string) =>
    v.startsWith('/') &&
    !v.startsWith('//') &&
    ![...v].some((ch) => ch === BACKSLASH || ch.charCodeAt(0) < 32) &&
    !v.startsWith('/api/') &&
    !v.startsWith('/account/login') &&
    !v.startsWith('/account/register');
  return safe(raw) && safe(decoded) ? raw : fallback;
}
