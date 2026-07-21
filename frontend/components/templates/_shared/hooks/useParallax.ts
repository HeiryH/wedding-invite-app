import { useEffect } from 'react';

const INTENSITY: Record<string, number> = { on: 1, subtle: 0.45, off: 0 };

/**
 * Drifts every `[data-depth]` layer as it crosses the viewport.
 *
 * Deliberately not GSAP/ScrollTrigger: eight stages × ~7 layers would mean 50-odd ScrollTriggers
 * and a 40 KB dependency to animate one custom property. A single passive scroll listener writing
 * `--sl-par` is cheaper and keeps the transform composition (see Stage.module.css) simple —
 * the layer's own transform owns position and scale, parallax only contributes a translateY.
 */
export function useParallax(
  rootRef: React.RefObject<HTMLElement | null>,
  mode: string,
  reduced: boolean,
) {
  useEffect(() => {
    const root = rootRef.current;
    // Reduced motion: skip both effects. reveal.css shows scroll-fade layers at full opacity, and
    // parallax is off, so there's nothing to drive here.
    if (!root || reduced) return;

    const intensity = INTENSITY[mode] ?? 1;
    const parallaxOn = intensity > 0;
    // A HorizontalRail owns motion for its own subtree (horizontal `--sl-par-x`/`--sl-out`), so skip
    // anything inside `[data-rail]` here to avoid double-writing the vertical vars.
    const inRail = (el: HTMLElement) => el.closest('[data-rail]') !== null;
    const depthLayers = parallaxOn
      ? Array.from(root.querySelectorAll<HTMLElement>('[data-depth]')).filter((el) => !inRail(el))
      : [];

    // Half strength on a phone: the same drift reads as a wobble on a small screen.
    const scale = window.matchMedia('(max-width: 768px)').matches ? 0.5 : 1;
    let frame = 0;
    // Track fade/exit layers we've written to so cleanup can reset them.
    const fadeTouched = new Set<HTMLElement>();
    const exitTouched = new Set<HTMLElement>();

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;

      for (const el of depthLayers) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) continue; // far off-screen — skip the write

        const depth = Number(el.dataset.depth) || 0;
        // -1 above the viewport, 0 centred, +1 below it
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.setProperty('--sl-par', `${progress * depth * -28 * intensity * scale}px`);
      }

      // Continuous scroll-fade: opacity tracks how centred the layer is. Re-queried each frame so a
      // layer switched to 'scroll-fade' in the Adjust editor takes effect without a remount.
      for (const el of root.querySelectorAll<HTMLElement>('[data-scroll-fade]')) {
        if (inRail(el)) continue;
        const rect = el.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh; // 0 centred, ±1 near edges
        const p = Math.abs(progress);
        // Full opacity within the central band, fading to 0 as the centre nears leaving the screen.
        const fade = p <= 0.35 ? 1 : p >= 0.9 ? 0 : 1 - (p - 0.35) / 0.55;
        el.style.setProperty('--sl-fade', fade.toFixed(3));
        fadeTouched.add(el);
      }

      // Scroll-scrubbed exit: 0 while the layer is in view, ramping to 1 as its centre moves up past
      // the middle and leaves the top. `progress` is negative above the viewport centre, so `up`
      // (= -progress) is the leaving amount. Only the leaving side ramps, so the one-shot entrance
      // (bottom entry, progress > 0) is untouched; scrolling back down reverses it.
      for (const el of root.querySelectorAll<HTMLElement>('[data-scroll-exit]')) {
        if (inRail(el)) continue;
        const rect = el.getBoundingClientRect();
        const up = -(rect.top + rect.height / 2 - vh / 2) / vh; // >0 once the centre passes above middle
        const out = up <= 0.15 ? 0 : up >= 0.85 ? 1 : (up - 0.15) / 0.7;
        el.style.setProperty('--sl-out', out.toFixed(3));
        exitTouched.add(el);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      for (const el of depthLayers) el.style.removeProperty('--sl-par');
      for (const el of fadeTouched) el.style.removeProperty('--sl-fade');
      for (const el of exitTouched) el.style.removeProperty('--sl-out');
    };
  }, [rootRef, mode, reduced]);
}
