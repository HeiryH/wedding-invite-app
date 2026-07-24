import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 6 (Fairy Garden) is a DOM/flow template, not a full-screen stage compositor. It opts
 * into the shared layer engine as a **hybrid overlay** (same recipe as Template 5/4): each section
 * keeps its responsive DOM, and layers sit on top of / alongside it, positioned as a percentage of
 * that section's own box.
 *
 * Two kinds of layer live here:
 *  - **anchor** layers (shipped as defaults below) — no visual of their own; they represent an
 *    existing DOM element (the couple names, a section title, …) and nudge it via a transform
 *    (see `useAnchors`). Geometry defaults to identity (x/y 50 = no offset, s 1), so existing
 *    weddings are unchanged until a PRO couple moves one.
 *  - **decorative** layers (text/shape/uploaded img) — added by the couple in the Adjust dock.
 *
 * There's no background image (`bg: ''`) — the welcome section's WebGL scene is untouched and
 * unanchored (it's a passive decorative background with no scroll-linked state, so there's nothing
 * unsafe about leaving it alone). The "Scroll to explore" cue button is intentionally excluded:
 * its bounce (`repeat: Infinity`) never settles, so a nudge would fight it every frame.
 *
 * Every welcome-section anchor target is itself a `motion.*` element (unlike Template5, which only
 * ever anchors plain nodes) — those are wrapped in a plain outer element in WelcomeSection.tsx that
 * carries the nudge style, leaving the inner motion node's own entrance animation untouched. The
 * other sections' `sectionTitle` headings are plain `<h2>`s nested under an (already-settled)
 * `motion.div` wrapper, so they're anchored directly, same as Template5's ceremony title/body.
 */

export const T6_ASSETS = '/templates/t6';

const anchor = (id: string, label: string, parent?: string): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const stage = (id: string, label: string, layers: Layer[] = []): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

export const T6_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome', [
    anchor('badge', 'Enchantment Badge'),
    anchor('greeting', 'Firefly Greeting'),
    anchor('names', 'Couple Names'),
    anchor('message', 'Heading Message'),
    anchor('dateVenue', 'Date / Venue Card'),
    anchor('date', 'Date', 'dateVenue'),
    anchor('venue', 'Venue', 'dateVenue'),
    anchor('inviteBody', 'Invite Body'),
  ]),
  walimah: stage('walimah', 'Ceremony', [
    anchor('title', 'Ceremony Title'),
  ]),
  rsvp: stage('rsvp', 'RSVP', [
    anchor('title', 'RSVP Title'),
  ]),
  itinerary: stage('itinerary', 'Programme', [
    anchor('title', 'Programme Title'),
  ]),
  wishes: stage('wishes', 'Wishes', [
    anchor('title', 'Wishes Title'),
  ]),
  photobooth: stage('photobooth', 'Photo Garden', [
    anchor('title', 'Photo Garden Title'),
  ]),
};

/** Ordered stage ids for the Adjust dock, matching which sections this wedding actually renders. */
export function t6StageIds(sections: string[]): string[] {
  return sections.filter((id) => id in T6_STAGES);
}
