'use client';
import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { METAL_COLORS, PURITIES, SETTING_TYPES, SHAPES, STYLES } from '@/lib/catalog';
import { Chip, ChipGroup, EditorSection, ErrorText, FieldLabel, Hint, MoneyInput, Switch, chevronStyle, inputCls, labelCls, selectCls, toggleIn, type SectionProps } from './editor-ui';

function TagInput({ tags, onChange, error }: { tags: string[]; onChange: (tags: string[]) => void; error?: string }) {
  const [text, setText] = useState('');
  const commit = (raw: string) => {
    const parts = raw
      .split(',')
      .map((t) => t.trim().toLowerCase().slice(0, 40))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const p of parts) if (!next.includes(p) && next.length < 30) next.push(p);
    onChange(next);
    setText('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(text);
    } else if (e.key === 'Backspace' && !text && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };
  return (
    <div>
      <label htmlFor="p-tags" className={labelCls}>
        Tags
      </label>
      <div className="field flex min-h-[42px] flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-ink">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 border border-line bg-porcelain py-0.5 pl-2 pr-1 text-xs text-charcoal">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="p-0.5 text-taupe hover:text-ink" aria-label={`Remove tag ${t}`}>
              <X className="h-3 w-3" strokeWidth={1.6} />
            </button>
          </span>
        ))}
        <input
          id="p-tags"
          value={text}
          onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setText(e.target.value))}
          onKeyDown={onKeyDown}
          onBlur={() => commit(text)}
          aria-describedby="p-tags-hint"
          aria-invalid={error ? true : undefined}
          className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1 text-[13px] focus:outline-none"
          placeholder={tags.length ? '' : 'Type a tag and press Enter'}
        />
      </div>
      {error ? (
        <ErrorText msg={error} />
      ) : (
        <Hint>
          <span id="p-tags-hint">Comma or Enter to add · used by store search. {tags.length}/30</span>
        </Hint>
      )}
    </div>
  );
}

export function AttributesSection({ draft, update, errors }: SectionProps) {
  const inv = (k: string) => (errors[k] ? true : undefined);
  const chosenMetals = METAL_COLORS.filter((m) => draft.metalColors.includes(m.slug));
  const chosenPurities = PURITIES.filter((p) => draft.purities.includes(p.slug));

  return (
    <EditorSection id="attributes" title="Attributes" description="Metals, purities and stone details. Variants are generated from the metals × purities you offer.">
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ChipGroup legend="Metal colours" required error={errors.metalColors}>
            {METAL_COLORS.map((m) => (
              <Chip key={m.slug} selected={draft.metalColors.includes(m.slug)} swatch={m.swatch} onClick={() => update((d) => ({ metalColors: toggleIn(d.metalColors, m.slug) }))}>
                {m.short}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup legend="Purities" required error={errors.purities} hint="Price multipliers: 9K ×1 · 10K ×1.08 · 14K ×1.32 · 18K ×1.68">
            {PURITIES.map((p) => (
              <Chip key={p.slug} selected={draft.purities.includes(p.slug)} onClick={() => update((d) => ({ purities: toggleIn(d.purities, p.slug) }))} title={p.fineness}>
                {p.label}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="p-def-metal">Default metal</FieldLabel>
            <select id="p-def-metal" value={draft.defaultMetalColor} onChange={(e) => update({ defaultMetalColor: e.target.value })} disabled={!chosenMetals.length} aria-invalid={inv('defaultMetalColor')} className={selectCls} style={chevronStyle}>
              {!chosenMetals.length && <option value="">Choose metals first</option>}
              {chosenMetals.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.label}
                </option>
              ))}
            </select>
            <ErrorText msg={errors.defaultMetalColor} />
          </div>
          <div>
            <FieldLabel htmlFor="p-def-purity">Default purity</FieldLabel>
            <select id="p-def-purity" value={draft.defaultPurity} onChange={(e) => update({ defaultPurity: e.target.value })} disabled={!chosenPurities.length} aria-invalid={inv('defaultPurity')} className={selectCls} style={chevronStyle}>
              {!chosenPurities.length && <option value="">Choose purities first</option>}
              {chosenPurities.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
            <ErrorText msg={errors.defaultPurity} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="p-base" required>
              Base price
            </FieldLabel>
            <MoneyInput id="p-base" value={draft.basePrice} onChange={(v) => update({ basePrice: v })} invalid={!!errors.basePrice} describedBy="p-base-hint" placeholder="0" />
            {errors.basePrice ? (
              <ErrorText msg={errors.basePrice} />
            ) : (
              <Hint>
                <span id="p-base-hint">Reference setting price at the lowest purity (9K). Variant prices can be generated from it.</span>
              </Hint>
            )}
          </div>
        </div>

        <ChipGroup legend="Diamond shapes" error={errors.shapes} hint="The first selected shape is used for illustrations and the listing thumbnail.">
          {SHAPES.map((s) => (
            <Chip key={s.slug} selected={draft.shapes.includes(s.slug)} onClick={() => update((d) => ({ shapes: toggleIn(d.shapes, s.slug) }))}>
              {s.label}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup legend="Styles" error={errors.styles}>
          {STYLES.map((s) => (
            <Chip key={s.slug} selected={draft.styles.includes(s.slug)} onClick={() => update((d) => ({ styles: toggleIn(d.styles, s.slug) }))}>
              {s.label}
            </Chip>
          ))}
        </ChipGroup>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="p-setting">Setting type</FieldLabel>
            <select id="p-setting" value={draft.settingType} onChange={(e) => update({ settingType: e.target.value })} aria-invalid={inv('settingType')} className={selectCls} style={chevronStyle}>
              <option value="">None</option>
              {SETTING_TYPES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
            <ErrorText msg={errors.settingType} />
          </div>
          <div>
            <FieldLabel htmlFor="p-center-ct">Centre carat</FieldLabel>
            <input id="p-center-ct" inputMode="decimal" value={draft.centerCarat} onChange={(e) => update({ centerCarat: e.target.value })} aria-invalid={inv('centerCarat')} className={`${inputCls} tabular-nums`} placeholder="e.g. 1.5" />
            {errors.centerCarat ? <ErrorText msg={errors.centerCarat} /> : <Hint>Default carat for illustrations.</Hint>}
          </div>
          <div>
            <FieldLabel htmlFor="p-total-ct">Total carat</FieldLabel>
            <input id="p-total-ct" inputMode="decimal" value={draft.totalCarat} onChange={(e) => update({ totalCarat: e.target.value })} aria-invalid={inv('totalCarat')} className={`${inputCls} tabular-nums`} placeholder="e.g. 2.1" />
            {errors.totalCarat ? (
              <ErrorText msg={errors.totalCarat} />
            ) : (
              <Hint>{draft.diamondMode === 'TOTAL_WEIGHT' ? 'Replaced by the default diamond package on save.' : 'Total diamond weight of the piece.'}</Hint>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Switch
            id="p-center"
            checked={draft.hasCenterStone}
            onChange={(v) => update({ hasCenterStone: v })}
            disabled={draft.diamondMode === 'CENTER_STONE'}
            label="Has a centre stone"
            description={draft.diamondMode === 'CENTER_STONE' ? 'Always on while shoppers choose a loose centre diamond.' : 'Shows “View diamond options” on product cards.'}
          />
          <Switch id="p-size" checked={draft.requiresSize} onChange={(v) => update({ requiresSize: v })} label="Requires a ring size" description="Shoppers must pick a size before adding to bag." />
        </div>

        <TagInput tags={draft.tags} onChange={(tags) => update({ tags })} error={errors.tags} />
      </div>
    </EditorSection>
  );
}
