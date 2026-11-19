import { normalizeAssetAnimations, type CinematicAssetAnimation } from './assetAnimations';
import { normalizeAssetKeyframes, type AssetKeyframe } from './assetKeyframes';
import type { Breakpoint } from '../types';
import type { CinematicTrackTransition } from './sequence';
import type { CinematicWorldLayer } from './world';

export const CINEMATIC_SCENE_SETS_VERSION = 1 as const;

export type CinematicSceneSetId = string;
export type CinematicSceneSpace = 'viewport' | 'world';

/**
 * A scene set is an authored container, not an engine-known category. Templates provide starting
 * sets, while saved projects may add any valid id without changing the renderer's vocabulary.
 */
export interface CinematicLayerGroup {
  id: string;
  label: string;
  memberIds: string[];
  hidden?: boolean;
  scale?: number;
  rotation?: number;
  animations?: CinematicAssetAnimation[];
  keyframes?: AssetKeyframe[];
  enter?: CinematicTrackTransition;
  exit?: CinematicTrackTransition;
}

export function cinematicGroupCenter(layers: readonly CinematicWorldLayer[]) {
  const count = Math.max(1, layers.length);
  return {
    x: layers.reduce((sum, layer) => sum + layer.x, 0) / count,
    y: layers.reduce((sum, layer) => sum + layer.y, 0) / count,
  };
}

export const cinematicGroupTargetId = (setId: string, groupId: string) => `layer-group:${setId}:${groupId}`;

export function cinematicEffectGroup(sets: CinematicSceneSet[], layers: CinematicWorldLayer[], breakpoint: Breakpoint, targetId: string) {
  for (const set of sets) {
    const group = set.layerGroups?.[breakpoint]?.find((item) => cinematicGroupTargetId(set.id, item.id) === targetId);
    if (!group) continue;
    const members = layers.filter((layer) => !layer.parentId && layer.group === set.id &&
      layer.space === set.space && group.memberIds.includes(layer.id));
    if (members.length >= 2) return { set, group, members };
  }
}

/** The shared animation editor uses the owning scene's appearance window. */
export function cinematicGroupAnimationTarget(set: CinematicSceneSet, group: CinematicLayerGroup, member: CinematicWorldLayer): CinematicWorldLayer {
  return { ...member, id: cinematicGroupTargetId(set.id, group.id), label: group.label, group: set.id, kind: 'shape',
    timingTrackId: set.timingTrackId, animations: group.animations, keyframes: group.keyframes, hidden: set.hidden };
}

export interface CinematicCompositionFrame { width: number; height: number }

export function fitCinematicComposition(reference: CinematicCompositionFrame, viewport: CinematicCompositionFrame) {
  const scale = Math.min(viewport.width / reference.width, viewport.height / reference.height);
  return { width: reference.width * scale, height: reference.height * scale };
}

export interface CinematicSceneSet {
  id: CinematicSceneSetId;
  label: string;
  space: CinematicSceneSpace;
  z: number;
  timingTrackId?: string;
  hidden: boolean;
  opacity: number;
  locked: boolean;
  system: boolean;
  /** Optional registry key for behaviour supplied by a later functional-layer phase. */
  behavior?: string;
  layerGroups?: Partial<Record<Breakpoint, CinematicLayerGroup[]>>;
  composeTiming?: boolean;
  referenceFrames?: Partial<Record<Breakpoint, CinematicCompositionFrame>>;
  loop?: 'float' | 'sway';
  enter?: CinematicTrackTransition;
  exit?: CinematicTrackTransition;
}

export interface CinematicSceneSetIssue {
  path: string;
  message: string;
}

type SceneSetPatch = Partial<Omit<
  CinematicSceneSet,
  'id' | 'timingTrackId' | 'behavior' | 'enter' | 'exit' | 'loop'
>> & {
  id: string;
  loop?: CinematicSceneSet['loop'] | null;
  timingTrackId?: string | null;
  behavior?: string | null;
  enter?: CinematicTrackTransition | null;
  exit?: CinematicTrackTransition | null;
  deleted?: boolean;
};
interface StoredSceneSets {
  version?: number;
  sets?: SceneSetPatch[];
}

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const TRANSITION_KINDS = new Set(['cut', 'fade', 'slide', 'scale', 'fade-slide']);
const EASINGS = new Set(['linear', 'ease-in', 'ease-out', 'ease-in-out']);
const DIRECTIONS = new Set(['left', 'right', 'up', 'down']);

export const cinematicSceneSetsKey = (prefix: string) =>
  `${prefix}.layout.cinematic-scene-sets`;

/** Apply container flags at render time, never bake them into the per-layer saved geometry. */
export function applyCinematicSceneSets(layers: CinematicWorldLayer[], sets: CinematicSceneSet[], breakpoint: Breakpoint = 'mobile'): CinematicWorldLayer[] {
  const byId = new Map(sets.map((set) => [set.id, set]));
  return layers.map((layer) => {
    const set = byId.get(layer.group);
    if (!set) return { ...layer, hidden: true };
    const groupHidden = !layer.parentId && set.space === layer.space && set.layerGroups?.[breakpoint]?.some((group) =>
      group.hidden && group.memberIds.includes(layer.id));
    return { ...layer, hidden: layer.hidden || set.hidden || Boolean(groupHidden), locked: layer.locked || set.locked,
      opacity: layer.opacity * (layer.parentId ? 1 : set.opacity) };
  });
}

export const isCinematicSceneSetId = (value: unknown): value is CinematicSceneSetId =>
  typeof value === 'string' && ID_PATTERN.test(value);

const finite = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function normalizeTransition(value: unknown): CinematicTrackTransition | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Partial<CinematicTrackTransition>;
  if (!TRANSITION_KINDS.has(source.kind ?? '') || !EASINGS.has(source.easing ?? '')) return undefined;
  const direction = source.direction && DIRECTIONS.has(source.direction) ? source.direction : undefined;
  const distance = source.distance === undefined
    ? undefined
    : Math.min(50, Math.max(0, finite(source.distance, 6)));
  const scale = source.scale === undefined
    ? undefined
    : Math.min(2, Math.max(.1, finite(source.scale, .86)));
  return {
    kind: source.kind!, easing: source.easing!,
    ...(direction ? { direction } : {}),
    ...(distance !== undefined ? { distance } : {}),
    ...(scale !== undefined ? { scale } : {}),
  };
}

function normalizeLayerGroups(value: CinematicSceneSet['layerGroups']) {
  const result: CinematicSceneSet['layerGroups'] = {};
  for (const bp of ['mobile', 'desktop'] as const) {
    const input = value?.[bp];
    if (!Array.isArray(input)) continue;
    const ids = new Set<string>();
    const members = new Set<string>();
    result[bp] = input.flatMap((group) => {
      if (!group || !isCinematicSceneSetId(group.id) || ids.has(group.id) ||
        typeof group.label !== 'string' || !group.label.trim() || !Array.isArray(group.memberIds)) return [];
      const memberIds = [...new Set(group.memberIds)].filter((id) => isCinematicSceneSetId(id) && !members.has(id));
      if (memberIds.length < 2) return [];
      ids.add(group.id);
      memberIds.forEach((id) => members.add(id));
      const animations = normalizeAssetAnimations(group.animations);
      const keyframes = normalizeAssetKeyframes(group.keyframes);
      const scale = Math.min(10, Math.max(.05, finite(group.scale, 1)));
      const rotation = Math.min(360, Math.max(-360, finite(group.rotation, 0)));
      const enter = normalizeTransition(group.enter);
      const exit = normalizeTransition(group.exit);
      return [{ id: group.id, label: group.label.trim().slice(0, 64), memberIds,
        ...(group.hidden === true ? { hidden: true } : {}),
        ...(animations.length ? { animations } : {}),
        ...(keyframes?.length ? { keyframes } : {}),
        ...(scale !== 1 ? { scale } : {}),
        ...(rotation ? { rotation } : {}),
        ...(enter && enter.kind !== 'cut' ? { enter } : {}),
        ...(exit && exit.kind !== 'cut' ? { exit } : {}) }];
    });
  }
  return Object.keys(result).length ? result : undefined;
}

function normalizeSet(
  value: SceneSetPatch,
  fallback: CinematicSceneSet | undefined,
  path: string,
  issues: CinematicSceneSetIssue[],
): CinematicSceneSet | null {
  if (!isCinematicSceneSetId(value.id)) {
    issues.push({ path, message: 'Scene set requires a valid id.' });
    return null;
  }
  const label = typeof value.label === 'string' ? value.label.trim() : fallback?.label;
  const space = value.space === 'viewport' || value.space === 'world' ? value.space : fallback?.space;
  if (!label || !space) {
    issues.push({ path, message: 'New scene set requires a label and coordinate space.' });
    return null;
  }
  if (value.space !== undefined && value.space !== 'viewport' && value.space !== 'world') {
    issues.push({ path: `${path}.space`, message: 'Unknown coordinate space was replaced.' });
  }
  const opacity = Math.min(1, Math.max(0, finite(value.opacity, fallback?.opacity ?? 1)));
  if (value.opacity !== undefined && opacity !== value.opacity) {
    issues.push({ path: `${path}.opacity`, message: 'Scene-set opacity was clamped.' });
  }
  const timingTrackId = value.timingTrackId === null
    ? undefined
    : value.timingTrackId === undefined
    ? fallback?.timingTrackId
    : isCinematicSceneSetId(value.timingTrackId) ? value.timingTrackId : undefined;
  if (value.timingTrackId !== undefined && value.timingTrackId !== null && timingTrackId === undefined) {
    issues.push({ path: `${path}.timingTrackId`, message: 'Invalid timing-track id was removed.' });
  }
  const behavior = value.behavior === null
    ? undefined
    : value.behavior === undefined
    ? fallback?.behavior
    : isCinematicSceneSetId(value.behavior) ? value.behavior : undefined;
  if (value.behavior !== undefined && value.behavior !== null && behavior === undefined) {
    issues.push({ path: `${path}.behavior`, message: 'Invalid behaviour key was removed.' });
  }
  const enter = value.enter === null
    ? undefined
    : value.enter === undefined ? fallback?.enter : normalizeTransition(value.enter);
  const exit = value.exit === null
    ? undefined
    : value.exit === undefined ? fallback?.exit : normalizeTransition(value.exit);
  const layerGroups = normalizeLayerGroups(value.layerGroups ?? fallback?.layerGroups);
  const referenceFrames = Object.fromEntries((['mobile', 'desktop'] as const).flatMap((breakpoint) => {
    const frame = (value.referenceFrames ?? fallback?.referenceFrames)?.[breakpoint];
    return frame && [frame.width, frame.height].every((size) => Number.isFinite(size) && size >= 1 && size <= 20000)
      ? [[breakpoint, { width: frame.width, height: frame.height }]] : [];
  }));
  const loop = value.loop === undefined ? fallback?.loop : value.loop;
  return {
    id: value.id,
    label,
    space,
    z: finite(value.z, fallback?.z ?? 0),
    ...(timingTrackId ? { timingTrackId } : {}),
    hidden: typeof value.hidden === 'boolean' ? value.hidden : fallback?.hidden ?? false,
    opacity,
    locked: typeof value.locked === 'boolean' ? value.locked : fallback?.locked ?? false,
    system: typeof value.system === 'boolean' ? value.system : fallback?.system ?? false,
    ...(behavior ? { behavior } : {}),
    ...(layerGroups ? { layerGroups } : {}),
    ...(value.referenceFrames || fallback?.referenceFrames ? { referenceFrames } : {}),
    ...((value.composeTiming ?? fallback?.composeTiming) === true ? { composeTiming: true } : {}),
    ...(loop === 'float' || loop === 'sway' ? { loop } : {}),
    ...(enter ? { enter } : {}),
    ...(exit ? { exit } : {}),
  };
}

function parse(raw: string | undefined, issues: CinematicSceneSetIssue[]): StoredSceneSets | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      issues.push({ path: 'sceneSets', message: 'Saved scene sets must be an object.' });
      return null;
    }
    const stored = value as StoredSceneSets;
    if (stored.version !== undefined && stored.version !== CINEMATIC_SCENE_SETS_VERSION) {
      issues.push({ path: 'sceneSets.version', message: `Unsupported scene-set version ${String(stored.version)}.` });
      return null;
    }
    if (stored.sets !== undefined && !Array.isArray(stored.sets)) {
      issues.push({ path: 'sceneSets.sets', message: 'Saved scene sets must be an array.' });
      return null;
    }
    return stored;
  } catch {
    issues.push({ path: 'sceneSets', message: 'Saved scene sets are not valid JSON.' });
    return null;
  }
}

export function resolveCinematicSceneSets(
  prefix: string,
  definitions: CinematicSceneSet[],
  config: Record<string, string> | undefined,
): { sceneSets: CinematicSceneSet[]; issues: CinematicSceneSetIssue[] } {
  const issues: CinematicSceneSetIssue[] = [];
  const defaults = definitions.flatMap((definition, index) => {
    const normalized = normalizeSet(definition, undefined, `defaults.${index}`, issues);
    return normalized ? [normalized] : [];
  });
  const stored = parse(config?.[cinematicSceneSetsKey(prefix)], issues);
  if (!stored) return { sceneSets: defaults.sort((a, b) => a.z - b.z), issues };

  const byId = new Map(defaults.map((set) => [set.id, set]));
  for (const [index, patch] of (stored.sets ?? []).entries()) {
    if (!patch || typeof patch !== 'object' || !isCinematicSceneSetId(patch.id)) {
      issues.push({ path: `sceneSets.sets.${index}`, message: 'Invalid scene-set record was ignored.' });
      continue;
    }
    if (patch.deleted) {
      byId.delete(patch.id);
      continue;
    }
    const normalized = normalizeSet(patch, byId.get(patch.id), `sceneSets.sets.${patch.id}`, issues);
    if (normalized) byId.set(normalized.id, normalized);
  }
  return { sceneSets: [...byId.values()].sort((a, b) => a.z - b.z), issues };
}

export function serializeCinematicSceneSets(
  definitions: CinematicSceneSet[],
  sceneSets: CinematicSceneSet[],
): string {
  const defaults = new Map(definitions.map((set) => [set.id, set]));
  const current = new Map(sceneSets.map((set) => [set.id, set]));
  const patches: SceneSetPatch[] = [];
  for (const definition of definitions) {
    if (!current.has(definition.id)) patches.push({ id: definition.id, deleted: true });
  }
  for (const set of sceneSets) {
    const base = defaults.get(set.id);
    if (!base) {
      patches.push({ ...set });
      continue;
    }
    const patch: SceneSetPatch = { id: set.id };
    for (const key of ['label', 'space', 'z', 'hidden', 'opacity', 'locked', 'system', 'composeTiming', 'layerGroups', 'referenceFrames'] as const) {
      if (JSON.stringify(set[key]) !== JSON.stringify(base[key])) patch[key] = set[key] as never;
    }
    for (const key of ['timingTrackId', 'behavior', 'enter', 'exit', 'loop'] as const) {
      if (JSON.stringify(set[key]) !== JSON.stringify(base[key])) {
        (patch as Record<string, unknown>)[key] = set[key] ?? null;
      }
    }
    if (Object.keys(patch).length > 1) patches.push(patch);
  }
  return patches.length
    ? JSON.stringify({ version: CINEMATIC_SCENE_SETS_VERSION, sets: patches })
    : '';
}
