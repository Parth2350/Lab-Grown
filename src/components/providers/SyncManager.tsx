'use client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useCart, type CartLine } from '@/store/cart';
import { useCompare, useWishlist } from '@/store/lists';
import type { ProductCard } from '@/lib/types';

type ServerState = { cart: CartLine[]; wishlist: ProductCard[]; compare: ProductCard[] };

const DEBOUNCE_MS = 800;
const COMPARE_LIMIT = 4;

const minimal = () => ({
  cart: useCart.getState().lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    diamondId: l.diamond?.id ?? null,
    diamondOptionId: l.option?.id ?? null,
    ringSize: l.ringSize ?? null,
    quantity: l.quantity,
  })),
  wishlist: useWishlist.getState().items.map((i) => i.id),
  compare: useCompare.getState().items.map((i) => i.id).slice(0, COMPARE_LIMIT),
});

type Persisted = { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };
const hydrated = (store: Persisted) =>
  store.persist.hasHydrated()
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const unsub = store.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });

/** Union by key; the server copy wins for data (current prices), the larger quantity wins. */
function mergeCart(local: CartLine[], server: CartLine[]) {
  const serverByKey = new Map(server.map((l) => [l.key, l]));
  const seen = new Set<string>();
  const out: CartLine[] = [];
  for (const l of local) {
    const s = serverByKey.get(l.key);
    out.push(s ? { ...l, ...s, quantity: Math.min(10, Math.max(s.quantity, l.quantity)), addedAt: Math.min(s.addedAt, l.addedAt) } : l);
    seen.add(l.key);
  }
  for (const s of server) if (!seen.has(s.key)) out.push(s);
  return out;
}

function mergeCards(local: ProductCard[], server: ProductCard[], limit = Infinity) {
  const fresh = new Map(server.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: ProductCard[] = [];
  for (const c of local) {
    out.push(fresh.get(c.id) ?? c);
    seen.add(c.id);
  }
  for (const c of server) if (!seen.has(c.id)) out.push(c);
  return out.slice(0, limit);
}

/**
 * Keeps the bag, wishlist and compare list in step with the signed-in account:
 * pull + merge (union) on sign-in, then debounced pushes on every change.
 * Signing out leaves local state untouched.
 */
export function SyncManager() {
  const { data, status } = useSession();
  const userId = status === 'authenticated' ? data?.user?.id : undefined;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSent = '';
    const unsubs: (() => void)[] = [];

    const push = (keepalive = false) => {
      const body = JSON.stringify(minimal());
      if (body === lastSent) return;
      lastSent = body;
      fetch('/api/me/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body, keepalive, credentials: 'same-origin' })
        .then((res) => {
          if (!res.ok) lastSent = '';
        })
        .catch(() => {
          lastSent = '';
        });
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        push();
      }, DEBOUNCE_MS);
    };
    const flush = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = undefined;
      push(true);
    };
    const onVisibility = () => document.visibilityState === 'hidden' && flush();

    (async () => {
      await Promise.all([hydrated(useCart), hydrated(useWishlist), hydrated(useCompare)]);
      let server: ServerState | null = null;
      try {
        const res = await fetch('/api/me/state', { cache: 'no-store', credentials: 'same-origin' });
        if (res.ok) server = (await res.json()) as ServerState;
      } catch {
        /* offline — try again on the next sign-in / page load */
      }
      // Never push without having merged first, or we could overwrite the account's saved state.
      if (cancelled || !server) return;

      useCart.getState().replace(mergeCart(useCart.getState().lines, server.cart));
      useWishlist.getState().replace(mergeCards(useWishlist.getState().items, server.wishlist));
      useCompare.getState().replace(mergeCards(useCompare.getState().items, server.compare, COMPARE_LIMIT));
      push();

      unsubs.push(useCart.subscribe(schedule), useWishlist.subscribe(schedule), useCompare.subscribe(schedule));
      window.addEventListener('pagehide', flush);
      document.addEventListener('visibilitychange', onVisibility);
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubs.forEach((u) => u());
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId]);

  return null;
}
