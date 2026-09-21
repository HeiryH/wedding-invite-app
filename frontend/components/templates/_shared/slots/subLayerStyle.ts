import type { CSSProperties } from 'react';
import type { Layer } from '../types';
import { fontVar } from '@/lib/fonts/registry';

/**
 * The standard "one slot, several individually adjustable/styleable sub-pieces" primitive (see
 * `SlotProps.stageLayers`'s doc comment). Two things every such slot needs, factored out so the
 * hero (T7's bride/groom/date/timer, T10's eyebrow/title/names/date/venue/timer) and the itinerary
 * list's Time/Label pieces can't drift:
 *
 * - `subLayersOf` finds a layer's own children (`parent === layer.id`) out of the stage's already-
 *   resolved sibling layers, keyed by sub-layer id.
 * - `subLayerStyle` turns one sub-layer's Style-tab fields into inline CSS — the same field set
 *   Layer.tsx's `case 'text'` renders (color/size/weight/line-height/font/spacing/border/radius/
 *   shadow), so a sub-layer flagged `styleable: true` gets the exact same Style tab and the exact
 *   same rendering a real text layer would. Every field is an optional override: `undefined` falls
 *   through to the caller's own CSS default, so an un-touched sub-layer renders unchanged.
 */

export function subLayersOf(stageLayers: Layer[] | undefined, parentId: string | undefined): Record<string, Layer> {
  const map: Record<string, Layer> = {};
  if (!parentId) return map;
  for (const l of stageLayers ?? []) if (l.parent === parentId) map[l.id] = l;
  return map;
}

export function subLayerStyle(layer?: Layer): CSSProperties {
  if (!layer) return {};
  const hasShadow = Boolean(layer.shadowBlur || layer.shadowX || layer.shadowY);
  return {
    color: layer.color,
    fontSize: layer.fontSize !== undefined ? `${layer.fontSize}cqi` : undefined,
    fontWeight: layer.fontWeight,
    fontStyle: layer.fontStyle,
    textTransform: layer.textTransform,
    lineHeight: layer.lineHeight,
    fontFamily: layer.fontFamily ? fontVar(layer.fontFamily) : undefined,
    letterSpacing: layer.letterSpacing !== undefined ? `${layer.letterSpacing}em` : undefined,
    wordSpacing: layer.wordSpacing !== undefined ? `${layer.wordSpacing}em` : undefined,
    border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor ?? '#000'}` : undefined,
    borderRadius: layer.borderWidth && layer.radius ? `${layer.radius}px` : undefined,
    textShadow: hasShadow
      ? `${layer.shadowX ?? 0}px ${layer.shadowY ?? 0}px ${layer.shadowBlur ?? 0}px ${layer.shadowColor ?? 'rgba(0,0,0,0.4)'}`
      : undefined,
  };
}
