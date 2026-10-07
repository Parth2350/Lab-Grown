'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProductDetail } from '@/lib/types';
import { useUI } from '@/store/ui';
import { Sheet } from '@/components/ui/Sheet';
import { ProductExperience } from '@/components/pdp/ProductExperience';

/** Quick view modal — full configuration (metal, diamond, size) and add to cart without leaving the page. */
export function QuickView() {
  const slug = useUI((s) => s.quickView);
  const close = useUI((s) => s.openQuickView);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState(false);
  const pathname = usePathname();

  useEffect(() => close(null), [pathname, close]);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setError(false);
    const ctrl = new AbortController();
    fetch(`/api/products/${slug}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProduct)
      .catch(() => !ctrl.signal.aborted && setError(true));
    return () => ctrl.abort();
  }, [slug]);

  return (
    <Sheet open={!!slug} onClose={() => close(null)} side="center" label="Quick view" bodyClassName="p-5 sm:p-8">
      {error ? (
        <p className="py-20 text-center text-taupe">This piece could not be loaded. Please try again.</p>
      ) : !product ? (
        <div className="grid gap-8 md:grid-cols-2" aria-busy="true">
          <div className="aspect-square animate-pulse bg-porcelain" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse bg-porcelain" />
            <div className="h-10 w-3/4 animate-pulse bg-porcelain" />
            <div className="h-8 w-32 animate-pulse bg-porcelain" />
            <div className="h-40 animate-pulse bg-porcelain" />
          </div>
        </div>
      ) : (
        <>
          <ProductExperience key={product.id} p={product} compact />
          <div className="mt-8 border-t border-line pt-5 text-center">
            <Link href={`/products/${product.slug}`} onClick={() => close(null)} className="label-caps inline-flex items-center gap-2 border-b border-ink pb-1">
              View full details <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </>
      )}
    </Sheet>
  );
}
