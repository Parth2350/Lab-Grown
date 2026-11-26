import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './db';
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/pricing';

export const getSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    try {
      const row = await db.setting.findUnique({ where: { key: 'store' } });
      return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<StoreSettings>) ?? {}) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  ['store-settings', 'returns-7d'],
  { tags: ['settings'], revalidate: 86400 },
);
