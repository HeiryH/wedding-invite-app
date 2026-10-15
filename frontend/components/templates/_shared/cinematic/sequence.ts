import type { CinematicVisibilitySet } from './visibility';
import type { CinematicLayerGroup } from './world';

export const CINEMATIC_SEQUENCE_VERSION = 1 as const;

export type CinematicCameraTransition =
  | 'cut'
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'hold';

export type CinematicAssetTransition =
  | 'cut'
  | 'fade'
  | 'slide'
  | 'scale'
  | 'fade-slide';

export type CinematicEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface CinematicSequenceBeat {
  id: string;
  label: string;
  /** Global story position. Camera geometry remains breakpoint-specific. */
  at: number;
  order: number;
  transitionIn: CinematicCameraTransition;
  referenceSrc?: string;
  referenceLabel?: string;
}

export interface CinematicSequenceClip {
  start: number;
  enterEnd: number;
  exitStart: number;
  end: number;
}

export interface CinematicTrackTransition {
  kind: CinematicAssetTransition;
  easing: CinematicEasing;
}

export type CinematicTrackOwnership =
  | { kind: 'shared' }
  | { kind: 'beat'; beatId: string };

export type CinematicTrackTiming =
  | { mode: 'independent' }
  | { mode: 'linked'; trackId: string };

export type CinematicTrackTarget =
  | { type: 'group'; id: CinematicLayerGroup }
  | { type: 'layer' | 'narrative' | 'effect' | 'interaction'; id: string };

export type CinematicTrackKind = 'set' | 'asset' | 'text' | 'effect' | 'interaction';

export interface CinematicSequenceTrack {
  id: string;
  label: string;
  kind: CinematicTrackKind;
  target: CinematicTrackTarget;
  timing: CinematicTrackTiming;
  clip: CinematicSequenceClip;
  enter: CinematicTrackTransition;
  exit: CinematicTrackTransition;
  ownership: CinematicTrackOwnership;
}

export interface CinematicSequence {
  version: typeof CINEMATIC_SEQUENCE_VERSION;
  beats: CinematicSequenceBeat[];
  tracks: CinematicSequenceTrack[];
}

export interface CinematicSequenceIssue {
  path: string;
  message: string;
}

export interface CinematicMomentRemoval {
  sequence: CinematicSequence;
  removedTracks: CinematicSequenceTrack[];
}

type BeatPatch = Partial<Omit<CinematicSequenceBeat, 'id'>> & { id: string; deleted?: boolean };
type TrackPatch = Partial<Omit<CinematicSequenceTrack, 'id'>> & { id: string; deleted?: boolean };
interface StoredSequence {
  version?: number;
  beats?: BeatPatch[];
  tracks?: TrackPatch[];
}

const CAMERA_TRANSITIONS = new Set<CinematicCameraTransition>([
  'cut', 'linear', 'ease-in', 'ease-out', 'ease-in-out', 'hold',
]);
const ASSET_TRANSITIONS = new Set<CinematicAssetTransition>([
  'cut', 'fade', 'slide', 'scale', 'fade-slide',
]);
const EASINGS = new Set<CinematicEasing>(['linear', 'ease-in', 'ease-out', 'ease-in-out']);
const TRACK_KINDS = new Set<CinematicTrackKind>(['set', 'asset', 'text', 'effect', 'interaction']);
const TARGET_TYPES = new Set<CinematicTrackTarget['type']>([
  'group', 'layer', 'narrative', 'effect', 'interaction',
]);
const LAYER_GROUPS = new Set<CinematicLayerGroup>([
  'background', 'welcome', 'custom', 'venue', 'dais', 'programme', 'table',
  'table-wishes', 'rsvp', 'wishes', 'memory',
]);

export const cinematicSequenceKey = (prefix: string) => `${prefix}.layout.cinematic-sequence`;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const finite = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value);
}

function parseStored(raw: string | undefined, issues: CinematicSequenceIssue[]): StoredSequence | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      issues.push({ path: 'sequence', message: 'Saved sequence must be an object.' });
      return null;
    }
    if (parsed.version !== undefined && parsed.version !== CINEMATIC_SEQUENCE_VERSION) {
      issues.push({ path: 'sequence.version', message: `Unsupported sequence version ${String(parsed.version)}.` });
      return null;
    }
    return parsed as StoredSequence;
  } catch {
    issues.push({ path: 'sequence', message: 'Saved sequence is not valid JSON.' });
    return null;
  }
}

function normalizeBeat(
  value: CinematicSequenceBeat,
  index: number,
  issues: CinematicSequenceIssue[],
): CinematicSequenceBeat | null {
  const path = `beats.${value.id || index}`;
  if (!validId(value.id) || typeof value.label !== 'string' || !value.label.trim()) {
    issues.push({ path, message: 'Beat requires a valid id and label.' });
    return null;
  }
  const at = clamp(finite(value.at, 0));
  if (at !== value.at) issues.push({ path: `${path}.at`, message: 'Beat position was clamped to the story range.' });
  const transitionIn = CAMERA_TRANSITIONS.has(value.transitionIn) ? value.transitionIn : 'ease-out';
  if (transitionIn !== value.transitionIn) {
    issues.push({ path: `${path}.transitionIn`, message: 'Unknown camera transition was replaced.' });
  }
  return {
    ...value,
    label: value.label.trim(),
    at,
    order: finite(value.order, index),
    transitionIn,
  };
}

function normalizeClip(
  clip: CinematicSequenceClip,
  path: string,
  issues: CinematicSequenceIssue[],
): CinematicSequenceClip {
  const start = clamp(finite(clip?.start, 0));
  const enterEnd = Math.max(start, clamp(finite(clip?.enterEnd, start)));
  const exitStart = Math.max(enterEnd, clamp(finite(clip?.exitStart, enterEnd)));
  const end = Math.max(exitStart, clamp(finite(clip?.end, exitStart)));
  const normalized = { start, enterEnd, exitStart, end };
  if (!same(normalized, clip)) {
    issues.push({ path, message: 'Clip timing was repaired to start ≤ entrance ≤ exit ≤ end.' });
  }
  return normalized;
}

function normalizeTransition(
  value: CinematicTrackTransition,
  path: string,
  issues: CinematicSequenceIssue[],
): CinematicTrackTransition {
  const kind = ASSET_TRANSITIONS.has(value?.kind) ? value.kind : 'fade';
  const easing = EASINGS.has(value?.easing) ? value.easing : 'ease-in-out';
  if (kind !== value?.kind || easing !== value?.easing) {
    issues.push({ path, message: 'Unknown asset transition was replaced.' });
  }
  return { kind, easing };
}

function normalizeTrack(
  value: CinematicSequenceTrack,
  index: number,
  beatIds: Set<string>,
  issues: CinematicSequenceIssue[],
): CinematicSequenceTrack | null {
  const path = `tracks.${value.id || index}`;
  if (!validId(value.id) || typeof value.label !== 'string' || !value.label.trim()) {
    issues.push({ path, message: 'Track requires a valid id and label.' });
    return null;
  }
  if (!TRACK_KINDS.has(value.kind) || !value.target || !TARGET_TYPES.has(value.target.type) ||
    !validId(value.target.id) || (value.target.type === 'group' && !LAYER_GROUPS.has(value.target.id))) {
    issues.push({ path, message: 'Track has an invalid kind or target.' });
    return null;
  }
  const ownership = value.ownership?.kind === 'beat' && validId(value.ownership.beatId)
    ? value.ownership
    : { kind: 'shared' as const };
  if (ownership.kind === 'beat' && !beatIds.has(ownership.beatId)) {
    // An exclusive track follows its narrative moment. A beat tombstone therefore suppresses the
    // track without deleting shared scene art that happens to span the same story range.
    return null;
  }
  const timing = value.timing?.mode === 'linked' && validId(value.timing.trackId)
    ? value.timing
    : { mode: 'independent' as const };
  return {
    ...value,
    label: value.label.trim(),
    ownership,
    timing,
    clip: normalizeClip(value.clip, `${path}.clip`, issues),
    enter: normalizeTransition(value.enter, `${path}.enter`, issues),
    exit: normalizeTransition(value.exit, `${path}.exit`, issues),
  };
}

function mergeBeat(base: CinematicSequenceBeat, patch: BeatPatch): CinematicSequenceBeat {
  const fields = { ...patch };
  delete fields.deleted;
  return { ...base, ...fields, id: base.id };
}

function mergeTrack(base: CinematicSequenceTrack, patch: TrackPatch): CinematicSequenceTrack {
  const fields = { ...patch };
  delete fields.deleted;
  return {
    ...base,
    ...fields,
    id: base.id,
    target: fields.target ? { ...base.target, ...fields.target } as CinematicTrackTarget : base.target,
    timing: fields.timing ? { ...base.timing, ...fields.timing } as CinematicTrackTiming : base.timing,
    clip: fields.clip ? { ...base.clip, ...fields.clip } : base.clip,
    enter: fields.enter ? { ...base.enter, ...fields.enter } : base.enter,
    exit: fields.exit ? { ...base.exit, ...fields.exit } : base.exit,
    ownership: fields.ownership
      ? { ...base.ownership, ...fields.ownership } as CinematicTrackOwnership
      : base.ownership,
  };
}

function isCompleteBeat(value: BeatPatch): value is CinematicSequenceBeat {
  return validId(value.id) && typeof value.label === 'string' && typeof value.at === 'number' &&
    typeof value.order === 'number' && typeof value.transitionIn === 'string';
}

function isCompleteTrack(value: TrackPatch): value is CinematicSequenceTrack {
  return validId(value.id) && typeof value.label === 'string' && typeof value.kind === 'string' &&
    isRecord(value.target) && isRecord(value.timing) && isRecord(value.clip) &&
    isRecord(value.enter) && isRecord(value.exit) && isRecord(value.ownership);
}

export function validateCinematicSequence(definition: CinematicSequence): {
  sequence: CinematicSequence;
  issues: CinematicSequenceIssue[];
} {
  const issues: CinematicSequenceIssue[] = [];
  const seenBeats = new Set<string>();
  const beats = definition.beats.flatMap((beat, index) => {
    const normalized = normalizeBeat(beat, index, issues);
    if (!normalized) return [];
    if (seenBeats.has(normalized.id)) {
      issues.push({ path: `beats.${normalized.id}`, message: 'Duplicate beat was ignored.' });
      return [];
    }
    seenBeats.add(normalized.id);
    return [normalized];
  }).sort((left, right) => left.order - right.order || left.at - right.at);

  const beatIds = new Set(beats.map((beat) => beat.id));
  const seenTracks = new Set<string>();
  let tracks = definition.tracks.flatMap((track, index) => {
    const normalized = normalizeTrack(track, index, beatIds, issues);
    if (!normalized) return [];
    if (seenTracks.has(normalized.id)) {
      issues.push({ path: `tracks.${normalized.id}`, message: 'Duplicate track was ignored.' });
      return [];
    }
    seenTracks.add(normalized.id);
    return [normalized];
  });

  const trackIds = new Set(tracks.map((track) => track.id));
  tracks = tracks.map((track) => {
    if (track.timing.mode !== 'linked') return track;
    if (track.timing.trackId !== track.id && trackIds.has(track.timing.trackId)) return track;
    issues.push({ path: `tracks.${track.id}.timing`, message: 'Broken timing link was unlinked.' });
    return { ...track, timing: { mode: 'independent' } };
  });

  return { sequence: { version: CINEMATIC_SEQUENCE_VERSION, beats, tracks }, issues };
}

export function resolveCinematicSequence(
  prefix: string,
  definition: CinematicSequence,
  config: Record<string, string> | undefined,
): { sequence: CinematicSequence; issues: CinematicSequenceIssue[] } {
  const issues: CinematicSequenceIssue[] = [];
  const source = clone(definition);
  const saved = parseStored(config?.[cinematicSequenceKey(prefix)], issues);
  if (saved) {
    const beats = new Map(source.beats.map((beat) => [beat.id, beat]));
    for (const patch of Array.isArray(saved.beats) ? saved.beats : []) {
      if (!isRecord(patch) || !validId(patch.id)) {
        issues.push({ path: 'beats', message: 'Malformed saved beat was ignored.' });
        continue;
      }
      if (patch.deleted) {
        beats.delete(patch.id);
        continue;
      }
      const current = beats.get(patch.id);
      if (current) beats.set(patch.id, mergeBeat(current, patch));
      else if (isCompleteBeat(patch)) beats.set(patch.id, patch);
      else issues.push({ path: `beats.${patch.id}`, message: 'Unknown partial beat was ignored.' });
    }
    source.beats = [...beats.values()];

    const tracks = new Map(source.tracks.map((track) => [track.id, track]));
    for (const patch of Array.isArray(saved.tracks) ? saved.tracks : []) {
      if (!isRecord(patch) || !validId(patch.id)) {
        issues.push({ path: 'tracks', message: 'Malformed saved track was ignored.' });
        continue;
      }
      if (patch.deleted) {
        tracks.delete(patch.id);
        continue;
      }
      const current = tracks.get(patch.id);
      if (current) tracks.set(patch.id, mergeTrack(current, patch));
      else if (isCompleteTrack(patch)) tracks.set(patch.id, patch);
      else issues.push({ path: `tracks.${patch.id}`, message: 'Unknown partial track was ignored.' });
    }
    source.tracks = [...tracks.values()];
  }

  const validated = validateCinematicSequence(source);
  return { sequence: validated.sequence, issues: [...issues, ...validated.issues] };
}

function diff<T extends object>(base: T, current: T, omitted: string[] = []): Partial<T> {
  const delta: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (omitted.includes(String(key))) continue;
    if (!same(base[key], current[key])) delta[key] = current[key];
  }
  return delta;
}

export function serializeCinematicSequence(
  definition: CinematicSequence,
  sequence: CinematicSequence,
): string {
  const baseBeats = new Map(definition.beats.map((beat) => [beat.id, beat]));
  const currentBeats = new Map(sequence.beats.map((beat) => [beat.id, beat]));
  const beats: BeatPatch[] = [];
  for (const beat of definition.beats) {
    const current = currentBeats.get(beat.id);
    if (!current) beats.push({ id: beat.id, deleted: true });
    else {
      const delta = diff(beat, current, ['id']);
      if (Object.keys(delta).length) beats.push({ id: beat.id, ...delta });
    }
  }
  for (const beat of sequence.beats) if (!baseBeats.has(beat.id)) beats.push(clone(beat));

  const baseTracks = new Map(definition.tracks.map((track) => [track.id, track]));
  const currentTracks = new Map(sequence.tracks.map((track) => [track.id, track]));
  const tracks: TrackPatch[] = [];
  for (const track of definition.tracks) {
    const current = currentTracks.get(track.id);
    if (!current) tracks.push({ id: track.id, deleted: true });
    else {
      const delta = diff(track, current, ['id']);
      if (Object.keys(delta).length) tracks.push({ id: track.id, ...delta });
    }
  }
  for (const track of sequence.tracks) if (!baseTracks.has(track.id)) tracks.push(clone(track));

  if (!beats.length && !tracks.length) return '';
  return JSON.stringify({
    version: CINEMATIC_SEQUENCE_VERSION,
    ...(beats.length ? { beats } : {}),
    ...(tracks.length ? { tracks } : {}),
  });
}

export interface CinematicResolvedBeat {
  id: string;
  label: string;
  progress: number;
  transitionIn: CinematicCameraTransition;
  referenceSrc?: string;
  referenceLabel?: string;
}

export function beatsFromSequence(sequence: CinematicSequence): CinematicResolvedBeat[] {
  return sequence.beats.map(({ id, label, at, transitionIn, referenceSrc, referenceLabel }) => ({
    id, label, progress: at, transitionIn, referenceSrc, referenceLabel,
  }));
}

/**
 * Removes one complete narrative moment. Shared tracks deliberately survive because they may span
 * neighbouring camera beats; only tracks that explicitly belong to this beat leave with it.
 */
export function removeCinematicNarrativeMoment(
  sequence: CinematicSequence,
  beatId: string,
): CinematicMomentRemoval {
  const removedTracks = sequence.tracks.filter((track) =>
    track.ownership.kind === 'beat' && track.ownership.beatId === beatId);
  const removedTrackIds = new Set(removedTracks.map((track) => track.id));
  return {
    sequence: {
      ...sequence,
      beats: sequence.beats.filter((beat) => beat.id !== beatId),
      tracks: sequence.tracks.filter((track) => !removedTrackIds.has(track.id)),
    },
    removedTracks,
  };
}

export function resolveCinematicTrackClip(
  track: CinematicSequenceTrack,
  tracks: CinematicSequenceTrack[] | Map<string, CinematicSequenceTrack>,
  visited = new Set<string>(),
): CinematicSequenceClip {
  const byId = tracks instanceof Map ? tracks : new Map(tracks.map((candidate) => [candidate.id, candidate]));
  if (track.timing.mode !== 'linked' || visited.has(track.id)) return track.clip;
  const parent = byId.get(track.timing.trackId);
  if (!parent) return track.clip;
  visited.add(track.id);
  return resolveCinematicTrackClip(parent, byId, visited);
}

export interface CinematicTrackPresentation {
  opacity: number;
  xVw: number;
  scale: number;
}

const easeAmount = (value: number, easing: CinematicEasing) => {
  const amount = clamp(value);
  if (easing === 'linear') return amount;
  if (easing === 'ease-in') return amount * amount * amount;
  if (easing === 'ease-out') return 1 - Math.pow(1 - amount, 3);
  return amount < .5
    ? 4 * amount * amount * amount
    : 1 - Math.pow(-2 * amount + 2, 3) / 2;
};

/** Runtime presentation for an asset track, including linked timing and reversible transitions. */
export function cinematicTrackPresentation(
  progress: number,
  track: CinematicSequenceTrack | undefined,
  tracks: CinematicSequenceTrack[],
): CinematicTrackPresentation {
  if (!track) return { opacity: 1, xVw: 0, scale: 1 };
  const clip = resolveCinematicTrackClip(track, tracks);
  if (progress < clip.start || progress > clip.end) return { opacity: 0, xVw: 0, scale: 1 };

  const enterRaw = clip.enterEnd <= clip.start ? 1
    : clamp((progress - clip.start) / (clip.enterEnd - clip.start));
  const exitRaw = clip.end <= clip.exitStart ? 1
    : 1 - clamp((progress - clip.exitStart) / (clip.end - clip.exitStart));
  const entering = track.enter.kind === 'cut' ? (enterRaw >= 1 ? 1 : 0) : easeAmount(enterRaw, track.enter.easing);
  const exiting = track.exit.kind === 'cut' ? (exitRaw > 0 ? 1 : 0) : easeAmount(exitRaw, track.exit.easing);
  const phase = Math.min(entering, exiting);
  const enteringNow = progress <= clip.enterEnd;
  const transition = enteringNow ? track.enter : track.exit;
  const fade = transition.kind === 'fade' || transition.kind === 'fade-slide';
  const slide = transition.kind === 'slide' || transition.kind === 'fade-slide';
  const scale = transition.kind === 'scale';

  return {
    opacity: fade ? phase : 1,
    xVw: slide ? (1 - phase) * (enteringNow ? 6 : -6) : 0,
    scale: scale ? .86 + phase * .14 : 1,
  };
}

/** Compatibility projection consumed by the current runtime until track rendering lands. */
export function visibilityFromSequence(sequence: CinematicSequence): CinematicVisibilitySet[] {
  const byId = new Map(sequence.tracks.map((track) => [track.id, track]));
  return sequence.tracks.flatMap((track) => {
    if (track.target.type !== 'group') return [];
    const clip = resolveCinematicTrackClip(track, byId);
    return [{
      id: track.id,
      label: track.label,
      group: track.target.id,
      enterStart: clip.start,
      enterEnd: clip.enterEnd,
      exitStart: clip.exitStart,
      exitEnd: clip.end,
    }];
  });
}
