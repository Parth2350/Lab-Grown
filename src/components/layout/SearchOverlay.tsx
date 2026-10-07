'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Search, TrendingUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/store/ui';
import { useSearchHistory } from '@/store/lists';
import { Sheet } from '@/components/ui/Sheet';
import { ProductMedia } from '@/components/product/ProductMedia';
import { ShapeIcon } from '@/components/art/ShapeIcon';
import { SHAPES } from '@/lib/catalog';
import { formatMoney } from '@/lib/utils';
import type { ProductCard } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

type Result = {
  total: number;
  products: ProductCard[];
  categories: { slug: string; name: string; href: string }[];
  collections: { slug: string; name: string; href: string }[];
  shapes: { slug: string; name: string; href: string }[];
};

export function SearchOverlay({ popular }: { popular: string[] }) {
  const open = useUI((s) => s.searchOpen);
  const setSearch = useUI((s) => s.setSearch);
  const router = useRouter();
  const mounted = useMounted();
  const { terms, push, clear } = useSearchHistory();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: Result) => setRes(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const close = () => setSearch(false);
  const go = (term: string) => {
    if (!term.trim()) return;
    push(term);
    close();
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const empty = res && res.total === 0 && !res.categories.length && !res.collections.length && !res.shapes.length;

  return (
    <Sheet open={open} onClose={close} side="top" hideClose label="Search" className="max-h-[92vh]" bodyClassName="pb-8">
      <div className="container-x pt-5">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
          className="flex items-center gap-4 border-b border-ink pb-3"
        >
          <Search className="h-5 w-5 shrink-0 text-taupe" strokeWidth={1.25} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try ‘2ct oval halo’, a shape, or a SKU"
            aria-label="Search jewelry"
            className="min-w-0 flex-1 bg-transparent py-2 font-serif text-2xl text-ink placeholder:text-taupe/60 focus:outline-none sm:text-3xl"
            data-autofocus
          />
          {loading && <span className="h-4 w-4 animate-spin rounded-full border border-taupe border-t-transparent" aria-hidden />}
          <button type="button" onClick={close} className="rounded-full p-2 hover:bg-porcelain" aria-label="Close search">
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </form>

        {!res || q.trim().length < 2 ? (
          <div className="grid gap-10 py-8 md:grid-cols-3">
            {mounted && terms.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="eyebrow flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.25} /> Recent searches
                  </p>
                  <button onClick={clear} className="text-[11px] text-taupe underline-offset-4 hover:underline">
                    Clear
                  </button>
                </div>
                <ul className="space-y-2.5">
                  {terms.map((t) => (
                    <li key={t}>
                      <button onClick={() => go(t)} className="link-underline text-[15px] text-charcoal">
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="eyebrow mb-4 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.25} /> Popular searches
              </p>
              <ul className="flex flex-wrap gap-2">
                {popular.map((t) => (
                  <li key={t}>
                    <button onClick={() => go(t)} className="border border-line px-3.5 py-2 text-[13px] transition-colors hover:border-ink">
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-4">Shop by shape</p>
              <ul className="grid grid-cols-5 gap-2">
                {SHAPES.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/collections/shape/${s.slug}`} onClick={close} className="group flex flex-col items-center gap-1 py-1 text-[11px] text-taupe hover:text-ink">
                      <ShapeIcon shape={s.slug} size={30} className="transition-colors group-hover:text-gold" />
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : empty ? (
          <div className="py-12 text-center">
            <p className="font-serif text-2xl">No results for “{q}”</p>
            <p className="mt-2 text-sm text-taupe">Try a shape like “oval”, a style like “halo”, or browse popular searches.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {popular.slice(0, 4).map((t) => (
                <button key={t} onClick={() => setQ(t)} className="border border-line px-3.5 py-2 text-[13px] hover:border-ink">
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-10 py-8 lg:grid-cols-[1fr_3fr]">
            <div className="space-y-7">
              {[
                { title: 'Categories', items: res.categories },
                { title: 'Collections', items: res.collections },
              ].map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={g.title}>
                      <p className="eyebrow mb-3">{g.title}</p>
                      <ul className="space-y-2">
                        {g.items.map((c) => (
                          <li key={c.href}>
                            <Link href={c.href} onClick={close} className="link-underline text-[15px]">
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
              {res.shapes.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Shapes</p>
                  <ul className="flex flex-wrap gap-3">
                    {res.shapes.map((s) => (
                      <li key={s.slug}>
                        <Link href={s.href} onClick={close} className="flex items-center gap-2 border border-line px-3 py-2 text-[13px] hover:border-ink">
                          <ShapeIcon shape={s.slug} size={20} /> {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="eyebrow">Products ({res.total})</p>
                {res.total > 0 && (
                  <button onClick={() => go(q)} className="label-caps flex items-center gap-2">
                    View all results <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {res.products.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={() => {
                        push(q);
                        close();
                      }}
                      className="group block"
                    >
                      <div className="art-tile aspect-square overflow-hidden p-3">
                        <ProductMedia name={p.name} art={p.art} images={p.images} shape={p.shapes[0]} metal={p.defaultMetalColor} carat={p.centerCarat ?? p.totalCarat} className="transition-transform duration-500 group-hover:scale-105" sizes="200px" />
                      </div>
                      <p className="mt-2 line-clamp-2 font-serif text-[15px] leading-snug">{p.name}</p>
                      <p className="text-[12px] text-taupe">From {formatMoney(p.fromPrice)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
