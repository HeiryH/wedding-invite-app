import type { CinematicTrackTransition } from './sequence';
import type { CinematicWorldLayer } from './world';

export const CINEMATIC_SCENE_SETS_VERSION = 1 as const;

export type CinematicSceneSetId = string;
export type CinematicSceneSpace = 'viewport' | 'world';

/**
 * A scene set is an authored container, not an engine-known category. Templates provide starting
 * sets, while saved projects may add any valid id without changing the renderer's vocabulary.
 */
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
  enter?: CinematicTrackTransition;
  exit?: CinematicTrackTransition;
}

export interface CinematicSceneSetIssue {
  path: string;
  message: string;
}

type SceneSetPatch = Partial<Omit<
  CinematicSceneSet,
  'id' | 'timingTrackId' | 'behavior' | 'enter' | 'exit'
>> & {
  id: string;
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
export function applyCinematicSceneSets(layers: CinematicWorldLayer[], sets: CinematicSceneSet[]): CinematicWorldLayer[] {
  const byId = new Map(sets.map((set) => [set.id, set]));
  return layers.map((layer) => {
    const set = byId.get(layer.group);
    if (!set) return { ...layer, hidden: true };
    return { ...layer, hidden: layer.hidden || set.hidden, locked: layer.locked || set.locked,
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
    for (const key of ['label', 'space', 'z', 'hidden', 'opacity', 'locked', 'system'] as const) {
      if (JSON.stringify(set[key]) !== JSON.stringify(base[key])) patch[key] = set[key] as never;
    }
    for (const key of ['timingTrackId', 'behavior', 'enter', 'exit'] as const) {
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
