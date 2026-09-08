import { useMemo } from 'react';
import type { Breakpoint, Layer, ObjectFit, StageDef, StageId, StageLayout } from './types';

/**
 * The config key one stage's layout is persisted under. `prefix` namespaces it per template
 * (`t7`, `t5`, …) so different templates' layouts never collide in the shared key-value bag.
 */
export const layoutKey = (prefix: string, bp: Breakpoint, stage: StageId) =>
  `${prefix}.layout.${bp}.${stage}`;

/** Geometry fields the Adjust panel can override. Exported for the authoring flatten helper
 *  (_shared/authoring/flatten.ts), which needs the same field list to diff a breakpoint's
 *  resolved layers against each other. */
export const OVERRIDABLE: (keyof Layer)[] = [
  'x', 'y', 'w', 'h', 's', 'z', 'order', 'chain', 'hidden', 'opacity', 'depth', 'textScale',
  'color', 'fill', 'fontSize', 'fontWeight', 'lineHeight', 'radius', 'text', 'src', 'shape', 'label',
  'anim', 'animDur', 'animOut',
  // text styling (types.ts) — usable by kind 'text', and by kind 'anchor' when `styleable`.
  'fontFamily', 'letterSpacing', 'wordSpacing', 'borderWidth', 'borderColor',
  'shadowColor', 'shadowBlur', 'shadowX', 'shadowY',
  // text shaping (kind 'text' only) — see CurvedText.tsx.
  'textShape', 'curvature',
  // idle/looping animation (kinds 'img'/'text'/'shape'/'slot') — see reveal.css.
  'animIdle', 'animIdleSpeed', 'animIdleIntensity',
  // kind 'scrollVideo' effect params (types.ts) — same delta mechanism, no geometry involved.
  'videoSrc', 'triggerStart', 'triggerEnd', 'scrub', 'pivot', 'holdWidth', 'videoStartSec',
  'openThreshold', 'resetSec', 'chromaThreshold', 'chromaFade',
  // kind 'video' (play-once) — see PlayOnceVideoLayer.tsx.
  'playDelaySec', 'posterSrc',
  // kind 'slot' presentation mode ('inline' | 'sheet') and which named sheet it belongs to /
  // opens — see _shared/SheetHost.tsx and _shared/slots/sheets.tsx.
  'presentation', 'sheetId',
];

/** Background placement the Adjust panel can override, over and above the shipped stage bg. */
export interface StageBg {
  bgFit: ObjectFit;
  bgPosition?: string;
  bgScale?: number;
  /** Replaces the shipped background image (an absolute /uploads/… path). */
  bgSrc?: string;
}

function parse(raw: string | undefined): StageLayout | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as StageLayout) : null;
  } catch {
    // A malformed blob must not take the whole invitation down — fall back to defaults.
    return null;
  }
}

function applyPatch(base: Layer, patch: Partial<Layer>): Layer {
  const out = { ...base };
  for (const k of OVERRIDABLE) {
    if (patch[k] !== undefined) (out as Record<string, unknown>)[k] = patch[k];
  }
  return out;
}

/**
 * Resolves one stage: shipped defaults → desktop overrides (desktop only) → the couple's
 * persisted delta for this breakpoint.
 *
 * Layers merge **by id**, never by array position. That's what keeps a stored override small
 * (it names only the layers it moved) and lets us add new default layers in a later release
 * without orphaning weddings that already saved a layout.
 */
export function resolveStage(
  prefix: string,
  def: StageDef,
  breakpoint: Breakpoint,
  config: Record<string, string> | undefined,
): { layers: Layer[] } & StageBg {
  // 1. defaults, plus the desktop overrides when we're wide
  let layers = def.layers.map((l) => {
    const dOverride = breakpoint === 'desktop' ? def.desktop?.[l.id] : undefined;
    return dOverride ? applyPatch(l, dOverride) : { ...l };
  });

  let bgFit = def.bgFit;
  let bgPosition = def.bgPosition;
  let bgScale = def.bgScale;
  let bgSrc: string | undefined;

  // 2. the couple's saved delta
  const saved = parse(config?.[layoutKey(prefix, breakpoint, def.id)]);
  if (saved) {
    if (saved.bgFit) bgFit = saved.bgFit;
    if (saved.bgPosition !== undefined) bgPosition = saved.bgPosition;
    if (saved.bgScale !== undefined) bgScale = saved.bgScale;
    if (saved.bgSrc !== undefined) bgSrc = saved.bgSrc;

    const byId = new Map(layers.map((l) => [l.id, l]));
    for (const patch of saved.layers ?? []) {
      const existing = byId.get(patch.id);
      if (existing) {
        byId.set(patch.id, applyPatch(existing, patch));
      } else if (patch.kind) {
        // a layer the couple added in the Adjust panel — it carries its own full definition
        byId.set(patch.id, {
          x: 50, y: 50, w: 30, h: 20, s: 1, z: 9, order: 0,
          chain: true, hidden: false, opacity: 1,
          ...patch,
        } as Layer);
      }
    }
    layers = [...byId.values()].filter((l) => !l.deleted);
  }

  return { layers: layers.sort((a, b) => a.z - b.z), bgFit, bgPosition, bgScale, bgSrc };
}

/** The stage exactly as it ships, with no couple overrides — what a delta is measured against. */
export function baseStage(def: StageDef, breakpoint: Breakpoint) {
  // No config ⇒ the prefix is never used to build a key; '' is a safe placeholder.
  return resolveStage('', def, breakpoint, undefined);
}

/**
 * Serializes a stage back down to just what differs from the shipped defaults.
 *
 * Delta-only, because the whole layout lives in one 4000-char config value: a stage where the
 * couple nudged two layers is a couple hundred bytes, not the two kilobytes a full dump would
 * cost. Returns '' when nothing differs, which the caller turns into "delete the key".
 */
export function serializeStage(
  def: StageDef,
  breakpoint: Breakpoint,
  layers: Layer[],
  bg: StageBg,
): string {
  const base = baseStage(def, breakpoint);
  const baseById = new Map(base.layers.map((l) => [l.id, l]));

  const out: StageLayout = {};
  if (bg.bgFit !== base.bgFit) out.bgFit = bg.bgFit;
  if (bg.bgPosition !== undefined && bg.bgPosition !== base.bgPosition) out.bgPosition = bg.bgPosition;
  if (bg.bgScale !== undefined && bg.bgScale !== base.bgScale) out.bgScale = bg.bgScale;
  if (bg.bgSrc) out.bgSrc = bg.bgSrc;

  const deltas: (Partial<Layer> & { id: string })[] = [];

  for (const layer of layers) {
    const original = baseById.get(layer.id);
    if (!original) {
      deltas.push({ ...layer }); // a layer the couple added — store it whole
      continue;
    }
    const diff: Partial<Layer> & { id: string } = { id: layer.id };
    let changed = false;
    for (const k of OVERRIDABLE) {
      if (layer[k] !== original[k]) {
        (diff as Record<string, unknown>)[k] = layer[k];
        changed = true;
      }
    }
    if (changed) deltas.push(diff);
  }

  // A shipped layer the couple removed is recorded as a tombstone — we can't just omit it,
  // because omission means "unchanged".
  for (const id of baseById.keys()) {
    if (!layers.some((l) => l.id === id)) deltas.push({ id, deleted: true });
  }

  if (deltas.length) out.layers = deltas;
  return Object.keys(out).length ? JSON.stringify(out) : '';
}

export function useStageLayout(
  prefix: string,
  stages: Record<string, StageDef>,
  stageIds: StageId[],
  breakpoint: Breakpoint,
  config: Record<string, string> | undefined,
) {
  return useMemo(
    () =>
      stageIds.map((id) => {
        const def = stages[id];
        return { def, ...resolveStage(prefix, def, breakpoint, config) };
      }),
    [prefix, stages, stageIds, breakpoint, config],
  );
}
