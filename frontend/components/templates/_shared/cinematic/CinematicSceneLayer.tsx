'use client';

import { cloneElement, useCallback, useEffect, useRef, type ReactElement, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { EditorHandle } from '../types';
import type { SlotProps } from '../types';
import { resolveBindings } from '../bindings';
import { fontVar } from '@/lib/fonts/registry';
import type { CinematicWorldLayer, CinematicWorldGeometry } from './world';
import { resizeCinematicLayer } from './world';
import type { CinematicEffectPose, CinematicMotion } from './direction';
import { frameW } from '../frameViewport';

interface Props {
  layer: CinematicWorldLayer;
  cssVars?: CSSProperties;
  editor?: EditorHandle;
  visibility?: number;
  /** DOM ancestors already apply their fades visually; include them only for hit testing. */
  ancestorOpacity?: number;
  transition?: { xVw?: number; yVh?: number; scale?: number };
  ambient?: {
    /** Percentage offsets within the layer's containing space. */
    x?: number;
    y?: number;
    /** Viewport offsets are useful for props entering from beyond the frame. */
    xVw?: number;
    yVh?: number;
    scale?: number;
    rotate?: number;
    opacity?: number;
    blur?: number;
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
  /** Mount a child on the real DOM slot, preserving its reflow and semantic markup. */
  localElement?: ReactElement<{ style?: CSSProperties; className?: string; children?: ReactNode; src?: string }>;
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
  lockAspect?: boolean;
  moved: boolean;
  inverse?: { a: number; b: number; c: number; d: number };
  pose?: CinematicEffectPose;
  screenWidth?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** One directly-manipulable piece of a continuous Cinematic world. */
export default function CinematicSceneLayer({
  layer, cssVars, editor, visibility = 1, ancestorOpacity = 1, transition, ambient, className, boxClassName, imageClassName,
  selectedClassName, resizeHandleClassName, children, slotProps, interactive = false, localElement,
}: Props) {
  const selected = Boolean(editor?.enabled && editor.selectedLayer === layer.id);
  const editable = Boolean(editor?.enabled && editor.cinematic?.mode === 'scene');
  const pose = editable && editor?.cinematic?.effectPose?.layerId === layer.id ? editor.cinematic.effectPose : undefined;
  // An endpoint must stay visible/editable even when its appearance track fades out there.
  if (pose) { visibility = 1; transition = undefined; ambient = { ...ambient, opacity: 1 }; }
  const canHit = !layer.hidden && (Boolean(pose) || layer.opacity * visibility * (ambient?.opacity ?? 1) * ancestorOpacity > .02);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const rafRef = useRef(0);
  const pendingPatchRef = useRef<Partial<CinematicWorldGeometry> | null>(null);
  const pendingPoseRef = useRef<{ effectId: string; layerId: string; side: 'from' | 'to'; patch: Partial<CinematicMotion> } | null>(null);

  const postSelection = useCallback((layerId: string | undefined) => {
    if (!editable || !canHit) return;
    if (selected && layerId === layer.id) return;
    if (pose && !layerId) return;
    window.parent.postMessage(
      { type: 'PREVIEW_CINEMATIC_LAYER_SELECT', layerId },
      window.location.origin,
    );
  }, [editable, canHit, pose, selected, layer.id]);

  const ensureSelected = useCallback(() => {
    if (!selected) postSelection(layer.id);
  }, [layer.id, postSelection, selected]);

  const flushPatch = useCallback(() => {
    rafRef.current = 0;
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = null;
    const posePatch = pendingPoseRef.current;
    pendingPoseRef.current = null;
    if (posePatch) window.parent.postMessage({ type: 'PREVIEW_CINEMATIC_EFFECT_POSE_EDIT', ...posePatch }, window.location.origin);
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
    if (!editable || !canHit) return;
    event.stopPropagation();
    ensureSelected();
    if (layer.locked) return;
    const artwork = event.currentTarget.closest<HTMLElement>('[data-cinematic-layer]') ?? event.currentTarget;
    const frame = localElement ? artwork : artwork.closest<HTMLElement>('[data-cinematic-space]');
    const rect = frame?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    let inverse: DragState['inverse'];
    if ((localElement || pose) && typeof DOMMatrix !== 'undefined') {
      // Convert screen pointer motion back through the camera and all transformed parents.
      // The child's individual translate lives before its own rotate/scale, so exclude itself.
      let matrix = new DOMMatrix();
      for (let node = artwork.parentElement; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        const scale = style.scale === 'none' ? [1, 1] : style.scale.split(' ').map(Number);
        const rotation = Number.parseFloat(style.rotate) || 0;
        const own = new DOMMatrix().rotate(rotation).scale(scale[0] || 1, scale[1] || scale[0] || 1)
          .multiply(new DOMMatrix(style.transform === 'none' ? undefined : style.transform));
        matrix = own.multiply(matrix);
      }
      const result = matrix.inverse();
      if ([result.a, result.b, result.c, result.d].every(Number.isFinite)) inverse = result;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rectW: inverse ? artwork.offsetWidth : localElement ? rect.width / (layer.w / 100) : rect.width,
      rectH: inverse ? artwork.offsetHeight : localElement ? rect.height / ((layer.h ?? layer.w) / 100) : rect.height,
      layerX: layer.x,
      layerY: layer.y,
      layerW: layer.w,
      layerH: layer.h,
      lockAspect: layer.lockAspect,
      moved: false,
      inverse,
      pose,
      screenWidth: artwork.getBoundingClientRect().width,
    };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const screenX = event.clientX - drag.startX, screenY = event.clientY - drag.startY;
    let dx = ((drag.inverse ? drag.inverse.a * screenX + drag.inverse.c * screenY : screenX) / drag.rectW) * 100;
    let dy = ((drag.inverse ? drag.inverse.b * screenX + drag.inverse.d * screenY : screenY) / drag.rectH) * 100;
    if (!drag.moved && Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    if (event.shiftKey) {
      if (Math.abs(event.clientX - drag.startX) >= Math.abs(event.clientY - drag.startY)) dy = 0;
      else dx = 0;
    }
    if (drag.pose) {
      const x = drag.inverse ? drag.inverse.a * screenX + drag.inverse.c * screenY : screenX;
      const y = drag.inverse ? drag.inverse.b * screenX + drag.inverse.d * screenY : screenY;
      const frameHeight = editor?.frame?.h ?? window.innerHeight;
      const patch = drag.mode === 'resize'
        ? { scale: clamp(drag.pose.motion.scale * (1 + screenX * 2 / (drag.screenWidth || 1)), .05, 10) }
        : { xVw: drag.pose.motion.xVw + (event.shiftKey && dx === 0 ? 0 : x / frameW() * 100),
            yVh: drag.pose.motion.yVh + (event.shiftKey && dy === 0 ? 0 : y / frameHeight * 100) };
      pendingPoseRef.current = { effectId: drag.pose.effectId, layerId: layer.id, side: drag.pose.side, patch };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flushPatch);
      return;
    }
    if (drag.mode === 'resize') {
      const width = clamp(drag.layerW + dx * 2, 3, 200);
      schedulePatch(drag.lockAspect && drag.layerH !== undefined
        ? resizeCinematicLayer({ w: drag.layerW, h: drag.layerH, lockAspect: true }, 'w', width)
        : drag.layerH === undefined
        ? { w: width }
        : { w: width, h: clamp(drag.layerH + dy * 2, 3, 200) });
    } else {
      schedulePatch({ x: clamp(drag.layerX + dx, localElement ? -500 : -25, localElement ? 500 : 125), y: clamp(drag.layerY + dy, localElement ? -500 : -25, localElement ? 500 : 125) });
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
    if (!editable || !canHit || layer.locked) return;
    const step = event.shiftKey ? 2 : 0.5;
    if (pose && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      window.parent.postMessage({ type: 'PREVIEW_CINEMATIC_EFFECT_POSE_EDIT', effectId: pose.effectId, layerId: layer.id, side: pose.side,
        patch: { xVw: pose.motion.xVw + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
          yVh: pose.motion.yVh + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) } }, window.location.origin);
      return;
    }
    const patch: Partial<CinematicWorldGeometry> = {};
    const min = localElement ? -500 : -25, max = localElement ? 500 : 125;
    if (event.key === 'ArrowLeft') patch.x = clamp(layer.x - step, min, max);
    else if (event.key === 'ArrowRight') patch.x = clamp(layer.x + step, min, max);
    else if (event.key === 'ArrowUp') patch.y = clamp(layer.y - step, min, max);
    else if (event.key === 'ArrowDown') patch.y = clamp(layer.y + step, min, max);
    else return;
    event.preventDefault();
    event.stopPropagation();
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
  const ambientYVh = (ambient?.yVh ?? 0) + (transition?.yVh ?? 0);
  const ambientScale = (ambient?.scale ?? 1) * (transition?.scale ?? 1);
  const ambientRotate = ambient?.rotate ?? 0;
  if (localElement) {
    const localStyle: CSSProperties = {
      ...localElement.props.style,
      // Individual transform properties compose with authored transforms (paper lift, centering,
      // frame tilt) rather than overwriting them. No-op defaults leave the old picture intact.
      translate: `calc(${layer.x - 50 + ambientX}% + var(--fvw, 100vw) * ${ambientXVw / 100}) calc(${layer.y - 50 + ambientY}% + var(--fvh, 100vh) * ${ambientYVh / 100})`,
      scale: `${layer.w / 100 * ambientScale * (layer.flipX ? -1 : 1)} ${(layer.h ?? layer.w) / 100 * ambientScale}`,
      rotate: `${layer.rotation + ambientRotate}deg`,
      position: localElement.props.style?.position ?? (['figure', 'strong', 'small', 'b', 'i', 'em', 'h2', 'p', 'time', 'address'].includes(String(localElement.type)) ? 'relative' : undefined),
      display: ['time', 'address'].includes(String(localElement.type)) ? 'block' : localElement.props.style?.display,
      ...(layer.textWidth === undefined ? {} : {
        width: `${clamp(layer.textWidth, 5, 200)}%`, minWidth: 0, maxWidth: 'none',
        ...(layer.kind === 'text' ? { display: 'block' } : {}),
        whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', boxSizing: 'border-box',
      } as CSSProperties),
      zIndex: layer.z || localElement.props.style?.zIndex,
      opacity: layer.opacity * visibility * (ambient?.opacity ?? 1) === 1 ? localElement.props.style?.opacity : layer.opacity * visibility * (ambient?.opacity ?? 1),
      ...(layer.color ? { color: layer.color } : {}),
      ...(layer.fontFamily ? { fontFamily: fontVar(layer.fontFamily) } : {}),
      ...(layer.fontSize ? { fontSize: `${layer.fontSize}cqi` } : {}),
      ...(layer.fontWeight ? { fontWeight: layer.fontWeight } : {}),
      ...(layer.textAlign ? { textAlign: layer.textAlign } : {}),
      ...(layer.lineHeight ? { lineHeight: layer.lineHeight } : {}),
      ...(layer.letterSpacing === undefined ? {} : { letterSpacing: `${layer.letterSpacing}em` }),
      ...(layer.fill ? { background: layer.fill } : {}),
      ...(layer.radius === undefined ? {} : { borderRadius: layer.radius }),
      ...(layer.borderColor && layer.part !== 'frames' ? { borderColor: layer.borderColor } : {}),
      ...(layer.borderWidth === undefined || layer.part === 'frames' ? {} : { borderWidth: layer.borderWidth, borderStyle: 'solid' } as CSSProperties),
      filter: ambient?.blur ? `blur(${ambient.blur}px)` : localElement.props.style?.filter,
      outline: selected ? '2px solid #b48642' : undefined, outlineOffset: selected ? 3 : undefined,
      pointerEvents: !canHit ? 'none' : editable ? 'auto' : localElement.props.style?.pointerEvents, touchAction: editable ? 'none' : undefined,
      cursor: editable ? layer.locked ? 'not-allowed' : 'move' : undefined,
      ...cssVars,
    };
    // eslint-disable-next-line react-hooks/refs -- cloneElement stores event handlers; it never invokes them or reads their refs.
    return cloneElement(localElement, {
      style: localStyle,
      ...(layer.src && layer.kind === 'img' && localElement.type === 'img' ? { src: layer.src } : {}),
      ...(layer.src && layer.kind === 'img' && localElement.type === 'figure' ? { children: /* eslint-disable-next-line @next/next/no-img-element -- Editable scene artwork must retain the generated element geometry and direct layer source. */
                                                                                            <img src={layer.src} alt="Selected memory artwork" style={{ width: '100%', height: '100%', objectFit: layer.fit ?? 'cover' }} /> } : {}),
      ...(layer.kind === 'text' && layer.text ? { children: resolveBindings(layer.text, slotProps), dangerouslySetInnerHTML: undefined } : {}),
      ...{
        'data-cinematic-layer': layer.id, 'data-cinematic-parent': layer.parentId, 'data-effect-pose': pose?.side,
        role: editable ? 'button' : undefined, tabIndex: editable && canHit ? 0 : undefined,
        'aria-hidden': !canHit || undefined,
        'aria-label': editable ? `Edit ${layer.label}` : undefined,
        onPointerDown: editable ? (event: ReactPointerEvent<HTMLElement>) => beginDrag(event, 'move') : undefined,
        onPointerMove: editable ? moveDrag : undefined, onPointerUp: editable ? endDrag : undefined,
        onPointerCancel: editable ? endDrag : undefined, onKeyDown: editable ? keyDown : undefined,
        onClick: editable ? (event: React.MouseEvent) => {
          event.stopPropagation();
          if (suppressClickRef.current) { suppressClickRef.current = false; return; }
          postSelection(layer.id);
        } : undefined,
      },
    });
  }
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
    opacity: layer.opacity * visibility * (ambient?.opacity ?? 1),
    filter: ambient?.blur ? `blur(${ambient.blur}px)` : undefined,
    transform: `translate(-50%, -50%) translate(${ambientX}%, ${ambientY}%) translate(calc(var(--fvw, 100vw) * ${ambientXVw / 100}), calc(var(--fvh, 100vh) * ${ambientYVh / 100})) scale(${ambientScale}) rotate(${layer.rotation + ambientRotate}deg) scaleX(${layer.flipX ? -1 : 1})`,
    pointerEvents: (editable || interactive) && canHit ? 'auto' : 'none',
    touchAction: editable ? 'none' : 'auto',
    ...cssVars,
  };

  return (
    <div
      className={`${boxClassName} ${className ?? ''} ${selected ? selectedClassName : ''}`}
      style={boxStyle}
      data-cinematic-layer={layer.id}
      data-effect-pose={pose?.side}
      data-cinematic-set={layer.group}
      role={editable ? 'button' : undefined}
      tabIndex={editable && canHit ? 0 : undefined}
      aria-hidden={!canHit || undefined}
      aria-label={editable ? `Edit ${layer.label}` : undefined}
      onKeyDown={keyDown}
      onClick={(event) => {
        event.stopPropagation();
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        postSelection(layer.id);
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
