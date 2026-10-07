import 'server-only';
import { db } from '@/lib/server/db';
import { revalidateSettings } from '@/lib/server/revalidate';
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/pricing';

/** Uncached read of the 'store' settings row merged over DEFAULT_SETTINGS (admin always sees the truth). */
export async function readStoreSettings(): Promise<StoreSettings> {
  const row = await db.setting.findUnique({ where: { key: 'store' } });
  const value = (row?.value ?? {}) as Partial<StoreSettings>;
  return { ...DEFAULT_SETTINGS, ...value, hero: { ...DEFAULT_SETTINGS.hero, ...(value.hero ?? {}) } };
}

/**
 * Merge a partial patch into the 'store' settings row and revalidate the storefront.
 * Both the Settings page and the Shipping page write through here so neither clobbers the other.
 */
export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const next = await db.$transaction(async (tx) => {
    const row = await tx.setting.findUnique({ where: { key: 'store' } });
    const current = { ...DEFAULT_SETTINGS, ...((row?.value ?? {}) as Partial<StoreSettings>) };
    const merged: StoreSettings = { ...current, ...patch, hero: { ...DEFAULT_SETTINGS.hero, ...current.hero, ...(patch.hero ?? {}) } };
    await tx.setting.upsert({
      where: { key: 'store' },
      create: { key: 'store', value: merged as object },
      update: { value: merged as object },
    });
    return merged;
  });
  revalidateSettings();
  return next;
}
