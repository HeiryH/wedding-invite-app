import type { StageDef, Layer } from '../types';

export const T7_ASSETS = '/templates/t7';

/**
 * Default composition for every stage, authored mobile-first.
 *
 * Geometry is a percentage of the **stage** (i.e. the viewport), not of the artwork — the
 * background is `object-fit: cover` underneath and crops independently. So `x: 50` is screen
 * centre on a phone and on a desktop alike, and a side prop can't wander off the edge just
 * because the viewport got narrow. `desktop` holds sparse overrides for the wide breakpoint.
 *
 * These are starting positions. They're meant to be tuned in the Adjust panel, which writes
 * a delta against them into `t7.layout.<breakpoint>.<stageId>`.
 */

// Defaults every layer inherits, so each entry below only states what's interesting about it.
const L = (layer: Partial<Layer> & Pick<Layer, 'id' | 'kind'>): Layer => ({
  x: 50, y: 50, w: 40, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...layer,
});

export const T7_STAGES: Record<string, StageDef> = {
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    bg: 'welcome/background.webp',
    bgFit: 'cover',
    // The scenery is one picture composed for a 390x844 screen, so it cover-crops as a unit with
    // the background instead of pulling apart on an unusual aspect ratio. Mobile only: the desktop
    // composition is a different picture with its own reference shape, and desktop aspect ratios
    // don't vary the way phone ones do. See StageDef.canvas.
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      L({ id: 'arch',      kind: 'img',  src: 'welcome/arch.webp',           x: 50, y: 40, w: 92,  z: 3, order: 0, depth: 0.5 }),
      L({ id: 'barrier',   kind: 'img',  src: 'welcome/barrier.webp',        x: 50, y: 68, w: 140, z: 5, order: 1, depth: 1.1 }),
      L({ id: 'fountain',  kind: 'img',  src: 'welcome/water-fountain.webp', x: 15, y: 60, w: 28,  z: 4, order: 2, depth: 1.5 }),
      L({ id: 'column',    kind: 'img',  src: 'welcome/plant-column.webp',   x: 87, y: 55, w: 26,  z: 4, order: 3, depth: 1.5 }),
      L({ id: 'stairs',    kind: 'img',  src: 'welcome/stairs.webp',         x: 50, y: 90, w: 105, z: 6, order: 4, depth: 0.8 }),
      // The hero container shows instantly (anim 'none'); its sub-layers below own the animation.
      L({ id: 'countdown', kind: 'slot', slot: 'countdown',                  x: 50, y: 40, w: 74, h: 42, z: 7, order: 5, chain: false, depth: 0.2, anim: 'none', canvasAnchor: true }),
      L({ id: 'cue',       kind: 'slot', slot: 'scrollCue',                  x: 50, y: 95, w: 50, h: 7,  z: 8, order: 6, chain: false, depth: 0 }),
      // Sub-layers of the hero — no visual of their own; the `countdown` slot applies each one's
      // nudge/hide/animation to the matching element (see HeroSlots). Nested under `countdown` in
      // the Adjust panel via `parent`. `order` gives the default staggered entrance cascade.
      L({ id: 'hero-theme', kind: 'anchor', parent: 'countdown', label: 'Theme Label',     order: 0 }),
      L({ id: 'hero-bride', kind: 'anchor', parent: 'countdown', label: 'Bride Name',      order: 1 }),
      L({ id: 'hero-groom', kind: 'anchor', parent: 'countdown', label: 'Groom Name',      order: 2 }),
      L({ id: 'hero-date',  kind: 'anchor', parent: 'countdown', label: 'Date',            order: 3 }),
      L({ id: 'hero-timer', kind: 'anchor', parent: 'countdown', label: 'Countdown Timer', order: 4 }),
    ],
    desktop: {
      arch:      { y: 38, w: 40 },
      barrier:   { y: 64, w: 101 },
      fountain:  { x: 17, y: 55, w: 15 },
      column:    { x: 84, y: 52, w: 13 },
      stairs:    { y: 86, w: 46 },
      countdown: { y: 38, w: 30, h: 34 },
      cue:       { w: 20, h: 6 },
    },
  },

  // The three ceremony beats and the programme share one backdrop — they read as one room you
  // move through, rather than four unrelated scenes.
  'ceremony-walimah': {
    id: 'ceremony-walimah',
    label: 'Ceremony',
    bg: 'ceremony/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      // A landscape architrave: on a portrait phone its straight top edge saws a visible seam
      // across the screen, and scaling it up to hide that pushes the columns off both sides.
      // It's a wide-viewport framing device, so it only exists at the desktop breakpoint.
      L({ id: 'pillars', kind: 'img',  src: 'ceremony/pillars.webp',         x: 50, y: 46, w: 145, z: 2, order: 0, depth: 0.4, hidden: true }),
      L({ id: 'potL',    kind: 'img',  src: 'ceremony/left-plant-pot.webp',  x: 10, y: 76, w: 30,  z: 3, order: 2, depth: 1.4 }),
      L({ id: 'potR',    kind: 'img',  src: 'ceremony/right-plant-pot.webp', x: 90, y: 77, w: 25,  z: 3, order: 3, depth: 1.4 }),
      L({ id: 'bench',   kind: 'img',  src: 'ceremony/bench.webp',           x: 50, y: 86, w: 82,  z: 4, order: 4, depth: 0.9 }),
      L({ id: 'title',   kind: 'slot', slot: 'walimahTitle',                 x: 50, y: 20, w: 60, h: 8,  z: 6, order: 0, chain: false, depth: 0.3, label: 'Ceremony Title' }),
      L({ id: 'body',    kind: 'slot', slot: 'walimahBody',                  x: 50, y: 52, w: 72, h: 42, z: 5, order: 1, chain: false, depth: 0.2, label: 'Ceremony Body' }),
    ],
    desktop: {
      pillars: { y: 49, w: 101, hidden: false },
      potL:    { x: 18, y: 72, w: 18 },
      potR:    { x: 83, y: 73, w: 14 },
      bench:   { y: 80, w: 44 },
      title:   { y: 18, w: 26, h: 8 },
      body:    { y: 46, w: 36, h: 36 },
    },
  },

  'ceremony-couple': {
    id: 'ceremony-couple',
    label: 'The Couple',
    bg: 'ceremony/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      // A landscape architrave: on a portrait phone its straight top edge saws a visible seam
      // across the screen, and scaling it up to hide that pushes the columns off both sides.
      // It's a wide-viewport framing device, so it only exists at the desktop breakpoint.
      L({ id: 'pillars', kind: 'img',  src: 'ceremony/pillars.webp',         x: 50, y: 46, w: 145, z: 2, order: 0, depth: 0.4, hidden: true }),
      L({ id: 'potL',    kind: 'img',  src: 'ceremony/left-plant-pot.webp',  x: 10, y: 76, w: 30,  z: 3, order: 2, depth: 1.4 }),
      L({ id: 'potR',    kind: 'img',  src: 'ceremony/right-plant-pot.webp', x: 90, y: 77, w: 25,  z: 3, order: 3, depth: 1.4 }),
      L({ id: 'bench',   kind: 'img',  src: 'ceremony/bench.webp',           x: 50, y: 86, w: 82,  z: 4, order: 4, depth: 0.9 }),
      L({ id: 'title',   kind: 'slot', slot: 'coupleTitle',                  x: 50, y: 20, w: 62, h: 8,  z: 6, order: 0, chain: false, depth: 0.3, label: 'Couple Title' }),
      L({ id: 'couple',  kind: 'slot', slot: 'coupleNames',                  x: 50, y: 52, w: 74, h: 44, z: 5, order: 1, chain: false, depth: 0.2, label: 'Couple Names' }),
    ],
    desktop: {
      pillars: { y: 49, w: 101, hidden: false },
      potL:    { x: 18, y: 72, w: 18 },
      potR:    { x: 83, y: 73, w: 14 },
      bench:   { y: 80, w: 44 },
      title:   { y: 18, w: 28, h: 8 },
      couple:  { y: 46, w: 38, h: 36 },
    },
  },

  'ceremony-details': {
    id: 'ceremony-details',
    label: 'Details',
    bg: 'ceremony/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      // A landscape architrave: on a portrait phone its straight top edge saws a visible seam
      // across the screen, and scaling it up to hide that pushes the columns off both sides.
      // It's a wide-viewport framing device, so it only exists at the desktop breakpoint.
      L({ id: 'pillars', kind: 'img',  src: 'ceremony/pillars.webp',         x: 50, y: 46, w: 145, z: 2, order: 0, depth: 0.4, hidden: true }),
      L({ id: 'potL',    kind: 'img',  src: 'ceremony/left-plant-pot.webp',  x: 10, y: 76, w: 30,  z: 3, order: 2, depth: 1.4 }),
      L({ id: 'potR',    kind: 'img',  src: 'ceremony/right-plant-pot.webp', x: 90, y: 77, w: 25,  z: 3, order: 3, depth: 1.4 }),
      L({ id: 'bench',   kind: 'img',  src: 'ceremony/bench.webp',           x: 50, y: 86, w: 82,  z: 4, order: 4, depth: 0.9 }),
      L({ id: 'title',   kind: 'slot', slot: 'detailsTitle',                 x: 50, y: 18, w: 64, h: 8,  z: 6, order: 0, chain: false, depth: 0.3, label: 'Details Title' }),
      L({ id: 'details', kind: 'slot', slot: 'ceremonyDetails',              x: 50, y: 52, w: 76, h: 46, z: 5, order: 1, chain: false, depth: 0.2, label: 'Date, Venue & Buttons' }),
    ],
    desktop: {
      pillars: { y: 49, w: 101, hidden: false },
      potL:    { x: 18, y: 72, w: 18 },
      potR:    { x: 83, y: 73, w: 14 },
      bench:   { y: 80, w: 44 },
      title:   { y: 16, w: 30, h: 8 },
      details: { y: 46, w: 40, h: 38 },
    },
  },

  'ceremony-programme': {
    id: 'ceremony-programme',
    label: 'Programme',
    bg: 'ceremony/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      // Desktop-only — see the note on the other ceremony stages.
      L({ id: 'pillars',   kind: 'img',  src: 'ceremony/pillars.webp',         x: 50, y: 46, w: 145, z: 2, order: 0, depth: 0.4, hidden: true }),
      L({ id: 'potL',      kind: 'img',  src: 'ceremony/left-plant-pot.webp',  x: 10, y: 76, w: 30,  z: 3, order: 2, depth: 1.4 }),
      L({ id: 'potR',      kind: 'img',  src: 'ceremony/right-plant-pot.webp', x: 90, y: 77, w: 25,  z: 3, order: 3, depth: 1.4 }),
      L({ id: 'title',     kind: 'slot', slot: 'itineraryTitle',                x: 50, y: 16, w: 64, h: 8,  z: 6, order: 0, chain: false, depth: 0.3, label: 'Schedule Title' }),
      L({ id: 'programme', kind: 'slot', slot: 'itineraryList',                 x: 50, y: 54, w: 78, h: 54, z: 5, order: 1, chain: false, depth: 0.2, label: 'Schedule List' }),
    ],
    desktop: {
      pillars:   { y: 49, w: 101, hidden: false },
      potL:      { x: 18, y: 72, w: 18 },
      potR:      { x: 83, y: 73, w: 14 },
      title:     { y: 14, w: 30, h: 8 },
      programme: { y: 50, w: 44, h: 48 },
    },
  },

  // Shared frame art for the compiled ceremony ROW (scene.ceremony.layout = 'row'). Rendered ONCE
  // across the whole row by HorizontalRail, so geometry here is a percentage of the **entire row**
  // (N beats × 100vw), not of a single stage: `x:50` is the middle of the room, `x:5`/`x:95` are the
  // two ends, and a width is a fraction of the whole row (so a pot stays pot-sized — ~w:6 — while a
  // piece meant to span reads large). This is a separate stage from the per-beat art the stacked
  // layout uses, so the two coordinate systems never collide. Not a scroll section (absent from
  // STAGE_GROUPS); it surfaces in the Adjust panel as the "Ceremony Backdrop" entry.
  'ceremony-rail': {
    id: 'ceremony-rail',
    label: 'Ceremony Backdrop',
    // This stage owns the row's single shared background: the rail resolves and renders it (with
    // the couple's Fit/Position/Scale/Replace overrides) so it's adjusted here, in one place,
    // exactly like any other stage's background.
    bg: 'ceremony/background.webp',
    bgFit: 'cover',
    layers: [
      L({ id: 'rail-pillars', kind: 'img', src: 'ceremony/pillars.webp',         x: 50, y: 46, w: 34, z: 2, order: 0, depth: 0.4, hidden: true }),
      L({ id: 'rail-potL',    kind: 'img', src: 'ceremony/left-plant-pot.webp',   x: 5,  y: 76, w: 9,  z: 3, order: 1, depth: 1.4 }),
      L({ id: 'rail-potR',    kind: 'img', src: 'ceremony/right-plant-pot.webp',  x: 95, y: 77, w: 8,  z: 3, order: 2, depth: 1.4 }),
      L({ id: 'rail-bench',   kind: 'img', src: 'ceremony/bench.webp',            x: 50, y: 86, w: 27, z: 4, order: 3, depth: 0.9 }),
    ],
    desktop: {
      'rail-pillars': { y: 49, w: 34, hidden: false },
      'rail-potL':    { y: 72, w: 6 },
      'rail-potR':    { y: 73, w: 5 },
      'rail-bench':   { y: 80, w: 15 },
    },
  },

  rsvp: {
    id: 'rsvp',
    label: 'RSVP',
    bg: 'rsvp/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    // Split like `wishes` below (title / prompt / form) plus a fourth layer, `seating`, only
    // reachable when the wedding's tier/feature includes it (SLOT_AVAILABLE.rsvpSeating gates on
    // `seatingEnabled`, same flag every other seating-aware control already reads). `form` and
    // `seating` share one guest flow (see `_shared/slots/rsvpFlow.tsx`) and by default occupy the
    // same box, since only one is ever on screen for a real guest at a time — they're independently
    // repositionable anyway, same as any other layer. `form` keeps its pre-split layer id so a
    // wedding's already-saved override (a moved/resized step-1 box) keeps applying unchanged.
    layers: [
      L({ id: 'frame',   kind: 'img',  src: 'rsvp/frame.webp',      x: 50, y: 44, w: 148, z: 2, order: 0, depth: 0.3 }),
      L({ id: 'pots',    kind: 'img',  src: 'rsvp/plant-pots.webp', x: 50, y: 90, w: 140, z: 3, order: 2, depth: 1.2 }),
      L({ id: 'title',   kind: 'slot', slot: 'rsvpTitle',           x: 50, y: 22, w: 70, h: 8,  z: 6, order: 0, chain: false, depth: 0.3, label: 'RSVP Title' }),
      L({ id: 'prompt',  kind: 'slot', slot: 'rsvpPrompt',          x: 50, y: 31, w: 78, h: 6,  z: 5, order: 0, chain: false, depth: 0.3, label: 'RSVP Prompt' }),
      L({ id: 'form',    kind: 'slot', slot: 'rsvpForm',    presentation: 'sheet', sheetId: 'rsvp', x: 50, y: 54, w: 74, h: 44, z: 5, order: 1, chain: false, depth: 0.15, label: 'RSVP Form (step 1) · in pop-up' }),
      L({ id: 'seating', kind: 'slot', slot: 'rsvpSeating', presentation: 'sheet', sheetId: 'rsvp', x: 50, y: 54, w: 74, h: 44, z: 4, order: 1, chain: false, depth: 0.15, label: 'Seating (step 2) · in pop-up' }),
      // No idle animation: this is a primary action in a quiet composition, and a button that
      // never stops moving reads as noise (it also makes the control a moving tap target). The
      // wishes trigger floats because it's decorative art the guest has to notice; this doesn't.
      L({ id: 'rsvpOpen', kind: 'slot', slot: 'sheetTrigger', sheetId: 'rsvp', x: 50, y: 54, w: 46, h: 8, z: 6, order: 1, chain: false, depth: 0.15, label: 'RSVP Button' }),
    ],
    desktop: {
      frame:   { y: 40, w: 60 },
      pots:    { y: 86, w: 97 },
      title:   { y: 20, w: 30, h: 8 },
      prompt:  { y: 28, w: 34, h: 6 },
      form:    { y: 48, w: 42, h: 38 },
      seating: { y: 48, w: 42, h: 38 },
      rsvpOpen: { y: 50, w: 22, h: 7 },
    },
  },

  wishes: {
    id: 'wishes',
    label: 'Wishes',
    bg: 'wishes/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      L({ id: 'title',     kind: 'img',  src: 'wishes/title.webp',           x: 50, y: 13, w: 84,  z: 3, order: 0, depth: 0.4 }),
      L({ id: 'titleText', kind: 'slot', slot: 'wishTitle',                  x: 50, y: 15, w: 66, h: 9, z: 6, order: 0, chain: false, depth: 0.4, canvasAnchor: true }),
      L({ id: 'partition', kind: 'img',  src: 'wishes/title-partition.webp', x: 50, y: 21, w: 34,  z: 4, order: 1, depth: 0.5 }),
      L({ id: 'prompt',    kind: 'slot', slot: 'wishPrompt',                 x: 50, y: 27, w: 80, h: 7, z: 5, order: 2, chain: false, depth: 0.3 }),
      L({ id: 'card',      kind: 'img',  src: 'wishes/msg.webp',             x: 50, y: 50, w: 108, z: 3, order: 2, depth: 0.3 }),
      L({ id: 'leaf',      kind: 'img',  src: 'wishes/leaf-deco.webp',       x: 50, y: 70, w: 96,  z: 4, order: 4, depth: 1 }),
      L({ id: 'form',      kind: 'slot', slot: 'wishForm',  presentation: 'sheet', sheetId: 'wish', x: 50, y: 52, w: 78, h: 26, z: 5, order: 3, chain: false, depth: 0.2, label: 'Wish Form (step 1) · in pop-up' }),
      L({ id: 'wishPhoto', kind: 'slot', slot: 'wishPhoto', presentation: 'sheet', sheetId: 'wish', x: 50, y: 52, w: 78, h: 30, z: 4, order: 4, chain: false, depth: 0.2, label: 'Add a Photo (step 2) · in pop-up' }),
      // The list takes over the space the form used to reserve, so it sits *on* the `card`
      // parchment rather than below it — that plate was only ever there to back the form.
      L({ id: 'list',      kind: 'slot', slot: 'wishList',                   x: 50, y: 56, w: 88, h: 44, z: 5, order: 5, chain: false, depth: 0 }),
      // Floats via `animIdle: 'wave'` (reveal.css) — a continuous, reduced-motion-aware bob, not a
      // bespoke keyframe. Artwork is dropped in later via `sheet.wish.image` or this layer's
      // `src`; until then SheetTriggerSlot renders a labelled button in the same box.
      L({ id: 'wishOpen',  kind: 'slot', slot: 'sheetTrigger', sheetId: 'wish', x: 50, y: 88, w: 34, h: 12, z: 7, order: 4, chain: false, depth: 0.2, label: 'Write a Wish Button', animIdle: 'wave', animIdleSpeed: 0.75, animIdleIntensity: 1 }),
    ],
    desktop: {
      title:     { y: 12, w: 40 },
      titleText: { y: 13, w: 32, h: 8 },
      partition: { y: 19, w: 16 },
      prompt:    { y: 24, w: 44, h: 6 },
      card:      { y: 47, w: 54 },
      leaf:      { y: 66, w: 54 },
      form:      { y: 46, w: 40, h: 26 },
      wishPhoto: { y: 46, w: 40, h: 30 },
      list:      { y: 54, w: 54, h: 40 },
      wishOpen:  { y: 86, w: 16, h: 10 },
    },
  },

  photobooth: {
    id: 'photobooth',
    label: 'Photos',
    bg: 'photobooth/background.webp',
    bgFit: 'cover',
    canvas: { mobile: { w: 390, h: 844 } },
    layers: [
      L({ id: 'partition', kind: 'img',  src: 'photobooth/title-partition.webp', x: 50, y: 14, w: 36,  z: 3, order: 0, depth: 0.5 }),
      L({ id: 'frame',     kind: 'img',  src: 'photobooth/frame.webp',           x: 50, y: 46, w: 100, z: 2, order: 1, depth: 0.3 }),
      L({ id: 'columnL',   kind: 'img',  src: 'photobooth/left-column.webp',     x: 8,  y: 55, w: 26,  z: 4, order: 3, depth: 1.2 }),
      L({ id: 'oval',      kind: 'img',  src: 'photobooth/oval-frame.webp',      x: 88, y: 40, w: 26,  z: 4, order: 4, depth: 1 }),
      L({ id: 'square',    kind: 'img',  src: 'photobooth/square-frame.webp',    x: 90, y: 66, w: 22,  z: 4, order: 5, depth: 1.1 }),
      L({ id: 'iconMsg',   kind: 'img',  src: 'photobooth/icon-msg.webp',        x: 50, y: 80, w: 62,  z: 4, order: 6, depth: 0.8 }),
      L({ id: 'deco',      kind: 'img',  src: 'photobooth/bottom-deco.webp',     x: 50, y: 93, w: 28,  z: 3, order: 7, depth: 0.8 }),
      // Gallery only — the wish sheet's optional photo step is T7's single upload path.
      L({ id: 'booth',     kind: 'slot', slot: 'photoGallery',                   x: 50, y: 46, w: 76, h: 46, z: 5, order: 2, chain: false, depth: 0.15 }),
    ],
    desktop: {
      partition: { y: 15, w: 18 },
      frame:     { y: 44, w: 56 },
      columnL:   { x: 16, y: 52, w: 13 },
      oval:      { x: 80, y: 40, w: 15 },
      square:    { x: 84, y: 64, w: 12 },
      iconMsg:   { y: 78, w: 34 },
      deco:      { y: 92, w: 14 },
      booth:     { y: 44, w: 44, h: 40 },
    },
  },
};

/** Which logical `section.order` code each stage belongs to. */
export const STAGE_GROUPS: Record<string, string[]> = {
  welcome: ['welcome'],
  walimah: ['ceremony-walimah', 'ceremony-couple', 'ceremony-details'],
  itinerary: ['ceremony-programme'],
  rsvp: ['rsvp'],
  wishes: ['wishes'],
  photobooth: ['photobooth'],
};

export const T7_DEFAULTS: Record<string, string> = {
  'scene.parallax': 'on',
  'scene.ceremony.layout': 'stack',
  'scene.ink.tint': '#3D3833',
  'scene.paper.grain': 'true',
  'invite.theme_label': 'Roman Garden',
  'ceremony.panel.couple_title': 'The Bride & Groom',
  'ceremony.panel.details_title': 'Ceremony Details',
  'rsvp.seating_prompt': 'Choose your table',
};
