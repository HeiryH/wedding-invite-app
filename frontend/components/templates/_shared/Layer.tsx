'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Layer as LayerModel, SlotProps } from './types';
import { IDLE_BASE_DUR } from './idle';
import { useEngine } from './engine';
import { DEFAULT_SHEET, useSheets } from './slots/sheets';
import { fontVar } from '@/lib/fonts/curated';
import CurvedText from './CurvedText';
import ScrollVideoLayer from './effects/ScrollVideoLayer';
import { resolveBindings } from './bindings';
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
  /** Only ever passed (true) for `kind:'slot'` layers inside a `StageDef.flow` stage (see
   *  Stage.tsx) — renders in normal document flow (width%, centred, z-stacked) instead of the
   *  usual absolutely-positioned box, so the slot's own content height determines the section's
   *  height rather than clipping to a fixed 100svh. The reveal/idle/exit chain is unchanged
   *  (data-attribute driven, doesn't care which element it's nested under). */
  flow?: boolean;
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

export default function Layer({ layer, slotProps, eager, selected, editing, flow }: Props) {
  const { assetRoot, assetSizes, slotRegistry } = useEngine();
  const sheets = useSheets();
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollVideoOpen, setScrollVideoOpen] = useState(false);
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
    // Layer geometry is a percentage of its positioning frame, so that frame's own on-screen box
    // is what converts a pixel drag delta back into the same percentage space. For a layer inside
    // an aspect-locked art canvas (Stage.tsx / StageDef.canvas) the frame is the canvas — which is
    // deliberately a real layout box, not a scaled one, so its rect needs no compensation. Falling
    // back to the stage would make every drag drift by the cover-crop factor, worst on exactly the
    // screen shapes the canvas exists to fix.
    const frameEl = boxRef.current?.closest<HTMLElement>('[data-canvas], [data-stage]');
    const rect = frameEl?.getBoundingClientRect();
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
  const animIdle = layer.animIdle && layer.animIdle !== 'none' ? layer.animIdle : undefined;
  const idleStyle: CSSProperties & Record<string, string | number> | undefined = animIdle
    ? {
        '--sl-idle-intensity': layer.animIdleIntensity ?? 1,
        '--sl-idle-dur': `${IDLE_BASE_DUR[animIdle] / (layer.animIdleSpeed ?? 1)}s`,
      }
    : undefined;
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
  // Flow-mode slot item: stays in normal document flow (no left/top/translate), just a
  // width%-constrained, centred, z-stacked block. `position: relative` (not static) is what lets
  // its explicit z-index interleave correctly with the stage's absolutely-positioned decorative
  // overlay layers, without taking it out of flow the way `position: absolute` would.
  const flowBox: CSSProperties & Record<string, string | number> = {
    position: 'relative',
    width: `${layer.w}%`,
    maxWidth: '100%',
    margin: '0 auto',
    zIndex: layer.z,
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
        // `.slot`'s inner-scroll (`overflow-y: auto`) is right for a slot clipped to a fixed
        // 100svh box, but wrong in flow mode — there the section itself grows to fit the slot,
        // so the slot should size naturally instead of scrolling inside a collapsed box.
        // nav/music render their real UI via `position: fixed` (ChromeSlots.tsx) — they escape
        // this wrapper's box entirely, so the wrapper's own nominal geometry (wherever the author
        // placed the layer) would otherwise sit as an invisible, clickable dead zone on top of
        // whatever real content happens to occupy that same spot. `.navRail`/`.musicBubble`
        // re-assert `pointer-events: auto` for themselves.
        const chromeFixed = layer.slot === 'nav' || layer.slot === 'music';
        // Read by slots.module.css's form text (.field/.choice/.wishTextarea) — a direct manual
        // multiplier on top of whatever the slot's own box-relative cqi sizing already gives them.
        const slotStyle: CSSProperties & Record<string, string | number> = {
          '--slot-text-scale': layer.textScale ?? 1,
          ...(chromeFixed ? { pointerEvents: 'none' } : null),
        };
        return (
          <div
            className={flow ? styles.flowSlotContent : styles.slot}
            style={slotStyle}
          >
            <Slot {...slotProps} layer={layer} />
          </div>
        );
      }

      case 'text': {
        // `{{brideName}}`-style tokens let one authored layer (shared across every wedding on
        // that template) resolve per-visitor wedding data — see bindings.ts. A layer with no
        // `{{` in its text (the common case, including every hand-authored template's own
        // literal strings) is returned unchanged.
        const resolvedText = resolveBindings(layer.text, slotProps);
        if (layer.textShape && layer.textShape !== 'flat') {
          return <CurvedText layer={layer} text={resolvedText} />;
        }
        const hasShadow = Boolean(layer.shadowBlur || layer.shadowX || layer.shadowY);
        return (
          <div
            className={styles.text}
            style={{
              color: layer.color ?? '#3F3524',
              fontSize: `${layer.fontSize ?? 4}cqi`,
              fontWeight: layer.fontWeight ?? 600,
              fontFamily: fontVar(layer.fontFamily),
              letterSpacing: layer.letterSpacing !== undefined ? `${layer.letterSpacing}em` : undefined,
              wordSpacing: layer.wordSpacing !== undefined ? `${layer.wordSpacing}em` : undefined,
              border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor ?? '#000'}` : undefined,
              borderRadius: layer.borderWidth && layer.radius ? `${layer.radius}px` : undefined,
              textShadow: hasShadow
                ? `${layer.shadowX ?? 0}px ${layer.shadowY ?? 0}px ${layer.shadowBlur ?? 0}px ${layer.shadowColor ?? 'rgba(0,0,0,0.4)'}`
                : undefined,
            }}
          >
            {resolvedText}
          </div>
        );
      }

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

      case 'scrollVideo': {
        if (!layer.videoSrc) return null;
        const src = layer.videoSrc.startsWith('/') ? layer.videoSrc : `${assetRoot}/${layer.videoSrc}`;
        // `boxRef` (this layer's own positioned box) doubles as the ScrollTrigger measurement
        // element — it's already the on-screen rect this layer occupies, so no extra wrapper is
        // needed the way Template5.tsx's bespoke envelopeWrapperRef was. Tapping while fully open
        // opens the sheet this layer names (`Layer.sheetId`), mirroring Template5.tsx's own
        // envelope-tap-to-RSVP gesture. This is the whole mp4-trigger story: to swap a button for
        // an animated envelope, change the trigger layer's `kind` and keep its `sheetId`.
        return (
          <div
            onClick={() => { if (scrollVideoOpen) sheets.open(layer.sheetId || DEFAULT_SHEET); }}
            role={scrollVideoOpen ? 'button' : undefined}
            style={{ width: '100%', height: '100%', cursor: scrollVideoOpen ? 'pointer' : undefined }}
          >
            <ScrollVideoLayer
              src={src}
              triggerRef={boxRef}
              layer={layer}
              onOpenChange={setScrollVideoOpen}
              className={styles.scrollVideo}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      ref={boxRef}
      className={flow ? styles.flowItem : styles.layerBox}
      style={flow ? flowBox : box}
      data-kind={layer.kind}
      data-depth={layer.depth ?? layer.z / 10}
      data-layer={layer.id}
      data-selected={selected || undefined}
      // useParallax sets --sl-fade / --sl-out on this box (they inherit down to the reveal elements).
      data-scroll-fade={anim === 'scroll-fade' || undefined}
      data-scroll-exit={animOut ? true : undefined}
      // A flow item stays in normal document flow — no drag-to-move/resize (its position is
      // determined by content order, not x/y), but it's still click-to-select in the editor.
      onPointerDown={editing && !flow ? (e) => beginDrag(e, 'move') : editing ? () => window.parent.postMessage({ type: 'PREVIEW_LAYER_SELECT', layerId: layer.id }, window.location.origin) : undefined}
      onPointerMove={editing && !flow ? onDragMove : undefined}
      onPointerUp={editing && !flow ? endDrag : undefined}
      onPointerCancel={editing && !flow ? endDrag : undefined}
    >
      {/* box: position/parallax/scale · inner: entrance · idle: continuous loop · exit: scroll-out
          — four elements so the transforms never fight (each owns its own nested node). */}
      <div className={styles.layerInner} data-sl-anim={anim}>
        <div className={styles.layerIdle} data-sl-idle={animIdle} style={idleStyle}>
          <div className={styles.layerExit} data-sl-out={animOut}>{content()}</div>
        </div>
      </div>
      {editing && selected && !flow && (
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
