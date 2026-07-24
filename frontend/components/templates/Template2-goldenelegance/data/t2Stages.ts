import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 2 (Golden Elegance) is a DOM/flow template, not a full-screen stage compositor. It opts
 * into the shared layer engine as a **hybrid overlay** (same recipe as Template 5/4/6/1/3) — a
 * continuous scroll with real `<section id="...">` elements (like Template 4/5), so a stage id here
 * is exactly a `SectionCode` and no tab-switch adaptation is needed.
 *
 * Two kinds of layer live here:
 *  - **anchor** layers (shipped as defaults below) — no visual of their own; they represent an
 *    existing DOM element (the couple names, the countdown, …) and nudge it via a transform (see
 *    `useAnchors`). Geometry defaults to identity (x/y 50 = no offset, s 1), so existing weddings
 *    are unchanged until a PRO couple moves one.
 *  - **decorative** layers (text/shape/uploaded img) — added by the couple in the Adjust dock.
 *
 * There's no background image (`bg: ''`). Most welcome-section anchor targets here are themselves
 * `motion.*` elements (unlike Template1/3, which have plain equivalents) — those are wrapped in a
 * plain outer element in Template2.tsx that carries the nudge style, leaving the inner motion
 * node's own entrance animation untouched (same technique as Template 6). The decorative ring
 * emoji, the "&" divider, and the "Scroll to RSVP" hint are intentionally excluded: the first two
 * are one-off flourishes not worth an anchor, and the scroll hint's arrow bounces continuously
 * (`repeat: Infinity`), which never settles for a nudge to safely apply to.
 */

export const T2_ASSETS = '/templates/t2';

const anchor = (id: string, label: string, parent?: string): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const stage = (id: string, label: string, layers: Layer[] = []): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

export const T2_STAGES: Record<string, StageDef> = {
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
export function t2StageIds(sectionOrder: string[]): string[] {
  return sectionOrder.filter((id) => id in T2_STAGES);
}
