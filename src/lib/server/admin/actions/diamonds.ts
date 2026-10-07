'use server';
import 'server-only';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { recomputeFromPrice } from '@/lib/server/product-pricing';
import { revalidateCatalog } from '@/lib/server/revalidate';
import { CERT_LABS, DIAMOND_CLARITIES, DIAMOND_COLORS, DIAMOND_CUTS, SHAPE_SLUGS, type ShapeSlug } from '@/lib/catalog';
import { CARAT_LIMITS, FINISH_GRADES, FLUORESCENCE, GROWTH_METHODS } from '@/components/admin/diamonds/options';
import { ActionError, adminAction, formObject, ok, parse, revalidateAdmin, ValidationError, zCheckbox, zCuid, zMoney, zOptDate, zOptFloat, zOptText } from '../action';
import type { ActionResult, FormState } from '../types';

const choose = (what: string) => ({ errorMap: () => ({ message: `Choose a ${what}` }) });

const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const diamondSchema = z
  .object({
    id: zCuid.optional(),
    sku: z
      .string({ required_error: 'Enter a SKU' })
      .trim()
      .toUpperCase()
      .min(3, 'The SKU must be at least 3 characters')
      .max(40, 'The SKU must be 40 characters or fewer')
      .regex(/^[A-Z0-9][A-Z0-9-]*$/, 'The SKU may only contain letters, numbers and hyphens'),
    shape: z.enum(SHAPE_SLUGS as [ShapeSlug, ...ShapeSlug[]], choose('shape')),
    carat: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ required_error: 'Carat is required', invalid_type_error: 'Carat must be a number' })
        .min(CARAT_LIMITS.min, `Carat must be at least ${CARAT_LIMITS.min}`)
        .max(CARAT_LIMITS.max, `Carat must be at most ${CARAT_LIMITS.max}`),
    ),
    color: z.enum(DIAMOND_COLORS, choose('colour grade')),
    clarity: z.enum(DIAMOND_CLARITIES, choose('clarity grade')),
    cut: z.enum(DIAMOND_CUTS, choose('cut grade')),
    polish: z.enum(FINISH_GRADES, choose('polish grade')),
    symmetry: z.enum(FINISH_GRADES, choose('symmetry grade')),
    fluorescence: z.enum(FLUORESCENCE, choose('fluorescence')),
    measurements: zOptText(80),
    tablePct: zOptFloat('Table %', { min: 40, max: 90 }),
    depthPct: zOptFloat('Depth %', { min: 40, max: 90 }),
    ratio: zOptFloat('Length-to-width ratio', { min: 0.8, max: 3 }),
    growth: z.enum(GROWTH_METHODS, choose('growth method')),
    price: zMoney('Price', { min: 1, max: 1_000_000 }),
    isAvailable: zCheckbox,
    certLab: z.enum(CERT_LABS, choose('grading lab')),
    certNumber: z
      .preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v), z.string().max(40, 'Certificate number must be 40 characters or fewer').regex(/^[A-Z0-9-]*$/, 'Use letters, numbers and hyphens only'))
      .optional()
      .transform((v) => v || null),
    certUrl: z
      .preprocess(
        blankToUndefined,
        z
          .string()
          .trim()
          .max(500, 'The link must be 500 characters or fewer')
          .url('Enter a full URL, e.g. https://www.igi.org/…')
          .refine((v) => v.startsWith('https://'), 'Certificate links must use https://')
          .optional(),
      )
      .transform((v) => v ?? null),
    certIssuedAt: zOptDate,
  })
  .superRefine((d, ctx) => {
    if (!d.certNumber && (d.certUrl || d.certIssuedAt)) ctx.addIssue({ code: 'custom', path: ['certNumber'], message: 'Add the certificate number (or clear the link and date)' });
    if (d.certIssuedAt && d.certIssuedAt.getTime() > Date.now() + 86_400_000) ctx.addIssue({ code: 'custom', path: ['certIssuedAt'], message: 'Issue date cannot be in the future' });
  });

/** fromPrice of any product whose centre stone matches these shapes depends on diamond inventory. */
async function recomputeForShapes(shapes: (string | null | undefined)[]) {
  const list = [...new Set(shapes.filter((s): s is string => Boolean(s)))];
  if (!list.length) return;
  const options = await db.productDiamondOption.findMany({ where: { kind: 'CENTER_STONE', shape: { in: list } }, select: { productId: true } });
  for (const productId of new Set(options.map((o) => o.productId))) await recomputeFromPrice(productId);
}

export async function saveDiamond(_prev: FormState, fd: FormData): Promise<FormState<{ id: string }>> {
  return adminAction(async () => {
    const { id, certLab, certNumber, certUrl, certIssuedAt, ...data } = parse(diamondSchema, formObject(fd));

    if (certNumber) {
      const clash = await db.diamondCertificate.findFirst({
        where: { number: certNumber, ...(id ? { NOT: { diamondId: id } } : {}) },
        select: { diamond: { select: { sku: true } } },
      });
      if (clash) throw new ValidationError('That certificate number is already in use', { certNumber: `Already used by diamond ${clash.diamond.sku}` });
    }

    const { row, previousShape } = await db.$transaction(async (tx) => {
      let previousShape: string | null = null;
      if (id) {
        const prev = await tx.diamond.findUnique({ where: { id }, select: { shape: true } });
        if (!prev) throw new ActionError('This diamond no longer exists — it may have been deleted.');
        previousShape = prev.shape;
      }
      const row = id
        ? await tx.diamond.update({ where: { id }, data, select: { id: true, sku: true, shape: true } })
        : await tx.diamond.create({ data, select: { id: true, sku: true, shape: true } });
      if (certNumber) {
        const cert = { lab: certLab, number: certNumber, url: certUrl, issuedAt: certIssuedAt };
        await tx.diamondCertificate.upsert({ where: { diamondId: row.id }, create: { diamondId: row.id, ...cert }, update: cert });
      } else {
        await tx.diamondCertificate.deleteMany({ where: { diamondId: row.id } });
      }
      return { row, previousShape };
    });

    await recomputeForShapes([row.shape, previousShape]);
    await revalidateCatalog();
    revalidateAdmin();
    return ok(id ? `${row.sku} updated` : `${row.sku} added to inventory`, { id: row.id });
  });
}

export async function setDiamondAvailable(id: string, isAvailable: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const row = await db.diamond.update({
      where: { id: parse(zCuid, id) },
      data: { isAvailable: parse(z.boolean(), isAvailable) },
      select: { sku: true, shape: true, isAvailable: true },
    });
    await recomputeForShapes([row.shape]);
    await revalidateCatalog();
    revalidateAdmin();
    return ok(row.isAvailable ? `${row.sku} is available for sale` : `${row.sku} is no longer offered in the store`);
  });
}

export async function deleteDiamond(id: string, redirectToList?: boolean): Promise<ActionResult> {
  return adminAction(async () => {
    const diamond = await db.diamond.findUnique({ where: { id: parse(zCuid, id) }, select: { id: true, sku: true, shape: true } });
    if (!diamond) throw new ActionError('This diamond no longer exists — it may already have been deleted.');
    const ordered = await db.orderItem.count({ where: { diamondId: diamond.id } });
    if (ordered > 0) {
      throw new ActionError(
        `${diamond.sku} appears on ${ordered} order${ordered === 1 ? '' : 's'}, so it can’t be deleted without breaking order history. Mark it unavailable instead to remove it from the store.`,
      );
    }
    // Certificate cascades; cart lines referencing it are set to null by the schema.
    await db.diamond.delete({ where: { id: diamond.id } });
    await recomputeForShapes([diamond.shape]);
    await revalidateCatalog();
    revalidateAdmin();
    if (parse(z.boolean().optional(), redirectToList)) redirect('/admin/diamonds');
    return ok(`${diamond.sku} deleted`);
  });
}
