'use client';
import { useMemo, useState } from 'react';
import type { DiamondData, DiamondOptionData, ProductDetail, VariantData } from '@/lib/types';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { unitPrice } from '@/lib/pricing';
import { RING_SIZES, SHAPE_SLUGS, nameFor, type ShapeSlug } from '@/lib/catalog';
import { caratOf, sizedPrice, variantSummary } from '@/lib/variant';

export const ENGRAVING_MAX = 12;

export type InitialConfig = { metal?: string; purity?: string; size?: string; shape?: string; carat?: string; length?: string };

export function diamondSummary(d: Pick<DiamondData, 'carat' | 'shape' | 'color' | 'clarity' | 'cut'>) {
  return `${d.carat.toFixed(2)} ct ${d.shape[0].toUpperCase()}${d.shape.slice(1)} · ${d.color} · ${d.clarity} · ${d.cut}`;
}

type Axis = 'metal' | 'purity' | 'shape' | 'carat' | 'length';
type Want = { metal: string; purity: string; shape: string | null; carat: number | null; length: string | null };

/**
 * Catalogue products: every choice resolves to a real variant. The axis the shopper just changed
 * is kept; the others move to the closest combination that exists (same metal and purity first).
 */
function pickVariant(p: ProductDetail, want: Want, pin: Axis | null): VariantData | undefined {
  const axes = p.optionAxes;
  const value = (v: VariantData, a: Axis) =>
    a === 'metal' ? v.metalColor : a === 'purity' ? v.purity : a === 'shape' ? v.shape ?? null : a === 'carat' ? caratOf(v, p.caratKind) : v.length ?? null;
  let best: VariantData | undefined;
  let bestScore = -Infinity;
  for (const v of p.variants) {
    if (pin && value(v, pin) !== want[pin]) continue;
    let score = (v.metalColor === want.metal ? 16 : 0) + (v.purity === want.purity ? 8 : 0);
    if (axes.includes('shape')) score += v.shape === want.shape ? 4 : 0;
    if (axes.includes('carat')) {
      const c = caratOf(v, p.caratKind);
      score += c === want.carat ? 2 : -Math.min(1.9, Math.abs((c ?? 0) - (want.carat ?? 0)));
    }
    if (axes.includes('length')) score += v.length === want.length ? 1 : 0;
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best ?? p.variants[0];
}

/** All configuration state for a product page / quick view, plus live price and add-to-cart. */
export function useConfiguration(p: ProductDetail, init: InitialConfig = {}) {
  const catalog = !!p.familyKey || p.optionAxes.length > 0;

  // ── admin-made products: metal × purity rows + a certified diamond or a diamond-weight option ──
  const [metalState, setMetal] = useState(init.metal && p.metalColors.includes(init.metal) ? init.metal : p.defaultMetalColor);
  const [purityState, setPurity] = useState(init.purity && p.purities.includes(init.purity) ? init.purity : p.purities.includes(p.defaultPurity) ? p.defaultPurity : p.purities[0]);
  const centerOption = catalog ? null : p.diamondOptions.find((o) => o.kind === 'CENTER_STONE') ?? null;
  const homeShape = p.defaultDiamond?.shape ?? centerOption?.shape ?? p.shapes[0] ?? 'round';
  // centre-stone pieces can be set with any shape; the picker loads matching diamonds when it changes
  const [stoneShape, setStoneShape] = useState(init.shape && SHAPE_SLUGS.includes(init.shape as ShapeSlug) ? init.shape : homeShape);
  const [diamond, setDiamond] = useState<DiamondData | null>(stoneShape === homeShape ? p.defaultDiamond : null);
  const tw = catalog ? [] : p.diamondOptions.filter((o) => o.kind === 'TOTAL_WEIGHT');
  const [option, setOption] = useState<DiamondOptionData | null>(tw.find((o) => o.isDefault) ?? tw[0] ?? null);

  // ── catalogue products: the selected variant is the state ──
  const [variantId, setVariantId] = useState(() => {
    if (!catalog) return '';
    const carat = init.carat ? Number(init.carat) : p.caratKind === 'total' ? p.totalCarat : p.centerCarat;
    const want: Want = {
      metal: init.metal && p.metalColors.includes(init.metal) ? init.metal : p.defaultMetalColor,
      purity: init.purity && p.purities.includes(init.purity) ? init.purity : p.defaultPurity,
      shape: init.shape && p.shapes.includes(init.shape) ? init.shape : p.shapes[0] ?? null,
      carat: Number.isFinite(carat) ? carat ?? null : null,
      length: init.length ?? null,
    };
    return pickVariant(p, want, null)?.id ?? '';
  });

  const [ringSize, setRingSize] = useState<string>(init.size ?? '');
  const [engraving, setEngraving] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const add = useCart((s) => s.add);
  const { setCart, toast } = useUI();

  const variant = useMemo(
    () =>
      catalog
        ? p.variants.find((v) => v.id === variantId) ?? p.variants[0]
        : p.variants.find((v) => v.purity === purityState && v.metalColor === metalState) ?? p.variants.find((v) => v.purity === purityState) ?? p.variants[0],
    [catalog, p.variants, variantId, purityState, metalState],
  );
  const metal = catalog ? variant?.metalColor ?? p.defaultMetalColor : metalState;
  const purity = catalog ? variant?.purity ?? p.defaultPurity : purityState;
  const selected: Want = { metal, purity, shape: variant?.shape ?? null, carat: variant ? caratOf(variant, p.caratKind) : null, length: variant?.length ?? null };
  const choose = (axis: Axis, value: string | number) => {
    const next = pickVariant(p, { ...selected, [axis]: value }, axis);
    if (next) setVariantId(next.id);
  };

  // what can be chosen next to the current selection (catalogue products)
  const choices = useMemo(() => {
    if (!catalog) return { shapes: [], carats: [], lengths: [] };
    const uniq = <T,>(xs: T[]) => [...new Set(xs)];
    const shapeOf = selected.shape;
    const sameShape = p.variants.filter((v) => !p.optionAxes.includes('shape') || v.shape === shapeOf);
    return {
      shapes: p.optionAxes.includes('shape') ? p.shapes.filter((s) => p.variants.some((v) => v.shape === s)) : [],
      carats: p.optionAxes.includes('carat') ? uniq(sameShape.map((v) => caratOf(v, p.caratKind)).filter((c): c is number => c != null)).sort((a, b) => a - b) : [],
      lengths: p.optionAxes.includes('length')
        ? uniq(sameShape.filter((v) => !p.optionAxes.includes('carat') || caratOf(v, p.caratKind) === selected.carat).map((v) => v.length).filter((l): l is string => !!l)).sort((a, b) => Number(a) - Number(b))
        : [],
    };
  }, [catalog, p.variants, p.optionAxes, p.shapes, p.caratKind, selected.shape, selected.carat]);

  const sizes = p.ringSizes.length ? p.ringSizes : RING_SIZES;
  const diamondPrice = centerOption ? diamond?.price ?? 0 : 0;
  const optionPrice = !centerOption ? option?.priceDelta ?? 0 : 0;
  const price = catalog
    ? variant
      ? sizedPrice(variant, ringSize)
      : p.fromPrice
    : unitPrice({ variantPrice: variant?.price ?? p.fromPrice, diamondPrice, optionDelta: optionPrice });
  const carat = catalog
    ? caratOf(variant ?? {}, p.caratKind) ?? p.centerCarat ?? p.totalCarat ?? 1
    : centerOption
      ? diamond?.carat ?? p.centerCarat ?? 1
      : option?.totalCarat ?? p.totalCarat ?? 1;
  const shape = catalog ? variant?.shape ?? p.shapes[0] ?? 'round' : centerOption ? stoneShape : p.shapes[0] ?? 'round';
  const inStock = (variant?.stock ?? 0) > 0;
  const madeToOrder = p.madeToOrder || !inStock;
  const needsDiamond = !!centerOption && !diamond;
  const details = catalog && variant ? variantSummary(variant) : null;

  function addToCart(opts: { silent?: boolean } = {}) {
    if (p.requiresSize && !ringSize) {
      setSizeError(true);
      document.getElementById(`ring-size-${p.id}`)?.focus();
      return false;
    }
    if (!variant || needsDiamond) return false;
    const photo = p.images.find((i) => i.kind === 'image' && i.metalColor === metal && (!i.shape || i.shape === shape)) ?? p.images.find((i) => i.kind === 'image');
    add({
      productId: p.id,
      slug: p.slug,
      name: nameFor(p.name, variant.metalColor, variant.purity),
      sku: variant.sku,
      category: p.category.slug,
      variantId: variant.id,
      purity: variant.purity,
      metalColor: variant.metalColor,
      diamond: centerOption && diamond ? { id: diamond.id, summary: diamondSummary(diamond), price: diamond.price, shape: diamond.shape, carat: diamond.carat } : null,
      option: !centerOption && option ? { id: option.id, label: option.label ?? `${option.totalCarat} ct total weight`, priceDelta: option.priceDelta } : null,
      details,
      ringSize: p.requiresSize ? ringSize : null,
      engraving: p.showEngraving ? engraving.trim() || null : null,
      quantity,
      unitPrice: price,
      art: p.art,
      shape,
      carat,
      image: photo?.url ?? null,
    });
    if (!opts.silent) {
      setCart(true);
      toast({ title: 'Added to your bag', description: nameFor(p.name, variant.metalColor, variant.purity), href: '/cart', action: 'View bag' });
    }
    return true;
  }

  return {
    catalog,
    metal,
    setMetal: (m: string) => (catalog ? choose('metal', m) : setMetal(m)),
    purity,
    setPurity: (x: string) => (catalog ? choose('purity', x) : setPurity(x)),
    diamond,
    setDiamond,
    setShape: (s: string) => (catalog ? choose('shape', s) : setStoneShape(s)),
    setCarat: (c: number) => choose('carat', c),
    setLength: (l: string) => choose('length', l),
    choices,
    selectedCarat: selected.carat,
    selectedLength: selected.length,
    option,
    setOption,
    sizes,
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
    details,
    price,
    carat,
    shape,
    inStock,
    madeToOrder,
    centerOption,
    totalWeightOptions: tw,
    needsDiamond,
    addToCart,
  };
}

export type Configuration = ReturnType<typeof useConfiguration>;
