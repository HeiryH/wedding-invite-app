import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 3 (Garden Romance) is a DOM/flow template, not a full-screen stage compositor. It opts
 * into the shared layer engine as a **hybrid overlay** (same recipe as Template 5/4/6/1). Like
 * Template 1, it renders one section **at a time** (`AnimatePresence mode="wait"` swaps
 * `activeSection`, no continuous scroll) — a stage id here is exactly a `SectionCode`, and the
 * Adjust panel's stage selection drives `activeSection` directly (see Template3.tsx's
 * `editor.selectedStage` effect) instead of scrolling the preview.
 *
 * Two kinds of layer live here:
 *  - **anchor** layers (shipped as defaults below) — no visual of their own; they represent an
 *    existing DOM element (the couple names, the portraits grid, …) and nudge it via a transform
 *    (see `useAnchors`). Geometry defaults to identity (x/y 50 = no offset, s 1), so existing
 *    weddings are unchanged until a PRO couple moves one.
 *  - **decorative** layers (text/shape/uploaded img) — added by the couple in the Adjust dock.
 *
 * There's no background image (`bg: ''`). Nothing here is excluded — Template 3 has no
 * continuously-animated or drag-driven elements like Template 4/6's exclusions.
 */

export const T3_ASSETS = '/templates/t3';

const anchor = (id: string, label: string, parent?: string, extra?: Partial<Layer>): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...extra,
});

const stage = (id: string, label: string, layers: Layer[] = []): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

export const T3_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome', [
    anchor('heading', 'Theme Label', undefined, { styleable: true }),
    anchor('brideName', 'Bride Name', undefined, { styleable: true, animatable: true }),
    anchor('groomName', 'Groom Name', undefined, { styleable: true, animatable: true }),
    // Static chrome text (not read from wedding data) — the couple can retype and restyle it, but
    // its default renders exactly as the literal `&` this replaces in Template3.tsx.
    anchor('connector', 'Names Connector (&)', undefined, { text: '&', hasText: true, styleable: true, animatable: true }),
    anchor('body', 'Invite Body'),
    anchor('dateCard', 'Date / Venue Card'),
    anchor('portraits', 'Portraits Grid'),
    anchor('countdown', 'Countdown', undefined, { styleable: true, animatable: true }),
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
export function t3StageIds(sectionOrder: string[]): string[] {
  return sectionOrder.filter((id) => id in T3_STAGES);
}
