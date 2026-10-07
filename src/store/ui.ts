'use client';
import { create } from 'zustand';

export type Toast = { id: number; title: string; description?: string; href?: string; action?: string };

type UIState = {
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  quickView: string | null;
  toasts: Toast[];
  setCart: (v: boolean) => void;
  setSearch: (v: boolean) => void;
  setMenu: (v: boolean) => void;
  openQuickView: (slug: string | null) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
};

let seq = 1;
export const useUI = create<UIState>()((set) => ({
  cartOpen: false,
  searchOpen: false,
  menuOpen: false,
  quickView: null,
  toasts: [],
  setCart: (v) => set((s) => ({ cartOpen: v, searchOpen: false, menuOpen: false, quickView: v ? null : s.quickView })),
  setSearch: (v) => set({ searchOpen: v, cartOpen: false, menuOpen: false }),
  setMenu: (v) => set({ menuOpen: v }),
  openQuickView: (slug) => set({ quickView: slug }),
  toast: (t) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
