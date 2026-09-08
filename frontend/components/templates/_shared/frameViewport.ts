/**
 * Module-scope singleton holding the currently-pinned preview frame (if any) — see
 * `FrameViewportVars.tsx` and `docs/FIX_QUEUE.md` Issue 2.
 *
 * Not a React context and not a `getComputedStyle` read: `useParallax` and `HorizontalRail` read
 * this inside a `requestAnimationFrame` loop, where a context read isn't available and a style
 * read is a layout-thrash hazard. `undefined`/no pin ⇒ fall back to the real `window.inner*`, which
 * is exactly what a guest's browser (no pin ever set) should use.
 */

import type { FrameViewport } from './types';

let pinned: FrameViewport | null = null;

export function setPinnedFrame(frame: FrameViewport | null): void {
  pinned = frame;
}

export function frameW(): number {
  return pinned?.w ?? (typeof window !== 'undefined' ? window.innerWidth : 0);
}

/** The Safari-*visible* height — what `.stage { height: 100svh }` actually is. Use this, not
 *  `frameLvh`, anywhere the real invitation reads `svh` (e.g. `useParallax`'s scroll math). */
export function frameSvh(): number {
  return pinned?.svh ?? (typeof window !== 'undefined' ? window.innerHeight : 0);
}
