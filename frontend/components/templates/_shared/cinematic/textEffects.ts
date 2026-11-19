import type { CSSProperties } from 'react';

export const textShadowPresets = {
  soft: { color: '#34201c', opacity: .38, blur: 6, x: 0, y: 2 },
  drop: { color: '#34201c', opacity: .55, blur: 3, x: 2, y: 3 },
  glow: { color: '#e8bf71', opacity: .75, blur: 10, x: 0, y: 0 },
};

export const defaultTextOutline = { color: '#4a3a32', width: 1, opacity: 1 };
export const defaultTextGradient = { start: '#fff0cd', end: '#b47a32', angle: 135 };
export const defaultTextBox = { color: '#fff7e9', opacity: 0, paddingX: .45, paddingY: .25 };

type TextShadow = typeof textShadowPresets.soft;
export interface CinematicTextEffects {
  shadow?: TextShadow;
  outline?: { color: string; width: number; opacity: number };
  gradient?: { start: string; end: string; angle: number };
  box?: { color: string; opacity: number; paddingX: number; paddingY: number };
}

export type TextReveal = 'letters' | 'words';
export interface TextGlitch {
  intensity: number;
  split: number;
  duration: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');
const hex = (value: unknown, fallback: string) =>
  typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value) ? value : fallback;
const bounded = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

export function normalizeTextEffects(value: unknown): CinematicTextEffects | undefined {
  if (!isRecord(value)) return;
  const { shadow, outline, gradient, box } = value;
  return {
    ...(isRecord(shadow) && { shadow: {
      color: hex(shadow.color, textShadowPresets.soft.color), opacity: bounded(shadow.opacity, .38, 0, 1),
      blur: bounded(shadow.blur, 6, 0, 30), x: bounded(shadow.x, 0, -20, 20), y: bounded(shadow.y, 2, -20, 20),
    } }),
    ...(isRecord(outline) && { outline: {
      color: hex(outline.color, defaultTextOutline.color), opacity: bounded(outline.opacity, defaultTextOutline.opacity, 0, 1), width: bounded(outline.width, defaultTextOutline.width, 0, 8),
    } }),
    ...(isRecord(gradient) && { gradient: {
      start: hex(gradient.start, defaultTextGradient.start), end: hex(gradient.end, defaultTextGradient.end), angle: bounded(gradient.angle, defaultTextGradient.angle, 0, 360),
    } }),
    ...(isRecord(box) && { box: {
      color: hex(box.color, defaultTextBox.color), opacity: bounded(box.opacity, defaultTextBox.opacity, 0, 1),
      paddingX: bounded(box.paddingX, defaultTextBox.paddingX, 0, 3), paddingY: bounded(box.paddingY, defaultTextBox.paddingY, 0, 3),
    } }),
  };
}

export const defaultTextGlitch: TextGlitch = { intensity: .5, split: .65, duration: .06 };

export function normalizeTextGlitch(value: unknown): TextGlitch | undefined {
  if (!isRecord(value)) return;
  return {
    intensity: bounded(value.intensity, 0, 0, 1),
    split: bounded(value.split, defaultTextGlitch.split, 0, 1),
    duration: bounded(value.duration, defaultTextGlitch.duration, .01, 1),
  };
}

function withOpacity(color: string, opacity: number) {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

export function textBoxStyle(box: CinematicTextEffects['box']): CSSProperties | undefined {
  if (!box) return;
  return { backgroundColor: withOpacity(box.color, box.opacity), padding: `${box.paddingY}em ${box.paddingX}em`, boxSizing: 'border-box' };
}

export function textPaint(effects?: CinematicTextEffects, shadowOpacity?: number) {
  const { shadow, outline, gradient } = effects ?? {};
  const alpha = shadowOpacity ?? shadow?.opacity ?? 0;
  const offset = shadow && alpha > 0
    ? `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${withOpacity(shadow.color, alpha)}` : undefined;
  const style: CSSProperties = {
    ...(outline?.width ? {
      WebkitTextStroke: `${outline.width}px ${withOpacity(outline.color, outline.opacity)}`,
      paintOrder: 'stroke fill',
    } : {}),
    ...(gradient ? {
      backgroundImage: `linear-gradient(${gradient.angle}deg, ${gradient.start}, ${gradient.end})`,
      backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    } : {}),
    ...(offset && !gradient ? { textShadow: offset } : {}),
  };
  return { style, filter: offset && gradient ? `drop-shadow(${offset})` : undefined };
}

const segmenters = new Map<TextReveal, Intl.Segmenter>();
export function splitTextReveal(text: string, mode: TextReveal, amount: number): [string, string] {
  let segmenter = segmenters.get(mode);
  if (!segmenter && typeof Intl.Segmenter === 'function') {
    segmenter = new Intl.Segmenter(undefined, { granularity: mode === 'letters' ? 'grapheme' : 'word' });
    segmenters.set(mode, segmenter);
  }
  if (amount <= 0) return ['', text];
  if (amount >= 1) return [text, ''];
  const segments = segmenter ? Array.from(segmenter.segment(text))
    : (mode === 'letters' ? Array.from(text) : text.split(/(\s+)/u)).map((segment) => ({ segment, isWordLike: undefined }));
  const counted = ({ segment, isWordLike }: { segment: string; isWordLike?: boolean }) =>
    mode === 'letters' ? Boolean(segment.trim()) : Boolean(isWordLike || /[\p{L}\p{N}\p{S}]/u.test(segment));
  const count = Math.floor(segments.filter(counted).length * amount + 1e-7);
  if (count === 0) return ['', text];
  let visible = 0;
  let end = 0;
  for (const segment of segments) {
    if (counted(segment) && ++visible > count) break;
    end += segment.segment.length;
  }
  return [text.slice(0, end), text.slice(end)];
}

export function textGlitchStyle(glitch?: TextGlitch, phase = 0): CSSProperties | undefined {
  if (!glitch?.intensity) return;
  const direction = Math.floor(phase * 9) % 2 ? -1 : 1;
  const shift = glitch.intensity * direction;
  const colorOffset = 4 * shift * glitch.split;
  return {
    position: 'relative', left: `${(3 * shift).toFixed(2)}px`,
    filter: colorOffset
      ? `drop-shadow(${colorOffset.toFixed(2)}px 0 #ed4079b3) drop-shadow(${(-colorOffset).toFixed(2)}px 0 #36ccd4b3)`
      : undefined,
  };
}
