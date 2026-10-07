'use client';
import { useMounted } from '@/hooks/use-mounted';
import { useCompare, useRecentlyViewed, useWishlist } from '@/store/lists';

/** Count of a persisted client list (rendered after mount to avoid hydration mismatches). */
export function ListCount({ list }: { list: 'wishlist' | 'compare' | 'recent' }) {
  const mounted = useMounted();
  const wish = useWishlist((s) => s.items.length);
  const compare = useCompare((s) => s.items.length);
  const recent = useRecentlyViewed((s) => s.items.length);
  if (!mounted) return <span className="inline-block w-4">&nbsp;</span>;
  return <>{list === 'wishlist' ? wish : list === 'compare' ? compare : recent}</>;
}
