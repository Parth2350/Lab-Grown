'use client';
import { useMemo, useState } from 'react';
import type { DiamondData, DiamondOptionData, ProductDetail } from '@/lib/types';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { unitPrice } from '@/lib/pricing';
import { SHAPE_SLUGS, type ShapeSlug } from '@/lib/catalog';

export const ENGRAVING_MAX = 12;

export type InitialConfig = { metal?: string; purity?: string; size?: string; shape?: string };

export function diamondSummary(d: Pick<DiamondData, 'carat' | 'shape' | 'color' | 'clarity' | 'cut'>) {
  return `${d.carat.toFixed(2)} ct ${d.shape[0].toUpperCase()}${d.shape.slice(1)} · ${d.color} · ${d.clarity} · ${d.cut}`;
}

/** All configuration state for a product page / quick view, plus live price and add-to-cart. */
export function useConfiguration(p: ProductDetail, init: InitialConfig = {}) {
  const [metal, setMetal] = useState(init.metal && p.metalColors.includes(init.metal) ? init.metal : p.defaultMetalColor);
  const [purity, setPurity] = useState(init.purity && p.purities.includes(init.purity) ? init.purity : p.purities.includes(p.defaultPurity) ? p.defaultPurity : p.purities[0]);
  const centerOption = p.diamondOptions.find((o) => o.kind === 'CENTER_STONE') ?? null;
  const homeShape = p.defaultDiamond?.shape ?? centerOption?.shape ?? p.shapes[0] ?? 'round';
  // centre-stone pieces can be set with any shape; the picker loads matching diamonds when it changes
  const [stoneShape, setStoneShape] = useState(init.shape && SHAPE_SLUGS.includes(init.shape as ShapeSlug) ? init.shape : homeShape);
  const [diamond, setDiamond] = useState<DiamondData | null>(stoneShape === homeShape ? p.defaultDiamond : null);
  const tw = p.diamondOptions.filter((o) => o.kind === 'TOTAL_WEIGHT');
  const [option, setOption] = useState<DiamondOptionData | null>(tw.find((o) => o.isDefault) ?? tw[0] ?? null);
  const [ringSize, setRingSize] = useState<string>(init.size ?? '');
  const [engraving, setEngraving] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const add = useCart((s) => s.add);
  const { setCart, toast } = useUI();

  const variant = useMemo(
    () => p.variants.find((v) => v.purity === purity && v.metalColor === metal) ?? p.variants.find((v) => v.purity === purity) ?? p.variants[0],
    [p.variants, purity, metal],
  );
  const diamondPrice = centerOption ? diamond?.price ?? 0 : 0;
  const optionPrice = !centerOption ? option?.priceDelta ?? 0 : 0;
  const price = unitPrice({ variantPrice: variant?.price ?? p.fromPrice, diamondPrice, optionDelta: optionPrice });
  const carat = centerOption ? diamond?.carat ?? p.centerCarat ?? 1 : option?.totalCarat ?? p.totalCarat ?? 1;
  const shape = centerOption ? stoneShape : p.shapes[0] ?? 'round';
  const inStock = (variant?.stock ?? 0) > 0;
  const needsDiamond = !!centerOption && !diamond;

  function addToCart(opts: { silent?: boolean } = {}) {
    if (p.requiresSize && !ringSize) {
      setSizeError(true);
      document.getElementById(`ring-size-${p.id}`)?.focus();
      return false;
    }
    if (!variant || needsDiamond) return false;
    add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      sku: variant.sku,
      category: p.category.slug,
      variantId: variant.id,
      purity: variant.purity,
      metalColor: variant.metalColor,
      diamond: centerOption && diamond ? { id: diamond.id, summary: diamondSummary(diamond), price: diamond.price, shape: diamond.shape, carat: diamond.carat } : null,
      option: !centerOption && option ? { id: option.id, label: option.label ?? `${option.totalCarat} ct total weight`, priceDelta: option.priceDelta } : null,
      ringSize: p.requiresSize ? ringSize : null,
      engraving: p.requiresSize ? engraving.trim() || null : null,
      quantity,
      unitPrice: price,
      art: p.art,
      shape,
      carat,
      image: p.images.find((i) => i.kind === 'image')?.url ?? null,
    });
    if (!opts.silent) {
      setCart(true);
      toast({ title: 'Added to your bag', description: p.name, href: '/cart', action: 'View bag' });
    }
    return true;
  }

  return {
    metal,
    setMetal,
    purity,
    setPurity,
    diamond,
    setDiamond,
    setShape: setStoneShape,
    option,
    setOption,
    ringSize,
    setRingSize: (s: string) => {
      setRingSize(s);
      setSizeError(false);
    },
    sizeError,
    engraving,
    setEngraving: (s: string) => setEngraving(s.slice(0, ENGRAVING_MAX)),
    quantity,
    setQuantity,
    variant,
    price,
    carat,
    shape,
    inStock,
    centerOption,
    totalWeightOptions: tw,
    needsDiamond,
    addToCart,
  };
}

export type Configuration = ReturnType<typeof useConfiguration>;
