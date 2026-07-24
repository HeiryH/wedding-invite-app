import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 1 (Classic Rose) is a DOM/flow template, not a full-screen stage compositor. It opts
 * into the shared layer engine as a **hybrid overlay** (same recipe as Template 5/4/6): each
 * section keeps its responsive DOM, and layers sit on top of / alongside it, positioned as a
 * percentage of that section's own box.
 *
 * Unlike the other templates, Template 1 renders one section **at a time** — `AnimatePresence
 * mode="wait"` swaps between `activeSection` states rather than a continuous scroll — so a stage
 * id here is exactly a `SectionCode` (`welcome`, `walimah`, `rsvp`, `itinerary`, `wishes`,
 * `photobooth`), and the Adjust panel's stage selection drives `activeSection` directly (see
 * Template1.tsx's `editor.selectedStage` effect) instead of scrolling the preview.
 *
 * Two kinds of layer live here:
 *  - **anchor** layers (shipped as defaults below) — no visual of their own; they represent an
 *    existing DOM element (the couple names, the countdown, …) and nudge it via a transform (see
 *    `useAnchors`). Geometry defaults to identity (x/y 50 = no offset, s 1), so existing weddings
 *    are unchanged until a PRO couple moves one.
 *  - **decorative** layers (text/shape/uploaded img) — added by the couple in the Adjust dock.
 *
 * There's no background image (`bg: ''`). The hero's CTA buttons are intentionally excluded from
 * anchoring — `whileHover`/`whileTap` actively drive their transform on interaction, so a nudged
 * rest position would look glitchy against the button's own scale animation.
 */

export const T1_ASSETS = '/templates/t1';

const anchor = (id: string, label: string, parent?: string): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const stage = (id: string, label: string, layers: Layer[] = []): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

export const T1_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome', [
    anchor('heading', 'Invite Label'),
    anchor('brideName', 'Bride Name'),
    anchor('groomName', 'Groom Name'),
    anchor('body', 'Invite Body'),
    anchor('details', 'Wedding Details Card'),
    anchor('countdown', 'Countdown', 'details'),
  ]),
  walimah: stage('walimah', 'Ceremony', [
    anchor('title', 'Ceremony Title'),
  ]),
  itinerary: stage('itinerary', 'Schedule', [
    anchor('title', 'Schedule Title'),
  ]),
  rsvp: stage('rsvp', 'RSVP', [
    anchor('heading', 'RSVP Heading'),
  ]),
  wishes: stage('wishes', 'Wishes', [
    anchor('heading', 'Wishes Heading'),
  ]),
  photobooth: stage('photobooth', 'Photo Booth', [
    anchor('heading', 'Photo Booth Heading'),
  ]),
};

/** Ordered stage ids for the Adjust dock, matching which sections this wedding actually renders. */
export function t1StageIds(sectionOrder: string[]): string[] {
  return sectionOrder.filter((id) => id in T1_STAGES);
}
