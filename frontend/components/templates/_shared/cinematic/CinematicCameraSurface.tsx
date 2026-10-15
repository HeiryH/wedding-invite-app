'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import type { CameraState } from './useCinematicScroll';

interface Props {
  camera: CameraState;
  beatId?: string;
  className: string;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  x: number;
  y: number;
  moved: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Transparent editor-only surface: drag the picture to pan; wheel/trackpad adjusts zoom. */
export default function CinematicCameraSurface({ camera, beatId, className }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const pendingRef = useRef<Partial<CameraState> | null>(null);
  const liveCameraRef = useRef(camera);
  const rafRef = useRef(0);

  useEffect(() => { liveCameraRef.current = camera; }, [camera]);

  const flush = useCallback(() => {
    rafRef.current = 0;
    const patch = pendingRef.current;
    pendingRef.current = null;
    if (patch) {
      window.parent.postMessage(
        { type: 'PREVIEW_CINEMATIC_CAMERA_EDIT', beatId, patch },
        window.location.origin,
      );
    }
  }, [beatId]);

  const schedule = useCallback((patch: Partial<CameraState>) => {
    pendingRef.current = { ...pendingRef.current, ...patch };
    liveCameraRef.current = { ...liveCameraRef.current, ...patch };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const begin = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const current = liveCameraRef.current;
    dragRef.current = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      width: rect.width, height: rect.height, x: current.x, y: current.y, moved: false,
    };
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = ((event.clientX - drag.startX) / drag.width) * 100;
    const dy = ((event.clientY - drag.startY) / drag.height) * 100;
    if (!drag.moved && Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    schedule({ x: clamp(drag.x + dx, -100, 100), y: clamp(drag.y + dy, -100, 100) });
  };

  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      flush();
    }
  };

  const wheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    schedule({ scale: clamp(liveCameraRef.current.scale * Math.exp(-event.deltaY * 0.0015), 0.3, 4) });
  };

  const keyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 2 : 0.5;
    let patch: Partial<CameraState> | undefined;
    const current = liveCameraRef.current;
    if (event.key === 'ArrowLeft') patch = { x: clamp(current.x - step, -100, 100) };
    else if (event.key === 'ArrowRight') patch = { x: clamp(current.x + step, -100, 100) };
    else if (event.key === 'ArrowUp') patch = { y: clamp(current.y - step, -100, 100) };
    else if (event.key === 'ArrowDown') patch = { y: clamp(current.y + step, -100, 100) };
    else if (event.key === '+' || event.key === '=') patch = { scale: clamp(current.scale * 1.05, 0.3, 4) };
    else if (event.key === '-') patch = { scale: clamp(current.scale / 1.05, 0.3, 4) };
    if (!patch) return;
    event.preventDefault();
    schedule(patch);
  };

  return (
    <div
      className={className}
      data-cinematic-camera-editor="true"
      aria-label="Drag to pan the cinematic camera; use the wheel or trackpad to zoom"
      role="application"
      tabIndex={0}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onWheel={wheel}
      onKeyDown={keyDown}
    />
  );
}
