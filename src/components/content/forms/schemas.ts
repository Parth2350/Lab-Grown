/**
 * Form schemas shared by the client (instant inline validation) and the API routes
 * (authoritative validation). Keep this module free of server-only imports.
 */
import { z } from 'zod';
import { SHAPES } from '@/lib/catalog';

// ───────────────────────────── primitives ─────────────────────────────

const name = z.string().trim().min(2, 'Please enter your full name.').max(100, 'Please keep your name under 100 characters.');
const email = z
  .string()
  .trim()
  .min(1, 'Please enter your email address.')
  .max(200, 'Please use a shorter email address.')
  .email('Please enter a valid email address.')
  .transform((v) => v.toLowerCase());

const PHONE_RE = /^\+?[0-9\s().-]{6,24}$/;
const phone = z
  .string()
  .trim()
  .max(32, 'Please enter a valid phone number.')
  .refine((v) => v === '' || (PHONE_RE.test(v) && v.replace(/\D/g, '').length >= 6), 'Please enter a valid phone number, including the country code.')
  .transform((v) => v || undefined)
  .optional();

const optionalText = (max: number, message = `Please keep this under ${max} characters.`) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || undefined)
    .optional();

const country = z.string().trim().max(80, 'Please enter a shorter country name.');

// ───────────────────────────── contact ─────────────────────────────

export const CONTACT_SUBJECTS = [
  { value: 'order', label: 'An existing order' },
  { value: 'product', label: 'A product or diamond question' },
  { value: 'bespoke', label: 'Bespoke design' },
  { value: 'returns', label: 'Returns & exchanges' },
  { value: 'care', label: 'Sizing, care & repairs' },
  { value: 'press', label: 'Press & partnerships' },
  { value: 'other', label: 'Something else' },
] as const;

export const contactSchema = z.object({
  name,
  email,
  phone,
  subject: z.enum(CONTACT_SUBJECTS.map((s) => s.value) as [string, ...string[]], { errorMap: () => ({ message: 'Please choose a subject.' }) }),
  message: z.string().trim().min(10, 'Please tell us a little more (at least 10 characters).').max(4000, 'Please keep your message under 4,000 characters.'),
});
export type ContactInput = z.input<typeof contactSchema>;

// ───────────────────────────── partner program ─────────────────────────────

export const AUDIENCE_SIZES = ['Under 5k', '5k – 25k', '25k – 100k', '100k – 500k', '500k +', 'Not applicable'] as const;
export const PARTNER_TYPES = [
  'Content creator / influencer',
  'Stylist or image consultant',
  'Wedding planner',
  'Boutique or retailer',
  'Jewelry or fashion blogger',
  'Other',
] as const;

export const partnerSchema = z.object({
  name,
  email,
  phone,
  country: country.min(2, 'Please tell us where you are based.'),
  company: optionalText(120),
  website: z
    .string()
    .trim()
    .max(200, 'Please use a shorter web address.')
    .refine((v) => v === '' || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i.test(v), 'Please enter a valid web address.')
    .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : undefined))
    .optional(),
  socialHandle: optionalText(120),
  audienceSize: z.enum(AUDIENCE_SIZES).optional().or(z.literal('').transform(() => undefined)),
  experience: z.enum(PARTNER_TYPES, { errorMap: () => ({ message: 'Please tell us what best describes you.' }) }),
  message: optionalText(2000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm we may contact you about your application.' }) }),
});
export type PartnerInput = z.input<typeof partnerSchema>;

// ───────────────────────────── bespoke ─────────────────────────────

export const BESPOKE_TYPES = [
  { value: 'engagement-ring', label: 'Engagement Ring' },
  { value: 'wedding-band', label: 'Wedding Band' },
  { value: 'ring', label: 'Ring' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'pendant', label: 'Pendant' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'other', label: 'Something Else' },
] as const;

export const BESPOKE_SHAPES = [...SHAPES.map((s) => ({ value: s.slug as string, label: s.label as string })), { value: 'not-sure', label: 'Not Sure' }];

export const BESPOKE_CARATS = [
  { value: 'under-1', label: 'Under 1 ct', hint: 'Delicate and refined' },
  { value: '1-1.5', label: '1 – 1.5 ct', hint: 'Our most requested size' },
  { value: '1.5-2', label: '1.5 – 2 ct', hint: 'Noticeable presence' },
  { value: '2-3', label: '2 – 3 ct', hint: 'A true statement' },
  { value: '3-plus', label: '3 ct +', hint: 'Show-stopping' },
  { value: 'not-sure', label: 'Not sure yet', hint: 'We will guide you' },
] as const;

export const BESPOKE_METALS = [
  { value: 'yellow', label: 'Yellow Gold', swatch: 'linear-gradient(135deg,#F6E2A8 0%,#D9B465 50%,#A87F33 100%)' },
  { value: 'white', label: 'White Gold', swatch: 'linear-gradient(135deg,#FFFFFF 0%,#DADDE0 50%,#A9AEB4 100%)' },
  { value: 'rose', label: 'Rose Gold', swatch: 'linear-gradient(135deg,#F7D2C0 0%,#DFA088 50%,#B06F58 100%)' },
  { value: 'yellow-white', label: 'Yellow & White Gold', swatch: 'linear-gradient(135deg,#E9CB80 0%,#E9CB80 50%,#D6D9DC 50%,#D6D9DC 100%)' },
  { value: 'rose-white', label: 'Rose & White Gold', swatch: 'linear-gradient(135deg,#E8AE97 0%,#E8AE97 50%,#D6D9DC 50%,#D6D9DC 100%)' },
  { value: 'not-sure', label: 'Not sure yet', swatch: 'conic-gradient(from 45deg,#E9CB80,#D6D9DC,#E8AE97,#E9CB80)' },
] as const;

export const BESPOKE_BUDGETS = [
  { value: 'under-100000', label: 'Under ₹1,00,000' },
  { value: '100000-250000', label: '₹1,00,000 – ₹2,50,000' },
  { value: '250000-500000', label: '₹2,50,000 – ₹5,00,000' },
  { value: '500000-1000000', label: '₹5,00,000 – ₹10,00,000' },
  { value: '1000000-plus', label: '₹10,00,000 +' },
  { value: 'not-sure', label: 'I would like guidance' },
] as const;

export const MAX_INSPIRATION_IMAGES = 5;
/** Only URLs produced by our own upload endpoint are accepted. */
export const INSPIRATION_URL_RE = /^(\/uploads\/bespoke\/[\w.-]+|https:\/\/res\.cloudinary\.com\/[\w./-]+)$/;

const values = <T extends readonly { value: string }[]>(arr: T) => arr.map((o) => o.value) as [string, ...string[]];

export const bespokeSchema = z.object({
  jewelryType: z.enum(values(BESPOKE_TYPES), { errorMap: () => ({ message: 'Please choose a type of jewelry.' }) }),
  shape: z.enum(values(BESPOKE_SHAPES), { errorMap: () => ({ message: 'Please choose a diamond shape.' }) }),
  carat: z.enum(values(BESPOKE_CARATS), { errorMap: () => ({ message: 'Please choose a carat range.' }) }),
  metal: z.enum(values(BESPOKE_METALS), { errorMap: () => ({ message: 'Please choose a metal.' }) }),
  budget: z.enum(values(BESPOKE_BUDGETS), { errorMap: () => ({ message: 'Please choose a budget range.' }) }),
  inspirationUrls: z
    .array(z.string().regex(INSPIRATION_URL_RE, 'One of your images could not be verified. Please upload it again.'))
    .max(MAX_INSPIRATION_IMAGES, `Please share up to ${MAX_INSPIRATION_IMAGES} images.`)
    .default([]),
  name,
  email,
  phone,
  country: country
    .transform((v) => v || undefined)
    .optional(),
  notes: optionalText(3000, 'Please keep your notes under 3,000 characters.'),
});
export type BespokeInput = z.input<typeof bespokeSchema>;

// ───────────────────────────── quiz ─────────────────────────────

export const matchSchema = z.object({
  step: z.enum(['taste', 'match']),
  occasion: z.string().max(40).optional(),
  categories: z.array(z.string().max(40)).max(12).default([]),
  /** paise */
  budget: z.object({ min: z.number().int().min(0), max: z.number().int().positive().nullable() }).nullable().optional(),
  metal: z.string().max(20).nullable().optional(),
  liked: z.array(z.string().max(40)).max(40).default([]),
});

// ───────────────────────────── helpers ─────────────────────────────

export type FieldErrors = Record<string, string>;

/** First error message per top-level field. */
export function firstErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function labelFor<T extends readonly { value: string; label: string }[]>(arr: T, value?: string | null) {
  return arr.find((o) => o.value === value)?.label ?? value ?? '';
}
