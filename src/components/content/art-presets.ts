import type { ArtSpec } from '@/components/art/JewelryArt';

export type ArtPreset = { spec: ArtSpec; shape: string; metal: string; carat?: number };

/** Illustration presets for jewelry categories, reused by the bespoke form, quiz and gift guide. */
export const TYPE_ART: Record<string, ArtPreset> = {
  'engagement-ring': { spec: { kind: 'ring', head: 'solitaire', band: 'plain' }, shape: 'oval', metal: 'yellow', carat: 1.5 },
  'wedding-band': { spec: { kind: 'band', stones: 'half', stoneShape: 'round' }, shape: 'round', metal: 'white' },
  ring: { spec: { kind: 'ring', head: 'cluster', band: 'plain' }, shape: 'round', metal: 'rose' },
  earrings: { spec: { kind: 'studs' }, shape: 'round', metal: 'yellow', carat: 1 },
  pendant: { spec: { kind: 'pendant', head: 'halo' }, shape: 'pear', metal: 'rose', carat: 1 },
  necklace: { spec: { kind: 'tennis-necklace', stoneShape: 'round' }, shape: 'round', metal: 'white' },
  bracelet: { spec: { kind: 'tennis-bracelet', stoneShape: 'oval' }, shape: 'oval', metal: 'yellow' },
  signet: { spec: { kind: 'signet' }, shape: 'round', metal: 'yellow' },
};

/** Quiz "type" answers → illustration */
export const QUIZ_TYPE_ART: Record<string, ArtPreset> = {
  engagement: TYPE_ART['engagement-ring']!,
  band: TYPE_ART['wedding-band']!,
  ring: { spec: { kind: 'ring', head: 'five-stone', band: 'plain' }, shape: 'round', metal: 'rose' },
  earrings: { spec: { kind: 'hoops', size: 'medium' }, shape: 'round', metal: 'yellow' },
  necklace: TYPE_ART.pendant!,
  bracelet: TYPE_ART.bracelet!,
};
