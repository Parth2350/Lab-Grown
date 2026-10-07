'use client';
import { JewelryArt, LooseDiamond, type JewelryArtProps } from '@/components/art/JewelryArt';
import { EditorialArt, type EditorialScene } from '@/components/art/EditorialArt';
import { LazyMount } from '@/components/ui/LazyMount';

/**
 * Below-the-fold illustrations rendered on the client from a few props, as they approach
 * the viewport. Keeps large SVG trees out of the server HTML and RSC payload (and out of
 * hydration), which matters on an art-heavy page. `className` styles the wrapper.
 */

export function LazyJewelryArt({ className, ...art }: JewelryArtProps & { className?: string }) {
  return (
    <LazyMount className={className}>
      <JewelryArt {...art} className="h-full w-full" />
    </LazyMount>
  );
}

export function LazyLooseDiamond({ shape, title, className }: { shape: string; title?: string; className?: string }) {
  return (
    <LazyMount className={className}>
      <LooseDiamond shape={shape} title={title} className="h-full w-full" />
    </LazyMount>
  );
}

export function LazyEditorialArt({ scene, className, decorative }: { scene: EditorialScene; className?: string; decorative?: boolean }) {
  return (
    <LazyMount className={className}>
      <EditorialArt scene={scene} decorative={decorative} />
    </LazyMount>
  );
}
