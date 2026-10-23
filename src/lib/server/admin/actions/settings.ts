'use server';
import 'server-only';
import { z } from 'zod';
import { saveUpload } from '@/lib/server/storage';
import { ActionError, adminAction, fdFiles, formObject, ok, parse, revalidateAdmin, zCheckbox, zInt, zText } from '../action';
import { updateStoreSettings } from '../settings';
import type { FormState } from '../types';

// Each action validates and writes ONLY its own section's keys, so saving one panel never
// clobbers another (or the shipping methods, which are edited on the Shipping page).

const strings = (fd: FormData, key: string) => fd.getAll(key).filter((v): v is string => typeof v === 'string');
const squish = (s: string) => s.replace(/\s+/g, ' ').trim();

const announcementsSchema = z.object({
  items: z
    .array(
      z
        .string()
        .transform(squish)
        .pipe(z.string().min(1, 'Remove empty messages or add text to them').max(120, 'Keep each message to 120 characters or fewer')),
    )
    .max(12, 'You can show up to 12 messages'),
});

export async function saveAnnouncements(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { items } = parse(announcementsSchema, { items: strings(fd, 'items') });
    await updateStoreSettings({ announcements: items });
    revalidateAdmin();
    return ok(items.length ? 'Announcement bar updated' : 'Announcement bar hidden — it has no messages');
  });
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

// set when the browser uploaded a video straight to Vercel Blob (see /api/admin/blob)
const blobVideoUrl = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/hero\//i.test(v), 'The uploaded video could not be verified. Please upload it again.');

const heroSchema = z.object({
  eyebrow: zText('Eyebrow', 60),
  title: zText('Title', 120),
  subtitle: zText('Subtitle', 300),
  removeImage: zCheckbox,
  removeVideo: zCheckbox,
  removeVideoMobile: zCheckbox,
  videoUrl: blobVideoUrl,
  videoMobileUrl: blobVideoUrl,
});
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

/** One hero video: uploaded straight to storage by the browser (production) or sent with the form (local development). undefined = unchanged */
async function heroVideo(fd: FormData, name: 'video' | 'videoMobile', url: string | undefined, remove: boolean) {
  if (url) return url;
  const file = fdFiles(fd, name)[0];
  if (file) {
    if (!VIDEO_TYPES.has(file.type)) throw new ActionError('Please upload hero videos as MP4 or WebM files.');
    return (await saveUpload(file, 'hero')).url;
  }
  return remove ? null : undefined;
}

export async function saveHeroSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { eyebrow, title, subtitle, removeImage, removeVideo, removeVideoMobile, videoUrl, videoMobileUrl } = parse(heroSchema, formObject(fd));
    const video = await heroVideo(fd, 'video', videoUrl, removeVideo);
    const videoMobile = await heroVideo(fd, 'videoMobile', videoMobileUrl, removeVideoMobile);
    const files = fdFiles(fd, 'image');
    if (files.length > 1) throw new ActionError('Please upload a single hero image.');
    const file = files[0];
    let image: string | null | undefined;
    if (file) {
      if (file.type.startsWith('video/')) throw new ActionError('The hero takes a still image — videos are not supported here. Please upload a JPG, PNG, WebP, AVIF or GIF.');
      if (!IMAGE_TYPES.has(file.type)) throw new ActionError('Unsupported file type. Please upload a JPG, PNG, WebP, AVIF or GIF image.');
      image = (await saveUpload(file, 'hero')).url;
    } else if (removeImage) {
      image = null;
    }
    await updateStoreSettings({ hero: { eyebrow, title, subtitle, ...(image !== undefined ? { image } : {}), ...(video !== undefined ? { video } : {}), ...(videoMobile !== undefined ? { videoMobile } : {}) } });
    revalidateAdmin();
    const what = [file && 'new image', video && 'new desktop video', videoMobile && 'new phone video', image === null && 'image removed', video === null && 'desktop video removed', videoMobile === null && 'phone video removed'].filter(Boolean).join(', ');
    return ok(what ? `Hero updated — ${what}` : 'Hero updated');
  });
}

const taxSchema = z.object({
  taxRatePercent: z
    .string({ required_error: 'Tax rate is required', invalid_type_error: 'Tax rate is required' })
    .transform((v) => v.replace(/[%\s]/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Tax rate is required')
        .regex(/^\d{1,2}(?:\.\d{1,3})?$/, 'Enter a percentage such as 3 or 7.25 (up to 3 decimals)'),
    )
    .transform(Number)
    .pipe(z.number().min(0, 'Tax rate cannot be negative').max(30, 'Tax rate must be 30% or less')),
  taxLabel: zText('Tax label', 40),
});

export async function saveTaxSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { taxRatePercent, taxLabel } = parse(taxSchema, formObject(fd));
    // percent → fraction, rounded to 5 decimals to avoid float drift (7.125 → 0.07125)
    const taxRate = Math.round(taxRatePercent * 1000) / 100_000;
    await updateStoreSettings({ taxRate, taxLabel });
    revalidateAdmin();
    return ok(`Tax set to ${taxRatePercent}% (“${taxLabel}”)`);
  });
}

const returnsSchema = z.object({ returnsDays: zInt('Returns window', { min: 0, max: 365 }) });

export async function saveReturnsSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { returnsDays } = parse(returnsSchema, formObject(fd));
    await updateStoreSettings({ returnsDays });
    revalidateAdmin();
    return ok(returnsDays ? `Returns window set to ${returnsDays} day${returnsDays === 1 ? '' : 's'}` : 'Returns window set to 0 days — returns are disabled');
  });
}

const searchesSchema = z.object({
  items: z
    .array(
      z
        .string()
        .transform(squish)
        .pipe(z.string().min(1, 'Remove empty search terms').max(40, 'Keep each search to 40 characters or fewer')),
    )
    .max(12, 'You can feature up to 12 popular searches')
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((s, i) => {
        const k = s.toLowerCase();
        if (seen.has(k)) ctx.addIssue({ code: 'custom', path: [i], message: `“${s}” is listed more than once` });
        seen.add(k);
      });
    }),
});

export async function savePopularSearches(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { items } = parse(searchesSchema, { items: strings(fd, 'items') });
    await updateStoreSettings({ popularSearches: items });
    revalidateAdmin();
    return ok(items.length ? 'Popular searches updated' : 'Popular searches cleared');
  });
}

const inventorySchema = z.object({ lowStockThreshold: zInt('Low-stock threshold', { min: 0, max: 1000 }) });

export async function saveInventorySettings(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction(async () => {
    const { lowStockThreshold } = parse(inventorySchema, formObject(fd));
    await updateStoreSettings({ lowStockThreshold });
    revalidateAdmin();
    return ok(`Low-stock threshold set to ${lowStockThreshold}`);
  });
}
