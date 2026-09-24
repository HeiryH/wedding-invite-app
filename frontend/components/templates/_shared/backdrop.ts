import type { CSSProperties } from 'react';
import type { Layer } from './types';

/**
 * Turns a layer's `backdropSrc`/`backdropFit`/`backdropPad`/`backdropBleed` into the CSS that
 * paints a plate, ribbon or banner *behind the text itself*.
 *
 * The point is that the art and the words become one element: nudge the text, restyle it, animate
 * it or curve it, and its backdrop comes along. A template shipping the same look as a separate
 * `img` layer (T13's hero ribbon did) has to keep the two in register by hand, and they drift
 * apart the moment a couple moves either one.
 *
 * `resolve` maps a template-relative path onto the engine's `assetRoot`, exactly as `Layer.tsx`
 * does for `src` — an uploaded `/uploads/…` path is already absolute and passes through.
 */
export function backdropStyle(layer: Layer, resolve: (src: string) => string): CSSProperties {
  if (!layer.backdropSrc) return {};
  const fit = layer.backdropFit ?? 'contain';
  const pad = layer.backdropPad ?? 0.4;
  const bleed = layer.backdropBleed ?? 0;
  return {
    // The art is usually taller than the line it frames, and `contain` fits to the shorter axis —
    // so the element is given a height to fill and the words are centred inside it.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Hug the text rather than the row: a full-width box makes `contain` fit the art to the
    // box's height and leaves a thumbnail floating in the middle of empty space. With the box
    // sized to the words (+ Bleed), the art spans what it's framing.
    width: 'max-content',
    maxWidth: '100%',
    alignSelf: 'center',
    // `alignSelf` only centres it when the backed element is itself the flex child; a hero piece
    // sits inside a stretched wrapper, where a `max-content` block would otherwise hug the left.
    marginInline: 'auto',
    minHeight: `${layer.backdropHeight ?? 2.6}em`,
    backgroundImage: `url("${resolve(layer.backdropSrc)}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: fit === 'stretch' ? '100% 100%' : fit,
    // Padding keeps the words off the art's edges; Bleed is extra horizontal room so a ribbon's
    // tails sit beyond the words rather than under them.
    padding: `${pad}em ${pad + bleed}em`,
  };
}
