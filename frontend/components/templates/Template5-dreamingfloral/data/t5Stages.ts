import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 5 (Dreaming Floral Sky) is a DOM/flow template, not a full-screen stage compositor.
 * It opts into the shared layer engine as a **hybrid overlay**: each section keeps its responsive
 * DOM, and layers sit on top of / alongside it, positioned as a percentage of *that section's* box.
 *
 * Two kinds of layer live here:
 *  - **anchor** layers (shipped as defaults below) — no visual of their own; they represent an
 *    existing DOM element (the countdown grid, the ceremony card, …) and nudge it via a transform
 *    (see `useAnchors`). Geometry defaults to identity (x/y 50 = no offset, s 1), so existing
 *    weddings are unchanged until a PRO couple moves one.
 *  - **decorative** layers (text/shape/uploaded img) — added by the couple in the Adjust dock.
 *
 * There's no background image (`bg: ''`). The welcome section has no anchors because its default
 * layout renders names as SVG arc-text, which a transform nudge can't safely target.
 *
 * The rsvp/envelope section carries exactly one layer, `kind: 'scrollVideo'` — the GSAP
 * ScrollTrigger + canvas chromakey effect (see `_shared/effects/ScrollVideoLayer.tsx`). It's
 * listed/editable here like any other layer (Adjust resolves and patches it the same way), but
 * Template5.tsx renders it directly rather than through the generic `<Layer>` dispatch — geometry
 * doesn't apply (it's not a positioned rectangle) and it needs a `triggerRef` + an `onOpenChange`
 * callback that drives sibling UI (the glow ring, tap hint, RSVP-open trigger) that lives in
 * Template5's own JSX. Same precedent as `anchor` layers being listed here but rendered via
 * `useAnchors`, not `<Layer>` — a third rendering strategy for a third layer shape.
 */

export const T5_ASSETS = '/templates/t5';

/**
 * An anchor pseudo-layer at identity (no nudge). `id` must match the DOM element in Template5.
 * `parent` nests it under another anchor in the Adjust panel's layer tree (a sub-layer) — the
 * nudge transform still composes with the parent's, since it's applied to the child's own element.
 */
const anchor = (id: string, label: string, parent?: string): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const stage = (id: string, label: string, layers: Layer[] = []): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

/** Geometry fields are inert for `scrollVideo` (identity values only to satisfy the `Layer`
 *  shape) — Template5 renders this one directly, not through `<Layer>`. */
const scrollVideo = (id: string, label: string, effect: Partial<Layer>): Layer => ({
  id, kind: 'scrollVideo', label,
  x: 50, y: 50, w: 100, h: 100, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...effect,
});

export const T5_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome'),
  countdown: stage('countdown', 'Countdown', [
    anchor('label', 'Countdown Label'),
    anchor('grid', 'Countdown Timer'),
    // Sub-layers: each timer block, nudgeable on its own (nested under the Timer).
    anchor('blk-days', 'Days', 'grid'),
    anchor('blk-hours', 'Hours', 'grid'),
    anchor('blk-min', 'Minutes', 'grid'),
    anchor('blk-sec', 'Seconds', 'grid'),
  ]),
  ceremony: stage('ceremony', 'Ceremony', [
    anchor('title', 'Ceremony Title'),
    anchor('card', 'Ceremony Card'),
    // Sub-layers inside the glass card.
    anchor('body', 'Ceremony Text', 'card'),
    anchor('names', 'Couple Names', 'card'),
  ]),
  wishes: stage('wishes', 'Wishes', [
    anchor('header', 'Wishes Heading'),
  ]),
  photos: stage('photos', 'Photos', [
    anchor('header', 'Photos Heading'),
  ]),
  envelope: stage('envelope', 'Envelope', [
    scrollVideo('video', 'Envelope Video', {
      videoSrc: 'envelope_keyed.mp4',
      triggerStart: 85, triggerEnd: 15, scrub: 0.5,
      pivot: 0.5, holdWidth: 0.04,
      videoStartSec: 0.5, openThreshold: 0.85, resetSec: 0.2,
      chromaThreshold: 30, chromaFade: 20,
    }),
  ]),
};

/** Ordered stage ids for the Adjust dock; `photos` only when the photo booth is on. */
export function t5StageIds(photoBoothEnabled: boolean): string[] {
  const ids = ['welcome', 'countdown', 'ceremony', 'envelope', 'wishes'];
  if (photoBoothEnabled) ids.push('photos');
  return ids;
}
