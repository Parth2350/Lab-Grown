import 'server-only';
import { db } from './db';

/**
 * Recomputes the denormalised Product.fromPrice (cheapest variant + cheapest diamond
 * option) — call after editing variants, diamond options or diamond inventory.
 */
export async function recomputeFromPrice(productId: string) {
  const p = await db.product.findUnique({
    where: { id: productId },
    select: { centerCarat: true, totalCarat: true, variants: { where: { isActive: true }, select: { price: true } }, diamondOptions: true },
  });
  if (!p) return;
  const minVariant = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
  let diamond = 0;
  const center = p.diamondOptions.find((o) => o.kind === 'CENTER_STONE');
  if (center?.shape) {
    const cheapest = await db.diamond.findFirst({
      where: { shape: center.shape, isAvailable: true, carat: { gte: center.minCarat ?? 0, lte: center.maxCarat ?? 99 } },
      orderBy: { price: 'asc' },
      select: { price: true },
    });
    diamond = cheapest?.price ?? 0;
  } else {
    const tw = p.diamondOptions.filter((o) => o.kind === 'TOTAL_WEIGHT');
    if (tw.length) diamond = Math.min(...tw.map((o) => o.priceDelta));
  }
  const def = p.diamondOptions.find((o) => o.isDefault && o.kind === 'TOTAL_WEIGHT');
  await db.product.update({
    where: { id: productId },
    data: {
      fromPrice: minVariant + diamond,
      ...(def?.totalCarat != null ? { totalCarat: def.totalCarat } : {}),
      caratSort: p.centerCarat ?? def?.totalCarat ?? p.totalCarat ?? 0,
    },
  });
}

/** Recompute every product's fromPrice (e.g. after bulk diamond inventory changes). */
export async function recomputeAllFromPrices() {
  const ids = await db.product.findMany({ select: { id: true } });
  for (const { id } of ids) await recomputeFromPrice(id);
}
