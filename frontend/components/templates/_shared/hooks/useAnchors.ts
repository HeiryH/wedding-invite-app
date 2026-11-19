import { useMemo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { AnimIdleType, Breakpoint, EditorHandle, Layer, StageDef } from '../types';
import { resolveStage } from '../layout';
import { fontVar } from '@/lib/fonts/registry';
import { idleInlineStyle } from '../idle';

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
    const map: Record<string, ReturnType<typeof resolveStage>> = {};
    for (const id of Object.keys(stages)) {
      map[id] = resolveStage(prefix, stages[id], breakpoint, config);
    }
    return map;
  }, [stages, prefix, config, breakpoint]);

  const findAnchor = (stageId: string, elementId: string): Layer | undefined =>
    byStage[stageId]?.layers.find((l) => l.id === elementId && l.kind === 'anchor');

  const a = (stageId: string, elementId: string, base?: CSSProperties): CSSProperties => {
    const layer = findAnchor(stageId, elementId);
    if (!layer) return base ?? {};

    const style: CSSProperties = { ...base };
    if (layer.hidden) {
      style.display = 'none';
      return style;
    }

    if (layer.groupOffsetX || layer.groupOffsetY) {
      style.translate = `calc(var(--fvw, 100vw) * ${(layer.groupOffsetX ?? 0) / 100}) calc(var(--fsvh, 100svh) * ${(layer.groupOffsetY ?? 0) / 100})`;
    }

    const dx = layer.x - 50;
    const dy = layer.y - 50;
    if (dx || dy || layer.s !== 1) style.transform = `translate(${dx}%, ${dy}%) scale(${layer.s})`;
    if (layer.opacity !== 1) style.opacity = layer.opacity;
    if (layer.resizable) {
      if (layer.boxW !== undefined) {
        style.width = `${layer.boxW}%`;
        style.maxWidth = 'none';
      }
      if (layer.boxH !== undefined) {
        style.height = `${layer.boxH}em`;
        style.minHeight = 0;
      }
      if (layer.boxBreakWord) style.overflowWrap = 'anywhere';
    }

    const selected =
      editor?.enabled && editor.selectedStage === stageId &&
      (editor.selectedLayer === elementId ||
        byStage[stageId]?.groups.some((group) => group.id === editor.selectedLayer && group.memberIds.includes(elementId)));
    if (selected) {
      style.outline = '2px dashed #C98A54';
      style.outlineOffset = '3px';
    }
    return style;
  };

  /** Position an existing element and let the editor pick it directly in the preview. */
  const anchorProps = (stageId: string, elementId: string, base?: CSSProperties) => {
    const style = a(stageId, elementId, base);
    const layer = findAnchor(stageId, elementId);
    const loop = byStage[stageId]?.groups.find((group) => group.memberIds.includes(elementId))?.animIdle;
    const props: { style: CSSProperties; 'data-anchor-group-idle'?: AnimIdleType } = {
      style,
      'data-anchor-group-idle': loop && loop !== 'none' ? loop : undefined,
    };
    if (!editor?.enabled || !layer || layer.hidden) return props;

    return {
      ...props,
      style: { ...style, cursor: layer.locked ? undefined : 'pointer', pointerEvents: 'auto' as const },
      'data-adjust-anchor': elementId,
      'data-adjust-stage': stageId,
      onClickCapture: (event: MouseEvent<Element>) => {
        // Nested elements belong to their own inspector, even when the parent is editable too.
        const target = event.target instanceof Element
          ? event.target.closest('[data-adjust-anchor], [data-layer]') : null;
        if (target !== event.currentTarget || layer.locked) return;
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_LAYER_SELECT', stageId, layerId: elementId }, window.location.origin);
      },
    };
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
    if (layer.fontStyle) style.fontStyle = layer.fontStyle;
    if (layer.textTransform) style.textTransform = layer.textTransform;
    if (layer.lineHeight !== undefined) style.lineHeight = layer.lineHeight;
    if (layer.letterSpacing !== undefined) style.letterSpacing = `${layer.letterSpacing}em`;
    if (layer.wordSpacing !== undefined) style.wordSpacing = `${layer.wordSpacing}em`;
    if (layer.borderWidth !== undefined && !layer.containerStyle) style.border = `${layer.borderWidth}px solid ${layer.borderColor ?? '#000'}`;
    if (layer.shadowBlur || layer.shadowX || layer.shadowY) {
      style.textShadow = `${layer.shadowX ?? 0}px ${layer.shadowY ?? 0}px ${layer.shadowBlur ?? 0}px ${layer.shadowColor ?? 'rgba(0,0,0,0.4)'}`;
    }

    return style;
  };

  const cx = (stageId: string, elementId: string): CSSProperties => {
    const layer = findAnchor(stageId, elementId);
    if (!layer?.containerStyle) return {};
    const style: CSSProperties = {};
    if (layer.borderWidth !== undefined) {
      style.border = `${layer.borderWidth}px solid ${layer.borderColor ?? '#000'}`;
    }
    if (layer.fill) style.background = layer.containerOpacity === undefined ? layer.fill
      : `color-mix(in srgb, ${layer.fill} ${layer.containerOpacity}%, transparent)`;
    if (layer.radius !== undefined) style.borderRadius = layer.radius;
    if (layer.containerPadding !== undefined) style.padding = layer.containerPadding;
    if (layer.containerMinHeight !== undefined) style.minHeight = layer.containerMinHeight;
    if (layer.containerBlur !== undefined) {
      style.backdropFilter = `blur(${layer.containerBlur}px) saturate(140%)`;
      style.WebkitBackdropFilter = style.backdropFilter;
    }
    if (layer.boxH !== undefined) {
      style.height = `${layer.boxH}em`;
      style.minHeight = 0;
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
      style: idleInlineStyle(type, { speed: layer.animIdleSpeed, intensity: layer.animIdleIntensity, origin: layer.animIdleOrigin }),
    };
  };

  return { a, anchorProps, tx, sx, ax, cx };
}

export type AnchorBinding = ReturnType<typeof useAnchorsFor>['anchorProps'];
