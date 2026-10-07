'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type CouponState = {
  /** Code the shopper applied in the bag; re-validated (server-side) wherever totals are shown. */
  code: string | null;
  setCode: (code: string | null) => void;
};

export const useCoupon = create<CouponState>()(
  persist((set) => ({ code: null, setCode: (code) => set({ code: code ? code.trim().toUpperCase() : null }) }), {
    name: 'aurevia-coupon',
    storage: createJSONStorage(() => localStorage),
    version: 1,
  }),
);
