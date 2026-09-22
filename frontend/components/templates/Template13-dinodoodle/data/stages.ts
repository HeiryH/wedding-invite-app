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
): Layer => L({
  id, kind: 'anchor', parent, label, order,
  styleable: true, hasText: text !== undefined, text,
  anim: 'rise', animOut: 'fade-out',
});

export const T13_STAGES: Record<string, StageDef> = {
  welcome: {
    id: 'welcome', label: 'Park Entrance', bg: 'backgrounds/welcome.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'stone-timber-entrance', kind: 'img', src: 'props/stone-timber-entrance.webp', x: 50, y: 26.5, w: 102, z: 3, order: 0, anim: 'fade', animOut: 'fade-out', depth: 0.05 }),
      L({ id: 'blank-hero-ribbon', kind: 'img', src: 'props/blank-hero-ribbon.webp', x: 50, y: 28.3, w: 55, z: 4, order: 1, anim: 'zoom-in', animOut: 'slide-fade-out-down', depth: 0.15 }),
      L({ id: 'blank-name-plaque', kind: 'img', src: 'props/blank-name-plaque.webp', x: 50, y: 42.5, w: 31, z: 4, order: 2, anim: 'zoom-in', animOut: 'slide-fade-out-down', depth: 0.15 }),
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
      A('hero-eyebrow', 'hero', 'Eyebrow', 0, 'Welcome to the Expedition'),
      A('hero-title', 'hero', 'Event Title', 1, 'The Roarsome Birthday'),
      A('hero-honoree', 'hero', 'Honoree', 2, '{{name1}}'),
      A('hero-age', 'hero', 'Age Line', 3, 'Turns 7'),
      A('hero-date', 'hero', 'Date & Time', 4, '{{date:long}} · {{time}}'),
      A('hero-venue', 'hero', 'Venue', 5, '{{venue}}'),
      A('hero-timer', 'hero', 'Countdown Timer', 6),
      A('hero-cue', 'hero', 'Scroll Cue', 7, 'Scroll to begin'),
    ],
    // The square desktop canvas cover-fits a 1440×900 window at ~1440px wide, so a 40%-wide
    // foliage prop becomes a 576px leaf over the title. Pull the foreground set out to the edges.
    desktop: {
      'left-border-upper-foliage': { x: 5, y: 24, w: 18 },
      'right-border-upper-foliage': { x: 95, y: 24, w: 18 },
      'left-side-fern-leaf-cluster-lower': { x: 4, y: 70, w: 15 },
      'right-side-fern-leaf-cluster-lower': { x: 96, y: 70, w: 15 },
      'bottom-foreground-foliage-stones': { x: 50, y: 87, w: 50 },
    },
  },
  details: {
    id: 'details', label: 'Expedition Briefing', bg: 'backgrounds/details.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'observation-balcony', kind: 'img', src: 'props/observation-balcony.webp', x: 50, y: 81, w: 104, z: 2, order: 0, anim: 'fade', animOut: 'none', depth: 0.1 }),
      L({ id: 'field-binoculars', kind: 'img', src: 'props/field-binoculars.webp', x: 89, y: 12.5, w: 18, z: 3, order: 1, anim: 'slide-down', animOut: 'slide-fade-out-right', depth: 0.25 }),
      L({ id: 'brachiosaurus-map-table-provisional', kind: 'img', src: 'props/brachiosaurus-map-table-provisional.webp', label: 'Brachiosaurus + map table (provisional)', x: 59, y: 67, w: 82, z: 5, order: 2, anim: 'rise', animOut: 'fade-out', depth: 0.3 }),
      L({ id: 'foreground-leaf-left', kind: 'img', src: 'props/foreground-leaf-left.webp', x: 18, y: 88, w: 45, z: 6, order: 3, anim: 'slide-right', animOut: 'slide-out-left', depth: 0.55 }),
      L({ id: 'details', kind: 'slot', slot: 'ceremonyDetails', label: 'Briefing', x: 50, y: 36, w: 80, h: 52, z: 7, order: 1, chain: false, anim: 'none', depth: 0.2 }),
      A('details-title', 'details', 'Title', 0, 'Expedition Briefing'),
      A('details-body', 'details', 'Body', 1, '{{walimah.body}}'),
      A('details-date', 'details', 'Date', 2, '{{date:long}}'),
      A('details-time', 'details', 'Time', 3, '{{time}}'),
      A('details-venue', 'details', 'Venue', 4, '{{venue}}'),
      A('details-note', 'details', 'Note', 5, 'Adventure gear encouraged'),
    ],
  },
  itinerary: {
    id: 'itinerary', label: 'Adventure Route', bg: 'backgrounds/itinerary.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'blank-trail-sign', kind: 'img', src: 'props/blank-trail-sign.webp', x: 27, y: 27, w: 56, z: 4, order: 0, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.2 }),
      L({ id: 'footprint-trail', kind: 'img', src: 'props/footprint-trail.webp', x: 55, y: 90, w: 18, z: 4, order: 1, anim: 'fade', animOut: 'none', depth: 0.1 }),
      L({ id: 'supply-pack', kind: 'img', src: 'props/supply-pack.webp', x: 19, y: 80, w: 38, z: 5, order: 3, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.4 }),
      L({ id: 'raptor-scout', kind: 'img', src: 'props/raptor-scout.webp', x: 84, y: 71, w: 34, z: 5, order: 4, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.4 }),
      L({ id: 'itinerary', kind: 'slot', slot: 'itineraryList', label: 'Adventure Route', x: 50, y: 50, w: 80, h: 46, z: 7, order: 2, chain: false, anim: 'none', depth: 0.2 }),
      A('itinerary-title', 'itinerary', 'Title', 0, 'Adventure Route'),
      A('itinerary-list', 'itinerary', 'Schedule', 1),
      A('itin-time', 'itinerary', 'Time', 2),
      A('itin-title', 'itinerary', 'Label', 3),
    ],
  },
  rsvp: {
    id: 'rsvp', label: 'Join the Expedition', bg: 'backgrounds/rsvp.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'warning-post', kind: 'img', src: 'props/warning-post.webp', x: 13, y: 44, w: 27, z: 4, order: 0, anim: 'slide-right', animOut: 'slide-fade-out-left', depth: 0.2 }),
      L({ id: 'radio-crate', kind: 'img', src: 'props/radio-crate.webp', x: 36, y: 81, w: 42, z: 5, order: 3, anim: 'rise', animOut: 'fade-out', depth: 0.35 }),
      L({ id: 'amber-specimen', kind: 'img', src: 'props/amber-specimen.webp', x: 15, y: 83, w: 27, z: 5, order: 4, anim: 'zoom-in', animOut: 'fade-out', depth: 0.4 }),
      L({ id: 'triceratops-ranger', kind: 'img', src: 'props/triceratops-ranger.webp', x: 83, y: 77, w: 36, z: 5, order: 5, anim: 'slide-left', animOut: 'slide-fade-out-right', depth: 0.4 }),
      L({ id: 'rsvp', kind: 'slot', slot: 'rsvpTitle', label: 'RSVP', x: 50, y: 50, w: 80, h: 42, z: 7, order: 1, chain: false, anim: 'none', depth: 0.2 }),
      A('rsvp-title', 'rsvp', 'Title', 0, 'Join the Expedition'),
      A('rsvp-prompt', 'rsvp', 'Prompt', 1, 'Will your explorer be joining the crew?'),
      A('rsvp-trigger', 'rsvp', 'Confirm Attendance', 2, 'Confirm attendance'),
      A('rsvp-deadline', 'rsvp', 'Reply Deadline', 3, 'Reply by 10 October'),
      A('rsvp-seating', 'rsvp', 'Seating Button', 4, 'Check your seat'),
      L({ id: 'rsvp-form', kind: 'slot', slot: 'rsvpForm', presentation: 'sheet', sheetId: 'rsvp', parent: 'rsvp', label: 'RSVP Form', x: 50, y: 54, w: 78, h: 44, z: 5, order: 1, chain: false }),
      L({ id: 'rsvp-seating-form', kind: 'slot', slot: 'rsvpSeating', presentation: 'sheet', sheetId: 'rsvp', parent: 'rsvp', label: 'Seating', x: 50, y: 54, w: 78, h: 44, z: 4, order: 2, chain: false }),
    ],
  },
  wishes: {
    id: 'wishes', label: 'Field Notes', bg: 'backgrounds/wishes.webp', bgFit: 'cover', canvas: CANVAS,
    layers: [
      L({ id: 'incubator-crate', kind: 'img', src: 'props/incubator-crate.webp', x: 25, y: 15, w: 39, z: 4, order: 0, anim: 'slide-down', animOut: 'slide-fade-out-left', depth: 0.2 }),
      L({ id: 'hatching-hatchling', kind: 'img', src: 'props/hatching-hatchling.webp', x: 85, y: 23, w: 33, z: 5, order: 1, anim: 'zoom-in', animOut: 'slide-fade-out-right', depth: 0.3 }),
      L({ id: 'field-journal', kind: 'img', src: 'props/field-journal.webp', x: 57, y: 82, w: 50, z: 5, order: 3, anim: 'rise', animOut: 'fade-out', depth: 0.35 }),
      L({ id: 'left-fern-corner', kind: 'img', src: 'props/left-fern-corner.webp', x: 17, y: 85, w: 38, z: 5, order: 4, anim: 'slide-right', animOut: 'slide-out-left', depth: 0.5 }),
      L({ id: 'right-fern-corner', kind: 'img', src: 'props/right-fern-corner.webp', x: 88, y: 87, w: 28, z: 5, order: 4, anim: 'slide-left', animOut: 'slide-out-right', depth: 0.5 }),
      L({ id: 'wishes', kind: 'slot', slot: 'wishTitle', label: 'Wishes', x: 50, y: 52, w: 80, h: 40, z: 7, order: 2, chain: false, anim: 'none', depth: 0.2 }),
      A('wishes-title', 'wishes', 'Title', 0, 'Field Notes'),
      A('wishes-prompt', 'wishes', 'Prompt', 1, 'Leave a birthday message for the expedition journal.'),
      A('wishes-trigger', 'wishes', 'Write a Wish', 2, 'Write a wish'),
      A('wishes-list', 'wishes', 'Wish List', 3),
      L({ id: 'wishes-form', kind: 'slot', slot: 'wishForm', presentation: 'sheet', sheetId: 'wish', parent: 'wishes', label: 'Wish Form', x: 50, y: 52, w: 78, h: 30, z: 5, order: 1, chain: false }),
      L({ id: 'wishes-photo', kind: 'slot', slot: 'wishPhoto', presentation: 'sheet', sheetId: 'wish', parent: 'wishes', label: 'Wish Photo', x: 50, y: 52, w: 78, h: 30, z: 4, order: 2, chain: false }),
    ],
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
