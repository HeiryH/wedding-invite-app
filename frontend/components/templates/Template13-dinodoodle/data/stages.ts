import type { Layer, StageDef } from '../types';

export const T13_ASSETS = '/templates/dino-doodle-party';

// Mobile keeps the accepted portrait composition. Desktop switches to a square art canvas so the
// same layers crop as a wide hero instead of scaling a 1:1.66 portrait until its text leaves the
// viewport; the background itself still cover-crops independently.
const CANVAS = { mobile: { w: 1024, h: 1696 }, desktop: { w: 1024, h: 1024 } };

const L = (layer: Partial<Layer> & Pick<Layer, 'id' | 'kind'>): Layer => ({
  x: 50, y: 50, w: 40, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...layer,
});

const A = (
  id: string,
  parent: string,
  label: string,
  order: number,
  text?: string,
  extra?: Partial<Layer>,
): Layer => L({
  id, kind: 'anchor', parent, label, order,
  styleable: true, hasText: text !== undefined, text,
  anim: 'rise', animOut: 'fade-out',
  ...extra,
});

export const T13_STAGES: Record<string, StageDef> = {
  welcome: {
    id: 'welcome', label: 'Park Entrance', bg: 'backgrounds/welcome.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'stone-timber-entrance', kind: 'img', src: 'props/stone-timber-entrance.webp', x: 50, y: 26.5, w: 102, z: 3, order: 0, anim: 'fade', animOut: 'fade-out', depth: 0.05 }),


      L({ id: 'egg-nest', kind: 'img', src: 'props/egg-nest.webp', x: 15, y: 77.5, w: 29, z: 5, order: 5, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.35 }),
      L({ id: 'trex-greeter', kind: 'img', src: 'props/trex-greeter.webp', x: 79, y: 75.5, w: 45, z: 5, order: 6, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.4 }),
      // Foreground foliage set (2026-09-22): hanging border leaves in the top corners, fern clusters
      // flanking the trail, and one wide foliage+stone strip along the bottom edge that grounds the
      // nest/T-rex. Bottom strip deliberately overhangs the canvas edge (a 9:16 device crops it).
      L({ id: 'left-border-upper-foliage', kind: 'img', src: 'props/left-border-upper-foliage.webp', x: 11, y: 13, w: 40, z: 6, order: 3, anim: 'slide-down', animOut: 'slide-out-up', depth: 0.5 }),
      L({ id: 'right-border-upper-foliage', kind: 'img', src: 'props/right-border-upper-foliage.webp', x: 89, y: 13, w: 40, z: 6, order: 3, anim: 'slide-down', animOut: 'slide-out-up', depth: 0.5 }),
      L({ id: 'left-side-fern-leaf-cluster-lower', kind: 'img', src: 'props/left-side-fern-leaf-cluster-lower.webp', x: 9, y: 73, w: 34, z: 6, order: 7, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.55 }),
      L({ id: 'right-side-fern-leaf-cluster-lower', kind: 'img', src: 'props/right-side-fern-leaf-cluster-lower.webp', x: 91, y: 73, w: 34, z: 6, order: 7, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.55 }),
      L({ id: 'bottom-foreground-foliage-stones', kind: 'img', src: 'props/bottom-foreground-foliage-stones.webp', x: 50, y: 89, w: 106, z: 7, order: 8, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.6 }),
      L({ id: 'hero', kind: 'slot', slot: 'eventHero', label: 'Party Details', x: 50, y: 47, w: 84, h: 42, z: 7, order: 4, chain: false, anim: 'none', depth: 0.2, canvasAnchor: true }),
      // The ribbon rides the eyebrow as its backdrop (see Layer.backdropSrc) instead of being a
      // separate `blank-hero-ribbon` img layer that had to be kept in register by hand.
      A('hero-eyebrow', 'hero', 'Eyebrow', 0, 'Welcome to the Expedition', {
        backdropSrc: 'props/blank-hero-ribbon.webp', backdropScale: 150,
      }),
      A('hero-title', 'hero', 'Event Title', 1, 'The Roarsome Birthday'),
      A('hero-honoree', 'hero', 'Honoree', 2, '{{name1}}', {
        backdropSrc: 'props/blank-name-plaque.webp', backdropScale: 135,
      }),
      A('hero-age', 'hero', 'Age Line', 3, 'Turns 7'),
      A('hero-date', 'hero', 'Date & Time', 4, '{{date:long}} · {{time}}'),
      A('hero-venue', 'hero', 'Venue', 5, '{{venue}}'),
      A('hero-timer', 'hero', 'Countdown Timer', 6),
      // The timer's own units — nested one level deeper, so the group moves them together while
      // each stays individually adjustable. `text` is the unit's caption.
      A('hero-timer-days', 'hero-timer', 'Days', 0, 'Days'),
      A('hero-timer-hours', 'hero-timer', 'Hours', 1, 'Hours'),
      A('hero-timer-minutes', 'hero-timer', 'Minutes', 2, 'Minutes'),
      A('hero-cue', 'hero', 'Scroll Cue', 7, 'Scroll to begin'),
    ],
    // The square desktop canvas cover-fits a 1440×900 window at ~1440px wide, so a 40%-wide
    // foliage prop becomes a 576px leaf over the title. Pull the foreground set out to the edges.
    desktop: {
      'left-border-upper-foliage': { x: 5, y: 24, w: 18 },
      'right-border-upper-foliage': { x: 95, y: 24, w: 18 },
      'left-side-fern-leaf-cluster-lower': { x: 4, y: 70, w: 15 },
      'right-side-fern-leaf-cluster-lower': { x: 96, y: 70, w: 15 },
      'bottom-foreground-foliage-stones': { x: 50, y: 78, w: 56 },
    },
  },
  details: {
    id: 'details', label: 'Expedition Briefing', bg: 'backgrounds/details.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'observation-balcony', kind: 'img', src: 'props/observation-balcony.webp', x: 50, y: 81, w: 104, z: 2, order: 0, anim: 'fade', animOut: 'none', depth: 0.1 }),
      L({ id: 'field-binoculars', kind: 'img', src: 'props/field-binoculars.webp', x: 89, y: 12.5, w: 18, z: 3, order: 1, anim: 'slide-down', animOut: 'slide-fade-out-right', depth: 0.25 }),
      // Was one combined "brachiosaurus + map table (provisional)" plate; now two pieces, so each
      // can be moved on its own and the dino can stand behind the table.
      L({ id: 'brachiosaurus', kind: 'img', src: 'props/brachiosaurus.webp', label: 'Brachiosaurus', x: 33, y: 64, w: 40, z: 4, order: 2, anim: 'slide-right', animOut: 'fade-out', depth: 0.28 }),
      L({ id: 'map-table', kind: 'img', src: 'props/map-table.webp', label: 'Map table', x: 72, y: 70, w: 46, z: 5, order: 3, anim: 'rise', animOut: 'fade-out', depth: 0.32 }),
      L({ id: 'foreground-leaf-left', kind: 'img', src: 'props/foreground-leaf-left.webp', x: 18, y: 88, w: 45, z: 6, order: 3, anim: 'slide-right', animOut: 'slide-out-left', depth: 0.55 }),
      L({ id: 'details', kind: 'slot', slot: 'ceremonyDetails', label: 'Briefing', x: 50, y: 36, w: 80, h: 52, z: 7, order: 1, chain: false, anim: 'none', depth: 0.2 }),
      A('details-title', 'details', 'Title', 0, 'Expedition Briefing'),
      A('details-body', 'details', 'Body', 1, '{{walimah.body}}'),
      A('details-date', 'details', 'Date', 2, '{{date:long}}'),
      A('details-time', 'details', 'Time', 3, '{{time}}'),
      A('details-venue', 'details', 'Venue', 4, '{{venue}}'),
      A('details-note', 'details', 'Note', 5, 'Adventure gear encouraged'),
    ],
    // Desktop is a genuinely different picture: the square desktop canvas cover-fits a 1440x900
    // window, so the visible band is only y 18.8-81.3 (a layer centred outside it is off-screen)
    // and a width is a % of 1440px — the mobile w:40 props render ~580px wide. Measured, not
    // guessed; see the welcome stage's own block.
    desktop: {
      'observation-balcony': { x: 50, y: 74, w: 70 },
      'field-binoculars': { x: 92, y: 26, w: 7 },
      brachiosaurus: { x: 28, y: 62, w: 15 },
      'map-table': { x: 68, y: 64, w: 17 },
      'foreground-leaf-left': { x: 6, y: 72, w: 16 },
      details: { x: 50, y: 40, w: 46, h: 46 },
    },
  },
  itinerary: {
    id: 'itinerary', label: 'Adventure Route', bg: 'backgrounds/itinerary.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'blank-trail-sign', kind: 'img', src: 'props/blank-trail-sign.webp', x: 34, y: 26, w: 52, z: 4, order: 0, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.2 }),
      L({ id: 'footprint-trail', kind: 'img', src: 'props/footprint-trail.webp', x: 55, y: 90, w: 18, z: 4, order: 1, anim: 'fade', animOut: 'none', depth: 0.1 }),
      L({ id: 'supply-pack', kind: 'img', src: 'props/supply-pack.webp', x: 22, y: 76, w: 34, z: 5, order: 3, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.4 }),
      L({ id: 'raptor-scout', kind: 'img', src: 'props/raptor-scout.webp', x: 84, y: 71, w: 34, z: 5, order: 4, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.4 }),
      L({ id: 'bottom-left-leaves-rocks', kind: 'img', src: 'props/bottom-left-leaves-rocks.webp', x: 24, y: 90, w: 48, z: 6, order: 5, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.55 }),
      L({ id: 'bottom-right-leaves-rocks', kind: 'img', src: 'props/bottom-right-leaves-rocks.webp', x: 80, y: 86, w: 34, z: 6, order: 5, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.55 }),
      L({ id: 'itinerary', kind: 'slot', slot: 'itineraryList', label: 'Adventure Route', x: 50, y: 50, w: 80, h: 46, z: 7, order: 2, chain: false, anim: 'none', depth: 0.2 }),
      A('itinerary-title', 'itinerary', 'Title', 0, 'Adventure Route'),
      A('itinerary-list', 'itinerary', 'Schedule', 1),
      A('itin-time', 'itinerary', 'Time', 2),
      A('itin-title', 'itinerary', 'Label', 3),
    ],
    // Desktop is a genuinely different picture: the square desktop canvas cover-fits a 1440x900
    // window, so the visible band is only y 18.8-81.3 (a layer centred outside it is off-screen)
    // and a width is a % of 1440px — the mobile w:40 props render ~580px wide. Measured, not
    // guessed; see the welcome stage's own block.
    desktop: {
      'blank-trail-sign': { x: 22, y: 26, w: 26 },
      'footprint-trail': { x: 52, y: 72, w: 7 },
      'supply-pack': { x: 10, y: 68, w: 15 },
      'raptor-scout': { x: 90, y: 64, w: 15 },
      'bottom-left-leaves-rocks': { x: 10, y: 78, w: 22 },
      'bottom-right-leaves-rocks': { x: 92, y: 76, w: 15 },
      itinerary: { x: 50, y: 48, w: 46, h: 44 },
    },
  },
  rsvp: {
    id: 'rsvp', label: 'Join the Expedition', bg: 'backgrounds/rsvp.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'warning-post', kind: 'img', src: 'props/warning-post.webp', x: 24, y: 46, w: 22, z: 4, order: 0, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.2 }),
      L({ id: 'radio-crate', kind: 'img', src: 'props/radio-crate.webp', x: 55, y: 84, w: 36, z: 5, order: 3, anim: 'rise', animOut: 'fade-out', depth: 0.35 }),
      L({ id: 'amber-specimen', kind: 'img', src: 'props/amber-specimen.webp', x: 32, y: 88, w: 36, z: 5, order: 4, anim: 'zoom-in', animOut: 'fade-out', depth: 0.4 }),
      L({ id: 'triceratops-ranger', kind: 'img', src: 'props/triceratops-ranger.webp', x: 83, y: 77, w: 36, z: 5, order: 5, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.4 }),
      L({ id: 'left-mid-leaf-bush', kind: 'img', src: 'props/left-mid-leaf-bush.webp', x: 18, y: 64, w: 32, z: 6, order: 6, anim: 'slide-right', animOut: 'slide-out-left', depth: 0.5 }),
      L({ id: 'bottom-right-leaf-bush', kind: 'img', src: 'props/bottom-right-leaf-bush.webp', x: 82, y: 90, w: 38, z: 6, order: 6, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.55 }),
      L({ id: 'rsvp', kind: 'slot', slot: 'rsvpTitle', label: 'RSVP', x: 50, y: 50, w: 80, h: 42, z: 7, order: 1, chain: false, anim: 'none', depth: 0.2 }),
      A('rsvp-title', 'rsvp', 'Title', 0, 'Join the Expedition'),
      A('rsvp-prompt', 'rsvp', 'Prompt', 1, 'Will your explorer be joining the crew?'),
      A('rsvp-trigger', 'rsvp', 'Confirm Attendance', 2, 'Confirm attendance'),
      A('rsvp-deadline', 'rsvp', 'Reply Deadline', 3, 'Reply by 10 October'),
      A('rsvp-seating', 'rsvp', 'Seating Button', 4, 'Check your seat'),
      L({ id: 'rsvp-form', kind: 'slot', slot: 'rsvpForm', presentation: 'sheet', sheetId: 'rsvp', parent: 'rsvp', label: 'RSVP Form', x: 50, y: 54, w: 78, h: 44, z: 5, order: 1, chain: false }),
      L({ id: 'rsvp-seating-form', kind: 'slot', slot: 'rsvpSeating', presentation: 'sheet', sheetId: 'rsvp', parent: 'rsvp', label: 'Seating', x: 50, y: 54, w: 78, h: 44, z: 4, order: 2, chain: false }),
    ],
    // Desktop is a genuinely different picture: the square desktop canvas cover-fits a 1440x900
    // window, so the visible band is only y 18.8-81.3 (a layer centred outside it is off-screen)
    // and a width is a % of 1440px — the mobile w:40 props render ~580px wide. Measured, not
    // guessed; see the welcome stage's own block.
    desktop: {
      'warning-post': { x: 12, y: 44, w: 9 },
      'radio-crate': { x: 28, y: 74, w: 16 },
      'amber-specimen': { x: 14, y: 76, w: 16 },
      'triceratops-ranger': { x: 86, y: 70, w: 16 },
      'left-mid-leaf-bush': { x: 5, y: 58, w: 14 },
      'bottom-right-leaf-bush': { x: 93, y: 78, w: 17 },
      rsvp: { x: 50, y: 46, w: 46, h: 40 },
    },
  },
  wishes: {
    id: 'wishes', label: 'Field Notes', bg: 'backgrounds/wishes.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'incubator-crate', kind: 'img', src: 'props/incubator-crate.webp', x: 30, y: 15, w: 39, z: 4, order: 0, anim: 'slide-down', animOut: 'slide-fade-out-left', depth: 0.2 }),
      L({ id: 'hatching-hatchling', kind: 'img', src: 'props/hatching-hatchling.webp', x: 85, y: 23, w: 33, z: 5, order: 1, anim: 'zoom-in', animOut: 'slide-fade-out-right', depth: 0.3 }),
      L({ id: 'field-journal', kind: 'img', src: 'props/field-journal.webp', x: 57, y: 82, w: 50, z: 5, order: 3, anim: 'rise', animOut: 'fade-out', depth: 0.35 }),
      L({ id: 'wishes-lantern', kind: 'img', src: 'props/wishes-lantern.webp', x: 82, y: 48, w: 22, z: 5, order: 4, anim: 'fade', animOut: 'fade-out', depth: 0.35 }),
      L({ id: 'wishes-top-left-leaves', kind: 'img', src: 'props/wishes-top-left-leaves.webp', x: 22, y: 8, w: 44, z: 5, order: 4, anim: 'slide-down', animOut: 'slide-out-up', depth: 0.4 }),
      L({ id: 'wishes-left-border-foliage', kind: 'img', src: 'props/wishes-left-border-foliage.webp', x: 14, y: 58, w: 26, z: 6, order: 5, anim: 'slide-right', animOut: 'slide-out-left', depth: 0.5 }),
      L({ id: 'wishes-right-boulders-leaves', kind: 'img', src: 'props/wishes-right-boulders-leaves.webp', x: 86, y: 76, w: 38, z: 6, order: 5, anim: 'slide-left', animOut: 'slide-out-right', depth: 0.5 }),
      L({ id: 'wishes-full-bottom-boulder-leaves', kind: 'img', src: 'props/wishes-full-bottom-boulder-leaves.webp', x: 50, y: 86, w: 106, z: 7, order: 6, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.6 }),
      L({ id: 'wishes', kind: 'slot', slot: 'wishTitle', label: 'Wishes', x: 50, y: 52, w: 80, h: 40, z: 7, order: 2, chain: false, anim: 'none', depth: 0.2 }),
      A('wishes-title', 'wishes', 'Title', 0, 'Field Notes'),
      A('wishes-prompt', 'wishes', 'Prompt', 1, 'Leave a birthday message for the expedition journal.'),
      A('wishes-trigger', 'wishes', 'Write a Wish', 2, 'Write a wish'),
      A('wishes-list', 'wishes', 'Wish List', 3),
      L({ id: 'wishes-form', kind: 'slot', slot: 'wishForm', presentation: 'sheet', sheetId: 'wish', parent: 'wishes', label: 'Wish Form', x: 50, y: 52, w: 78, h: 30, z: 5, order: 1, chain: false }),
      L({ id: 'wishes-photo', kind: 'slot', slot: 'wishPhoto', presentation: 'sheet', sheetId: 'wish', parent: 'wishes', label: 'Wish Photo', x: 50, y: 52, w: 78, h: 30, z: 4, order: 2, chain: false }),
    ],
    // Desktop is a genuinely different picture: the square desktop canvas cover-fits a 1440x900
    // window, so the visible band is only y 18.8-81.3 (a layer centred outside it is off-screen)
    // and a width is a % of 1440px — the mobile w:40 props render ~580px wide. Measured, not
    // guessed; see the welcome stage's own block.
    desktop: {
      'incubator-crate': { x: 12, y: 30, w: 16 },
      'hatching-hatchling': { x: 90, y: 32, w: 14 },
      'field-journal': { x: 60, y: 74, w: 20 },
      'wishes-lantern': { x: 82, y: 50, w: 8 },
      'wishes-top-left-leaves': { x: 8, y: 22, w: 20 },
      'wishes-left-border-foliage': { x: 3, y: 52, w: 10 },
      'wishes-right-boulders-leaves': { x: 94, y: 70, w: 15 },
      'wishes-full-bottom-boulder-leaves': { x: 50, y: 78, w: 60 },
      wishes: { x: 50, y: 46, w: 46, h: 38 },
    },
  },
  photobooth: {
    id: 'photobooth', label: 'Expedition Photos', bg: 'backgrounds/photobooth.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'canvas-fossil-display', kind: 'img', src: 'props/canvas-fossil-display.webp', x: 51, y: 12.5, w: 78, z: 3, order: 0, anim: 'slide-down', animOut: 'slide-out-up', depth: 0.15 }),
      L({ id: 'camera-equipment-case', kind: 'img', src: 'props/camera-equipment-case.webp', x: 15, y: 75, w: 32, z: 5, order: 2, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.35 }),
      L({ id: 'dino-photographer', kind: 'img', src: 'props/dino-photographer.webp', x: 85, y: 72, w: 32, z: 5, order: 3, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.4 }),
      L({ id: 'fern-tuft-left', kind: 'img', src: 'props/fern-tuft-left.webp', x: 14, y: 92, w: 34, z: 6, order: 4, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.55 }),
      L({ id: 'fern-tuft-right', kind: 'img', src: 'props/fern-tuft-right.webp', x: 87, y: 93, w: 32, z: 6, order: 4, anim: 'slide-up', animOut: 'slide-out-down', depth: 0.55 }),
      L({ id: 'photobooth', kind: 'slot', slot: 'photoBooth', label: 'Photo Booth', x: 50, y: 56, w: 76, h: 50, z: 7, order: 1, chain: false, anim: 'none', depth: 0.2 }),
      A('photobooth-title', 'photobooth', 'Title', 0, 'Expedition Photos'),
      A('photobooth-prompt', 'photobooth', 'Prompt', 1, 'Capture a memory from the wild.'),
      A('photobooth-gallery', 'photobooth', 'Gallery', 2),
      A('photobooth-upload', 'photobooth', 'Upload Button', 3, 'Upload a photo'),
    ],
  },
};

export const STAGE_GROUPS: Record<string, string[]> = {
  welcome: ['welcome'],
  walimah: ['details'],
  itinerary: ['itinerary'],
  rsvp: ['rsvp'],
  wishes: ['wishes'],
  photobooth: ['photobooth'],
};

export const T13_DEFAULTS: Record<string, string> = {
  'photobooth.frameArt': 'none',
};
