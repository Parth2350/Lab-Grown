'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Plus, Search } from 'lucide-react';
import { addProductToCollection, searchProductsForCollection } from '@/lib/server/admin/actions/collections';
import type { CollectionProductHit } from '@/lib/server/admin/queries/collections';
import { Badge } from '../ui';
import { toast } from '../toast';
import { ProductThumb } from './ProductThumb';

/**
 * Debounced product search (server action) listing up to 20 products that are not yet
 * in the collection, each with an Add button. Adding revalidates the page so the
 * "In this collection" table refreshes on its own.
 */
export function CollectionProductPicker({ collectionId, collectionName, memberCount }: { collectionId: string; collectionName: string; memberCount: number }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CollectionProductHit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const seq = useRef(0);

  // Re-query when the term changes or when membership changes (add/remove elsewhere on the page).
  useEffect(() => {
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(
      async () => {
        const res = await searchProductsForCollection(collectionId, q).catch(() => null);
        if (id !== seq.current) return;
        setLoading(false);
        if (res?.ok) setResults(res.data ?? []);
        else {
          setResults([]);
          toast.error(res?.message ?? 'Search failed. Please try again.');
        }
      },
      q ? 250 : 0,
    );
    return () => clearTimeout(t);
  }, [q, collectionId, memberCount]);

  const add = (p: CollectionProductHit) => {
    setAddingId(p.id);
    startTransition(async () => {
      const res = await addProductToCollection(collectionId, p.id).catch(() => ({ ok: false as const, message: 'Something went wrong. Please try again.' }));
      setAddingId(null);
      toast.result(res, `Added ${p.name}`);
      if (res.ok) setResults((r) => r?.filter((x) => x.id !== p.id) ?? r);
    });
  };

  return (
    <div>
      <label htmlFor="collection-product-search" className="mb-1.5 block text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal">
        Find products to add
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} aria-hidden />
        <input
          id="collection-product-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or SKU…"
          autoComplete="off"
          className="field h-10 py-0 pl-9 text-[15px]"
          aria-controls="collection-product-results"
          aria-describedby="collection-product-search-hint"
        />
      </div>
      <p id="collection-product-search-hint" className="mt-1 text-xs text-taupe">
        {q ? 'Matching products' : 'Newest products'} not yet in {collectionName}. Showing up to 20.
      </p>

      <div id="collection-product-results" aria-live="polite" aria-busy={loading} className="mt-3 border border-line bg-white">
        {results === null ? (
          <p className="px-4 py-6 text-center text-xs text-taupe">Loading products…</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-taupe">{loading ? 'Searching…' : q ? `No products match “${q}”.` : 'Every product is already in this collection.'}</p>
        ) : (
          <ul className={loading ? 'opacity-60 transition-opacity' : undefined}>
            {results.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-line/70 px-3 py-2 last:border-0">
                <ProductThumb product={p} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-ink">{p.name}</p>
                  <p className="truncate text-[13.5px] text-taupe">
                    {p.sku} · {p.categoryName}
                  </p>
                </div>
                {!p.isActive && <Badge tone="neutral">Hidden</Badge>}
                <button
                  type="button"
                  onClick={() => add(p)}
                  disabled={addingId !== null}
                  aria-label={`Add ${p.name} to ${collectionName}`}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 border border-ink/80 px-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-ivory disabled:opacity-40"
                >
                  {addingId === p.id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />
                  ) : (
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  )}
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
