import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { AnimIdleType, Breakpoint, EditorHandle, Layer, StageDef } from '../types';
import { resolveStage } from '../layout';
import { fontVar } from '@/lib/fonts/registry';
import { IDLE_BASE_DUR } from '../idle';

/**
 * Shared factory behind every per-template `useAnchors` hook (Template1-classicrose/useAnchors.ts
 * etc — all six were byte-identical modulo which `StageDef` map/prefix they closed over). Turns a
 * template's `anchor` layers into:
 *  - `a(stageId, elementId, base?)` — an inline style (transform/opacity/hide) to merge onto the
 *    wrapping `<div>` around the real DOM element an anchor targets. Unchanged from the original
 *    per-template implementations.
 *  - `tx(stageId, elementId, fallback)` — a text-content override for anchors flagged `hasText`
 *    (e.g. the bride/groom names' "&" connector), falling back to the template's own hardcoded
 *    string when nothing's been saved, so untouched invitations render byte-identical.
 *  - `sx(stageId, elementId)` — a style override (font/color/spacing/border/shadow) for anchors
 *    flagged `styleable`, meant to be spread onto the *inner* content element (not the wrapper `a()`
 *    styles), placed AFTER any pre-existing per-element style object so it wins per-key while an
 *    untouched property still falls through to whatever the template already renders (a legacy
 *    `templateConfigSchema.ts` field, or a hardcoded className).
 */
export function useAnchorsFor(
  stages: Record<string, StageDef>,
  prefix: string,
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  const byStage = useMemo(() => {
    const map: Record<string, ReturnType<typeof resolveStage>['layers']> = {};
    for (const id of Object.keys(stages)) {
      map[id] = resolveStage(prefix, stages[id], breakpoint, config).layers;
    }
    return map;
  }, [stages, prefix, config, breakpoint]);

  const findAnchor = (stageId: string, elementId: string): Layer | undefined =>
    byStage[stageId]?.find((l) => l.id === elementId && l.kind === 'anchor');

  const a = (stageId: string, elementId: string, base?: CSSProperties): CSSProperties => {
    const layer = findAnchor(stageId, elementId);
    if (!layer) return base ?? {};

    const style: CSSProperties = { ...base };
    if (layer.hidden) {
      style.display = 'none';
      return style;
    }

    const dx = layer.x - 50;
    const dy = layer.y - 50;
    if (dx || dy || layer.s !== 1) style.transform = `translate(${dx}%, ${dy}%) scale(${layer.s})`;
    if (layer.opacity !== 1) style.opacity = layer.opacity;

    const selected =
      editor?.enabled && editor.selectedStage === stageId && editor.selectedLayer === elementId;
    if (selected) {
      style.outline = '2px dashed #C98A54';
      style.outlineOffset = '3px';
    }
    return style;
  };

  const tx = (stageId: string, elementId: string, fallback: string): string => {
    const layer = findAnchor(stageId, elementId);
    return layer?.text ?? fallback;
  };

  const sx = (stageId: string, elementId: string): CSSProperties => {
    const layer = findAnchor(stageId, elementId);
    if (!layer?.styleable) return {};
    const style: CSSProperties = {};
    if (layer.color) style.color = layer.color;
    if (layer.fontFamily) style.fontFamily = fontVar(layer.fontFamily);
    if (layer.fontSize) style.fontSize = `${layer.fontSize}cqi`;
    if (layer.fontWeight) style.fontWeight = layer.fontWeight;
    if (layer.letterSpacing !== undefined) style.letterSpacing = `${layer.letterSpacing}em`;
    if (layer.wordSpacing !== undefined) style.wordSpacing = `${layer.wordSpacing}em`;
    if (layer.borderWidth) style.border = `${layer.borderWidth}px solid ${layer.borderColor ?? '#000'}`;
    if (layer.shadowBlur || layer.shadowX || layer.shadowY) {
      style.textShadow = `${layer.shadowX ?? 0}px ${layer.shadowY ?? 0}px ${layer.shadowBlur ?? 0}px ${layer.shadowColor ?? 'rgba(0,0,0,0.4)'}`;
    }
    return style;
  };

  /**
   * Props to spread on a nested `<div>` wrapping an `animatable` anchor's content — the *only*
   * animation category wired up for anchors (enter/exit are skipped: most anchor targets already
   * carry their own bespoke framer-motion entrance, which a generic enter system would fight or
   * double up on). `data-seen="true"` is set directly on this same wrapper rather than relying on
   * an ancestor, since hybrid-overlay templates have no scroll-gated reveal for these elements
   * anyway (`SectionOverlay` already hardcodes `data-seen="true"` unconditionally) — reveal.css's
   * `[data-seen='true'] [data-sl-idle='wave']` selector still matches as long as `data-seen` sits
   * on an ancestor of the `data-sl-idle` node, so this must be a DIFFERENT (outer) element than the
   * one carrying `data-sl-idle`; wrap with `<div data-seen="true"><div {...ax(...)}>content</div></div>`.
   */
  const ax = (stageId: string, elementId: string): { 'data-sl-idle'?: AnimIdleType; style?: CSSProperties } => {
    const layer = findAnchor(stageId, elementId);
    if (!layer?.animatable || !layer.animIdle || layer.animIdle === 'none') return {};
    const type = layer.animIdle;
    return {
      'data-sl-idle': type,
      style: {
        '--sl-idle-intensity': layer.animIdleIntensity ?? 1,
        '--sl-idle-dur': `${IDLE_BASE_DUR[type] / (layer.animIdleSpeed ?? 1)}s`,
      } as CSSProperties,
    };
  };

  return { a, tx, sx, ax };
}
