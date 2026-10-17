import type { Breakpoint } from '../types';
import type { CinematicSequenceTrack } from './sequence';
import type { CinematicLayerGroup } from './world';

export interface CinematicVisibilitySet {
  id: string;
  label: string;
  group: CinematicLayerGroup;
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
}

type VisibilityGeometry = Pick<
  CinematicVisibilitySet,
  'enterStart' | 'enterEnd' | 'exitStart' | 'exitEnd'
>;
type VisibilityDelta = Partial<VisibilityGeometry> & { id: string };
interface VisibilityLayout { sets?: VisibilityDelta[] }

const FIELDS: (keyof VisibilityGeometry)[] = [
  'enterStart', 'enterEnd', 'exitStart', 'exitEnd',
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const cinematicVisibilityKey = (prefix: string, breakpoint: Breakpoint) =>
  `${prefix}.layout.${breakpoint}.cinematic-visibility`;

function patchSet(set: CinematicVisibilitySet, patch: Partial<VisibilityGeometry>) {
  const next = { ...set };
  for (const field of FIELDS) {
    if (patch[field] !== undefined) next[field] = clamp(patch[field] as number);
  }
  return next;
}

export function resolveCinematicVisibility(
  prefix: string,
  defs: CinematicVisibilitySet[],
  breakpoint: Breakpoint,
  config: Record<string, string> | undefined,
): CinematicVisibilitySet[] {
  const sets = defs.map((set) => ({ ...set }));
  const raw = config?.[cinematicVisibilityKey(prefix, breakpoint)];
  if (!raw) return sets;
  try {
    const saved = JSON.parse(raw) as VisibilityLayout;
    const byId = new Map(sets.map((set) => [set.id, set]));
    for (const patch of saved.sets ?? []) {
      const set = byId.get(patch.id);
      if (set) byId.set(patch.id, patchSet(set, patch));
    }
    return [...byId.values()];
  } catch {
    return sets;
  }
}

export function serializeCinematicVisibility(
  defs: CinematicVisibilitySet[],
  sets: CinematicVisibilitySet[],
): string {
  const baseById = new Map(defs.map((set) => [set.id, set]));
  const deltas: VisibilityDelta[] = [];
  for (const set of sets) {
    const base = baseById.get(set.id);
    if (!base) continue;
    const delta: VisibilityDelta = { id: set.id };
    let changed = false;
    for (const field of FIELDS) {
      if (set[field] !== base[field]) {
        delta[field] = set[field];
        changed = true;
      }
    }
    if (changed) deltas.push(delta);
  }
  return deltas.length ? JSON.stringify({ sets: deltas }) : '';
}

/**
 * Promotes the pre-sequence, breakpoint visibility format into the versioned track model at read
 * time. Keeping this conversion in one pure function prevents the editor and guest renderer from
 * drifting during the migration window. The caller retires the legacy key on the next timing edit.
 */
export function promoteLegacyCinematicVisibilityTracks(
  tracks: CinematicSequenceTrack[],
  sets: CinematicVisibilitySet[],
): CinematicSequenceTrack[] {
  if (!sets.length) return tracks;
  const byId = new Map(sets.map((set) => [set.id, set]));
  const byGroup = new Map(sets.map((set) => [set.group, set]));
  let changed = false;
  const promoted = tracks.map((track) => {
    if (track.target.type !== 'group') return track;
    const set = byId.get(track.id) ?? byGroup.get(track.target.id);
    if (!set) return track;
    const clip = {
      start: set.enterStart,
      enterEnd: set.enterEnd,
      exitStart: set.exitStart,
      end: set.exitEnd,
    };
    if (track.clip.start === clip.start && track.clip.enterEnd === clip.enterEnd &&
      track.clip.exitStart === clip.exitStart && track.clip.end === clip.end) return track;
    changed = true;
    return { ...track, clip };
  });
  return changed ? promoted : tracks;
}

/** Scroll-scrubbed, reversible visibility with independently directable entrance and exit. */
export function cinematicSetOpacity(progress: number, set: CinematicVisibilitySet | undefined) {
  if (!set) return 1;
  if (progress <= set.enterStart) return 0;
  const enterSpan = Math.max(set.enterEnd - set.enterStart, 0.0001);
  const entering = clamp((progress - set.enterStart) / enterSpan);
  if (progress <= set.exitStart) return entering;
  if (set.exitEnd >= 1 && progress >= 1) return set.exitStart >= 1 ? entering : 0;
  const exitSpan = Math.max(set.exitEnd - set.exitStart, 0.0001);
  return Math.min(entering, 1 - clamp((progress - set.exitStart) / exitSpan));
}
