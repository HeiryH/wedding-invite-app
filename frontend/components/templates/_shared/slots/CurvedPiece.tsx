'use client';

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { Layer } from '../types';
import CurvedText from '../CurvedText';
import { staggerDelay } from '../reveal';

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
export function CurvedPiece({ layer, text, anim }: { layer: Layer; text: string; anim: string }) {
  return (
    <div
      data-sl-anim={anim}
      data-scroll-fade={anim === 'scroll-fade' ? true : undefined}
      style={{
        // CurvedText is an SVG with a 200×100 viewBox and `height: 100%`; a sub-layer piece is a
        // flow element with no height of its own, so give the box that same 2:1 aspect or the
        // glyphs render against a collapsed height and spill over the neighbours.
        width: '100%',
        aspectRatio: '2 / 1',
        '--sl-opacity': layer.opacity ?? 1,
        '--sl-delay': staggerDelay(layer.order ?? 0),
        ...(layer.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
      } as CSSProperties}
    >
      <CurvedText layer={layer} text={text} />
    </div>
  );
}
