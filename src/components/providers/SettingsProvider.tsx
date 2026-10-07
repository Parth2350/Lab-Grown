'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/pricing';

const Ctx = createContext<StoreSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ value, children }: { value: StoreSettings; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Store settings (tax rate, shipping methods, announcements…) loaded on the server. */
export const useStoreSettings = () => useContext(Ctx);
