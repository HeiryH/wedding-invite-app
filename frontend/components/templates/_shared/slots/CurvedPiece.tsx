'use client';

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { Layer } from '../types';
import CurvedText, { curvedAspect } from '../CurvedText';
import { staggerDelay } from '../reveal';
import { backdropSrcOf, backdropTransform } from '../backdrop';

/**
 * The Style tab's Shape control (arc/circle) for a *sub-layer* piece — the hero's title, a section
 * heading, any `styleable` anchor that owns a line of text.
 *
 * A curve can't be applied to an arbitrary element: `<CurvedText>` lays the glyphs out along an SVG
 * `<textPath>`, so it has to own the text node itself. `curvedTextOf` therefore only opts in when
 * the piece's child renders **one plain string** (`<p>{bound(...)}</p>`, the shape every text piece
 * in the slot catalog uses) — a composite child such as the countdown grid, or a line with an
 * inline icon, returns undefined and keeps its flat rendering. That's also why the Shape control
 * is offered for `kind:'text'` layers and sub-layers with `hasText` only (see AdjustPanel).
 */
export function curvedTextOf(layer: Layer | undefined, children: ReactElement): string | undefined {
  if (!layer?.textShape || layer.textShape === 'flat') return undefined;
  const kids = (children.props as { children?: ReactNode }).children;
  if (typeof kids === 'string') return kids;
  if (typeof kids === 'number') return String(kids);
  return undefined;
}

/** The curved replacement for a piece's flat child, carrying the same entrance-animation hooks
 *  the `cloneElement` path applies (see each slot file's `Piece`/`HeroPiece`). */
export function CurvedPiece({ layer, text, anim, assetRoot }: {
  layer: Layer;
  text: string;
  anim: string;
  /** Resolves a template-relative `backdropSrc`; see backdrop.ts. */
  assetRoot?: string;
}) {
  // The piece keeps roughly the FLAT line's height in flow, and the curve is absolutely positioned
  // and centred on it — so switching a piece to arc/circle overlaps its neighbours instead of
  // pushing them down the hero. The curve's own box is only as tall as the geometry needs
  // (`curvedAspect`), which also keeps the overhang small enough to stay inside the slot's
  // `overflow-y: auto` box — a fixed 2:1 box was clipped away entirely.
  const line = (layer.fontSize ?? 4) * (layer.lineHeight ?? 1.25);
  return (
    <div
      data-sl-anim={anim}
      data-scroll-fade={anim === 'scroll-fade' ? true : undefined}
      style={{
        position: 'relative',
        width: '100%',
        // Never let a flex parent shrink-wrap this: the SVG inside is sized as a % of this box.
        alignSelf: 'stretch',
        height: `${line}cqi`,
        '--sl-opacity': layer.opacity ?? 1,
        '--sl-delay': staggerDelay(layer.order ?? 0),
        ...(layer.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
      } as CSSProperties}
    >
      {/* The backdrop rides the same box as the curve — a curved piece replaces the flat child
          entirely, so without this the plate vanished whenever Shape wasn't 'flat'. Centred on
          the curve and free to be bigger than it, exactly as in the flat case. */}
      {backdropSrcOf(layer, assetRoot) && (
        <img
          src={backdropSrcOf(layer, assetRoot)}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: backdropTransform(layer),
            // Size means "% of the text" in the flat case, where the box hugs the words. A
            // curve's box spans the whole row instead, so the same number would make the art
            // roughly twice as wide the moment you switch Shape — halved here so one slider
            // reads the same in both modes.
            width: `${(layer.backdropScale ?? 140) * 0.5}%`,
            height: 'auto',
            maxWidth: 'none',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          aspectRatio: String(curvedAspect(layer)),
          // A full `circle` ring is as tall as it is wide; cap the overhang so it can't reach past
          // the slot's own clip. The SVG's default `preserveAspectRatio` then fits the ring inside
          // (smaller, fully visible) rather than cropping it.
          maxHeight: `${line * 10}cqi`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <CurvedText layer={layer} text={text} />
      </div>
    </div>
  );
}
