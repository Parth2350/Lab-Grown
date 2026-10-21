import Image from 'next/image';
import { JewelryArt, type ArtSpec } from '@/components/art/JewelryArt';
import { cn } from '@/lib/utils';
import type { MediaImage } from '@/lib/types';
import { isCatalogMedia } from '@/lib/catalog';

type Props = {
  name: string;
  art: ArtSpec | null;
  images?: MediaImage[];
  shape?: string;
  metal?: string;
  carat?: number | null;
  /** 0 = primary, 1 = secondary/hover, 2 = close-up */
  view?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Shows uploaded photography when available (optimised via next/image → AVIF/WebP),
 * otherwise the procedural illustration that recolours with the selected metal.
 */
export function ProductMedia({ name, art, images = [], shape = 'round', metal = 'yellow', carat, view = 0, sizes = '(min-width:1024px) 25vw, 50vw', priority, className }: Props) {
  const photos = images.filter((i) => i.kind === 'image');
  const byMetal = photos.filter((i) => !i.metalColor || i.metalColor === metal);
  const pool = byMetal.length ? byMetal : photos;
  const photo = pool[view] ?? (view === 0 ? pool[0] : undefined);

  if (photo) {
    return (
      <div className={cn('relative h-full w-full', className)}>
        <Image src={photo.url} alt={photo.alt ?? name} fill sizes={sizes} priority={priority} unoptimized={isCatalogMedia(photo.url)} className="object-cover" />
      </div>
    );
  }
  return (
    <JewelryArt
      spec={art ?? { kind: 'ring' }}
      shape={shape}
      metal={metal}
      carat={carat ?? 1}
      view={view}
      title={view ? `${name} — alternate view` : name}
      className={cn('h-full w-full', className)}
    />
  );
}
