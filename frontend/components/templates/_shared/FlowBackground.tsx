import { useEffect, useRef, useState } from 'react';
import styles from './FlowBackground.module.css';

interface FlowBackgroundProps {
  /** The single tileable image, e.g. `/templates/rose-horizon/bg/flow.webp`. */
  src: string;
  /** Natural height of one tile, px — used to size the stack and pick the tile count. */
  tileHeight: number;
  /** Fraction of page scroll the background drifts at. 0 = pinned, 1 = scrolls with content. */
  parallaxRate?: number;
  className?: string;
}

/**
 * A full-page background built from ONE tileable image, stacked with every other copy
 * vertically flipped ("mirror"/ping-pong tiling) instead of CSS `background-repeat`.
 *
 * Why not `background-repeat: repeat-y`: that requires the tile's own top row to match its
 * bottom row, in the same orientation — a real constraint on the art, and one this specific
 * tile doesn't cleanly satisfy (a measurable tone step at the join, see spec/background.md).
 * Flipping every other copy removes the constraint entirely: copy N's bottom edge meets copy
 * N+1's top edge, which after the flip IS the same row — pixel-identical by construction,
 * regardless of whether the tile's two ends ever matched each other. Every join becomes a
 * mirror reflection, not a repeat, so there is nothing to seam-check.
 *
 * Why JS and not CSS at all: plain `background-repeat` cannot alternate orientation per tile —
 * there is no mirror-repeat keyword in CSS. So the tiles are real stacked `<img>` elements.
 *
 * Sized to content, not guessed: a ResizeObserver on `document.documentElement` recomputes the
 * tile count whenever page height changes (content loaded, fonts swapped, viewport resized), so
 * this works for however long a given invite's content turns out to be, with no fixed assumption
 * baked in anywhere.
 */
export function FlowBackground({ src, tileHeight, parallaxRate = 0.3, className }: FlowBackgroundProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [tileCount, setTileCount] = useState(3);

  useEffect(() => {
    const recompute = () => {
      // Headroom: the inner stack must stay tall enough to cover the viewport across the whole
      // parallax range, i.e. content height's worth of scroll, drifted at parallaxRate.
      const contentHeight = document.documentElement.scrollHeight;
      const needed = window.innerHeight + contentHeight * parallaxRate;
      setTileCount(Math.max(2, Math.ceil(needed / tileHeight) + 1));
    };
    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(document.documentElement);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [tileHeight, parallaxRate]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      inner.style.setProperty('--flowbg-y', `${-window.scrollY * parallaxRate}px`);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [parallaxRate]);

  return (
    <div className={`${styles.viewport} ${className ?? ''}`} aria-hidden="true">
      <div ref={innerRef} className={styles.inner}>
        {Array.from({ length: tileCount }, (_, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={styles.tile}
            style={i % 2 === 1 ? { transform: 'scaleY(-1)' } : undefined}
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
