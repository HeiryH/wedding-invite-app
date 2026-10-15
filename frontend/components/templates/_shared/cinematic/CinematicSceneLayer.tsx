'use client';

import { useCallback, useEffect, useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { EditorHandle } from '../types';
import type { SlotProps } from '../types';
import { resolveBindings } from '../bindings';
import { fontVar } from '@/lib/fonts/registry';
import type { CinematicWorldLayer, CinematicWorldGeometry } from './world';

interface Props {
  layer: CinematicWorldLayer;
  editor?: EditorHandle;
  visibility?: number;
  transition?: { xVw?: number; scale?: number };
  ambient?: {
    /** Percentage offsets within the layer's containing space. */
    x?: number;
    y?: number;
    /** Viewport offsets are useful for props entering from beyond the frame. */
    xVw?: number;
    yVh?: number;
    scale?: number;
    rotate?: number;
  };
  className?: string;
  boxClassName: string;
  imageClassName: string;
  selectedClassName: string;
  resizeHandleClassName: string;
  children?: ReactNode;
  slotProps?: SlotProps;
  /** Keep live buttons/links usable on the guest invitation. */
  interactive?: boolean;
}

interface DragState {
  pointerId: number;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  rectW: number;
  rectH: number;
  layerX: number;
  layerY: number;
  layerW: number;
  layerH?: number;
  moved: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** One directly-manipulable piece of a continuous Cinematic world. */
export default function CinematicSceneLayer({
  layer, editor, visibility = 1, transition, ambient, className, boxClassName, imageClassName,
  selectedClassName, resizeHandleClassName, children, slotProps, interactive = false,
}: Props) {
  const selected = Boolean(editor?.enabled && editor.selectedLayer === layer.id);
  const editable = Boolean(editor?.enabled && editor.cinematic?.mode === 'scene');
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const rafRef = useRef(0);
  const pendingPatchRef = useRef<Partial<CinematicWorldGeometry> | null>(null);

  const postSelection = useCallback((layerId: string | undefined) => {
    if (!editable) return;
    window.parent.postMessage(
      { type: 'PREVIEW_CINEMATIC_LAYER_SELECT', layerId },
      window.location.origin,
    );
  }, [editable]);

  const ensureSelected = useCallback(() => {
    if (!selected) postSelection(layer.id);
  }, [layer.id, postSelection, selected]);

  const flushPatch = useCallback(() => {
    rafRef.current = 0;
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = null;
    if (patch) {
      window.parent.postMessage(
        { type: 'PREVIEW_CINEMATIC_LAYER_EDIT', layerId: layer.id, patch },
        window.location.origin,
      );
    }
  }, [layer.id]);

  const schedulePatch = useCallback((patch: Partial<CinematicWorldGeometry>) => {
    pendingPatchRef.current = patch;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushPatch);
  }, [flushPatch]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, mode: DragState['mode']) => {
    if (!editable) return;
    event.stopPropagation();
    ensureSelected();
    if (layer.locked) return;
    const frame = event.currentTarget.closest<HTMLElement>('[data-cinematic-space]');
    const rect = frame?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rectW: rect.width,
      rectH: rect.height,
      layerX: layer.x,
      layerY: layer.y,
      layerW: layer.w,
      layerH: layer.h,
      moved: false,
    };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    let dx = ((event.clientX - drag.startX) / drag.rectW) * 100;
    let dy = ((event.clientY - drag.startY) / drag.rectH) * 100;
    if (!drag.moved && Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    if (event.shiftKey) {
      if (Math.abs(event.clientX - drag.startX) >= Math.abs(event.clientY - drag.startY)) dy = 0;
      else dx = 0;
    }
    if (drag.mode === 'resize') {
      const width = clamp(drag.layerW + dx * 2, 3, 200);
      schedulePatch(drag.layerH === undefined
        ? { w: width }
        : { w: width, h: clamp(drag.layerH + dy * 2, 3, 200) });
    } else {
      schedulePatch({ x: clamp(drag.layerX + dx, -25, 125), y: clamp(drag.layerY + dy, -25, 125) });
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      flushPatch();
    }
  };

  const keyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!editable || layer.locked) return;
    const step = event.shiftKey ? 2 : 0.5;
    const patch: Partial<CinematicWorldGeometry> = {};
    if (event.key === 'ArrowLeft') patch.x = clamp(layer.x - step, -25, 125);
    else if (event.key === 'ArrowRight') patch.x = clamp(layer.x + step, -25, 125);
    else if (event.key === 'ArrowUp') patch.y = clamp(layer.y - step, -25, 125);
    else if (event.key === 'ArrowDown') patch.y = clamp(layer.y + step, -25, 125);
    else return;
    event.preventDefault();
    ensureSelected();
    window.parent.postMessage(
      { type: 'PREVIEW_CINEMATIC_LAYER_EDIT', layerId: layer.id, patch },
      window.location.origin,
    );
  };

  if (layer.hidden) return null;
  const ambientX = ambient?.x ?? 0;
  const ambientY = ambient?.y ?? 0;
  const ambientXVw = (ambient?.xVw ?? 0) + (transition?.xVw ?? 0);
  const ambientYVh = ambient?.yVh ?? 0;
  const ambientScale = (ambient?.scale ?? 1) * (transition?.scale ?? 1);
  const ambientRotate = ambient?.rotate ?? 0;
  const boxStyle: CSSProperties = {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.w}%`,
    height: layer.h === undefined ? 'auto' : `${layer.h}%`,
    aspectRatio: layer.aspectRatio,
    // Cinematic scenes depend on honest foreground/background occlusion. Floating a selected
    // full-scene prop to 9999 makes a backdrop such as an uploaded dais cover the seated couple
    // and gives a false impression of the saved composition. Keep its real depth while editing;
    // obscured layers remain selectable from the director's layer list.
    zIndex: layer.z,
    opacity: layer.opacity * visibility,
    transform: `translate(-50%, -50%) translate(${ambientX}%, ${ambientY}%) translate(${ambientXVw}vw, ${ambientYVh}vh) scale(${ambientScale}) rotate(${layer.rotation + ambientRotate}deg) scaleX(${layer.flipX ? -1 : 1})`,
    pointerEvents: (editable || interactive) && layer.opacity * visibility > 0.02 ? 'auto' : 'none',
    touchAction: editable ? 'none' : 'auto',
  };

  return (
    <div
      className={`${boxClassName} ${className ?? ''} ${selected ? selectedClassName : ''}`}
      style={boxStyle}
      data-cinematic-layer={layer.id}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={editable ? `Edit ${layer.label}` : undefined}
      onKeyDown={keyDown}
      onClick={(event) => {
        event.stopPropagation();
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        postSelection(selected ? undefined : layer.id);
      }}
      onPointerDown={(event) => beginDrag(event, 'move')}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {children ?? (layer.kind === 'text' ? (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: layer.textAlign === 'left' ? 'flex-start' : layer.textAlign === 'right' ? 'flex-end' : 'center',
          color: layer.color ?? '#4a3a32', fontSize: `${layer.fontSize ?? 4}cqi`,
          fontFamily: fontVar(layer.fontFamily), fontWeight: layer.fontWeight ?? 600,
          lineHeight: layer.lineHeight ?? 1.15,
          letterSpacing: layer.letterSpacing === undefined ? undefined : `${layer.letterSpacing}em`,
          textAlign: layer.textAlign ?? 'center', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
          border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor ?? '#4a3a32'}` : undefined,
          borderRadius: layer.radius ? `${layer.radius}px` : undefined,
          boxSizing: 'border-box', padding: layer.borderWidth ? '0.25em 0.45em' : undefined,
          pointerEvents: 'none',
        }}>
          {resolveBindings(layer.text, slotProps)}
        </div>
      ) : layer.kind === 'shape' ? (
        <div style={{
          width: '100%', height: '100%', background: layer.fill ?? '#c98a54',
          borderRadius: layer.shape === 'ellipse' ? '50%' : `${layer.radius ?? 0}px`,
          border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor ?? '#4a3a32'}` : undefined,
          boxSizing: 'border-box', pointerEvents: 'none',
        }} />
      ) : layer.src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={layer.src}
          alt=""
          className={imageClassName}
          style={{ objectFit: layer.fit ?? 'contain', height: layer.h === undefined ? 'auto' : '100%' }}
          draggable={false}
        />
      ) : null)}
      {selected && !layer.locked && (
        <span
          className={resizeHandleClassName}
          aria-hidden="true"
          onPointerDown={(event) => beginDrag(event, 'resize')}
        />
      )}
    </div>
  );
}
