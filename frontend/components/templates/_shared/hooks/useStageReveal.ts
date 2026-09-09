import { useEffect, useState, useRef } from 'react';

/**
 * Marks a stage "seen" the first time it's meaningfully on screen. Reveal itself is pure CSS —
 * this only flips a data attribute, so the staggered entrance costs no JS per frame.
 *
 * Once seen, a stage stays seen: scrolling back up must not replay the entrance.
 */
export function useStageReveal(reduced: boolean) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const stages = Array.from(root.querySelectorAll<HTMLElement>('[data-stage]'));
    if (!stages.length) return;

    // No motion, or no IntersectionObserver: show everything at once rather than never.
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setSeen(new Set(stages.map((s) => s.dataset.stage!)));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const arrived = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.15)
          .map((e) => (e.target as HTMLElement).dataset.stage!);
        if (!arrived.length) return;

        // On a cold load, decoding/network delay naturally puts a real paint of the pre-reveal
        // state (opacity 0, translateY 42px — reveal.css's `[data-sl-anim]` base rule) between
        // mount and this callback, so the CSS transition to `[data-seen='true']`'s target state
        // has something to animate from. On a warm/cached reload everything can resolve fast
        // enough that this observer's very first callback fires in the same frame as mount —
        // the browser then never gets to paint the pre-reveal state at all, so there's nothing
        // for the transition to interpolate from and every layer just snaps straight to "revealed"
        // with no visible animation. The standard fix: defer the state flip by two animation
        // frames, which guarantees a real paint of the pre-reveal state happens first regardless
        // of how fast everything else loaded.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setSeen((prev) => {
            const next = new Set(prev);
            let changed = false;
            for (const id of arrived) if (!next.has(id)) { next.add(id); changed = true; }
            return changed ? next : prev;
          });
        }));

        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.15) io.unobserve(e.target);
        }
      },
      { threshold: [0, 0.15, 0.35] },
    );

    stages.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [reduced]);

  return { rootRef, seen };
}
