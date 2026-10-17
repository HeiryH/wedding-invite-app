import type { CinematicVisibilitySet } from './visibility';
import type { CinematicLayerGroup, CinematicWorldLayer } from './world';
import { cinematicAncestors } from './parts';

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

export type CinematicSlideDirection = 'left' | 'right' | 'up' | 'down';

export interface CinematicSequenceBeat {
  id: string;
  label: string;
  /** Global story position. Camera geometry remains breakpoint-specific. */
  at: number;
  order: number;
  transitionIn: CinematicCameraTransition;
  referenceSrc?: string;
  referenceLabel?: string;
  referenceFit?: 'contain' | 'cover' | 'fill';
  referenceOpacity?: number;
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
  /** Direction of the off-stage endpoint for slide-based transitions. */
  direction?: CinematicSlideDirection;
  /** Distance from the composed position, as a percentage of the preview frame. */
  distance?: number;
  /** Scale at the off-stage endpoint. 1 keeps the authored size. */
  scale?: number;
}

export type CinematicTrackOwnership =
  | { kind: 'shared' }
  | { kind: 'beat'; beatId: string };

export type CinematicTrackTiming =
  | { mode: 'independent' }
  | { mode: 'linked'; trackId: string };

export type CinematicTrackTarget =
  | { type: 'group'; id: CinematicLayerGroup }
  | { type: 'set' | 'layer' | 'narrative' | 'effect' | 'interaction'; id: string };

export type CinematicTrackKind = 'set' | 'asset' | 'text' | 'effect' | 'interaction';

export interface CinematicSequenceTrack {
  /** Editor-only projection of a layer's in-between animation; never stored in the sequence. */
  assetAnimation?: { layerId: string; animationId: string; label?: string; sourceTrackId?: string; startLimit?: number; endLimit?: number };
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
  removedBeat?: CinematicSequenceBeat;
  removedTracks: CinematicSequenceTrack[];
  /** Normalized story span removed before the remaining timeline is compacted back to 0..1. */
  freedSpan: number;
  /** The surviving beat whose incoming camera transition now follows the previous moment. */
  nextBeatId?: string;
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
const SLIDE_DIRECTIONS = new Set<CinematicSlideDirection>(['left', 'right', 'up', 'down']);
const TRACK_KINDS = new Set<CinematicTrackKind>(['set', 'asset', 'text', 'effect', 'interaction']);
const TARGET_TYPES = new Set<CinematicTrackTarget['type']>([
  'group', 'set', 'layer', 'narrative', 'effect', 'interaction',
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
    referenceFit: ['contain', 'cover', 'fill'].includes(value.referenceFit ?? '') ? value.referenceFit : undefined,
    referenceOpacity: value.referenceOpacity === undefined ? undefined : clamp(finite(value.referenceOpacity, .45)),
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
  const direction = value?.direction === undefined
    ? undefined
    : SLIDE_DIRECTIONS.has(value.direction) ? value.direction : undefined;
  const rawDistance = value?.distance;
  const distance = rawDistance === undefined
    ? undefined
    : Math.min(50, Math.max(0, finite(rawDistance, 6)));
  const rawScale = value?.scale;
  const scale = rawScale === undefined
    ? undefined
    : Math.min(2, Math.max(.1, finite(rawScale, .86)));
  if (kind !== value?.kind || easing !== value?.easing ||
    direction !== value?.direction || distance !== rawDistance || scale !== rawScale) {
    issues.push({ path, message: 'Unknown asset transition was replaced.' });
  }
  return {
    kind,
    easing,
    ...(direction ? { direction } : {}),
    ...(distance !== undefined ? { distance } : {}),
    ...(scale !== undefined ? { scale } : {}),
  };
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
    !validId(value.target.id)) {
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
  referenceFit?: 'contain' | 'cover' | 'fill';
  referenceOpacity?: number;
}

export interface CinematicSnapResult {
  value: number;
  beat?: CinematicResolvedBeat;
}

/** Keeps a clip inside the story while preserving the invariant used by the runtime. */
export function constrainCinematicClip(clip: CinematicSequenceClip): CinematicSequenceClip {
  const start = clamp(finite(clip.start, 0));
  const enterEnd = Math.max(start, clamp(finite(clip.enterEnd, start)));
  const exitStart = Math.max(enterEnd, clamp(finite(clip.exitStart, enterEnd)));
  const end = Math.max(exitStart, clamp(finite(clip.end, exitStart)));
  return { start, enterEnd, exitStart, end };
}

/** Moves the whole clip without changing either transition span. */
export function moveCinematicClip(
  clip: CinematicSequenceClip,
  requestedDelta: number,
): CinematicSequenceClip {
  const delta = Math.max(-clip.start, Math.min(1 - clip.end, requestedDelta));
  const shifted = (value: number) => Number((value + delta).toFixed(6));
  return {
    start: shifted(clip.start),
    enterEnd: shifted(clip.enterEnd),
    exitStart: shifted(clip.exitStart),
    end: shifted(clip.end),
  };
}

/** Snaps a story position to the nearest camera beat when it is within the visual threshold. */
export function snapCinematicStoryValue(
  value: number,
  beats: CinematicResolvedBeat[],
  threshold = .012,
): CinematicSnapResult {
  const clamped = clamp(value);
  const beat = beats.reduce<CinematicResolvedBeat | undefined>((closest, candidate) => {
    if (Math.abs(candidate.progress - clamped) > threshold) return closest;
    if (!closest) return candidate;
    return Math.abs(candidate.progress - clamped) < Math.abs(closest.progress - clamped)
      ? candidate
      : closest;
  }, undefined);
  return beat ? { value: beat.progress, beat } : { value: clamped };
}

/** Human-readable story positions for the director UI (for example, “Full dais + 12%”). */
export function describeCinematicStoryPosition(
  value: number,
  beats: CinematicResolvedBeat[],
): string {
  if (!beats.length) return `${Math.round(clamp(value) * 100)}%`;
  const ordered = [...beats].sort((left, right) => left.progress - right.progress);
  const exact = ordered.find((beat) => Math.abs(beat.progress - value) < .0005);
  if (exact) return exact.label;
  const previous = [...ordered].reverse().find((beat) => beat.progress < value);
  const next = ordered.find((beat) => beat.progress > value);
  if (!previous) {
    const amount = Math.round((clamp(value) / Math.max(next?.progress ?? 1, .0001)) * 100);
    return `Opening + ${amount}%`;
  }
  if (!next) {
    const amount = Math.round(((clamp(value) - previous.progress) /
      Math.max(1 - previous.progress, .0001)) * 100);
    return amount ? `${previous.label} + ${amount}%` : previous.label;
  }
  const amount = Math.round(((value - previous.progress) /
    Math.max(next.progress - previous.progress, .0001)) * 100);
  return amount ? `${previous.label} + ${amount}%` : previous.label;
}

function cinematicBeatCoordinate(value: number, beats: CinematicResolvedBeat[]): number {
  const ordered = [...beats].sort((left, right) => left.progress - right.progress);
  const points = [{ progress: 0 }, ...ordered, { progress: 1 }];
  const clamped = clamp(value);
  const rightIndex = points.findIndex((point) => point.progress >= clamped);
  if (rightIndex <= 0) return 0;
  const left = points[rightIndex - 1];
  const right = points[rightIndex];
  return rightIndex - 1 + ((clamped - left.progress) /
    Math.max(right.progress - left.progress, .0001));
}

export function cinematicClipBeatSpan(
  clip: CinematicSequenceClip,
  beats: CinematicResolvedBeat[],
): number {
  return Math.max(0,
    cinematicBeatCoordinate(clip.end, beats) - cinematicBeatCoordinate(clip.start, beats));
}

export function beatsFromSequence(sequence: CinematicSequence): CinematicResolvedBeat[] {
  return sequence.beats.map(({ id, label, at, transitionIn, referenceSrc, referenceLabel, referenceFit, referenceOpacity }) => ({
    id, label, progress: at, transitionIn, referenceSrc, referenceLabel, referenceFit, referenceOpacity,
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
  const ordered = [...sequence.beats].sort((left, right) => left.at - right.at || left.order - right.order);
  const index = ordered.findIndex((beat) => beat.id === beatId);
  const removedBeat = ordered[index];
  if (!removedBeat || ordered.length <= 1) {
    return { sequence, removedTracks: [], freedSpan: 0 };
  }
  const previous = ordered[index - 1];
  const next = ordered[index + 1];
  // A beat owns the story span from the midpoint behind it to the midpoint ahead of it. Excising
  // that whole cell makes the remap continuous and monotonic: values inside the deleted moment
  // meet at one seam, while everything before/after retains its relative timing.
  const cutStart = previous ? (previous.at + removedBeat.at) / 2 : 0;
  const cutEnd = next ? (removedBeat.at + next.at) / 2 : 1;
  const freedSpan = Math.min(.45, Math.max(.005, cutEnd - cutStart));
  const remainingRange = Math.max(.001, 1 - freedSpan);
  const collapse = (value: number) => {
    if (value <= cutStart) return clamp(value / remainingRange);
    if (value >= cutEnd) return clamp((value - freedSpan) / remainingRange);
    return clamp(cutStart / remainingRange);
  };
  const removedTracks = sequence.tracks.filter((track) =>
    track.ownership.kind === 'beat' && track.ownership.beatId === beatId);
  const removedTrackIds = new Set(removedTracks.map((track) => track.id));
  const beats = ordered
    .filter((beat) => beat.id !== beatId)
    .map((beat, order) => ({ ...beat, at: collapse(beat.at), order }));
  const tracks = sequence.tracks.flatMap((track) => {
    if (removedTrackIds.has(track.id)) return [];
    const sourceWasRemoved = track.timing.mode === 'linked' && removedTrackIds.has(track.timing.trackId);
    const sourceClip = sourceWasRemoved ? resolveCinematicTrackClip(track, sequence.tracks) : track.clip;
    return [{
      ...track,
      timing: sourceWasRemoved ? { mode: 'independent' as const } : track.timing,
      clip: constrainCinematicClip({
        start: collapse(sourceClip.start),
        enterEnd: collapse(sourceClip.enterEnd),
        exitStart: collapse(sourceClip.exitStart),
        end: collapse(sourceClip.end),
      }),
    }];
  });
  return {
    sequence: {
      ...sequence,
      beats,
      tracks,
    },
    removedBeat,
    removedTracks,
    freedSpan,
    nextBeatId: next?.id ?? previous?.id,
  };
}

/** Restores a shipped narrative moment and its exclusively-owned tracks between surviving beats. */
export function restoreCinematicNarrativeMoment(
  definition: CinematicSequence,
  sequence: CinematicSequence,
  beatId: string,
): CinematicSequence {
  if (sequence.beats.some((beat) => beat.id === beatId)) return sequence;
  const shipped = definition.beats.find((beat) => beat.id === beatId);
  if (!shipped) return sequence;

  const shippedOrder = [...definition.beats].sort((left, right) => left.at - right.at || left.order - right.order);
  const shippedIndex = shippedOrder.findIndex((beat) => beat.id === beatId);
  const currentById = new Map(sequence.beats.map((beat) => [beat.id, beat]));
  const previous = [...shippedOrder.slice(0, shippedIndex)].reverse()
    .map((beat) => currentById.get(beat.id)).find(Boolean);
  const next = shippedOrder.slice(shippedIndex + 1)
    .map((beat) => currentById.get(beat.id)).find(Boolean);
  const shippedPrevious = previous ? definition.beats.find((beat) => beat.id === previous.id) : undefined;
  const shippedNext = next ? definition.beats.find((beat) => beat.id === next.id) : undefined;
  let at = shipped.at;
  if (previous && next && shippedPrevious && shippedNext) {
    const ratio = (shipped.at - shippedPrevious.at) /
      Math.max(shippedNext.at - shippedPrevious.at, .0001);
    at = previous.at + (next.at - previous.at) * ratio;
  } else if (previous && shippedPrevious) {
    const ratio = (shipped.at - shippedPrevious.at) / Math.max(1 - shippedPrevious.at, .0001);
    at = previous.at + (1 - previous.at) * ratio;
  } else if (next && shippedNext) {
    at = next.at * (shipped.at / Math.max(shippedNext.at, .0001));
  }

  const beats = [...sequence.beats, { ...shipped, at: clamp(at) }]
    .sort((left, right) => left.at - right.at || left.order - right.order)
    .map((beat, order) => ({ ...beat, order }));
  const restoredBeatById = new Map(beats.map((beat) => [beat.id, beat]));
  const anchors = [
    { from: 0, to: 0 },
    ...shippedOrder.flatMap((beat) => {
      const current = restoredBeatById.get(beat.id);
      return current ? [{ from: beat.at, to: current.at }] : [];
    }),
    { from: 1, to: 1 },
  ].sort((left, right) => left.from - right.from);
  const mapFromDefinition = (value: number) => {
    const rightIndex = anchors.findIndex((anchor) => anchor.from >= value);
    if (rightIndex <= 0) return anchors[0]?.to ?? value;
    const left = anchors[rightIndex - 1];
    const right = anchors[rightIndex];
    const amount = (value - left.from) / Math.max(right.from - left.from, .0001);
    return clamp(left.to + (right.to - left.to) * amount);
  };
  const currentTrackIds = new Set(sequence.tracks.map((track) => track.id));
  const restoredTracks = definition.tracks.flatMap((track) => {
    if (currentTrackIds.has(track.id) || track.ownership.kind !== 'beat' ||
      track.ownership.beatId !== beatId) return [];
    return [{
      ...clone(track),
      clip: constrainCinematicClip({
        start: mapFromDefinition(track.clip.start),
        enterEnd: mapFromDefinition(track.clip.enterEnd),
        exitStart: mapFromDefinition(track.clip.exitStart),
        end: mapFromDefinition(track.clip.end),
      }),
    }];
  });
  return { ...sequence, beats, tracks: [...sequence.tracks, ...restoredTracks] };
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

/** Resolves the track that ultimately owns a linked clip. */
export function resolveCinematicTrackSource(
  track: CinematicSequenceTrack,
  tracks: CinematicSequenceTrack[] | Map<string, CinematicSequenceTrack>,
  visited = new Set<string>(),
): CinematicSequenceTrack {
  const byId = tracks instanceof Map ? tracks : new Map(tracks.map((candidate) => [candidate.id, candidate]));
  if (track.timing.mode !== 'linked' || visited.has(track.id)) return track;
  const parent = byId.get(track.timing.trackId);
  if (!parent) return track;
  visited.add(track.id);
  return resolveCinematicTrackSource(parent, byId, visited);
}

export interface CinematicLayerTimingMember {
  id: string;
  label: string;
  group: CinematicLayerGroup;
  kind?: 'img' | 'text' | 'shape' | 'functional';
  timingTrackId?: string;
  parentId?: string;
}

export interface CinematicLayerTimingResolution {
  exact?: CinematicSequenceTrack;
  inherited?: CinematicSequenceTrack;
  source?: CinematicSequenceTrack;
  status: 'independent' | 'linked' | 'always';
}

/** Returns both the asset wrapper track and the set that effectively controls its clip. */
export function resolveCinematicLayerTiming(
  layerId: string,
  group: CinematicLayerGroup,
  tracks: CinematicSequenceTrack[],
  timingTrackId?: string,
  layers: CinematicWorldLayer[] = [],
): CinematicLayerTimingResolution {
  const exact = tracks.find((track) => track.target.type === 'layer' && track.target.id === layerId)
    ?? (timingTrackId ? tracks.find((track) => track.id === timingTrackId) : undefined);
  const member = layers.find((layer) => layer.id === layerId);
  const parentTrack = member ? cinematicAncestors(member, layers).flatMap((parent) => {
    const track = tracks.find((item) => item.target.type === 'layer' && item.target.id === parent.id)
      ?? tracks.find((item) => item.id === parent.timingTrackId);
    return track ? [track] : [];
  })[0] : undefined;
  const inherited = parentTrack ?? tracks.find((track) =>
    track.target.type === 'group' && track.target.id === group);
  const effective = exact ?? inherited;
  if (!effective) return { exact, inherited, status: 'always' };
  const source = resolveCinematicTrackSource(effective, tracks);
  return {
    exact,
    inherited,
    source,
    status: exact?.timing.mode === 'independent' ? 'independent' : 'linked',
  };
}

const uniqueTrackId = (tracks: CinematicSequenceTrack[], requested: string) => {
  const normalized = requested.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 64) || 'timing-set';
  const used = new Set(tracks.map((track) => track.id));
  let id = normalized;
  let suffix = 2;
  while (used.has(id)) id = `${normalized}-${suffix++}`;
  return id;
};

const alwaysClip: CinematicSequenceClip = { start: 0, enterEnd: 0, exitStart: 1, end: 1 };
const defaultEnter: CinematicTrackTransition = { kind: 'fade', easing: 'ease-out' };
const defaultExit: CinematicTrackTransition = { kind: 'fade', easing: 'ease-in' };

export function linkCinematicLayerTiming(
  tracks: CinematicSequenceTrack[],
  member: CinematicLayerTimingMember,
  sourceTrackId: string,
): CinematicSequenceTrack[] {
  const source = tracks.find((track) => track.id === sourceTrackId);
  if (!source) return tracks;
  const timing = resolveCinematicLayerTiming(member.id, member.group, tracks, member.timingTrackId);
  if (timing.exact) {
    return tracks.map((track) => track.id === timing.exact!.id
      ? { ...track, timing: { mode: 'linked', trackId: sourceTrackId } }
      : track);
  }
  const id = uniqueTrackId(tracks, `layer-${member.id}`);
  return [...tracks, {
    id,
    label: member.label,
    kind: member.kind === 'text' ? 'text' : 'asset',
    target: { type: 'layer', id: member.id },
    timing: { mode: 'linked', trackId: sourceTrackId },
    clip: resolveCinematicTrackClip(source, tracks),
    enter: source.enter,
    exit: source.exit,
    ownership: { kind: 'shared' },
  }];
}

export function unlinkCinematicLayerTiming(
  tracks: CinematicSequenceTrack[],
  member: CinematicLayerTimingMember,
  layers?: CinematicWorldLayer[],
): CinematicSequenceTrack[] {
  const timing = resolveCinematicLayerTiming(member.id, member.group, tracks, member.timingTrackId, layers);
  if (timing.exact?.timing.mode === 'independent') return tracks;
  if (timing.exact) {
    const clip = resolveCinematicTrackClip(timing.exact, tracks);
    return tracks.map((track) => track.id === timing.exact!.id
      ? { ...track, timing: { mode: 'independent' }, clip }
      : track);
  }
  const source = timing.source;
  const id = uniqueTrackId(tracks, `layer-${member.id}`);
  return [...tracks, {
    id,
    label: member.label,
    kind: member.kind === 'text' ? 'text' : 'asset',
    target: { type: 'layer', id: member.id },
    timing: { mode: 'independent' },
    clip: source ? resolveCinematicTrackClip(source, tracks) : alwaysClip,
    enter: source?.enter ?? defaultEnter,
    exit: source?.exit ?? defaultExit,
    ownership: source?.ownership ?? { kind: 'shared' },
  }];
}

/** Removes an asset wrapper so it follows its built-in scene group again. */
export function relinkCinematicLayerToGroup(
  tracks: CinematicSequenceTrack[],
  layerId: string,
): CinematicSequenceTrack[] {
  return tracks.filter((track) =>
    !(track.target.type === 'layer' && track.target.id === layerId));
}

export function createCinematicTimingSet(
  tracks: CinematicSequenceTrack[],
  label: string,
  members: CinematicLayerTimingMember[],
): { tracks: CinematicSequenceTrack[]; setId: string } {
  const cleanLabel = label.trim() || 'New timing set';
  const setId = uniqueTrackId(tracks, `set-${cleanLabel}`);
  const firstTiming = members[0]
    ? resolveCinematicLayerTiming(members[0].id, members[0].group, tracks)
    : undefined;
  const source = firstTiming?.source;
  let next: CinematicSequenceTrack[] = [...tracks, {
    id: setId,
    label: cleanLabel,
    kind: 'set',
    target: { type: 'set', id: setId },
    timing: { mode: 'independent' },
    clip: source ? resolveCinematicTrackClip(source, tracks) : alwaysClip,
    enter: source?.enter ?? defaultEnter,
    exit: source?.exit ?? defaultExit,
    ownership: { kind: 'shared' },
  }];
  for (const member of members) next = linkCinematicLayerTiming(next, member, setId);
  return { tracks: next, setId };
}

export function duplicateCinematicTimingSet(
  tracks: CinematicSequenceTrack[],
  setId: string,
): { tracks: CinematicSequenceTrack[]; setId?: string } {
  const source = tracks.find((track) =>
    track.id === setId && track.kind === 'set' && track.target.type === 'set');
  if (!source) return { tracks };
  const duplicateId = uniqueTrackId(tracks, `${source.id}-copy`);
  return {
    tracks: [...tracks, {
      ...clone(source), id: duplicateId, label: `${source.label} copy`,
      target: { type: 'set', id: duplicateId }, timing: { mode: 'independent' },
    }],
    setId: duplicateId,
  };
}

/** Deletes a custom set without changing its assets' current appearance. Linked clips become independent. */
export function deleteCinematicTimingSet(
  tracks: CinematicSequenceTrack[],
  setId: string,
): CinematicSequenceTrack[] {
  if (!tracks.some((track) =>
    track.id === setId && track.kind === 'set' && track.target.type === 'set')) return tracks;
  return tracks.flatMap((track) => {
    if (track.id === setId) return [];
    if (track.timing.mode !== 'linked' || track.timing.trackId !== setId) return [track];
    return [{ ...track, timing: { mode: 'independent' }, clip: resolveCinematicTrackClip(track, tracks) }];
  });
}

export type CinematicTrackLookup = CinematicSequenceTrack[] | Map<string, CinematicSequenceTrack>;

/** True while the playhead is inside a track's effective (possibly linked) clip. */
export function cinematicTrackIsActive(
  progress: number,
  track: CinematicSequenceTrack | undefined,
  tracks: CinematicTrackLookup,
): boolean {
  if (!track) return false;
  const clip = resolveCinematicTrackClip(track, tracks);
  return progress >= clip.start && progress <= clip.end;
}

/**
 * Normalized 0..1 progress through a track's entrance region. Effects use this instead of keeping
 * private scroll thresholds in their components; after the entrance finishes the phase holds at 1
 * until the effective clip ends.
 */
export function cinematicTrackPhase(
  progress: number,
  track: CinematicSequenceTrack | undefined,
  tracks: CinematicTrackLookup,
): number {
  if (!track) return 0;
  const clip = resolveCinematicTrackClip(track, tracks);
  if (progress < clip.start || progress > clip.end) return 0;
  if (clip.enterEnd <= clip.start || progress >= clip.enterEnd) return 1;
  return clamp((progress - clip.start) / (clip.enterEnd - clip.start));
}

export interface CinematicTrackPresentation {
  opacity: number;
  xVw: number;
  yVh: number;
  scale: number;
}

export const easeAmount = (value: number, easing: CinematicEasing) => {
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
  tracks: CinematicTrackLookup,
): CinematicTrackPresentation {
  if (!track) return { opacity: 1, xVw: 0, yVh: 0, scale: 1 };
  const clip = resolveCinematicTrackClip(track, tracks);
  if (progress < clip.start || progress > clip.end) {
    return { opacity: 0, xVw: 0, yVh: 0, scale: 1 };
  }

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
  const distance = transition.distance ?? 6;
  const direction = transition.direction ?? (enteringNow ? 'right' : 'left');
  const offset = (1 - phase) * distance;
  const xVw = !slide ? 0 : direction === 'left' ? -offset : direction === 'right' ? offset : 0;
  const yVh = !slide ? 0 : direction === 'up' ? -offset : direction === 'down' ? offset : 0;
  const endpointScale = transition.scale ?? .86;

  return {
    opacity: fade ? phase : 1,
    xVw,
    yVh,
    scale: scale ? endpointScale + phase * (1 - endpointScale) : 1,
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
