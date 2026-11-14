'use client';

import { cloneElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import type { EditorHandle, Layer } from '../types';
import { subLayerStyle } from './subLayerStyle';
import { staggerDelay } from '../reveal';
import { CurvedPiece, curvedTextOf } from './CurvedPiece';
import { Backdrop, backdropSrcOf } from '../backdrop';
import { idleInlineStyle } from '../idle';
import { usePieceDrag } from './usePieceDrag';
import { useEngine } from '../engine';

/**
 * Wraps slot content as an adjustable sub-layer: the nudge (translate/scale) rides an outer
 * wrapper while the reveal animation (`data-sl-anim` + reveal.css, triggered by the enclosing
 * stage's `data-seen`) rides the element itself — two elements so the two transforms never fight.
 */
export function SlotPiece({ layer, editor, id, stageId, children }: {
  layer?: Layer;
  editor?: EditorHandle;
  id: string;
  stageId: string;
  children: ReactElement;
}) {
  const { assetRoot } = useEngine();
  // Double-click to reach this piece inside its group; drag it once it's selected (usePieceDrag).
  const drag = usePieceDrag(layer, id, editor, stageId);
  if (layer?.hidden) return null;

  const dx = (layer?.x ?? 50) - 50;
  const dy = (layer?.y ?? 50) - 50;
  const s = layer?.s ?? 1;
  const nudge = dx || dy || s !== 1 ? `translate(${dx}%, ${dy}%) scale(${s})` : undefined;
  const anim = layer?.anim || 'rise';
  const animOut = layer?.animOut && layer.animOut !== 'none' ? layer.animOut : undefined;
  // "While on screen" — its own element, between the entrance and the exit, so the three
  // transforms can't fight (the same split Layer.tsx uses for ordinary layers).
  const animIdle = layer?.animIdle && layer.animIdle !== 'none' ? layer.animIdle : undefined;
  const idleStyle = animIdle
    ? idleInlineStyle(animIdle, { speed: layer?.animIdleSpeed, intensity: layer?.animIdleIntensity, origin: layer?.animIdleOrigin })
    : undefined;
  const withIdle = (node: ReactElement) => (animIdle
    ? <div data-sl-idle={animIdle} style={idleStyle}>{node}</div>
    : node);
  const selected =
    Boolean(editor?.enabled) && editor?.selectedStage === stageId && editor?.selectedLayer === id;

  // Shape (arc/circle) from the Style tab, when this piece's child is one plain string.
  const curveText = curvedTextOf(layer, children);
  const childStyle = (children.props as { style?: CSSProperties }).style ?? {};
  // A backdrop means the ENTRANCE belongs on the wrapper that holds both the art and the words —
  // otherwise the plate pops in at full opacity while only the text rises.
  const hasBackdrop = Boolean(layer && backdropSrcOf(layer, assetRoot));
  const animAttrs = {
    'data-sl-anim': anim,
    'data-scroll-fade': anim === 'scroll-fade' ? true : undefined,
  } as const;
  const animVars = {
    '--sl-opacity': layer?.opacity ?? 1,
    '--sl-delay': staggerDelay(layer?.order ?? 0),
    ...(layer?.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
  } as CSSProperties;
  const inner = curveText !== undefined
    ? <CurvedPiece layer={layer!} text={curveText} anim={anim} assetRoot={assetRoot} />
    : cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...(hasBackdrop ? {} : animAttrs),
      style: {
        ...childStyle,
        // Style-tab fields (color/font/size/spacing/border/shadow) — present only when the
        // sub-layer is flagged `styleable` (all of these are), so this is a no-op until the
        // couple actually touches the Style tab.
        ...subLayerStyle(layer, assetRoot),
        ...(hasBackdrop ? {} : animVars),
      } as CSSProperties,
    });

  // Backdrop art (a ribbon/plate) rides the text itself — see backdrop.tsx. Skipped for a curved
  // piece, which paints its own inside CurvedPiece.
  const backed = curveText !== undefined
    ? inner
    : <Backdrop layer={layer} assetRoot={assetRoot} {...(hasBackdrop ? animAttrs : {})} style={hasBackdrop ? animVars : undefined}>{inner}</Backdrop>;

  // nudge wrapper · optional exit wrapper (scroll-scrubbed via --sl-out) · entrance inner — three
  // elements so nudge/exit/entrance transforms never collide.
  return (
    <div
      {...drag.handlers}
      style={{
        transform: nudge,
        // An explicit per-piece box (Layer.boxW/boxH) — auto unless the couple sets one. Centred,
        // so narrowing a line to make it wrap doesn't shove it to one side.
        ...(layer?.boxW !== undefined ? { width: `${layer.boxW}%`, marginInline: 'auto' } : null),
        ...(layer?.boxH !== undefined ? { height: `${layer.boxH}em`, flexShrink: 0 } : null),
        // `anywhere` rather than `break-word`: it also lets the box shrink to the broken width,
        // which is what a narrowed piece is asking for.
        ...(layer?.boxBreakWord ? { overflowWrap: 'anywhere' as const } : null),
        ...(selected ? { outline: '2px dashed #C98A54', outlineOffset: '3px' } : {}),
        ...(drag.handlers.style ?? {}),
      }}
    >
      {animOut ? (
        <div data-scroll-exit data-sl-out={animOut}>{withIdle(backed)}</div>
      ) : (
        withIdle(backed)
      )}
    </div>
  );
}
