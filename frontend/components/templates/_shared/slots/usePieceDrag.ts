'use client';

import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { EditorHandle, Layer } from '../types';

/**
 * Canvas dragging for a *sub-layer piece* — a hero's title, a countdown unit, any anchor a slot
 * renders through its own `Piece`/`HeroPiece` wrapper.
 *
 * Two problems this solves. A piece sits inside its slot's `.layerBox`, so a pointerdown on it
 * bubbles to the slot and the whole group gets selected and dragged; and a piece has no box of
 * its own on the stage — its position is a nudge, `translate((x-50)%, (y-50)%)` **of the piece's
 * own size** (see each slot's wrapper). So neither the selection nor the pixel→percent maths of
 * `Layer.tsx` can be reused.
 *
 * - **Double-click enters the group**: it selects the piece rather than its parent, which is the
 *   only way to reach a nested element with the mouse. A single click still selects the group, so
 *   nothing about the existing gesture changes.
 * - **Dragging is armed only once the piece is the selected layer**, so an ordinary click-drag on
 *   a hero still moves the whole hero.
 * - Percentages are of the element's own rect, matching what the transform means. Holding
 *   **Shift** locks the drag to one axis.
 */
export function usePieceDrag(layer: Layer | undefined, id: string, editor: EditorHandle | undefined, stageId?: string) {
  const state = useRef<{
    pointerId: number; startX: number; startY: number; w: number; h: number;
    baseX: number; baseY: number; moved: boolean;
  } | null>(null);
  const raf = useRef(0);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const armed = Boolean(editor?.enabled) && editor?.selectedLayer === id && !layer?.locked;

  const post = (msg: Record<string, unknown>) =>
    window.parent.postMessage({ ...msg, stageId: stageId ?? editor?.selectedStage }, window.location.origin);

  const flush = () => {
    raf.current = 0;
    const patch = pending.current;
    pending.current = null;
    if (patch) post({ type: 'PREVIEW_LAYER_EDIT', layerId: id, patch });
  };

  const onDoubleClick = (e: ReactPointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    if (!editor?.enabled) return;
    e.stopPropagation();
    post({ type: 'PREVIEW_LAYER_SELECT', layerId: id });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!armed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    e.stopPropagation();
    state.current = {
      pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
      w: rect.width, h: rect.height,
      baseX: layer?.x ?? 50, baseY: layer?.y ?? 50, moved: false,
    };
    // Capture on first movement, not here — see Layer.tsx: holding the pointer retargets the
    // click/dblclick that follows, which would swallow the gesture that reaches nested pieces.
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = state.current;
    if (!d || e.pointerId !== d.pointerId) return;
    let dx = ((e.clientX - d.startX) / d.w) * 100;
    let dy = ((e.clientY - d.startY) / d.h) * 100;
    if (!d.moved && Math.abs(e.clientX - d.startX) < 2 && Math.abs(e.clientY - d.startY) < 2) return;
    if (!d.moved) e.currentTarget.setPointerCapture(e.pointerId);
    d.moved = true;
    if (e.shiftKey) {
      if (Math.abs(e.clientX - d.startX) >= Math.abs(e.clientY - d.startY)) dy = 0;
      else dx = 0;
    }
    // Same range the panel's Nudge sliders use, so a drag can't reach a value the sliders can't.
    const clamp = (v: number) => Math.min(120, Math.max(-20, v));
    pending.current = { x: clamp(d.baseX + dx), y: clamp(d.baseY + dy) };
    if (!raf.current) raf.current = requestAnimationFrame(flush);
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const d = state.current;
    if (!d || e.pointerId !== d.pointerId) return;
    state.current = null;
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; flush(); }
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return {
    armed,
    handlers: {
      onDoubleClick,
      ...(armed ? {
        onPointerDown,
        onPointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
        style: { cursor: 'move', touchAction: 'none' as const },
      } : null),
    },
  };
}
