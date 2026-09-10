import { useEffect, useState, useRef } from 'react';

/**
 * Marks a stage "seen" the first time it's meaningfully on screen. Reveal itself is pure CSS —
 * this only flips a data attribute, so the staggered entrance costs no JS per frame.
 *
 * Once seen, a stage stays seen: scrolling back up must not replay the entrance.
 *
 * `stageKey` should change whenever the set of mounted `[data-stage]` elements can change (a
 * section reordered, toggled on/off, or a stage's content otherwise reflows the DOM) — e.g. pass
 * `stageIds.join(',')`. Without it, a stage that first appears mid-session (after the initial
 * mount) is never queried, never observed, and stays permanently at reveal.css's pre-reveal
 * opacity: 0 — its background still paints (that's a plain img, not gated by data-seen), so only
 * the animated content looks "missing."
 */
export function useStageReveal(reduced: boolean, stageKey = '') {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const seenRef = useRef(seen);
  seenRef.current = seen;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Skip stages already marked seen — re-observing them would be harmless on its own, but
    // guards against a future change that clears an IO entry's isIntersecting on disconnect.
    // More importantly this keeps this effect's job scoped to *newly mounted* stages, matching
    // the "once seen, stays seen" contract in the doc comment above.
    const stages = Array.from(root.querySelectorAll<HTMLElement>('[data-stage]'))
      .filter((s) => !seenRef.current.has(s.dataset.stage!));
    if (!stages.length) return;

    // No motion, or no IntersectionObserver: show everything at once rather than never.
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setSeen((prev) => {
        const next = new Set(prev);
        for (const s of stages) next.add(s.dataset.stage!);
        return next;
      });
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
        // a fully warm/cached reload that gap can shrink well past the point of mattering, and a
        // 2-frame (`requestAnimationFrame` ×2) defer here — the standard fix for "no paint happened
        // between states" — was measured NOT enough at the time: the CSS transition still got
        // skipped, snapping straight to revealed with no visible animation. A flat 500ms defer
        // fixed it then. Re-measured 2026-09-10 (this repo's own dev server, 6 repeated warm
        // reloads per value, sampling the welcome stage's opacity via rAF through the whole
        // transition window to confirm a real ramp — not just a start/end snapshot): every value
        // from 500ms down to 0ms reproduced a smooth transition reliably, including no defer at
        // all. That's a real behavior change since the original measurement, not a flaw in that
        // measurement — something else in how this mounts today (this file's own stageKey
        // re-subscribe fix among other changes since) most likely closed the gap the defer was
        // covering. Left at 150ms rather than 0: real headroom under where it started failing
        // before (a couple of frames), in case a slower device or a network condition this
        // environment doesn't reproduce still needs it — but a 4th of a second lighter than before
        // will be plainly quicker to guests, and re-verifiable the same way if it ever needs
        // revisiting. Still doesn't touch `--sl-delay`/`--sl-dur` once `data-seen` flips — see
        // Layer.tsx for the per-layer stagger, and reveal.css for the transition itself.
        setTimeout(() => {
          setSeen((prev) => {
            const next = new Set(prev);
            let changed = false;
            for (const id of arrived) if (!next.has(id)) { next.add(id); changed = true; }
            return changed ? next : prev;
          });
        }, 150);

        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.15) io.unobserve(e.target);
        }
      },
      { threshold: [0, 0.15, 0.35] },
    );

    stages.forEach((s) => io.observe(s));
    return () => io.disconnect();
    // stageKey is a deliberate proxy for "the set of [data-stage] elements changed"; seen is read
    // via seenRef, not a dep, so a reveal never replays.
  }, [reduced, stageKey]);

  return { rootRef, seen };
}
