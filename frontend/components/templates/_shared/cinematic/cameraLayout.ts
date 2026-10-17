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

  // Once directing begins, named beats are the authoritative camera path. The shipped curve still
  // supplies each beat's default framing, but its anonymous interior keyframes must not survive
  // between visible beats: doing so creates motion the editor cannot display or remove (for
  // example a 58.5% edited beat followed by an unseen shipped point at 59%). Preserve only the two
  // story boundaries so the opening and final framing remain compatible.
  const cameraById = new Map(beatCameras.map((camera) => [camera.id, camera]));
  const timeline: CameraKeyframe[] = beats.flatMap((beat) => {
    const camera = cameraById.get(beat.id);
    return camera ? [{
      at: beat.progress,
      x: camera.x,
      y: camera.y,
      scale: camera.scale,
      rotate: camera.rotate,
      transitionIn: beat.transitionIn,
    }] : [];
  });
  const boundary = (at: 0 | 1): CameraKeyframe => {
    const camera = sampleCamera(at, shippedTimeline);
    return {
      at, x: camera.x, y: camera.y, scale: camera.scale, rotate: camera.rotate,
      transitionIn: at === 1 ? shippedTimeline[shippedTimeline.length - 1]?.transitionIn : undefined,
    };
  };
  if (!timeline.some((frame) => frame.at === 0)) timeline.push(boundary(0));
  if (!timeline.some((frame) => frame.at === 1)) timeline.push(boundary(1));
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
