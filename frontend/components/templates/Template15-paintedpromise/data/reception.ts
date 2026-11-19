import { effectEase, type CinematicEffect } from '../../_shared/cinematic/direction';
import {
  cinematicTrackPhase, resolveCinematicTrackClip,
  type CinematicSequence, type CinematicSequenceClip, type CinematicSequenceTrack,
} from '../../_shared/cinematic/sequence';
import type { Breakpoint } from '../../_shared/types';

export const RECEPTION_SPRITES = {
  'rsvp-guest-book': { width: 400, height: 360, columns: 4, rows: 3, frames: 12 },
  'wishes-envelope': { width: 448, height: 392, columns: 3, rows: 2, frames: 6 },
} as const;

export function receptionArtworkFrame(kind: keyof typeof RECEPTION_SPRITES, progress: number) {
  const { width, height, columns, rows, frames } = RECEPTION_SPRITES[kind];
  const frame = Math.round(progress * (frames - 1));
  return {
    frame,
    style: {
      aspectRatio: width / height,
      backgroundImage: `url(/templates/painted-promise/assets/reception-sprites/${kind}.webp)`,
      backgroundSize: `${columns * 100}% ${rows * 100}%`,
      backgroundPosition: `${(frame % columns) * 100 / (columns - 1)}% ${Math.floor(frame / columns) * 100 / (rows - 1)}%`,
    },
  };
}

// Set to false to restore the original RSVP and Wishes sequence.
export const PAINTED_PROMISE_RECEPTION = true;

export const RECEPTION_BEATS = {
  'table-rsvp': .77,
  'rsvp-letter': .79,
  'table-wishes': .81,
  'wishes-book': .83,
};

const receptionClips: Record<string, CinematicSequenceClip> = {
  table: { start: .75, enterEnd: .77, exitStart: .87, end: .89 },
  'table-wishes': { start: .75, enterEnd: .77, exitStart: .87, end: .89 },
  rsvp: { start: .775, enterEnd: .79, exitStart: .805, end: .81 },
  'rsvp-availability': { start: .79, enterEnd: .79, exitStart: .805, end: .805 },
  'rsvp-reset-window': { start: 0, enterEnd: 0, exitStart: .775, end: .775 },
  wishes: { start: .815, enterEnd: .83, exitStart: .845, end: .85 },
  'wishes-availability': { start: .83, enterEnd: .83, exitStart: .845, end: .845 },
  'wishes-reset-window': { start: 0, enterEnd: 0, exitStart: .815, end: .815 },
};

export function withReceptionTimeline(sequence: CinematicSequence): CinematicSequence {
  if (!PAINTED_PROMISE_RECEPTION) return sequence;
  return {
    ...sequence,
    beats: sequence.beats.map((beat) => {
      const at = RECEPTION_BEATS[beat.id as keyof typeof RECEPTION_BEATS];
      return at === undefined ? beat : { ...beat, at };
    }),
    tracks: sequence.tracks.map((track) => {
      const clip = receptionClips[track.id];
      if (!clip) return track;
      return {
        ...track, clip,
        exit: ['table', 'table-wishes'].includes(track.id)
          ? { kind: 'fade-slide', direction: 'left', distance: 20, easing: 'ease-in' }
          : track.exit,
      };
    }),
  };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const section = (progress: number, start: number, end: number) =>
  start === end ? Number(progress >= end) : clamp((progress - start) / (end - start));

export function receptionPose(progress: number, clip: CinematicSequenceClip, reduced: boolean) {
  const arrived = progress >= clip.enterEnd && progress <= clip.exitStart;
  if (reduced) return { lift: Number(arrived), open: Number(arrived), arrived };
  const arrival = section(progress, clip.start, clip.enterEnd);
  const departure = section(progress, clip.exitStart, clip.end);
  const lift = Math.min(1 - (1 - clamp(arrival / .8)) ** 2, 1 - clamp((departure - .38) / .62) ** 2);
  const open = Math.min(clamp((arrival - .32) / .68), 1 - clamp(departure / .65));
  return { lift, open, arrived };
}

// Blend authored position offsets with the table-to-display lift when they share its interval.
// Rotation, scale and effects with independent timing still use their own progress.
export function receptionPositionCorrection({ layerId, effects, tracks, clip, breakpoint, progress, lift, editingEffectId }: {
  layerId: string;
  effects: CinematicEffect[];
  tracks: Map<string, CinematicSequenceTrack>;
  clip: CinematicSequenceClip;
  breakpoint: Breakpoint;
  progress: number;
  lift: number;
  editingEffectId?: string;
}) {
  const correction = { x: 0, y: 0, xVw: 0, yVh: 0 };
  for (const base of effects) {
    if (base.id === editingEffectId) continue;
    const effect = breakpoint === 'desktop' ? { ...base, ...base.desktop } : base;
    if (!effect.enabled || effect.kind !== 'transform' || effect.target !== 'layer' || effect.targetId !== layerId) continue;
    const track = tracks.get(effect.trackId);
    if (!track) continue;
    const timing = resolveCinematicTrackClip(track, tracks);
    if (timing.start !== clip.start || timing.end !== clip.end) continue;

    const phaseDelta = lift - effectEase(cinematicTrackPhase(progress, track, tracks), effect.easing);
    correction.x += (effect.to.x - effect.from.x) * phaseDelta;
    correction.y += (effect.to.y - effect.from.y) * phaseDelta;
    correction.xVw += (effect.to.xVw - effect.from.xVw) * phaseDelta;
    correction.yVh += (effect.to.yVh - effect.from.yVh) * phaseDelta;
  }
  return correction;
}
