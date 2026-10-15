import type { Breakpoint } from '../types';
import { sampleCamera, type CameraKeyframe, type CameraState } from './useCinematicScroll';

export interface CameraBeat {
  id: string;
  progress: number;
  transitionIn?: CameraKeyframe['transitionIn'];
}

export interface CinematicBeatCamera extends CameraState {
  id: string;
}

type CameraDelta = Partial<CameraState> & { id: string };
interface CameraLayout { frames?: CameraDelta[] }

const FIELDS: (keyof CameraState)[] = ['x', 'y', 'scale', 'rotate'];
const LIMITS: Record<keyof CameraState, readonly [number, number]> = {
  x: [-100, 100], y: [-100, 100], scale: [.3, 4], rotate: [-15, 15],
};

const clamp = (value: number, [min, max]: readonly [number, number]) =>
  Math.min(max, Math.max(min, value));

function safeCameraValue(field: keyof CameraState, value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(value, LIMITS[field])
    : undefined;
}

function normalizeDelta(value: unknown): CameraDelta | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (typeof source.id !== 'string' || !source.id) return null;
  const result: CameraDelta = { id: source.id };
  for (const field of FIELDS) {
    const safe = safeCameraValue(field, source[field]);
    if (safe !== undefined) result[field] = safe;
  }
  return result;
}

export const cinematicCameraKey = (prefix: string, breakpoint: Breakpoint) =>
  `${prefix}.layout.${breakpoint}.cinematic-camera`;

function baseTimeline(base: CameraKeyframe[], breakpoint: Breakpoint): CameraKeyframe[] {
  if (breakpoint === 'mobile') return base;
  return base.map(({ desktop, ...frame }) => ({ ...frame, ...desktop }));
}

export function baseBeatCameras(
  base: CameraKeyframe[],
  beats: CameraBeat[],
  breakpoint: Breakpoint = 'mobile',
): CinematicBeatCamera[] {
  const timeline = baseTimeline(base, breakpoint);
  return beats.map((beat) => ({ id: beat.id, ...sampleCamera(beat.progress, timeline) }));
}

function parse(raw: string | undefined): CameraLayout | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const frames = Array.isArray((value as CameraLayout).frames)
      ? (value as CameraLayout).frames!.flatMap((frame) => {
          const normalized = normalizeDelta(frame);
          return normalized ? [normalized] : [];
        })
      : undefined;
    return frames ? { frames } : null;
  } catch {
    return null;
  }
}

/** Resolves editor-facing beat frames and the render timeline produced by their saved overrides. */
export function resolveCinematicCamera(
  prefix: string,
  base: CameraKeyframe[],
  beats: CameraBeat[],
  breakpoint: Breakpoint,
  config: Record<string, string> | undefined,
): { beatCameras: CinematicBeatCamera[]; timeline: CameraKeyframe[] } {
  const shippedTimeline = baseTimeline(base, breakpoint);
  const defaults = baseBeatCameras(base, beats, breakpoint);
  const saved = parse(config?.[cinematicCameraKey(prefix, breakpoint)]);
  const hasTransitionOverrides = beats.some((beat) =>
    Boolean(beat.transitionIn && beat.transitionIn !== 'ease-out'));
  if (!saved?.frames?.length && !hasTransitionOverrides) {
    return { beatCameras: defaults, timeline: shippedTimeline };
  }

  const savedById = new Map((saved?.frames ?? []).map((frame) => [frame.id, frame]));
  const beatCameras = defaults.map((camera) => {
    const delta = savedById.get(camera.id);
    return delta ? { ...camera, ...delta, id: camera.id } : camera;
  });

  // Keep the original camera curve intact everywhere except beats the director explicitly edits.
  // An edited beat is inserted as a keyframe at that beat's scroll position.
  const timeline = shippedTimeline.map((frame) => ({ ...frame }));
  for (const beat of beats) {
    if (!savedById.has(beat.id)) continue;
    const camera = beatCameras.find((candidate) => candidate.id === beat.id);
    if (!camera) continue;
    const replacement: CameraKeyframe = {
      at: beat.progress, x: camera.x, y: camera.y, scale: camera.scale, rotate: camera.rotate,
      transitionIn: beat.transitionIn,
    };
    const existing = timeline.findIndex((frame) => Math.abs(frame.at - beat.progress) < 0.00001);
    if (existing >= 0) timeline[existing] = replacement;
    else timeline.push(replacement);
  }
  timeline.sort((a, b) => a.at - b.at);

  // A non-default transition is itself an explicit directing decision. Give it a real sampled
  // keyframe even when its camera geometry has not otherwise been edited.
  for (const beat of beats) {
    if (!beat.transitionIn || beat.transitionIn === 'ease-out' || savedById.has(beat.id)) continue;
    const existing = timeline.findIndex((frame) => Math.abs(frame.at - beat.progress) < .00001);
    if (existing >= 0) {
      timeline[existing] = { ...timeline[existing], transitionIn: beat.transitionIn };
      continue;
    }
    const sampled = sampleCamera(beat.progress, shippedTimeline);
    timeline.push({ at: beat.progress, ...sampled, transitionIn: beat.transitionIn });
  }
  timeline.sort((a, b) => a.at - b.at);
  return { beatCameras, timeline };
}

export function serializeCinematicCamera(
  base: CameraKeyframe[],
  beats: CameraBeat[],
  cameras: CinematicBeatCamera[],
  breakpoint: Breakpoint = 'mobile',
): string {
  const defaultsById = new Map(baseBeatCameras(base, beats, breakpoint).map((camera) => [camera.id, camera]));
  const deltas: CameraDelta[] = [];
  for (const camera of cameras) {
    const initial = defaultsById.get(camera.id);
    if (!initial) continue;
    const delta: CameraDelta = { id: camera.id };
    let changed = false;
    for (const field of FIELDS) {
      const safe = safeCameraValue(field, camera[field]) ?? initial[field];
      if (safe !== initial[field]) {
        (delta as Record<string, unknown>)[field] = safe;
        changed = true;
      }
    }
    if (changed) deltas.push(delta);
  }
  return deltas.length ? JSON.stringify({ frames: deltas }) : '';
}
