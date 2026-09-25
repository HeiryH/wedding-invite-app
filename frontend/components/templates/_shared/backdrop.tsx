'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { Layer } from './types';

/**
 * A plate, ribbon or banner painted behind a piece of text, as part of the same element — so the
 * art and the words move, scale, animate and curve as one thing. A template shipping the same
 * look as a separate `img` layer (T13's hero ribbon did) has to keep the two in register by hand,
 * and they drift apart the moment a couple moves either one.
 *
 * It's a real `<img>` behind the text, not a CSS `background-image`. A background is clipped to
 * its element's own box, so making the art bigger than the words meant inflating the text box
 * with padding — which pushed neighbours around and, in a flex row, drifted off centre. An
 * absolutely-positioned image is free to be **larger than the text and overlap whatever is
 * around it**, while `left/top: 50%` + `translate(-50%, -50%)` keeps it centred on the words no
 * matter how big it gets. `height: auto` keeps its own aspect, so Size is the only control.
 */
export function backdropSrcOf(layer: Layer, assetRoot?: string): string | undefined {
  const src = layer.backdropSrc;
  if (!src) return undefined;
  return src.startsWith('/') || !assetRoot ? src : `${assetRoot}/${src}`;
}

/** Wraps `children` with the layer's backdrop art behind it. Returns the children untouched when
 *  the layer has none, so a caller can use it unconditionally. */
export function Backdrop({ layer, assetRoot, children, style }: {
  layer?: Layer;
  assetRoot?: string;
  children: ReactNode;
  /** Merged onto the wrapper — the caller's own layout for the text. */
  style?: CSSProperties;
}) {
  const src = layer && backdropSrcOf(layer, assetRoot);
  if (!src) return <>{children}</>;
  return (
    <span
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Hug the words, so Size is measured against the TEXT and not against whatever width the
        // row happens to have — a stretched wrapper made 140% mean "140% of the whole hero".
        width: 'max-content',
        maxWidth: '100%',
        marginInline: 'auto',
        // Keeps the art's z-index local, so it can never slide behind a neighbouring layer.
        isolation: 'isolate',
        ...style,
      }}
    >
      <img
        src={src}
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) rotate(${layer?.backdropRotate ?? 0}deg)`,
          // % of the text's own width; >100 overflows symmetrically and stays centred.
          width: `${layer?.backdropScale ?? 140}%`,
          height: 'auto',
          maxWidth: 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </span>
  );
}
