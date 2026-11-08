import type { Breakpoint, ObjectFit } from '../types';
import { normalizeAssetAnimations, type CinematicAssetAnimation } from './assetAnimations';
import type { CinematicSceneSetId, CinematicSceneSpace } from './sceneSets';
import { expandCinematicParts, type CinematicPartsOptions } from './parts';

/** @deprecated Group is retained as a storage alias while layers migrate to `sceneSetId`. */
export type CinematicLayerGroup = CinematicSceneSetId;
export type CinematicLayerSpace = CinematicSceneSpace;
export type CinematicLayerKind = 'img' | 'text' | 'shape' | 'functional';

export interface CinematicWorldLayer {
  id: string;
  /** Real, persisted ownership. Child geometry is local to its authored responsive slot. */
  parentId?: string;
  part?: string;
  label: string;
  group: CinematicLayerGroup;
  space: CinematicLayerSpace;
  /** Omitted on text and shape layers. Existing art defaults to `img`. */
  kind?: CinematicLayerKind;
  behavior?: string;
  contentKey?: string;
  title?: string;
  titleSize?: number;
  timingTrackId?: string;
  interactionId?: string;
  animations?: CinematicAssetAnimation[];
  src?: string;
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  rowGap?: number;
  columnGap?: number;
  /** Nested text box width, as a percentage of its containing block; unlike w, does not scale type. */
  textWidth?: number;
  shape?: 'rect' | 'ellipse';
  fill?: string;
  radius?: number;
  borderColor?: string;
  borderWidth?: number;
  x: number;
  y: number;
  w: number;
  /** Omitted means preserve the source aspect ratio. */
  h?: number;
  /** Preserve the current explicit box proportions during size edits. Natural-height art is already proportional. */
  lockAspect?: boolean;
  z: number;
  rotation: number;
  flipX: boolean;
  hidden: boolean;
  locked: boolean;
  opacity: number;
  fit?: ObjectFit;
  /** Optional intrinsic box ratio for composite DOM objects such as a programme board. */
  aspectRatio?: number;
  desktop?: Partial<CinematicWorldGeometry>;
}

export type CinematicWorldGeometry = Pick<
  CinematicWorldLayer,
  'parentId' | 'part' | 'label' | 'group' | 'space' | 'kind' | 'src' | 'text' | 'color' | 'fontSize' | 'fontFamily' |
  'fontWeight' | 'textAlign' | 'lineHeight' | 'letterSpacing' | 'rowGap' | 'columnGap' | 'textWidth' | 'shape' | 'fill' | 'radius' |
  'borderColor' | 'borderWidth' | 'x' | 'y' | 'w' | 'h' | 'lockAspect' | 'z' | 'rotation' | 'flipX' |
  'hidden' | 'locked' | 'opacity' | 'fit' | 'behavior' | 'contentKey' | 'title' | 'titleSize' | 'timingTrackId' | 'interactionId' | 'aspectRatio' | 'animations'
>;

type LayerDelta = Partial<CinematicWorldGeometry> & { id: string };
type StoredLayer = LayerDelta | CinematicWorldLayer;
interface WorldLayout { layers?: StoredLayer[] }

const OVERRIDABLE: (keyof CinematicWorldGeometry)[] = [
  'parentId', 'part',
  'label', 'group', 'space', 'kind', 'src', 'text', 'color', 'fontSize', 'fontFamily',
  'fontWeight', 'textAlign', 'lineHeight', 'letterSpacing', 'rowGap', 'columnGap', 'textWidth', 'shape', 'fill', 'radius',
  'borderColor', 'borderWidth', 'x', 'y', 'w', 'h', 'lockAspect', 'z', 'rotation', 'flipX', 'hidden',
  'locked', 'opacity', 'fit', 'behavior', 'contentKey', 'title', 'titleSize', 'timingTrackId', 'interactionId', 'aspectRatio', 'animations',
];

export const cinematicWorldKey = (prefix: string, breakpoint: Breakpoint) =>
  `${prefix}.layout.${breakpoint}.cinematic-world`;

/** Shared by inspector size fields and canvas handles so linked boxes cannot drift or distort at limits. */
export function resizeCinematicLayer(layer: Pick<CinematicWorldLayer, 'w' | 'h' | 'lockAspect'>, axis: 'w' | 'h', value: number): Partial<CinematicWorldGeometry> {
  if (!Number.isFinite(value)) return {};
  const size = Math.max(3, Math.min(200, value));
  if (!layer.lockAspect || layer.h === undefined || layer.w <= 0 || layer.h <= 0) return { [axis]: size };
  const factor = Math.max(Math.max(3 / layer.w, 3 / layer.h),
    Math.min(Math.min(200 / layer.w, 200 / layer.h), size / layer[axis]!));
  return { w: layer.w * factor, h: layer.h * factor };
}

function applyPatch(layer: CinematicWorldLayer, patch: Partial<CinematicWorldGeometry>) {
  const next = { ...layer };
  for (const key of OVERRIDABLE) {
    if (patch[key] !== undefined) (next as unknown as Record<string, unknown>)[key] = patch[key];
  }
  return next;
}

function defaultsFor(defs: CinematicWorldLayer[], breakpoint: Breakpoint) {
  return defs.map((layer) => breakpoint === 'desktop' && layer.desktop
    ? applyPatch(layer, layer.desktop)
    : { ...layer });
}

function isCompleteUserLayer(value: StoredLayer): value is CinematicWorldLayer {
  return typeof value.id === 'string' && typeof value.label === 'string' &&
    typeof value.group === 'string' && (value.space === 'world' || value.space === 'viewport') &&
    typeof value.x === 'number' && typeof value.y === 'number' && typeof value.w === 'number' &&
    typeof value.z === 'number' && typeof value.rotation === 'number' &&
    typeof value.flipX === 'boolean' && typeof value.hidden === 'boolean' &&
    typeof value.locked === 'boolean' && typeof value.opacity === 'number' &&
    (value.kind === undefined || value.kind === 'img' || value.kind === 'text' || value.kind === 'shape' || value.kind === 'functional');
}

export function resolveCinematicWorld(
  prefix: string,
  defs: CinematicWorldLayer[],
  breakpoint: Breakpoint,
  config: Record<string, string> | undefined,
  partsOptions?: CinematicPartsOptions,
): CinematicWorldLayer[] {
  let layers = expandCinematicParts(defaultsFor(defs, breakpoint), partsOptions);
  const raw = config?.[cinematicWorldKey(prefix, breakpoint)];
  if (raw) {
    try {
      const saved = JSON.parse(raw) as WorldLayout;
      const byId = new Map(layers.map((layer) => [layer.id, layer]));
      for (const patch of saved.layers ?? []) {
        const layer = byId.get(patch.id);
        if (layer) byId.set(patch.id, applyPatch(layer, patch));
        else if (isCompleteUserLayer(patch)) {
          // User-added layers are stored whole. Unknown partial records are ignored so malformed
          // config cannot create an unrenderable object in the invitation.
          byId.set(patch.id, patch as CinematicWorldLayer);
        }
      }
      layers = [...byId.values()];
    } catch {
      // A malformed layout must never take the invitation down; shipped defaults remain active.
    }
  }
  return expandCinematicParts(layers, partsOptions).map((layer) => layer.animations === undefined ? layer : { ...layer, animations: normalizeAssetAnimations(layer.animations) }).sort((a, b) => a.z - b.z);
}

export function serializeCinematicWorld(
  defs: CinematicWorldLayer[],
  breakpoint: Breakpoint,
  layers: CinematicWorldLayer[],
): string {
  const baseById = new Map(expandCinematicParts(defaultsFor(defs, breakpoint)).map((layer) => [layer.id, layer]));
  const deltas: StoredLayer[] = [];
  for (const layer of layers) {
    const base = baseById.get(layer.id);
    if (!base) {
      deltas.push(layer);
      continue;
    }
    const delta: LayerDelta = { id: layer.id };
    let changed = false;
    for (const key of OVERRIDABLE) {
      if (layer[key] !== base[key]) {
        (delta as Record<string, unknown>)[key] = layer[key];
        changed = true;
      }
    }
    if (changed) deltas.push(delta);
  }
  return deltas.length ? JSON.stringify({ layers: deltas }) : '';
}
