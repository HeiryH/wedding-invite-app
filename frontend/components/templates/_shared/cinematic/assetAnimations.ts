import type { CinematicEffect, CinematicMotion } from './direction';
import { assetClipPosition, assetPoseClip, keyframeTime, normalizeAssetPose, sampleAssetKeyframes, type AssetKeyframe } from './assetKeyframes';
import type { CinematicWorldLayer } from './world';
import { easeAmount, resolveCinematicLayerTiming, resolveCinematicTrackClip, type CinematicEasing, type CinematicSequenceTrack } from './sequence';

export interface CinematicAssetAnimation {
  id: string; label: string; enabled: boolean;
  /** Fractions of the asset's fully-visible interval, not global story coordinates. */
  start: number; end: number; easing: CinematicEasing;
  /** Destination relative to the asset's authored position. X/Y are screen percentages. */
  x: number; y: number; scale: number; rotate: number;
}
export const NEUTRAL_ASSET_MOTION = { x: 0, y: 0, scale: 1, rotate: 0 };
export type AssetMotion = typeof NEUTRAL_ASSET_MOTION;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const numeric = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
export function normalizeAssetAnimations(value: unknown): CinematicAssetAnimation[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.slice(0, 50).flatMap((raw) => {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !/^[\w-]{1,80}$/.test(raw.id) || ids.has(raw.id)) return [];
    ids.add(raw.id);
    const start = numeric(raw.start, 0, 0, 1);
    return [{ id: raw.id, label: typeof raw.label === 'string' ? raw.label.slice(0, 120) : 'Move', enabled: raw.enabled !== false,
      start, end: Math.max(start, numeric(raw.end, 1, 0, 1)),
      easing: ['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(raw.easing) ? raw.easing as CinematicEasing : 'ease-in-out',
      x: numeric(raw.x, 0, -200, 200), y: numeric(raw.y, 0, -200, 200), scale: numeric(raw.scale, 1, .05, 10), rotate: numeric(raw.rotate, 0, -360, 360) }];
  });
}
export function assetAnimationWindow(layer: CinematicWorldLayer, tracks: CinematicSequenceTrack[], layers?: CinematicWorldLayer[]) {
  const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
  const track = timing.exact ?? timing.inherited;
  const clip = track ? resolveCinematicTrackClip(track, tracks) : { start: 0, enterEnd: 0, exitStart: 1, end: 1 };
  return { start: clip.enterEnd, end: clip.exitStart, span: Math.max(0, clip.exitStart - clip.enterEnd), trackId: track?.id };
}
/** Stateless sampling is reversible. Each move starts from the preceding move's sampled position,
 * so gaps hold the last destination and overlapping moves redirect smoothly without a snap. */
export function sampleAssetAnimations(layer: CinematicWorldLayer, tracks: CinematicSequenceTrack[], progress: number, layers?: CinematicWorldLayer[]): AssetMotion {
  const window = assetAnimationWindow(layer, tracks, layers);
  if (!window.span) return { ...NEUTRAL_ASSET_MOTION };
  const position = (progress - window.start) / window.span;
  let segment: { from: AssetMotion; to: AssetMotion; start: number; end: number; easing: CinematicEasing } | undefined;
  const sample = (at: number): AssetMotion => {
    if (!segment) return { ...NEUTRAL_ASSET_MOTION };
    const phase = segment.end <= segment.start ? 1 : easeAmount((at - segment.start) / (segment.end - segment.start), segment.easing);
    return { x: segment.from.x + (segment.to.x - segment.from.x) * phase,
      y: segment.from.y + (segment.to.y - segment.from.y) * phase,
      scale: segment.from.scale + (segment.to.scale - segment.from.scale) * phase,
      rotate: segment.from.rotate + (segment.to.rotate - segment.from.rotate) * phase };
  };
  for (const animation of normalizeAssetAnimations(layer.animations).filter((item) => item.enabled).sort((a, b) => a.start - b.start)) {
    if (position < animation.start) break;
    const from = sample(animation.start);
    segment = { ...animation, from, to: { x: animation.x, y: animation.y, scale: animation.scale, rotate: animation.rotate } };
  }
  return sample(position);
}

/** Convert only moves whose sampled motion can be reproduced by one pose lane. */
export function convertAssetAnimations(
  layer: CinematicWorldLayer, tracks: CinematicSequenceTrack[], layers: CinematicWorldLayer[],
): AssetKeyframe[] | undefined {
  if (layer.keyframes?.length || layer.behavior === 'rsvp-envelope' || layer.behavior === 'guest-book') return;
  const moves = normalizeAssetAnimations(layer.animations).filter((move) => move.enabled).sort((a, b) => a.start - b.start);
  if (!moves.length || moves.some((move, index) => move.end <= move.start || (index > 0 && move.start < moves[index - 1].end))) return;
  const clip = assetPoseClip(layer, tracks, layers);
  const window = assetAnimationWindow(layer, tracks, layers);
  if (!window.span || clip.end <= clip.start) return;
  const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
  const track = timing.exact ?? timing.inherited;
  if (layer.behavior !== 'programme-board' && [track?.enter.kind, track?.exit.kind].some((kind) => kind && kind !== 'cut' && kind !== 'fade')) return;
  const story = (local: number) => window.start + local * window.span;
  const points: AssetKeyframe[] = [];
  for (const move of moves) {
    const start = keyframeTime(assetClipPosition(story(move.start), clip));
    const end = keyframeTime(assetClipPosition(story(move.end), clip));
    const last = points.at(-1);
    if (start === end || (last && start < last.at)) return;
    if (last?.at === start) last.easing = move.easing;
    else points.push({ id: `start-${points.length}`, at: start, pose: last?.pose ?? NEUTRAL_ASSET_MOTION, easing: move.easing });
    const { x, y, scale, rotate } = move;
    points.push({ id: `end-${points.length}`, at: end, pose: { x, y, scale, rotate }, easing: 'linear' });
  }
  // Quantization can noticeably change short or fast moves. Keep those on the legacy sampler.
  for (const move of moves) {
    for (let step = 0; step <= 8; step++) {
      const progress = story(move.start + (move.end - move.start) * step / 8);
      const legacy = sampleAssetAnimations(layer, tracks, progress, layers);
      const converted = sampleAssetKeyframes(points, assetClipPosition(progress, clip))!;
      if (Math.abs(legacy.x - converted.x) > .05 || Math.abs(legacy.y - converted.y) > .05 ||
          Math.abs(legacy.scale - converted.scale) > .005 || Math.abs(legacy.rotate - converted.rotate) > .1) return;
    }
  }
  return points;
}

/** Transfer a single clip-aligned effect whose endpoints are already expressed in frame units. */
export function convertAssetEffect(
  layer: CinematicWorldLayer, tracks: CinematicSequenceTrack[], layers: CinematicWorldLayer[], effect: CinematicEffect,
): AssetKeyframe[] | undefined {
  const group = effect.target === 'group';
  const hasMovement = layer.animations?.some((move) => move.enabled &&
    (!group || move.x || move.y || move.scale !== 1 || move.rotate));
  if (layer.keyframes?.length || hasMovement || layer.behavior === 'rsvp-envelope' ||
      layer.behavior === 'guest-book' || effect.kind === 'drift' ||
      (!group && (effect.from.x || effect.from.y || effect.to.x || effect.to.y))) return;
  const effectTrack = tracks.find((track) => track.id === effect.trackId);
  if (!effectTrack) return;
  const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
  const appearance = timing.exact ?? timing.inherited;
  if (!group && [appearance?.enter.kind, appearance?.exit.kind].some((kind) => kind && kind !== 'cut' && kind !== 'fade')) return;
  const clip = assetPoseClip(layer, tracks, layers);
  const motion = resolveCinematicTrackClip(effectTrack, tracks);
  if (motion.start !== clip.start || motion.end !== clip.end) return;
  const finish = assetClipPosition(motion.enterEnd, clip);
  const at = keyframeTime(finish);
  if (at <= 0 || (!group && Math.abs(at - finish) > 1e-8)) return;
  const pose = ({ x, y, xVw, yVh, scale, rotate, opacity, blur }: CinematicMotion) =>
    ({ x: xVw + (group ? x : 0), y: yVh + (group ? y : 0), scale, rotate, opacity, blur });
  const from = pose(effect.from), to = pose(effect.to);
  if (group) {
    // Reject effects whose frame offsets exceed the pose range, or whose short interval
    // would visibly change when rounded to the keyframe ruler's precision.
    const phaseError = 3 * Math.abs(at - finish) / Math.min(finish, at);
    if ([from, to].some((point) => {
      const normalized = normalizeAssetPose(point);
      return normalized?.x !== point.x || normalized.y !== point.y;
    }) ||
      Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), Math.abs(to.rotate - from.rotate)) * phaseError > .05 ||
      Math.max(Math.abs(to.scale - from.scale), Math.abs(to.opacity - from.opacity), Math.abs(to.blur - from.blur)) * phaseError > .005) return;
  }
  return [
    { id: 'effect-from', at: 0, easing: effect.easing, pose: from },
    { id: 'effect-to', at, easing: 'hold', pose: to },
  ];
}
