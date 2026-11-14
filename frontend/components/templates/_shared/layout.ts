import { TEMPLATE_CAPABILITIES } from '../templateCapabilities';
import { useMemo } from 'react';
import { ANIM_OPTIONS, ANIM_OUT_OPTIONS, ANIM_IDLE_OPTIONS } from './types';
import type { Breakpoint, Layer, LayerGroup, ObjectFit, StageDef, StageId, StageLayout } from './types';

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
  'accentColor', 'containerMinHeight', 'containerPadding', 'containerOpacity', 'contentGap', 'contentAlignY', 'contentAlign',
  'rotation', 'flipX', 'flipY', 'locked', 'deleted', 'overflowMode',
  'color', 'fill', 'fontSize', 'fontWeight', 'lineHeight', 'radius', 'text', 'src', 'shape', 'label',
  'anim', 'animDur', 'animOut', 'animOutDur',
  // text styling (types.ts) — usable by kind 'text', and by kind 'anchor' when `styleable`.
  'fontFamily', 'fontStyle', 'textTransform', 'letterSpacing', 'wordSpacing', 'borderWidth', 'borderColor',
  'shadowColor', 'shadowBlur', 'shadowX', 'shadowY',
  // text shaping (kind 'text' only) — see CurvedText.tsx.
  'textShape', 'curvature',
  // per-text backdrop art (kind 'text' and styleable sub-layers) — see backdrop.ts.
  'backdropSrc', 'backdropScale', 'backdropRotate', 'backdropX', 'backdropY',
  // per-piece box (slot pieces only) — see Layer.boxW.
  'boxW', 'boxH', 'boxBreakWord',
  // idle/looping animation (kinds 'img'/'text'/'shape'/'slot') — see reveal.css.
  'animIdle', 'animIdleSpeed', 'animIdleIntensity', 'animIdleOrigin',
  // kind 'scrollVideo' effect params (types.ts) — same delta mechanism, no geometry involved.
  'videoSrc', 'triggerStart', 'triggerEnd', 'scrub', 'pivot', 'holdWidth', 'videoStartSec',
  'openThreshold', 'resetSec', 'chromaThreshold', 'chromaFade',
  // kind 'video' (play-once) — see PlayOnceVideoLayer.tsx.
  'playDelaySec', 'posterSrc',
  // kind 'water' — see WaterLayer.tsx.
  'waterDrift', 'waterRipples', 'waterGlints', 'waterGlow', 'waterGlowColor', 'waterIntensity',
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

export const isStageCanvasLayer = (layer: Layer) =>
  Boolean(layer.canvasAnchor) || ['img', 'shape', 'text', 'video', 'water'].includes(layer.kind);

export function canGroupLayer(layer: Layer): boolean {
  return !layer.parent && layer.kind !== 'anchor' && layer.presentation !== 'sheet';
}

function resolveGroups(groups: LayerGroup[] | undefined, layers: Layer[]): LayerGroup[] {
  if (!Array.isArray(groups)) return [];
  const layerIds = new Set(layers.map((layer) => layer.id));
  const eligibleIds = new Set(layers.filter(canGroupLayer).map((layer) => layer.id));
  const groupIds = new Set<string>();
  const assignedIds = new Set<string>();
  const result: LayerGroup[] = [];
  for (const group of groups) {
    if (!group || typeof group.id !== 'string' || !group.id.trim() ||
      layerIds.has(group.id) || groupIds.has(group.id) ||
      typeof group.label !== 'string' || !group.label.trim() || !Array.isArray(group.memberIds)) continue;
    const memberIds = [...new Set(group.memberIds)].filter((id) => eligibleIds.has(id) && !assignedIds.has(id));
    if (!memberIds.length) continue;
    result.push({
      id: group.id, label: group.label, memberIds,
      ...(Number.isFinite(group.x) && group.x ? { x: group.x } : {}),
      ...(Number.isFinite(group.y) && group.y ? { y: group.y } : {}),
      ...(group.anim && ANIM_OPTIONS.includes(group.anim) ? { anim: group.anim } : {}),
      ...(group.animOut && ANIM_OUT_OPTIONS.includes(group.animOut) ? { animOut: group.animOut } : {}),
      ...(group.animIdle && ANIM_IDLE_OPTIONS.includes(group.animIdle) ? { animIdle: group.animIdle } : {}),
    });
    groupIds.add(group.id);
    memberIds.forEach((id) => assignedIds.add(id));
  }
  return result;
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
): { layers: Layer[]; groups: LayerGroup[] } & StageBg {
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
    for (const patch of Array.isArray(saved.layers) ? saved.layers : []) {
      if (!patch || typeof patch.id !== 'string') continue;
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

  return { layers: layers.sort((a, b) => a.z - b.z), groups: resolveGroups(saved?.groups ?? def.groups?.[breakpoint], layers), bgFit, bgPosition, bgScale, bgSrc };
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
  groups?: LayerGroup[],
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
  const validGroups = resolveGroups(groups ?? base.groups, layers.filter((layer) => !layer.deleted));
  if (JSON.stringify(validGroups) !== JSON.stringify(base.groups)) out.groups = validGroups;
  return Object.keys(out).length ? JSON.stringify(out) : '';
}

export function inlineFormSheet(prefix: string, stageId: StageId, config?: Record<string, string>) {
  const id = /^t(\d+)$/.exec(prefix)?.[1];
  if (!id || !TEMPLATE_CAPABILITIES[Number(id)]?.configurableForms) return undefined;
  if (stageId === 'rsvp' && config?.['rsvp.form_layout'] === 'inline') return 'rsvp';
  if (stageId === 'wishes' && config?.['wish.form_layout'] === 'inline') return 'wish';
}

export function isInlineFormLayer(layer: Layer, sheetId: string | undefined) {
  return Boolean(sheetId && layer.kind === 'slot' && layer.sheetId === sheetId &&
    (layer.slot === 'rsvpForm' || layer.slot === 'rsvpSeating' || layer.slot === 'wishForm' || layer.slot === 'wishPhoto'));
}

export function appearsInFormLayout(layer: Layer, sheetId: string | undefined) {
  return !sheetId || layer.sheetId !== sheetId || isInlineFormLayer(layer, sheetId);
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
        const resolved = resolveStage(prefix, def, breakpoint, config);
        const sheetId = inlineFormSheet(prefix, id, config);
        if (!sheetId) return { def, ...resolved };

        // Project the chosen presentation after applying saved geometry. The saved sheet
        // layers and trigger stay intact so switching back restores the original composition.
        const isForm = (layer: Layer) => isInlineFormLayer(layer, sheetId);
        const body = resolved.layers.filter((layer) => appearsInFormLayout(layer, sheetId));
        const formOrder = Math.max(0, ...body.filter((layer) => !isForm(layer) && layer.slot !== 'wishList')
          .filter((layer) => layer.kind === 'slot' || layer.id === 'title' || layer.id === 'prompt')
          .map((layer) => layer.order)) + 1;
        return {
          ...resolved,
          def: { ...def, flow: true },
          layers: body.map((layer) => isForm(layer)
            ? { ...layer, presentation: 'inline' as const, order: formOrder, depth: 0 }
            : layer.slot === 'wishList' ? { ...layer, order: Math.max(layer.order, formOrder + 1) } : layer),
        };
      }),
    [prefix, stages, stageIds, breakpoint, config],
  );
}

/** Ratio between the cover-fitted art canvas and the visible stage at the active viewport. */
export function stageArtScale(def: StageDef, bp: Breakpoint, frame?: { w: number; h: number }) {
  const canvas = def.canvas?.[bp] ?? (bp === 'desktop' ? def.canvas?.mobile : undefined);
  if (!canvas || def.flow || !frame?.w || !frame.h) return undefined;
  const ratio = (canvas.w / canvas.h) / (frame.w / frame.h);
  return { x: Math.max(1, ratio), y: Math.max(1, 1 / ratio) };
}

/** Apply an absolute group offset by moving each member by the same delta. */
export function moveLayerGroup(layers: Layer[], group: LayerGroup, x: number, y: number, artScale = { x: 1, y: 1 }) {
  const members = layers.filter((layer) => group.memberIds.includes(layer.id));
  const mixed = members.some(isStageCanvasLayer) && members.some((layer) => !isStageCanvasLayer(layer));
  const dx = x - (group.x ?? 0);
  const dy = y - (group.y ?? 0);
  return layers.map((layer) => group.memberIds.includes(layer.id)
    ? { ...layer, x: layer.x + dx / (mixed && isStageCanvasLayer(layer) ? artScale.x : 1),
      y: layer.y + dy / (mixed && isStageCanvasLayer(layer) ? artScale.y : 1) }
    : layer);
}

/** Apply a canvas edit to a regular layer or to an entire group. */
export function patchStageLayer(layers: Layer[], groups: LayerGroup[], id: string, patch: Partial<Layer>, artScale?: { x: number; y: number }) {
  const group = groups.find((item) => item.id === id);
  if (!group) {
    return { layers: layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer), groups };
  }

  const x = typeof patch.x === 'number' && Number.isFinite(patch.x) ? patch.x : group.x ?? 0;
  const y = typeof patch.y === 'number' && Number.isFinite(patch.y) ? patch.y : group.y ?? 0;
  return {
    layers: moveLayerGroup(layers, group, x, y, artScale),
    groups: groups.map((item) => item === group ? { ...item, x, y } : item),
  };
}

/** Preserve a linked box's ratio within the editor's width and height limits. */
export function resizeLinkedBox(w: number, h: number, nextWidth: number): Pick<Layer, 'w' | 'h'> {
  const ratio = h / w;
  const width = Math.min(200, 200 / ratio, Math.max(3, 3 / ratio, nextWidth));
  return { w: width, h: width * ratio };
}
