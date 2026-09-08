'use client';

import { useEffect, useRef, useState } from 'react';
import type { EditorHandle, Layer as LayerModel, ObjectFit, SlotProps, StageDef } from './types';
import { useEngine } from './engine';
import { frameSvh, frameW } from './frameViewport';
import Stage from './Stage';
import Layer from './Layer';
import styles from './HorizontalRail.module.css';

export interface RailPanel {
  def: StageDef;
  /** Per-beat content only (slots). Shared art is lifted into the rail's shared plane. */
  layers: LayerModel[];
  bgFit: ObjectFit;
}

interface Props {
  /** Ordered panels — each carries only its own beat content (slots). */
  panels: RailPanel[];
  /** Frame art shared by the whole row, rendered ONCE in a full-width plane. Positioned as a
   *  percentage of the entire row, so a wide piece (a pillar) spans across the beats. */
  sharedLayers: LayerModel[];
  /** Stage id the shared art edits/persists under (its Adjust-panel entry). Also carried on a
   *  scroll anchor so selecting that tab pans the preview to the room's start. */
  sharedStageId?: string;
  /** Shared background asset path relative to the engine's assetRoot (all panels share one). */
  bg: string;
  /** Background placement overrides for the shared background (from the shared stage's resolve),
   *  so it's adjusted in the panel exactly like any other stage's background. */
  bgFit?: ObjectFit;
  bgPosition?: string;
  bgScale?: number;
  /** Uploaded replacement (absolute /uploads/… path) — wins over `bg`. */
  bgSrc?: string;
  slotProps: SlotProps;
  editing?: boolean;
  editor?: EditorHandle;
  /** scene.parallax !== 'off' — drives the background drift + per-layer horizontal parallax. */
  parallaxOn: boolean;
  /** The very first stage on the whole page loads its art eagerly. */
  firstEager?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** A group of same-background stages rendered as one pinned, horizontally-panning "room". Vertical
 *  scroll through the tall outer wrapper translates the track sideways; the shared background drifts
 *  slower (parallax); the frame art spans the row in one shared plane; each beat's content reveals
 *  as it centres and each shared art piece reveals as it individually pans into view. */
export default function HorizontalRail({
  panels, sharedLayers, sharedStageId, bg, bgFit = 'cover', bgPosition, bgScale, bgSrc,
  slotProps, editing, editor, parallaxOn, firstEager,
}: Props) {
  const { assetRoot } = useEngine();
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<number>>(new Set());
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const n = panels.length;
  const panMax = Math.max(1, n - 1);
  // An uploaded replacement lives under /uploads (absolute); shipped art is relative to the root.
  const bgUrl = bgSrc ? bgSrc : bg ? `${assetRoot}/${bg}` : '';
  const shared = sharedLayers.filter((l) => !l.hidden);

  // Per-element reveal: each shared art piece animates in the first time it pans into view (not when
  // its beat centres). IntersectionObserver honours the plane's CSS transform, so a layer parked at
  // the row's right end stays hidden until the pin pans to it. One-shot, then unobserve.
  useEffect(() => {
    const plane = planeRef.current;
    if (!plane) return;
    const nodes = Array.from(plane.querySelectorAll<HTMLElement>('[data-layer]'));
    if (!nodes.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      for (const el of nodes) el.setAttribute('data-seen', 'true');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.1) {
            (e.target as HTMLElement).setAttribute('data-seen', 'true');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: [0, 0.1] },
    );
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shared.length]);

  useEffect(() => {
    const rail = railRef.current;
    const track = trackRef.current;
    if (!rail || !track) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = rail.getBoundingClientRect();
      // `frameSvh()`/`frameW()` read the Adjust Editor's pinned preview frame when set, falling
      // back to `window.inner*` otherwise (see `_shared/frameViewport.ts`). Matters specifically
      // under "Reveal off-screen": the ambient iframe viewport is widened well past the rail's own
      // `.sticky`/`.panel` boxes, so reading raw `window.inner*` here would pan/parallax against
      // the wrong scale (docs/FIX_QUEUE.md Issue 2).
      const vh = frameSvh();
      const vw = frameW();
      const denom = rect.height - vh;
      const p = denom > 0 ? clamp(-rect.top / denom, 0, 1) : 0; // 0 = start, 1 = last panel centred

      // Emitted in px, not `vw` strings — `--rail-x`/`--rail-bg-x` no longer need to agree with
      // whatever `.panel`'s own CSS `vw` happens to resolve to (see HorizontalRail.module.css,
      // itself migrated to `var(--fvw, 100vw)`); both now derive from the same `vw` read above.
      const railX = `${(-p * panMax * vw).toFixed(2)}px`;
      track.style.setProperty('--rail-x', railX);
      if (planeRef.current) planeRef.current.style.setProperty('--rail-x', railX);
      if (bgRef.current) bgRef.current.style.setProperty('--rail-bg-x', `${(-p * 0.4 * vw).toFixed(2)}px`);

      let next: Set<number> | null = null;
      const panelEls = track.children;
      for (let i = 0; i < n; i++) {
        const el = panelEls[i] as HTMLElement | undefined;
        if (!el) continue;
        const panelProgress = i - p * panMax; // 0 centred, <0 panned off the left
        // Exit: ramps as the panel leaves toward the left (reuses reveal.css `[data-sl-out]`).
        const out = clamp((-panelProgress - 0.15) / 0.7, 0, 1);
        el.style.setProperty('--sl-out', out.toFixed(3));
        // Horizontal parallax: layers drift by depth as the room pans.
        if (parallaxOn) {
          for (const dl of el.querySelectorAll<HTMLElement>('[data-depth]')) {
            const depth = Number(dl.dataset.depth) || 0;
            dl.style.setProperty('--sl-par-x', `${(panelProgress * depth * 24).toFixed(1)}px`);
          }
        }
        // Entrance: one-shot once the panel is near centre (drives reveal.css `[data-seen]`).
        if (Math.abs(panelProgress) < 0.6 && !seenRef.current.has(i)) {
          (next ??= new Set(seenRef.current)).add(i);
        }
      }
      if (next) { seenRef.current = next; setSeen(next); }

      // Shared-plane art: exit + horizontal parallax computed per element from its on-screen box,
      // since a spanning piece isn't tied to a single panel. (Entrance is the IO above.)
      const plane = planeRef.current;
      if (plane) {
        for (const el of plane.querySelectorAll<HTMLElement>('[data-layer]')) {
          const r = el.getBoundingClientRect();
          const centreX = r.left + r.width / 2;
          const off = (centreX - vw / 2) / vw; // 0 centred, <0 panned left of centre
          if (parallaxOn) {
            const depth = Number(el.dataset.depth) || 0;
            el.style.setProperty('--sl-par-x', `${(off * depth * 24).toFixed(1)}px`);
          }
          if (el.matches('[data-scroll-exit]')) {
            const out = clamp((-off - 0.35) / 0.4, 0, 1); // leaves as its centre passes the left edge
            el.style.setProperty('--sl-out', out.toFixed(3));
          }
        }
      }
    };

    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [n, panMax, parallaxOn, shared.length]);

  return (
    <div ref={railRef} className={styles.rail} data-rail style={{ height: `calc(var(--fsvh, 100svh) * ${n})` }}>
      {/* Per-panel scroll anchors: `getElementById(stageId).scrollIntoView()` lands the vertical
          scroll at the offset that pans the pin to that panel (editor "scroll to stage"). */}
      {/* Selecting the "Ceremony Backdrop" tab pans the preview to the room's start. */}
      {sharedStageId && (
        <div id={sharedStageId} className={styles.anchor} style={{ top: 0 }} aria-hidden />
      )}
      {panels.map((p, i) => (
        <div key={`${p.def.id}-anchor`} id={p.def.id} className={styles.anchor}
          style={{ top: `${(i / n) * 100}%` }} aria-hidden />
      ))}

      <div className={styles.sticky}>
        {bgUrl && (
          // Wrapper owns the parallax drift (--rail-bg-x); the img owns fit/position/scale, so the
          // shared background honours the same adjustments as any stage background.
          <div ref={bgRef} className={styles.bg} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgUrl}
              alt=""
              className={styles.bgImg}
              style={{
                objectFit: bgFit,
                objectPosition: bgPosition,
                transform: bgScale && bgScale !== 1 ? `scale(${bgScale})` : undefined,
              }}
              draggable={false}
            />
          </div>
        )}

        {/* Shared frame art — rendered once across the full row so a wide piece spans the beats. */}
        <div ref={planeRef} className={styles.plane} style={{ width: `calc(var(--fvw, 100vw) * ${n})` }}>
          {shared.map((l, i) => (
            <Layer
              key={l.id}
              layer={l}
              slotProps={slotProps}
              eager={Boolean(firstEager) && i === 0}
              selected={editing && editor?.selectedStage === sharedStageId && editor?.selectedLayer === l.id}
              editing={editing && editor?.selectedStage === sharedStageId}
            />
          ))}
        </div>

        <div ref={trackRef} className={styles.track} style={{ width: `calc(var(--fvw, 100vw) * ${n})` }}>
          {panels.map((p, i) => (
            <div key={p.def.id} className={styles.panel}>
              <Stage
                def={{ ...p.def, bg: '' }} // background is shared by the rail, not per-panel
                layers={p.layers}
                bgFit={p.bgFit}
                seen={seen.has(i)}
                slotProps={slotProps}
                eager={Boolean(firstEager) && i === 0}
                editing={editing && editor?.selectedStage === p.def.id}
                selectedLayer={editor?.selectedLayer}
                suppressId
                transparent
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
