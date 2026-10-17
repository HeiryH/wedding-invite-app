import type { Breakpoint } from '../types';
import { resolveCinematicProjectConfig, writeCinematicProject } from './project';
import { cinematicTrackPhase, resolveCinematicTrackClip, type CinematicEasing, type CinematicSequenceTrack, type CinematicSequenceBeat } from './sequence';

export interface CinematicMotion {
  x: number; y: number; xVw: number; yVh: number; scale: number; rotate: number; opacity: number; blur: number;
}
export interface CinematicEffect {
  id: string; label: string; enabled: boolean; trackId: string; target: 'layer' | 'world'; targetId: string;
  kind: 'transform' | 'drift' | 'blur'; easing: CinematicEasing;
  from: CinematicMotion; to: CinematicMotion; amplitudeX: number; amplitudeY: number; frequency: number;
  desktop?: Partial<Omit<CinematicEffect, 'desktop'>>;
}
export interface CinematicInteraction {
  id: string; label: string; enabled: boolean; triggerLayerId: string;
  action: 'rsvp' | 'wish' | 'info' | 'focus' | 'navigate' | 'return';
  availabilityTrackId: string; resetTrackId: string; targetBeatId: string;
  returnMode: 'scene' | 'previous' | 'stay'; returnSetIds: string[]; revealSetIds: string[];
  lockScroll: boolean; openMs: number; closeMs: number; infoTitle: string; infoBody: string;
}
export interface CinematicAnchor {
  id: string; label: string; target: 'beat' | 'track-start' | 'track-enter' | 'track-end'; targetId: string;
}
export interface CinematicPacing {
  mobileVh: number; desktopVh: number;
  beats: Record<string, { mobileVh?: number; desktopVh?: number; holdVh?: number }>;
}
export interface CinematicMemoryLayout {
  frames: number; maxPhotos: number; columns: number; gap: number; tilt: number;
  frameColor: string; borderWidth: number; placeholder: string; captionX: number; captionY: number; captionWidth: number;
}
export interface CinematicTheme {
  ink: string; secondaryInk: string; accent: string; panel: string; border: string; page: string;
  shadow: number; radius: number; displayFont: string; bodyFont: string; titleSize: number; bodySize: number;
  memory: CinematicMemoryLayout;
}
export interface CinematicDirection {
  effects: CinematicEffect[];
  interactions: CinematicInteraction[];
  pacing: CinematicPacing;
  navigation: CinematicAnchor[];
  theme: CinematicTheme;
}

export const MOTION_DEFAULT: CinematicMotion = { x: 0, y: 0, xVw: 0, yVh: 0, scale: 1, rotate: 0, opacity: 1, blur: 0 };
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value.slice(0, 8000) : fallback;
const ids = (value: unknown) => Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(0, 100) : [];
const choose = <T extends string>(value: unknown, options: readonly T[], fallback: T): T => options.includes(value as T) ? value as T : fallback;

export function normalizeMotion(value: unknown): CinematicMotion {
  const source = object(value) ? value : {};
  return Object.fromEntries(Object.entries(MOTION_DEFAULT).map(([key, fallback]) => [key,
    number(source[key], fallback, key === 'scale' ? .05 : key === 'opacity' || key === 'blur' ? 0 : -500,
      key === 'opacity' ? 1 : key === 'blur' ? 40 : key === 'scale' ? 10 : 500),
  ])) as unknown as CinematicMotion;
}

export function normalizeEffect(value: unknown): CinematicEffect | undefined {
  if (!object(value) || !text(value.id)) return undefined;
  const result: CinematicEffect = {
    id: text(value.id), label: text(value.label, 'Effect'), enabled: value.enabled !== false,
    trackId: text(value.trackId), target: choose(value.target, ['layer', 'world'], 'layer'), targetId: text(value.targetId),
    kind: choose(value.kind, ['transform', 'drift', 'blur'], 'transform'),
    easing: choose(value.easing, ['linear', 'ease-in', 'ease-out', 'ease-in-out'], 'linear'),
    from: normalizeMotion(value.from), to: normalizeMotion(value.to),
    amplitudeX: number(value.amplitudeX, 0, -100, 100), amplitudeY: number(value.amplitudeY, 0, -100, 100),
    frequency: number(value.frequency, 1, 0, 20),
  };
  if (object(value.desktop)) {
    const desktop = normalizeEffect({ ...result, ...value.desktop, desktop: undefined });
    if (desktop) result.desktop = desktop;
  }
  return result;
}

export function normalizeInteraction(value: unknown): CinematicInteraction | undefined {
  if (!object(value) || !text(value.id)) return undefined;
  return {
    id: text(value.id), label: text(value.label, 'Interaction'), enabled: value.enabled !== false,
    triggerLayerId: text(value.triggerLayerId), action: choose(value.action, ['rsvp', 'wish', 'info', 'focus', 'navigate', 'return'], 'info'),
    availabilityTrackId: text(value.availabilityTrackId), resetTrackId: text(value.resetTrackId), targetBeatId: text(value.targetBeatId),
    returnMode: choose(value.returnMode, ['scene', 'previous', 'stay'], 'scene'),
    returnSetIds: ids(value.returnSetIds), revealSetIds: ids(value.revealSetIds), lockScroll: value.lockScroll !== false,
    openMs: number(value.openMs, 550, 0, 5000), closeMs: number(value.closeMs, 620, 0, 5000),
    infoTitle: text(value.infoTitle, 'Information'), infoBody: text(value.infoBody),
  };
}

/** Section overrides are whole values, including empty arrays, so deleting the last record persists. */
export function resolveCinematicDirection(prefix: string, defaults: CinematicDirection, config?: Record<string, string>): CinematicDirection {
  const { project } = resolveCinematicProjectConfig(prefix, config);
  const effectSource = Array.isArray(project.effects.items) ? project.effects.items : defaults.effects;
  const interactionSource = Array.isArray(project.interactions.items) ? project.interactions.items : defaults.interactions;
  const pacing = project.pacing;
  const theme = project.theme;
  const memory = object(theme.memory) ? theme.memory : defaults.theme.memory;
  const anchors = Array.isArray(project.navigation.items) ? project.navigation.items : defaults.navigation;
  const beatPacing: CinematicPacing['beats'] = {};
  if (object(pacing.beats)) for (const [id, value] of Object.entries(pacing.beats)) {
    if (!object(value)) continue;
    beatPacing[id] = {
      ...(value.mobileVh !== undefined ? { mobileVh: number(value.mobileVh, 100, 1, 3000) } : {}),
      ...(value.desktopVh !== undefined ? { desktopVh: number(value.desktopVh, 100, 1, 3000) } : {}),
      holdVh: number(value.holdVh, 0, 0, 3000),
    };
  }
  const color = (value: unknown, fallback: string) => typeof value === 'string' && /^#[\da-f]{3,8}$/i.test(value) ? value : fallback;
  return {
    effects: effectSource.flatMap((value) => { const effect = normalizeEffect(value); return effect ? [effect] : []; }),
    interactions: interactionSource.flatMap((value) => { const interaction = normalizeInteraction(value); return interaction ? [interaction] : []; }),
    pacing: { mobileVh: number(pacing.mobileVh, defaults.pacing.mobileVh, 300, 30000), desktopVh: number(pacing.desktopVh, defaults.pacing.desktopVh, 300, 30000), beats: beatPacing },
    navigation: anchors.flatMap((value) => object(value) && /^[a-zA-Z][\w-]{0,79}$/.test(text(value.id)) ? [{
      id: text(value.id), label: text(value.label, text(value.id)),
      target: choose(value.target, ['beat', 'track-start', 'track-enter', 'track-end'], 'beat'), targetId: text(value.targetId),
    }] : []),
    theme: {
      ...defaults.theme,
      ink: color(theme.ink, defaults.theme.ink), secondaryInk: color(theme.secondaryInk, defaults.theme.secondaryInk),
      accent: color(theme.accent, defaults.theme.accent), panel: color(theme.panel, defaults.theme.panel),
      border: color(theme.border, defaults.theme.border), page: color(theme.page, defaults.theme.page),
      shadow: number(theme.shadow, defaults.theme.shadow, 0, 1), radius: number(theme.radius, defaults.theme.radius, 0, 100),
      displayFont: text(theme.displayFont, defaults.theme.displayFont), bodyFont: text(theme.bodyFont, defaults.theme.bodyFont),
      titleSize: number(theme.titleSize, defaults.theme.titleSize, 1, 20), bodySize: number(theme.bodySize, defaults.theme.bodySize, .5, 8),
      memory: {
        frames: Math.round(number(memory.frames, defaults.theme.memory.frames, 1, 24)), maxPhotos: Math.round(number(memory.maxPhotos, defaults.theme.memory.maxPhotos, 1, 100)),
        columns: Math.round(number(memory.columns, defaults.theme.memory.columns, 1, 6)), gap: number(memory.gap, defaults.theme.memory.gap, 0, 25),
        tilt: number(memory.tilt, defaults.theme.memory.tilt, -30, 30), frameColor: color(memory.frameColor, defaults.theme.memory.frameColor),
        borderWidth: number(memory.borderWidth, defaults.theme.memory.borderWidth, 0, 30), placeholder: text(memory.placeholder, defaults.theme.memory.placeholder),
        captionX: number(memory.captionX, defaults.theme.memory.captionX, 0, 100), captionY: number(memory.captionY, defaults.theme.memory.captionY, 0, 100),
        captionWidth: number(memory.captionWidth, defaults.theme.memory.captionWidth, 10, 100),
      },
    },
  };
}

export function saveCinematicDirection(prefix: string, config: Record<string, string>, direction: CinematicDirection): Record<string, string> {
  const { project } = resolveCinematicProjectConfig(prefix, config);
  return writeCinematicProject(prefix, config, { ...project,
    effects: { items: direction.effects }, interactions: { items: direction.interactions }, pacing: { ...direction.pacing },
    navigation: { items: direction.navigation }, theme: { ...direction.theme },
  });
}

export const effectEase = (value: number, easing: CinematicEasing) => easing === 'ease-in' ? value ** 3
  : easing === 'ease-out' ? 1 - (1 - value) ** 3 : easing === 'ease-in-out'
    ? value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2 : value;

export function sampleCinematicEffects(effects: CinematicEffect[], tracks: CinematicSequenceTrack[], progress: number, breakpoint: Breakpoint) {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const layers = new Map<string, CinematicMotion>();
  let world = { ...MOTION_DEFAULT };
  for (const base of effects) {
    const effect = breakpoint === 'desktop' ? { ...base, ...base.desktop } : base;
    if (!effect.enabled || !byId.has(effect.trackId)) continue;
    const phase = effectEase(cinematicTrackPhase(progress, byId.get(effect.trackId), byId), effect.easing);
    const motion = Object.fromEntries(Object.keys(MOTION_DEFAULT).map((key) => [key,
      effect.from[key as keyof CinematicMotion] + (effect.to[key as keyof CinematicMotion] - effect.from[key as keyof CinematicMotion]) * phase,
    ])) as unknown as CinematicMotion;
    if (effect.kind === 'drift') {
      motion.x += Math.sin(phase * Math.PI * 2 * effect.frequency) * effect.amplitudeX;
      motion.y += Math.sin(phase * Math.PI * 2 * effect.frequency) * effect.amplitudeY;
    }
    const existing = effect.target === 'world' ? world : layers.get(effect.targetId) ?? { ...MOTION_DEFAULT };
    const mixed = { x: existing.x + motion.x, y: existing.y + motion.y, xVw: existing.xVw + motion.xVw, yVh: existing.yVh + motion.yVh,
      scale: existing.scale * motion.scale, rotate: existing.rotate + motion.rotate, opacity: existing.opacity * motion.opacity, blur: Math.max(existing.blur, motion.blur) };
    if (effect.target === 'world') world = mixed;
    else layers.set(effect.targetId, mixed);
  }
  return { layers, world };
}

export function interactionAvailable(interaction: CinematicInteraction, tracks: CinematicSequenceTrack[], progress: number) {
  if (!interaction.enabled) return false;
  if (!interaction.availabilityTrackId) return true;
  const track = tracks.find((candidate) => candidate.id === interaction.availabilityTrackId);
  if (!track) return false;
  const clip = resolveCinematicTrackClip(track, tracks);
  return progress >= clip.start && progress <= clip.end;
}

export function cinematicPacingNodes(beats: CinematicSequenceBeat[], pacing: CinematicPacing, breakpoint: Breakpoint, originalBeatCount: number) {
  // The track includes the final stationary viewport; only the remainder is scroll travel.
  const base = Math.max(1, ((breakpoint === 'desktop' ? pacing.desktopVh : pacing.mobileVh) + 100)
    * Math.max(3, beats.length) / Math.max(1, originalBeatCount) - 100);
  const points = [{ story: 0, distance: 0 }];
  let previous = 0;
  let distance = 0;
  for (const beat of [...beats].sort((a, b) => a.at - b.at)) {
    const override = pacing.beats[beat.id];
    distance += override?.[breakpoint === 'desktop' ? 'desktopVh' : 'mobileVh'] ?? (beat.at - previous) * base;
    points.push({ story: beat.at, distance });
    if (override?.holdVh) { distance += override.holdVh; points.push({ story: beat.at, distance }); }
    previous = beat.at;
  }
  distance += (1 - previous) * base;
  points.push({ story: 1, distance });
  return { heightVh: distance + 100, points: points.map((point) => ({ story: point.story, scroll: point.distance / Math.max(1, distance) })) };
}
export function mapCinematicProgress(value: number, points: { story: number; scroll: number }[], inverse = false) {
  const source = inverse ? 'story' : 'scroll';
  const destination = inverse ? 'scroll' : 'story';
  const index = points.findIndex((point) => point[source] >= value);
  if (index <= 0) return index === 0 ? points[0][destination] : 1;
  const left = points[index - 1], right = points[index];
  const phase = (value - left[source]) / Math.max(.000001, right[source] - left[source]);
  return left[destination] + (right[destination] - left[destination]) * phase;
}
