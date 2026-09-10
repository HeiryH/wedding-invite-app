/** Per-layer stagger for the entrance reveal (reveal.css's `--sl-delay`), shared by Layer.tsx
 *  (every ordinary layer) and HeroSlots.tsx (T7's hero sub-layers — same reveal system, computed
 *  inline because HeroPiece is a bespoke wrapper, not a Layer). Pulled into one place so the two
 *  call sites can't drift, not to change the formula itself.
 *
 *  Grows linearly with `order`, uncapped — a later piece on a busy stage waits longer for its
 *  turn than an earlier one, however many layers the stage has, and no two layers ever land at
 *  the same instant. A capped version was tried (2026-09-10) to cut total settle time on dense
 *  stages, but that made every layer past the cap arrive simultaneously — it read as "a few
 *  staggered items, then everything else at once," dulling the cascade — reverted same day.
 *
 *  2026-09-10 (later same day): instead of capping the total, shrunk the *step* between items
 *  (0.22s → 0.11s) — the cascade is unchanged (still strictly one-after-another, never tied), it's
 *  just packed tighter. A 14-layer stage's last item now starts at ~1.8s instead of ~3.2s. If
 *  total delay needs trimming further, look at the reveal's own defer (useStageReveal.ts) or
 *  `--sl-dur` before shrinking this step again — shrinking it much more starts to read as "all at
 *  once" rather than a cascade. */
const STAGGER_BASE_S = 0.35;
const STAGGER_STEP_S = 0.11;

export function staggerDelay(order: number): string {
  return `${STAGGER_BASE_S + order * STAGGER_STEP_S}s`;
}
