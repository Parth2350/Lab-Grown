'use client';
import type { ReactNode } from 'react';
import { titleCase } from '@/lib/catalog';
import { ArtPreview, MetalSwitcher } from './ArtPreview';
import { EditorSection, ErrorText, FieldLabel, Hint, Switch, chevronStyle, inputCls, selectCls, type SectionProps } from './editor-ui';
import { ART_BANDS, ART_HEADS, ART_KINDS, ART_SIZES, ART_STONES, ART_STONE_SHAPES, SHAPE_LIST, toArtSpec, type ArtDraft } from './shared';

function ArtSelect({ id, label, value, options, onChange, error, optional = true, hint }: { id: string; label: string; value: string; options: readonly string[]; onChange: (v: string) => void; error?: string; optional?: boolean; hint?: ReactNode }) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={!optional}>
        {label}
      </FieldLabel>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} className={selectCls} style={chevronStyle}>
        {optional && <option value="">— Default</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {titleCase(o)}
          </option>
        ))}
      </select>
      {error ? <ErrorText msg={error} /> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function ImagerySection({
  draft,
  update,
  errors,
  previewMetal,
  setPreviewMetal,
  previewShape,
  previewCarat,
  media,
}: SectionProps & { previewMetal: string; setPreviewMetal: (m: string) => void; previewShape: string; previewCarat: number; media: ReactNode }) {
  const art = draft.art;
  const setArt = (patch: Partial<ArtDraft>) => update((d) => ({ art: { ...d.art, ...patch } }));
  const e = (k: keyof ArtDraft) => errors[`art.${k}`];
  const isRingLike = ['ring', 'band', 'signet'].includes(art.kind);

  return (
    <EditorSection id="imagery" title="Imagery" description="A procedural illustration is shown until photography is uploaded.">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ArtSelect id="art-kind" label="Illustration type" value={art.kind} options={ART_KINDS} onChange={(v) => setArt({ kind: v })} error={e('kind')} optional={false} />
          </div>
          <ArtSelect id="art-head" label="Head" value={art.head} options={ART_HEADS} onChange={(v) => setArt({ head: v })} error={e('head')} hint={isRingLike ? undefined : 'Mostly used by rings & pendants.'} />
          <ArtSelect id="art-band" label="Band" value={art.band} options={ART_BANDS} onChange={(v) => setArt({ band: v })} error={e('band')} />
          <ArtSelect id="art-stones" label="Stone coverage" value={art.stones} options={ART_STONES} onChange={(v) => setArt({ stones: v })} error={e('stones')} />
          <ArtSelect id="art-stone-shape" label="Stone shape" value={art.stoneShape} options={ART_STONE_SHAPES} onChange={(v) => setArt({ stoneShape: v })} error={e('stoneShape')} hint="For bands, tennis & station pieces." />
          <ArtSelect id="art-size" label="Size" value={art.size} options={ART_SIZES} onChange={(v) => setArt({ size: v })} error={e('size')} />
          <ArtSelect id="art-sides" label="Side stones" value={art.sides} options={ART_STONE_SHAPES} onChange={(v) => setArt({ sides: v })} error={e('sides')} hint="Three-stone side shape." />
          <ArtSelect id="art-second" label="Second stone" value={art.second} options={SHAPE_LIST} onChange={(v) => setArt({ second: v })} error={e('second')} hint="Toi et moi partner stone." />
          <div>
            <FieldLabel htmlFor="art-prongs">Prongs</FieldLabel>
            <input
              id="art-prongs"
              inputMode="numeric"
              value={art.prongs}
              onChange={(ev) => setArt({ prongs: ev.target.value.replace(/[^\d]/g, '').slice(0, 2) })}
              aria-invalid={e('prongs') ? true : undefined}
              className={`${inputCls} tabular-nums`}
              placeholder="Default"
            />
            <ErrorText msg={e('prongs')} />
          </div>
          <div className="flex items-end pb-2.5 sm:col-span-2">
            <Switch id="art-graduated" checked={art.graduated} onChange={(v) => setArt({ graduated: v })} label="Graduated stones" description="Stones grow towards the centre (tennis & station necklaces)." />
          </div>
        </div>

        <div className="min-w-0 xl:max-w-[520px] 2xl:max-w-none">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal">Live preview</p>
            <MetalSwitcher metals={draft.metalColors} value={previewMetal} onChange={setPreviewMetal} />
          </div>
          <ArtPreview spec={toArtSpec(art)} metal={previewMetal} shape={previewShape} carat={previewCarat} name={draft.name} />
          <Hint className="mt-2">Shape and carat come from the attributes (or the centre-stone range) — the storefront recolours it with the shopper’s metal choice.</Hint>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">{media}</div>
    </EditorSection>
  );
}
