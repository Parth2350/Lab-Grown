'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ArtSpec } from '@/components/art/JewelryArt';

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  variantId: string;
  purity: string;
  metalColor: string;
  diamond?: { id: string; summary: string; price: number; shape: string; carat: number } | null;
  option?: { id: string; label: string; priceDelta: number } | null;
  ringSize?: string | null;
  quantity: number;
  /** Client-side estimate in cents. The server re-prices every line at checkout. */
  unitPrice: number;
  art: ArtSpec | null;
  shape: string;
  carat: number;
  image?: string | null;
  addedAt: number;
};

export const lineKey = (l: Pick<CartLine, 'productId' | 'variantId' | 'ringSize'> & { diamondId?: string | null; optionId?: string | null }) =>
  [l.productId, l.variantId, l.diamondId ?? '', l.optionId ?? '', l.ringSize ?? ''].join('|');

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'key' | 'addedAt'>) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const key = lineKey({ ...line, diamondId: line.diamond?.id, optionId: line.option?.id });
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(10, l.quantity + line.quantity), unitPrice: line.unitPrice } : l)) };
          }
          return { lines: [...s.lines, { ...line, key, addedAt: Date.now() }] };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setQty: (key, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(10, qty)) } : l)) })),
      clear: () => set({ lines: [] }),
      replace: (lines) => set({ lines }),
    }),
    // v2: prices moved from USD to INR — carts saved before that are dropped
    { name: 'aurevia-cart', storage: createJSONStorage(() => localStorage), version: 2, migrate: () => ({ lines: [] }) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
