import { ProductMedia } from '@/components/product/ProductMedia';
import type { CollectionProductHit } from '@/lib/server/admin/queries/collections';
import { cn } from '@/lib/utils';

/** Small square product thumbnail — photo when uploaded, otherwise the procedural art. */
export function ProductThumb({ product, size = 44, className }: { product: CollectionProductHit; size?: number; className?: string }) {
  return (
    <div className={cn('art-tile relative shrink-0 overflow-hidden border border-line', className)} style={{ width: size, height: size }}>
      <ProductMedia name={product.name} art={product.art} images={product.images} shape={product.shape} metal={product.metal} carat={product.carat} sizes={`${size}px`} />
    </div>
  );
}
