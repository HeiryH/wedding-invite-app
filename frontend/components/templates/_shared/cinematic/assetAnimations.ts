import type { CinematicWorldLayer } from './world';
import { easeAmount, resolveCinematicLayerTiming, resolveCinematicTrackClip, type CinematicEasing, type CinematicSequenceClip, type CinematicSequenceTrack } from './sequence';

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
export const assetAnimationTrackId = (layerId: string, id: string) => `asset-motion:${layerId}:${id}`;
export function compileAssetAnimationTracks(layers: CinematicWorldLayer[], tracks: CinematicSequenceTrack[]): CinematicSequenceTrack[] {
  return layers.flatMap((layer) => {
    const window = assetAnimationWindow(layer, tracks, layers);
    if (window.span <= 0 || layer.hidden) return [];
    return normalizeAssetAnimations(layer.animations).filter((animation) => animation.enabled).map((animation) => {
      const start = window.start + animation.start * window.span, end = window.start + animation.end * window.span;
      return { id: assetAnimationTrackId(layer.id, animation.id), label: `${layer.label} · ${animation.label}`, kind: 'effect' as const,
        target: { type: 'effect' as const, id: animation.id }, assetAnimation: { layerId: layer.id, animationId: animation.id, label: animation.label,
          sourceTrackId: window.trackId, startLimit: window.start, endLimit: window.end },
        clip: { start, enterEnd: end, exitStart: end, end }, timing: { mode: 'independent' as const },
        enter: { kind: 'cut' as const, easing: animation.easing }, exit: { kind: 'cut' as const, easing: 'linear' as const }, ownership: { kind: 'shared' as const } };
    });
  });
}
export function retimeAssetAnimation(layer: CinematicWorldLayer, id: string, clip: CinematicSequenceClip, tracks: CinematicSequenceTrack[], layers?: CinematicWorldLayer[]): CinematicWorldLayer {
  const window = assetAnimationWindow(layer, tracks, layers);
  if (window.span <= 0) return layer;
  const start = clamp((clip.start - window.start) / window.span), end = Math.max(start, clamp((clip.end - window.start) / window.span));
  return { ...layer, animations: normalizeAssetAnimations(layer.animations).map((animation) => animation.id === id ? { ...animation, start, end } : animation) };
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
