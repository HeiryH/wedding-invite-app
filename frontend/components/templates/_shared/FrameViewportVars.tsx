'use client';

/**
 * Pins `--fvw`/`--fvh`/`--fsvh`/`--fsat`/`--fsar`/`--fsab`/`--fsal` on `document.documentElement`
 * to the Adjust Editor's previewed device frame — see `docs/FIX_QUEUE.md` Issue 2.
 *
 * Written to `:root`, not a wrapper div, because `SheetHost` mounts *outside* the themed root
 * (a sibling of every `<Stage>`, inside Template7's `.wrapper`) and `.sheetCard`/`.lightboxOverlay`/
 * T7's `.tint`/`.grain`/`.navRail` are all `position: fixed` — only `:root` reaches all of them.
 *
 * Mounted exactly once, in `app/(standalone)/organizer-admin/preview/page.tsx` — never in
 * `TemplateWrapper`, so the public invitation and `/template-preview/[code]` stay untouched and
 * every CSS use site's `var(--fsvh, 100svh)` fallback simply resolves to the real viewport unit.
 */

import { useEffect } from 'react';
import type { FrameViewport } from './types';
import { setPinnedFrame } from './frameViewport';

export default function FrameViewportVars({ frame }: { frame?: FrameViewport }) {
  useEffect(() => {
    if (!frame) return;

    // A non-finite value here makes `.stage { height: var(--fsvh) }` invalid at computed-value
    // time -> `height: auto` -> `container-type: size` (Stage.module.css) collapses every
    // art-canvas stage to zero. Guard loudly rather than debug a blank preview later.
    const nums = [frame.w, frame.h, frame.svh, frame.safe.top, frame.safe.right, frame.safe.bottom, frame.safe.left];
    if (!nums.every((n) => Number.isFinite(n) && n >= 0)) {
      console.error('[FrameViewportVars] refusing to pin an invalid frame', frame);
      return;
    }

    const style = document.documentElement.style;
    const entries: [string, number][] = [
      ['--fvw', frame.w], ['--fvh', frame.h], ['--fsvh', frame.svh],
      ['--fsat', frame.safe.top], ['--fsar', frame.safe.right],
      ['--fsab', frame.safe.bottom], ['--fsal', frame.safe.left],
    ];
    for (const [prop, val] of entries) style.setProperty(prop, `${val}px`);
    setPinnedFrame(frame);

    return () => {
      for (const [prop] of entries) style.removeProperty(prop);
      setPinnedFrame(null);
    };
  }, [frame]);

  return null;
}
