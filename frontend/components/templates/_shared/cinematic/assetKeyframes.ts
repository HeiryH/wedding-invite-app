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
export type AssetAnchorOption = AssetAnchorOffset & { id: AssetAnchor; label: string };
export type ResolveAssetAnchor = (anchor: AssetAnchor) => AssetAnchorOffset | undefined;

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
  const { x, y, scale, rotate, opacity, blur, frame, paper, anchor, textReveal, revealAmount, shadowOpacity, glitch, contactShadow, shadowSoftness } = value as AssetPose;
  if (![x, y, scale, rotate].every(Number.isFinite)) return;
  const burst = normalizeTextGlitch(glitch);
  const perspective = normalizeAssetPerspective((value as AssetPose).perspective);
  const referencedAnchor = normalizeAssetAnchor(anchor);
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

export function resolveAssetPose(pose: AssetPose, resolveAnchor?: ResolveAssetAnchor): AssetPose {
  const { anchor, ...local } = pose;
  const origin = anchor && resolveAnchor?.(anchor);
  return origin ? { ...local, x: local.x + origin.x, y: local.y + origin.y } : local;
}

export function sampleAssetKeyframes(frames: AssetKeyframe[] | undefined, at: number, resolveAnchor?: ResolveAssetAnchor, appearance?: AssetPoseAppearance): AssetPose | undefined {
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
  const sameAnchor = from.pose.anchor === to.pose.anchor;
  const a = sameAnchor ? from.pose : resolveAssetPose(from.pose, resolveAnchor);
  const b = sameAnchor ? to.pose : resolveAssetPose(to.pose, resolveAnchor);
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
    anchor: sameAnchor ? a.anchor : undefined,
  };
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
    (layer.id === 'rsvp-letter' && layer.behavior === 'rsvp-envelope') ||
    (layer.id === 'wishes-book' && layer.behavior === 'guest-book'));
}
