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

        // On a cold load, the public invite page (a client component that fetches its event/config
        // data in a useEffect) shows a loading placeholder for however long that fetch takes, so
        // the real Stage/Layer tree — and this observer — don't even mount until real time has
        // already passed, which is what let the pre-reveal state (opacity 0, translateY 42px —
        // reveal.css's `[data-sl-anim]` base rule) get painted before this callback ever fires. On
        // a fully warm/cached reload that gap can shrink well past the point of mattering, and
        // measured directly (real browser, cold vs. warm reload of the same page): a 2-frame
        // (`requestAnimationFrame` ×2) defer here — the standard fix for "no paint happened between
        // states" — was NOT enough; the CSS transition still got skipped, snapping straight to
        // revealed with no visible animation. A flat 500ms defer measured reliably correct across
        // repeated warm reloads (rAF-based approaches only guarantee frame ordering, not real
        // elapsed time, and whatever's actually gating this — most likely React settling the
        // freshly-mounted tree together with something else on an unusually quiet main thread — is
        // apparently not bounded by a couple of frames). The cost is identical on every load: this
        // only delays the point at which `data-seen` is *allowed* to flip, not the reveal's own
        // `--sl-delay`/`--sl-dur` timing once it does — on a cold load that already-existing gap is
        // usually bigger than 500ms anyway, so warm reloads end up matching, not lagging, the cold
        // experience.
        setTimeout(() => {
          setSeen((prev) => {
            const next = new Set(prev);
            let changed = false;
            for (const id of arrived) if (!next.has(id)) { next.add(id); changed = true; }
            return changed ? next : prev;
          });
        }, 500);

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
