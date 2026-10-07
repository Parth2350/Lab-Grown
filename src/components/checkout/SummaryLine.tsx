import { AlertCircle } from 'lucide-react';
import { label } from '@/lib/catalog';
import { formatMoney } from '@/lib/utils';
import type { ArtSpec } from '@/components/art/JewelryArt';
import { ProductMedia } from '@/components/product/ProductMedia';

export type SummaryLineData = {
  key: string;
  name: string;
  purity: string;
  metalColor: string;
  details: (string | null | undefined)[];
  quantity: number;
  lineTotal: number;
  art: ArtSpec | null;
  image?: string | null;
  shape: string;
  carat: number;
};

/** Compact line used in the checkout summary and order confirmation. */
export function SummaryLine({ line, issue }: { line: SummaryLineData; issue?: string }) {
  return (
    <li className="flex gap-4 py-4">
      <div className="art-tile relative h-[72px] w-[72px] shrink-0 p-1.5 sm:h-20 sm:w-20">
        <ProductMedia
          name={line.name}
          art={line.art}
          images={line.image ? [{ url: line.image, alt: line.name, kind: 'image', metalColor: null }] : []}
          shape={line.shape}
          metal={line.metalColor}
          carat={line.carat}
          sizes="80px"
        />
        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-medium text-ivory" aria-label={`Quantity ${line.quantity}`}>
          {line.quantity}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[16px] leading-snug">{line.name}</p>
        <p className="mt-0.5 text-[12px] text-taupe">
          {line.purity} {label.metal(line.metalColor)}
        </p>
        {line.details.filter(Boolean).map((d) => (
          <p key={d} className="text-[12px] leading-snug text-taupe">
            {d}
          </p>
        ))}
        {issue && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-danger" role="alert">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            {issue}
          </p>
        )}
      </div>
      <p className="shrink-0 text-sm tabular-nums">{formatMoney(line.lineTotal, { exact: true })}</p>
    </li>
  );
}
