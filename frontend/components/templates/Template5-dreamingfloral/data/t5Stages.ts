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
 * The name anchors follow display position, so they respect the template's brideFirst toggle.
 * The welcome heading anchor styles HTML in Minimal and SVG text in Classic and Ornate.
 *
 * The RSVP envelope's scrollVideo is the GSAP scroll-scrub and canvas chromakey effect
 * (see `_shared/effects/ScrollVideoLayer.tsx`). It's
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
const anchor = (id: string, label: string, parent?: string, extra?: Partial<Layer>): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...extra,
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
  welcome: stage('welcome', 'Welcome', [
    anchor('heading', 'Welcome Heading', undefined, { styleable: true }),
    anchor('firstName', 'First Name (position 1)', undefined, { styleable: true, animatable: true }),
    anchor('secondName', 'Second Name (position 2)', undefined, { styleable: true, animatable: true }),
    // Static chrome text (not read from wedding data). Each layout variant's own historical default
    // ('&' for ornate/classic, 'and' for minimal) is passed as `tx()`'s own fallback per call site,
    // so an untouched invitation keeps that variant's byte-identical look; a saved override shows
    // the same text across all three variants.
    anchor('connector', 'Names Connector', undefined, { hasText: true, styleable: true, animatable: true }),
  ]),
  countdown: stage('countdown', 'Countdown', [
    anchor('label', 'Countdown Label', undefined, { styleable: true }),
    anchor('grid', 'Countdown Timer', undefined, { styleable: true }),
    // Sub-layers: each timer block, nudgeable on its own (nested under the Timer).
    anchor('blk-days', 'Days', 'grid'),
    anchor('blk-hours', 'Hours', 'grid'),
    anchor('blk-min', 'Minutes', 'grid'),
    anchor('blk-sec', 'Seconds', 'grid'),
  ]),
  ceremony: stage('ceremony', 'Ceremony', [
    anchor('title', 'Ceremony Title', undefined, { styleable: true }),
    anchor('card', 'Ceremony Card'),
    // Sub-layers inside the glass card.
    anchor('body', 'Ceremony Text', 'card', { styleable: true }),
    anchor('names', 'Couple Names', 'card', { styleable: true }),
    // Date & location sit outside the glass card as their own rectangles (see Template5.tsx) —
    // previously un-anchored entirely.
    anchor('date', 'Date Card', undefined, { styleable: true, animatable: true }),
    anchor('location', 'Location Card', undefined, { styleable: true, animatable: true }),
  ]),
  itinerary: stage('itinerary', 'Itinerary', [
    anchor('title', 'Schedule Title', undefined, { styleable: true }),
    anchor('items', 'Schedule Items', undefined, { styleable: true }),
  ]),
  footer: stage('footer', 'Footer', [
    anchor('tagline', 'Footer Tagline', undefined, { styleable: true }),
  ]),
  wishes: stage('wishes', 'Wishes', [
    anchor('header', 'Wishes Heading', undefined, { styleable: true }),
    anchor('prompt', 'Wishes Prompt', 'header', { styleable: true }),
  ]),
  photos: stage('photos', 'Photos', [
    anchor('header', 'Photos Heading', undefined, { styleable: true }),
  ]),
  envelope: stage('envelope', 'Envelope', [
    scrollVideo('video', 'Envelope Video', {
      videoSrc: 'envelope_keyed.mp4',
      triggerStart: 85, triggerEnd: 15, scrub: 0.5,
      pivot: 0.5, holdWidth: 0.04,
      videoStartSec: 0.5, openThreshold: 0.85, resetSec: 0.2,
      chromaThreshold: 30, chromaFade: 20,
    }),
    anchor('subtitle', 'RSVP Subtitle', undefined, { styleable: true }),
  ]),
};

const STAGES_BY_SECTION: Partial<Record<string, string[]>> = {
  welcome: ['welcome', 'countdown'],
  walimah: ['ceremony'],
  itinerary: ['itinerary'],
  rsvp: ['envelope'],
  wishes: ['wishes'],
  photobooth: ['photos'],
};

export function t5StageIds(sections: string[]): string[] {
  return [...sections.flatMap((section) => STAGES_BY_SECTION[section] ?? []), 'footer'];
}
