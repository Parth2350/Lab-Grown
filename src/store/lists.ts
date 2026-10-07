'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProductCard } from '@/lib/types';

type ListState = {
  items: ProductCard[];
  toggle: (p: ProductCard) => boolean;
  add: (p: ProductCard) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  replace: (items: ProductCard[]) => void;
};

function makeList(name: string, max: number) {
  return create<ListState>()(
    persist(
      (set, get) => ({
        items: [],
        toggle: (p) => {
          const exists = get().items.some((i) => i.id === p.id);
          if (exists) set((s) => ({ items: s.items.filter((i) => i.id !== p.id) }));
          else set((s) => ({ items: [p, ...s.items].slice(0, max) }));
          return !exists;
        },
        add: (p) => set((s) => ({ items: [p, ...s.items.filter((i) => i.id !== p.id)].slice(0, max) })),
        remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
        has: (id) => get().items.some((i) => i.id === id),
        clear: () => set({ items: [] }),
        replace: (items) => set({ items: items.slice(0, max) }),
      }),
      { name, storage: createJSONStorage(() => localStorage), version: 1 },
    ),
  );
}

export const useWishlist = makeList('aurevia-wishlist', 100);
export const useCompare = makeList('aurevia-compare', 4);
export const useRecentlyViewed = makeList('aurevia-recent', 12);
export const COMPARE_MAX = 4;

type SearchHistory = { terms: string[]; push: (t: string) => void; clear: () => void };
export const useSearchHistory = create<SearchHistory>()(
  persist(
    (set) => ({
      terms: [],
      push: (t) => {
        const term = t.trim();
        if (!term) return;
        set((s) => ({ terms: [term, ...s.terms.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 6) }));
      },
      clear: () => set({ terms: [] }),
    }),
    { name: 'aurevia-searches', storage: createJSONStorage(() => localStorage) },
  ),
);
