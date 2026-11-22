import { easeAmount, resolveCinematicLayerTiming, resolveCinematicTrackClip, type CinematicEasing, type CinematicSequenceTrack } from './sequence';
import type { CinematicWorldLayer } from './world';
import { interpolateAssetPerspective, normalizeAssetPerspective, type AssetPerspective } from './assetPerspective';
import { normalizeTextGlitch, type TextGlitch, type TextReveal } from './textEffects';

export interface AssetPose {
  // Offsets in invitation-frame units, relative to the authored layer or its scene anchor.
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity?: number;
  blur?: number;
  frame?: number;
  paper?: number;
  anchor?: AssetAnchor;
  anchorTransform?: AssetAnchorTransform | false;
  anchorBlur?: number;
  textReveal?: TextReveal;
  revealAmount?: number;
  shadowOpacity?: number;
  glitch?: TextGlitch;
  perspective?: AssetPerspective;
  contactShadow?: number;
  shadowSoftness?: number;
}

export type AssetAnchor = 'table' | `layer:${string}` | `point:${string}:${string}`;
export interface CinematicAnchorPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Intrinsic ratio of the image on which this point was authored. */
  aspectRatio: number;
}

export function normalizeCinematicAnchorPoints(value: unknown): CinematicAnchorPoint[] | undefined {
  if (!Array.isArray(value)) return;
  const seen = new Set<string>();
  return value.slice(0, 24).flatMap((point): CinematicAnchorPoint[] => {
    if (!point || typeof point.id !== 'string' || !/^[\w-]{1,80}$/.test(point.id) || seen.has(point.id) ||
      typeof point.label !== 'string' || !point.label.trim() ||
      ![point.x, point.y, point.aspectRatio].every(Number.isFinite) || point.aspectRatio <= 0) return [];
    seen.add(point.id);
    return [{ id: point.id, label: point.label.trim().slice(0, 80), x: clampPoseValue(point.x),
      y: clampPoseValue(point.y), aspectRatio: point.aspectRatio }];
  });
}

export function assetAnchorTarget(anchor?: AssetAnchor) {
  return anchor && anchor !== 'table' ? anchor.split(':')[1] : undefined;
}
export type AssetAnchorOffset = Pick<AssetPose, 'x' | 'y'>;
export type AssetAnchorTransform = Pick<AssetPose, 'scale' | 'rotate'>;
export type AssetAnchorFrame = AssetAnchorOffset & {
  transform?: AssetAnchorTransform;
  aspect?: number;
  pivotY?: number;
  blur?: number;
};
export type AssetAnchorOption = AssetAnchorFrame & { id: AssetAnchor; label: string };
export type ResolveAssetAnchor = (anchor: AssetAnchor) => AssetAnchorFrame | undefined;
type SampledAssetPose = AssetPose & { inheritedBlur?: number };

export function normalizeAssetAnchorTransform(value: unknown): AssetAnchorTransform | undefined {
  if (!value || typeof value !== 'object') return;
  const { scale, rotate } = value as AssetAnchorTransform;
  if (Number.isFinite(scale) && scale >= 1e-6 && scale <= 1e6 && Number.isFinite(rotate)) return { scale, rotate };
}

export function normalizeAssetAnchor(value: unknown): AssetAnchor | undefined {
  return value === 'table' || (typeof value === 'string' && /^(?:layer:[\w-]{1,120}|point:[\w-]{1,120}:[\w-]{1,80})$/.test(value))
    ? value as AssetAnchor : undefined;
}

export type AssetPoseAppearance = Pick<AssetPose, 'opacity' | 'blur' | 'shadowOpacity'>;

export interface AssetKeyframe {
  id: string;
  at: number;
  pose: AssetPose;
  easing: CinematicEasing | 'hold';
}

export interface AssetPoseEdit {
  layerId: string;
  session: string;
  pending?: AssetPose;
}

export const neutralAssetPose: AssetPose = { x: 0, y: 0, scale: 1, rotate: 0 };
export const clampPoseValue = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const clipTicks = 10_000;
const keyframeTick = (at: number) => Math.round(clampPoseValue(at) * clipTicks);
export const keyframeTime = (at: number) => keyframeTick(at) / clipTicks;
export const MAX_ASSET_KEYFRAMES = 250;

export function openAssetKeyframeTime(points: AssetKeyframe[], at: number, direction: 1 | -1) {
  const occupied = new Set(points.map((point) => keyframeTick(point.at)));
  const target = keyframeTick(at);
  let tick = target;
  while (occupied.has(tick)) tick += direction;
  if (tick < 0 || tick > clipTicks) {
    tick = target;
    while (occupied.has(tick)) tick -= direction;
  }
  return tick / clipTicks;
}

/** Keep both poses when a moved keyframe lands on an occupied tick. */
export function moveAssetKeyframe(points: AssetKeyframe[], id: string, at: number) {
  const point = points.find((item) => item.id === id);
  if (!point || !Number.isFinite(at)) return;
  const nextAt = openAssetKeyframeTime(points.filter((item) => item !== point), at, at < point.at ? -1 : 1);
  return {
    at: nextAt,
    points: nextAt === point.at ? points : points.map((item) => item === point ? { ...point, at: nextAt } : item)
      .sort((a, b) => a.at - b.at),
  };
}

export function normalizeAssetPose(value: unknown): AssetPose | undefined {
  if (!value || typeof value !== 'object') return;
  const { x, y, scale, rotate, opacity, blur, frame, paper, anchor, anchorTransform, anchorBlur,
    textReveal, revealAmount, shadowOpacity, glitch, contactShadow, shadowSoftness } = value as AssetPose;
  if (![x, y, scale, rotate].every(Number.isFinite)) return;
  const burst = normalizeTextGlitch(glitch);
  const perspective = normalizeAssetPerspective((value as AssetPose).perspective);
  const referencedAnchor = normalizeAssetAnchor(anchor);
  const reference = anchorTransform === false ? false : normalizeAssetAnchorTransform(anchorTransform);
  return {
    x: clampPoseValue(x, -500, 500), y: clampPoseValue(y, -500, 500),
    scale: clampPoseValue(scale, .05, 10), rotate: clampPoseValue(rotate, -3600, 3600),
    ...(Number.isFinite(opacity) ? { opacity: clampPoseValue(opacity!) } : {}),
    ...(Number.isFinite(blur) ? { blur: clampPoseValue(blur!, 0, 40) } : {}),
    ...(Number.isFinite(frame) ? { frame: clampPoseValue(frame!) } : {}),
    ...(Number.isFinite(paper) ? { paper: clampPoseValue(paper!) } : {}),
    ...(textReveal === 'letters' || textReveal === 'words' ? { textReveal } : {}),
    ...(Number.isFinite(revealAmount) ? { revealAmount: clampPoseValue(revealAmount!) } : {}),
    ...(Number.isFinite(shadowOpacity) ? { shadowOpacity: clampPoseValue(shadowOpacity!) } : {}),
    ...(burst ? { glitch: burst } : {}),
    ...(perspective ? { perspective } : {}),
    ...(Number.isFinite(contactShadow) ? { contactShadow: clampPoseValue(contactShadow!) } : {}),
    ...(Number.isFinite(shadowSoftness) ? { shadowSoftness: clampPoseValue(shadowSoftness!, 0, 16) } : {}),
    ...(referencedAnchor ? { anchor: referencedAnchor } : {}),
    ...(referencedAnchor && reference !== undefined ? { anchorTransform: reference } : {}),
    ...(referencedAnchor && Number.isFinite(anchorBlur) ? { anchorBlur: clampPoseValue(anchorBlur!) } : {}),
  };
}

export function normalizeAssetKeyframes(value: unknown): AssetKeyframe[] | undefined {
  if (!Array.isArray(value)) return;
  const ids = new Set<string>();
  const times = new Set<number>();
  const frames: AssetKeyframe[] = [];
  for (const item of value.slice(0, MAX_ASSET_KEYFRAMES)) {
    if (!item || typeof item.id !== 'string' || !/^[\w-]{1,80}$/.test(item.id) || ids.has(item.id) || !Number.isFinite(item.at)) continue;
    const pose = normalizeAssetPose(item.pose);
    const at = keyframeTime(item.at);
    if (!pose || times.has(at)) continue;
    ids.add(item.id);
    times.add(at);
    const easing = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'hold'].includes(item.easing) ? item.easing : 'linear';
    frames.push({ id: item.id, at, pose, easing });
  }
  return frames.sort((a, b) => a.at - b.at);
}

export function assetPoseClip(layer: CinematicWorldLayer, tracks: CinematicSequenceTrack[], layers: CinematicWorldLayer[]) {
  const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
  const track = timing.exact ?? timing.inherited;
  return track ? resolveCinematicTrackClip(track, tracks) : { start: 0, enterEnd: 0, exitStart: 1, end: 1 };
}

export function assetClipPosition(progress: number, clip: { start: number; end: number }) {
  return clip.end > clip.start ? clampPoseValue((progress - clip.start) / (clip.end - clip.start)) : Number(progress >= clip.end);
}

function anchorDelta(reference: AssetPose['anchorTransform'], origin?: AssetAnchorFrame): AssetAnchorTransform {
  if (!reference || !origin?.transform) return { scale: 1, rotate: 0 };
  return { scale: origin.transform.scale / reference.scale, rotate: origin.transform.rotate - reference.rotate };
}

function applyAnchorTransform({ x, y }: AssetAnchorOffset, { scale, rotate }: AssetAnchorTransform, aspect: number) {
  const radians = rotate * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  return { x: scale * (x * cos - y * sin / aspect), y: scale * (x * aspect * sin + y * cos) };
}

export function assetAnchorLocalDelta(pose: AssetPose, delta: AssetAnchorOffset, origin?: AssetAnchorFrame) {
  const { scale, rotate } = anchorDelta(pose.anchorTransform, origin);
  return applyAnchorTransform(delta, { scale: 1 / scale, rotate: -rotate }, origin?.aspect ?? 1);
}

export function resolveAssetPose(pose: SampledAssetPose, resolveAnchor?: ResolveAssetAnchor): SampledAssetPose {
  const { anchor, anchorTransform, anchorBlur, ...local } = pose;
  const origin = anchor && resolveAnchor?.(anchor);
  if (!origin) return anchorBlur === undefined ? local : { ...local, inheritedBlur: 0 };
  const delta = anchorDelta(anchorTransform, origin);
  const pivotY = origin.pivotY ?? 0;
  const offset = applyAnchorTransform({ x: pose.x, y: pose.y - pivotY }, delta, origin.aspect ?? 1);
  return { ...local, x: offset.x + origin.x, y: offset.y + origin.y + pivotY,
    scale: pose.scale * delta.scale, rotate: pose.rotate + delta.rotate,
    ...(anchorBlur === undefined ? {} : { inheritedBlur: (origin.blur ?? 0) * anchorBlur }),
  };
}

/** Keep the visible pose fixed when changing anchor or reference at the playhead. */
export function rebaseAssetAnchor(pose: AssetPose, previous: AssetAnchorFrame | undefined, next: AssetAnchorFrame | undefined,
  anchor: AssetAnchor | undefined, reference: AssetPose['anchorTransform']): AssetPose {
  const display = resolveAssetPose(pose, () => previous);
  const rebased = { ...pose, anchor, anchorTransform: reference, anchorBlur: anchor ? pose.anchorBlur : undefined };
  const delta = anchorDelta(reference, next);
  const pivotY = next?.pivotY ?? 0;
  const offset = assetAnchorLocalDelta(rebased, { x: display.x - (next?.x ?? 0), y: display.y - (next?.y ?? 0) - pivotY }, next);
  return { ...rebased, x: offset.x, y: offset.y + pivotY, scale: display.scale / delta.scale, rotate: display.rotate - delta.rotate };
}

export function sampleAssetKeyframes(frames: AssetKeyframe[] | undefined, at: number, resolveAnchor?: ResolveAssetAnchor, appearance?: AssetPoseAppearance): SampledAssetPose | undefined {
  if (!frames?.length) return;
  const nextIndex = frames.findIndex((point) => point.at > at + 1e-8);
  const from = nextIndex < 0 ? frames.at(-1)! : frames[Math.max(0, nextIndex - 1)];
  if (Math.abs(at - from.at) <= 1e-8) return from.pose;
  if (nextIndex <= 0 || from.easing === 'hold') {
    if (!from.pose.glitch) return from.pose;
    const held = { ...from.pose };
    delete held.glitch;
    return held;
  }
  const to = frames[nextIndex];
  const t = easeAmount((at - from.at) / (to.at - from.at), from.easing);
  // Interpolate in the common frame when the anchor changes, staying anchor-relative otherwise.
  const anchor = from.pose.anchor;
  const sameAnchor = anchor === to.pose.anchor;
  const fromReference = from.pose.anchorTransform, toReference = to.pose.anchorTransform;
  const reference = fromReference && toReference ? fromReference
    : fromReference !== undefined || toReference !== undefined ? false : undefined;
  const origin = sameAnchor && anchor && (fromReference || toReference) ? resolveAnchor?.(anchor) : undefined;
  const inSampleSpace = (pose: AssetPose): SampledAssetPose => {
    if (!sameAnchor) return resolveAssetPose(pose, resolveAnchor);
    return origin && pose.anchorTransform !== reference ? rebaseAssetAnchor(pose, origin, origin, anchor, reference) : pose;
  };
  const a = inSampleSpace(from.pose), b = inSampleSpace(to.pose);
  const mix = (x: number, y: number) => x + (y - x) * t;
  const optional = (x?: number, y?: number) => x === undefined || y === undefined ? x ?? y : mix(x, y);
  return {
    x: mix(a.x, b.x), y: mix(a.y, b.y), scale: mix(a.scale, b.scale), rotate: mix(a.rotate, b.rotate),
    opacity: a.opacity === undefined && b.opacity === undefined ? undefined : mix(a.opacity ?? appearance?.opacity ?? 1, b.opacity ?? appearance?.opacity ?? 1),
    blur: a.blur === undefined && b.blur === undefined ? undefined : mix(a.blur ?? appearance?.blur ?? 0, b.blur ?? appearance?.blur ?? 0),
    frame: optional(a.frame, b.frame), paper: optional(a.paper, b.paper),
    textReveal: a.textReveal ?? b.textReveal,
    revealAmount: a.revealAmount === undefined && b.revealAmount === undefined ? undefined : mix(a.revealAmount ?? 1, b.revealAmount ?? 1),
    shadowOpacity: a.shadowOpacity === undefined && b.shadowOpacity === undefined ? undefined
      : mix(a.shadowOpacity ?? appearance?.shadowOpacity ?? 0, b.shadowOpacity ?? appearance?.shadowOpacity ?? 0),
    perspective: interpolateAssetPerspective(a.perspective, b.perspective, t),
    contactShadow: a.contactShadow === undefined && b.contactShadow === undefined ? undefined : mix(a.contactShadow ?? 0, b.contactShadow ?? 0),
    shadowSoftness: a.shadowSoftness === undefined && b.shadowSoftness === undefined ? undefined : mix(a.shadowSoftness ?? 4, b.shadowSoftness ?? 4),
    anchor: sameAnchor ? anchor : undefined,
    anchorTransform: sameAnchor ? reference : undefined,
    anchorBlur: sameAnchor && (a.anchorBlur !== undefined || b.anchorBlur !== undefined)
      ? mix(a.anchorBlur ?? 0, b.anchorBlur ?? 0) : undefined,
    inheritedBlur: !sameAnchor && (a.inheritedBlur !== undefined || b.inheritedBlur !== undefined)
      ? mix(a.inheritedBlur ?? 0, b.inheritedBlur ?? 0) : undefined,
  };
}

export function assetPoseBlur(pose: SampledAssetPose | undefined, ownBlur?: number) {
  const own = pose?.blur ?? ownBlur;
  return pose?.inheritedBlur ? Math.hypot(own ?? 0, pose.inheritedBlur) : own;
}

/** A glitch is a one-shot event whose duration is measured on the clip ruler. */
export function sampleTextGlitch(frames: AssetKeyframe[] | undefined, at: number, pending?: AssetPose) {
  const point = frames?.findLast((item) => item.at <= at + 1e-8 && item.pose.glitch);
  const glitch = pending?.glitch ?? point?.pose.glitch;
  if (!glitch?.intensity) return;
  const phase = pending?.glitch ? 0 : Math.max(0, at - (point?.at ?? at)) / glitch.duration;
  if (phase >= 1) return;
  return { glitch: { ...glitch, intensity: glitch.intensity * (1 - phase) }, phase };
}

export function supportsAssetKeyframes(layer: CinematicWorldLayer) {
  return Boolean(layer.parentId) || (layer.kind === undefined || layer.kind === 'img' || layer.kind === 'shape' || layer.kind === 'text' ||
    layer.behavior === 'programme-board' ||
    (layer.id === 'rsvp-letter' && layer.behavior === 'rsvp-envelope') ||
    (layer.id === 'wishes-book' && layer.behavior === 'guest-book'));
}
