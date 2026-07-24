'use client';

import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Layer as LayerModel, SlotProps } from './types';
import { useEngine } from './engine';
import styles from './Stage.module.css';
import './reveal.css';

interface Props {
  layer: LayerModel;
  /** Only `kind: 'slot'` layers need this; decorative overlays (img/text/shape) can omit it. */
  slotProps?: SlotProps;
  /** Above-the-fold stage — its art loads eagerly. */
  eager: boolean;
  selected?: boolean;
  /**
   * True iff this layer's stage is the one currently open in the Adjust dock. Drives click-to-
   * select and drag-to-move/resize by posting straight to the parent customize page — this
   * component renders identically inside the editor iframe and on the public invitation, where
   * `editing` is always false, so none of this attaches there (a stray `postMessage` to itself on
   * the public page is otherwise harmless — no listener is registered — but gating on `editing`
   * means it never fires there at all).
   */
  editing?: boolean;
}

/** One postMessage per animation frame while dragging, mirroring the parent's own rAF-coalesced
 *  PREVIEW_UPDATE — the round trip (this message → parent recomputes config → PREVIEW_UPDATE
 *  echo → this component re-renders with the new x/y) is what actually moves the layer; there is
 *  no local optimistic transform. */
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
  layerH: number;
  chain: boolean;
  moved: boolean;
}

export default function Layer({ layer, slotProps, eager, selected, editing }: Props) {
  const { assetRoot, assetSizes, slotRegistry } = useEngine();
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef(0);
  const pendingPatchRef = useRef<Partial<LayerModel> | null>(null);

  const flushPatch = useCallback(() => {
    rafRef.current = 0;
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = null;
    if (patch) {
      window.parent.postMessage({ type: 'PREVIEW_LAYER_EDIT', layerId: layer.id, patch }, window.location.origin);
    }
  }, [layer.id]);

  const schedulePatch = useCallback((patch: Partial<LayerModel>) => {
    pendingPatchRef.current = patch;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushPatch);
  }, [flushPatch]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const beginDrag = (e: ReactPointerEvent<HTMLDivElement>, mode: DragState['mode']) => {
    if (!editing) return;
    e.stopPropagation();
    if (mode === 'move') {
      window.parent.postMessage({ type: 'PREVIEW_LAYER_SELECT', layerId: layer.id }, window.location.origin);
    }
    // Layer geometry is a percentage of the stage, so the stage's own on-screen box is the frame
    // of reference for converting a pixel drag delta back into that same percentage space.
    const stageEl = boxRef.current?.closest<HTMLElement>('[data-stage]');
    const rect = stageEl?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    dragRef.current = {
      pointerId: e.pointerId, mode,
      startX: e.clientX, startY: e.clientY,
      rectW: rect.width, rectH: rect.height,
      layerX: layer.x, layerY: layer.y, layerW: layer.w, layerH: layer.h, chain: layer.chain,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Frozen drag-start values (not the live `layer` prop) so latency in the parent round-trip can
  // never cause the layer to drift from the pointer — each patch is an absolute position/size
  // computed from the total delta since pointerdown, not an increment from the last frame.
  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dxPct = ((e.clientX - d.startX) / d.rectW) * 100;
    const dyPct = ((e.clientY - d.startY) / d.rectH) * 100;
    if (!d.moved && Math.abs(dxPct) < 0.3 && Math.abs(dyPct) < 0.3) return;
    d.moved = true;
    // Clamped to the same ranges the panel's own sliders use (AdjustPanel.tsx) — a drag has no
    // other bound, so without this a fast swipe could push a layer to an unrecoverable position.
    const clampPos = (v: number) => Math.min(120, Math.max(-20, v));
    const clampSize = (v: number) => Math.min(200, Math.max(3, v));
    if (d.mode === 'resize') {
      // The box is centre-anchored (translate(-50%,-50%)), so growing it to keep the dragged
      // corner under the pointer means both edges move — the width/height delta is doubled.
      const nextW = clampSize(d.layerW + 2 * dxPct);
      schedulePatch(d.chain ? { w: nextW } : { w: nextW, h: clampSize(d.layerH + 2 * dyPct) });
    } else {
      schedulePatch({ x: clampPos(d.layerX + dxPct), y: clampPos(d.layerY + dyPct) });
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); flushPatch(); }
  };

  const anim = layer.anim || 'rise';
  const animOut = layer.animOut && layer.animOut !== 'none' ? layer.animOut : undefined;
  const box: CSSProperties & Record<string, string | number> = {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.w}%`,
    height: layer.chain ? 'auto' : `${layer.h}%`,
    // A numeric z-index makes `.layerBox` its own stacking context, so a selected layer's resize
    // handle — nested inside that context — can never paint or hit-test above a higher-z sibling
    // it happens to overlap. Editing mode should also float the active layer to the front, which
    // conveniently fixes both at once.
    zIndex: editing && selected ? 9999 : layer.z,
    '--sl-scale': layer.s,
    '--sl-opacity': layer.opacity,
    '--sl-delay': `${0.35 + layer.order * 0.22}s`,
    ...(layer.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
  };

  const content = () => {
    switch (layer.kind) {
      case 'img': {
        if (!layer.src) return null;
        // Uploaded art lives under /uploads and has no manifest entry; shipped art does, and the
        // intrinsic size is what reserves the box before decode.
        const size = assetSizes[layer.src];
        const src = layer.src.startsWith('/') ? layer.src : `${assetRoot}/${layer.src}`;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={styles.img}
            width={size?.[0]}
            height={size?.[1]}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'auto'}
            decoding="async"
            draggable={false}
          />
        );
      }

      case 'slot': {
        const Slot = layer.slot ? slotRegistry[layer.slot] : undefined;
        if (!Slot || !slotProps) return null;
        return (
          <div className={styles.slot}>
            <Slot {...slotProps} />
          </div>
        );
      }

      case 'text':
        return (
          <div
            className={styles.text}
            style={{
              color: layer.color ?? '#3F3524',
              fontSize: `${layer.fontSize ?? 4}cqi`,
              fontWeight: layer.fontWeight ?? 600,
            }}
          >
            {layer.text}
          </div>
        );

      case 'shape':
        return (
          <div
            className={styles.shape}
            style={{
              background: layer.fill ?? '#C98A54',
              borderRadius: layer.shape === 'ellipse' ? '50%' : `${layer.radius ?? 0}px`,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={boxRef}
      className={styles.layerBox}
      style={box}
      data-kind={layer.kind}
      data-depth={layer.depth ?? layer.z / 10}
      data-layer={layer.id}
      data-selected={selected || undefined}
      // useParallax sets --sl-fade / --sl-out on this box (they inherit down to the reveal elements).
      data-scroll-fade={anim === 'scroll-fade' || undefined}
      data-scroll-exit={animOut ? true : undefined}
      onPointerDown={editing ? (e) => beginDrag(e, 'move') : undefined}
      onPointerMove={editing ? onDragMove : undefined}
      onPointerUp={editing ? endDrag : undefined}
      onPointerCancel={editing ? endDrag : undefined}
    >
      {/* box: position/parallax/scale · inner: entrance · exit: scroll-out — three elements so the
          three transforms never fight. */}
      <div className={styles.layerInner} data-sl-anim={anim}>
        <div className={styles.layerExit} data-sl-out={animOut}>{content()}</div>
      </div>
      {editing && selected && (
        <div
          className={styles.handle}
          data-role="resize-handle"
          onPointerDown={(e) => beginDrag(e, 'resize')}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      )}
    </div>
  );
}
