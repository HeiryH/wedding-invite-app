import type { Layer, StageDef } from '@/components/templates/_shared/types';
import { ROSE_HORIZON_PROPS, PROP_DEPTH } from './roseHorizonProps';

/**
 * Real `anchor` layers (see `_shared/hooks/useAnchors.ts` / `Template11-rosehorizon/useAnchors.ts`)
 * — same recipe as every other Classic template's `data/tXStages.ts` (compare T3's
 * `t3Stages.ts`). No visual of their own; they nudge/restyle the real DOM elements Template11.tsx
 * already renders. Geometry defaults to identity (x/y 50 = no offset, s 1), so an untouched
 * wedding renders byte-identical to before this existed.
 *
 * The shared `FlowBackground` is deliberately NOT modeled here — it's one continuous asset behind
 * every section, not a per-stage image, so it gets its own stage-independent Adjust panel control
 * instead (`TemplateEngine.pageBackground`, `t11.layout.pageBg.*`) rather than a synthetic
 * per-stage Background row.
 *
 * Every section also gets real `kind:'img'` layers for its shipped `PropLayer` art (roses, icons,
 * the welcome arch) — generated from `ROSE_HORIZON_PROPS` (the ingest pipeline's own measured
 * data) below, rather than hand-duplicated, so the two files can't drift. These render through
 * the shared `<Layer>` component (see PropLayer.tsx), same as any other `img` layer — full
 * drag/resize/hide in the Adjust dock — with PropLayer's reserved-zone collision avoidance
 * applied on top so a nudged prop still can't be dragged permanently under the content panel by
 * the resolve step alone (the couple can still push it there manually if they want).
 */
const anchor = (id: string, label: string, extra?: Partial<Layer>): Layer => ({
  id, kind: 'anchor', label,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...extra,
});

/** A real content-wrapper anchor. It is the expandable parent row in Adjust; its children remain
 * individually editable, while this layer moves/scales/hides the complete section block. */
const group = (id: string, label: string): Layer => anchor(id, label);

/** One shipped decorative image, converted from its ingest-measured manifest entry. `z` is just
 *  array order (1-based) — every prop already paints behind `.panel` via a fixed CSS z-index, so
 *  this only matters for the Adjust panel's front-to-back list ordering. */
function propLayers(section: string): Layer[] {
  return (ROSE_HORIZON_PROPS[section] ?? []).map((p, i) => ({
    id: p.id, kind: 'img', src: p.src,
    x: p.x, y: p.y, w: p.w, h: p.h, s: 1, z: i + 1, order: 0,
    chain: false, hidden: false, opacity: 1, depth: PROP_DEPTH,
  }));
}

function stage(id: string, label: string, anchors: Layer[] = []): StageDef {
  return { id, label, bg: '', bgFit: 'cover', layers: [...propLayers(id), ...anchors] };
}

/**
 * Per-section ids of the shipped props (from `ROSE_HORIZON_PROPS`, so it can't drift from
 * `propLayers` above). Distinguishes "shipped decorative art" from "a couple's own '+Image'
 * addition" — both are plain `kind:'img'` layers once resolved, with no other structural
 * difference, but they render through two different owners: PropLayer.tsx (shipped only —
 * reserved-zone collision avoidance, kept behind the panel) vs. SectionOverlay.tsx (everything
 * else — free z-index, no collision avoidance, same as any other couple-added extra).
 */
export const SHIPPED_PROP_IDS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(ROSE_HORIZON_PROPS).map(([section, props]) => [section, new Set(props.map((p) => p.id))]),
);

/** A `kind:'slot'` layer that renders in normal document flow (see Template11.tsx's
 *  `flowSlotsFor`, which applies the `flow` prop the same way `_shared/Stage.tsx`'s own
 *  `StageDef.flow` branch does) rather than absolute stage position — x/y/w/h are unused in this
 *  mode (kept at identity so the `Layer` type's required fields are satisfied) and only `order`
 *  (document position) and `z` (Adjust-panel list order) matter. */
const slot = (id: string, slotId: string, label: string, extra?: Partial<Layer>): Layer => ({
  id, kind: 'slot', slot: slotId, label,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: false, hidden: false, opacity: 1,
  ...extra,
});

export const T11_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome', [
    group('hero', 'Couple Details'),
    anchor('themeLabel', 'Theme Label', { parent: 'hero', styleable: true }),
    // Split like T7/T10's bride/groom hero pieces — each name individually nudgeable/styleable,
    // rather than one combined "Couple Names" block. The "&" between them stays static markup.
    anchor('nameFirst', 'First Name', { parent: 'hero', styleable: true }),
    anchor('nameSecond', 'Second Name', { parent: 'hero', styleable: true }),
    anchor('date', 'Date', { parent: 'hero', styleable: true }),
    anchor('timer', 'Countdown Timer', { parent: 'hero', styleable: true }),
    anchor('hijri', 'Hijri Date', { parent: 'hero', styleable: true }),
    anchor('venue', 'Venue', { parent: 'hero', styleable: true }),
  ]),
  walimah: stage('walimah', 'Ceremony', [
    group('ceremonyContent', 'Ceremony Details'),
    anchor('title', 'Ceremony Title', { parent: 'ceremonyContent', styleable: true }),
    anchor('body', 'Ceremony Body', { parent: 'ceremonyContent', styleable: true }),
  ]),
  // RSVP/Wishes/Schedule/Photos now render through the shared `_shared/slots/*` registry — the
  // same components T7/T10 use — instead of bespoke JSX, so a couple gets the same per-piece
  // Adjust-panel control (hide/reorder/rename/style/animate) T7/T10 already have. Forms
  // (`presentation:'sheet'`) render in a bottom-sheet pop-up, opened by a `sheetTrigger` button
  // that sits inline in the flow — same split T7/T10 both moved to (see SheetHost.tsx).
  rsvp: stage('rsvp', 'RSVP', [
    group('rsvpContent', 'RSVP'),
    slot('rsvpTitle', 'rsvpTitle', 'RSVP Title', { parent: 'rsvpContent', order: 0, z: 5 }),
    slot('rsvpPrompt', 'rsvpPrompt', 'RSVP Prompt', { parent: 'rsvpContent', order: 1, z: 4 }),
    slot('rsvpForm', 'rsvpForm', 'RSVP Form · in pop-up', { parent: 'rsvpContent', order: 2, z: 3, presentation: 'sheet', sheetId: 'rsvp' }),
    slot('rsvpSeating', 'rsvpSeating', 'Seating · in pop-up', { parent: 'rsvpContent', order: 2, z: 2, presentation: 'sheet', sheetId: 'rsvp' }),
    slot('rsvpTrigger', 'sheetTrigger', 'RSVP Button', { parent: 'rsvpContent', order: 3, z: 1, sheetId: 'rsvp', animIdle: 'wave', animIdleSpeed: 0.75 }),
  ]),
  itinerary: stage('itinerary', 'Schedule', [
    group('itineraryContent', 'Schedule'),
    slot('itineraryTitle', 'itineraryTitle', 'Schedule Title', { parent: 'itineraryContent', order: 0, z: 3 }),
    slot('itineraryList', 'itineraryList', 'Schedule List', { parent: 'itineraryContent', order: 1, z: 2 }),
    // One shared Time style and one shared Label style, applied to every rendered item — not a
    // per-item override (see subLayerStyle.ts's identical T7/T10 precedent). Nested under
    // `itineraryList` in the Adjust panel via `parent`, same shape as T7's own itinerary sub-layers.
    anchor('itin-time', 'Time', { parent: 'itineraryList', styleable: true }),
    anchor('itin-title', 'Label', { parent: 'itineraryList', styleable: true }),
  ]),
  wishes: stage('wishes', 'Wishes', [
    group('wishesContent', 'Wishes'),
    slot('wishTitle', 'wishTitle', 'Wishes Title', { parent: 'wishesContent', order: 0, z: 6 }),
    slot('wishPrompt', 'wishPrompt', 'Wishes Prompt', { parent: 'wishesContent', order: 1, z: 5 }),
    slot('wishForm', 'wishForm', 'Wish Form · in pop-up', { parent: 'wishesContent', order: 2, z: 4, presentation: 'sheet', sheetId: 'wish' }),
    slot('wishPhoto', 'wishPhoto', 'Add a Photo · in pop-up', { parent: 'wishesContent', order: 2, z: 3, presentation: 'sheet', sheetId: 'wish' }),
    slot('wishTrigger', 'sheetTrigger', 'Write a Wish Button', { parent: 'wishesContent', order: 3, z: 2, sheetId: 'wish', animIdle: 'wave', animIdleSpeed: 0.75 }),
    slot('wishList', 'wishList', 'Wishes List', { parent: 'wishesContent', order: 4, z: 1 }),
  ]),
  photobooth: stage('photobooth', 'Photos', [
    group('photoboothContent', 'Photo Booth'),
    // Upload + gallery in one block — PhotoBoothSlot already renders its own title/prompt/upload
    // button/gallery internally (see _shared/slots/PhotoBoothSlot.tsx), so no separate title layer.
    slot('photoBooth', 'photoBooth', 'Photo Booth', { parent: 'photoboothContent', order: 0, z: 1 }),
  ]),
};

export function t11StageIds(sectionOrder: string[]): string[] {
  return sectionOrder.filter((id) => id in T11_STAGES);
}
