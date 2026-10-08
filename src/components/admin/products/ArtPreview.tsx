'use client';
import { JewelryArt, type ArtSpec } from '@/components/art/JewelryArt';
import { METAL_COLORS } from '@/lib/catalog';
import { cn } from '@/lib/utils';

/** Swatch buttons for the metals a product is offered in */
export function MetalSwitcher({ metals, value, onChange, className }: { metals: string[]; value: string; onChange: (m: string) => void; className?: string }) {
  const list = METAL_COLORS.filter((m) => metals.includes(m.slug));
  if (!list.length) return null;
  return (
    <div role="radiogroup" aria-label="Preview metal" className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {list.map((m) => {
        const active = m.slug === value;
        return (
          <button
            key={m.slug}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={m.label}
            title={m.label}
            onClick={() => onChange(m.slug)}
            className={cn('flex h-7 w-7 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold', active ? 'border-ink' : 'border-transparent hover:border-stone')}
          >
            <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: m.swatch }} />
          </button>
        );
      })}
    </div>
  );
}

/** Live procedural illustration — primary and hover views side by side. */
export function ArtPreview({ spec, metal, shape, carat, name, views = [0, 1], className }: { spec: ArtSpec; metal: string; shape: string; carat: number; name: string; views?: number[]; className?: string }) {
  return (
    <div className={cn('grid gap-2', views.length > 1 ? 'grid-cols-2' : 'grid-cols-1', className)}>
      {views.map((view) => (
        <figure key={view} className="min-w-0">
          <div className="art-tile aspect-square w-full overflow-hidden border border-line">
            <JewelryArt spec={spec} metal={metal} shape={shape} carat={carat} view={view} title={`${name || 'Product'} — ${view === 0 ? 'primary' : 'hover'} view`} className="h-full w-full" />
          </div>
          {views.length > 1 && <figcaption className="mt-1 text-center text-[12.5px] uppercase tracking-[0.14em] text-taupe">{view === 0 ? 'Primary view' : 'Hover view'}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
