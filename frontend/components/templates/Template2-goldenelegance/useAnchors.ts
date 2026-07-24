'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { resolveStage } from '@/components/templates/_shared/layout';
import { T2_STAGES } from './data/t2Stages';

/**
 * Turns Template 2's `anchor` layers into an inline style to merge onto the real DOM element they
 * target. The nudge is transform-only (translate + scale) + opacity + hide, so the element's
 * native size and text wrapping are untouched — only its post-layout paint moves. Applied directly
 * to plain (non-framer-motion) elements, so there's no wrapper and no animation conflict — a
 * framer-motion anchor target (most of the welcome section here) is instead wrapped in a plain
 * outer element that carries this style, leaving the inner motion node's own animation untouched.
 *
 * Returns `a(stageId, elementId, baseStyle?)` → a merged CSSProperties. `translate` is a
 * percentage of the element's own box (x/y of 50 = no offset).
 */
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  const byStage = useMemo(() => {
    const map: Record<string, ReturnType<typeof resolveStage>['layers']> = {};
    for (const id of Object.keys(T2_STAGES)) {
      map[id] = resolveStage('t2', T2_STAGES[id], breakpoint, config).layers;
    }
    return map;
  }, [config, breakpoint]);

  return (stageId: string, elementId: string, base?: CSSProperties): CSSProperties => {
    const layer = byStage[stageId]?.find((l) => l.id === elementId && l.kind === 'anchor');
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
}
