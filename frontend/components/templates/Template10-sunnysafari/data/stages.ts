import type { StageDef, Layer } from '../types';

export const T10_ASSETS = '/templates/t10';

/**
 * Default composition for every stage, authored mobile-first.
 *
 * Every source art file (background and every prop) shares one canvas: 1024x1696 pixels. Rather
 * than convert prop pixel offsets into an approximate viewport percentage and then fight the
 * mismatch on odd device shapes, each stage declares `canvas: { mobile: { w: 1024, h: 1696 } }` —
 * the art's own aspect — so the background and every prop cover-fit the device as one unit,
 * exactly like Template 7's canvas stages. `x`/`y`/`w` below are the prop's own bounding-box
 * centre/width as a plain percentage of that 1024x1696 canvas (computed directly from the source
 * PSD/PNG crop — see `frontend/scripts/extract-t10-props.mjs` and each section's
 * `props.manifest.json`), so they need no further scale correction.
 *
 * These are starting positions, meant to be tuned in the Adjust panel, which writes a delta
 * against them into `t10.layout.<breakpoint>.<stageId>`.
 */

// Defaults every layer inherits, so each entry below only states what's interesting about it.
const L = (layer: Partial<Layer> & Pick<Layer, 'id' | 'kind'>): Layer => ({
  x: 50, y: 50, w: 40, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...layer,
});

// No explicit `desktop` entry needed: `Stage.tsx` falls back to reusing `mobile`'s aspect when a
// stage has no desktop-specific composition (see `StageDef.canvas`'s doc comment) — which is
// exactly this template's case, since every prop/text position is a plain percentage of this one
// 1024x1696 source composite (see the file header comment) with no separate desktop-format art to
// design around. Previously this fell through to no canvas at all on desktop, and hero text
// visibly collided with foreground art on any real desktop window — see docs/FIX_QUEUE.md Issue 1.
const CANVAS_1024x1696 = { mobile: { w: 1024, h: 1696 } };

// Shared text styling for the welcome hero — a chunky hand-drawn marker face (Baloo 2) for the
// two headline-weight lines, a rounder body face (Nunito) for the supporting lines, both reading
// near-black to match the bold marker lettering in the reference art.
const INK = '#20180F';

export const T10_STAGES: Record<string, StageDef> = {
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    bg: 'welcome/background.webp',
    bgFit: 'cover',
    canvas: CANVAS_1024x1696,
    layers: [
      // ── Sky (behind everything) ──────────────────────────────────────────
      L({ id: 'cloud-tl', kind: 'img', src: 'welcome/cloud-top-left.webp', x: 26.8, y: 8.5, w: 34.5, z: 2, order: 0 }),
      L({ id: 'cloud-tr', kind: 'img', src: 'welcome/cloud-top-right.webp', x: 77.6, y: 7.7, w: 31.4, z: 2, order: 0 }),
      L({ id: 'sun', kind: 'img', src: 'welcome/sun.webp', x: 51.9, y: 18, w: 25.6, z: 2, order: 0 }),
      L({ id: 'cloud-ml', kind: 'img', src: 'welcome/cloud-mid-left.webp', x: 20.9, y: 20.5, w: 32.4, z: 2, order: 0 }),
      L({ id: 'cloud-mr', kind: 'img', src: 'welcome/cloud-mid-right.webp', x: 82.1, y: 20, w: 28.1, z: 2, order: 0 }),
      // ── Field (mid-ground) ───────────────────────────────────────────────
      L({ id: 'zebra', kind: 'img', src: 'welcome/zebra.webp', x: 24.8, y: 44.2, w: 34.4, z: 3, order: 1 }),
      // ── Hero text block — plain `kind:'text'` layers with {{binding}} tokens (bindings.ts),
      // not a bespoke slot: this event type has no "sides" and no countdown in the reference
      // design, so there's nothing here a shared slot buys over a couple of text layers the
      // Adjust panel can already restyle (color/font/shadow/curve) like any other text. Being
      // `kind:'text'` also means these default INTO the art canvas (see Stage.tsx's `inCanvas`),
      // so the copy stays welded to the sky/zebra composition on every device shape, exactly like
      // the reference.
      L({
        id: 'eyebrow', kind: 'text', text: "You're invited to",
        x: 50, y: 24, w: 70, h: 5, z: 7, order: 2, chain: false, depth: 0.3,
        color: INK, fontFamily: 'nunito', fontWeight: 700, fontSize: 3.4, letterSpacing: 0.04,
        label: 'Eyebrow',
      }),
      L({
        id: 'title', kind: 'text', text: '{{eventTitle}}',
        x: 50, y: 34, w: 84, h: 20, z: 7, order: 3, chain: false, depth: 0.25,
        color: INK, fontFamily: 'baloo-2', fontWeight: 800, fontSize: 10, label: 'Event Title',
      }),
      L({
        id: 'names', kind: 'text', text: '{{name1}} & {{name2}}',
        x: 50, y: 46.5, w: 74, h: 7, z: 7, order: 4, chain: false, depth: 0.2,
        color: INK, fontFamily: 'baloo-2', fontWeight: 700, fontSize: 5.6, label: 'Names',
      }),
      L({
        id: 'date', kind: 'text', text: '{{date:long}}',
        x: 50, y: 51.5, w: 78, h: 5, z: 7, order: 5, chain: false, depth: 0.2,
        color: INK, fontFamily: 'nunito', fontWeight: 700, fontSize: 3.4, label: 'Date',
      }),
      L({
        id: 'venue', kind: 'text', text: '{{venue}}',
        x: 50, y: 55, w: 78, h: 5, z: 7, order: 6, chain: false, depth: 0.2,
        color: INK, fontFamily: 'nunito', fontWeight: 600, fontSize: 3.2, label: 'Venue',
      }),
      // ── Foreground (dancers + drum + snake, in front of the text baseline) ──
      L({ id: 'monkey-4', kind: 'img', src: 'welcome/monkey-4.webp', x: 15.7, y: 67.4, w: 25.7, z: 5, order: 7 }),
      L({ id: 'monkey-2', kind: 'img', src: 'welcome/monkey-2.webp', x: 39.2, y: 65.7, w: 21.7, z: 5, order: 8 }),
      L({ id: 'monkey-3', kind: 'img', src: 'welcome/monkey-3.webp', x: 60.6, y: 66.2, w: 19.8, z: 5, order: 9 }),
      L({ id: 'monkey-1', kind: 'img', src: 'welcome/monkey-1.webp', x: 80.1, y: 65.2, w: 21.6, z: 5, order: 10 }),
      L({ id: 'snake', kind: 'img', src: 'welcome/snake.webp', x: 29.1, y: 83.9, w: 54.5, z: 4, order: 11 }),
      L({ id: 'drum', kind: 'img', src: 'welcome/drum.webp', x: 87.8, y: 85.3, w: 15.9, z: 4, order: 12 }),
      L({ id: 'cue', kind: 'slot', slot: 'scrollCue', x: 50, y: 95, w: 50, h: 7, z: 8, order: 13, chain: false, depth: 0, anim: 'none' }),
    ],
    desktop: {
      title: { fontSize: 6.5 },
      names: { fontSize: 3.6 },
      date: { fontSize: 2.4 },
      venue: { fontSize: 2.2 },
      eyebrow: { fontSize: 2.2 },
    },
  },

  // The delivered artwork covers 5 scenes (welcome, itinerary, RSVP, wishes, photobooth) with no
  // separate "Details" scene — date/venue already live in the welcome hero. To keep parity with
  // every other template's Details/walimah section, this stage reuses the RSVP sky background
  // (mostly empty cream/blue, good for text) rather than duplicating RSVP's scroll-leaves prop,
  // which has strong identity as "the invitation scroll" and would read as an obvious repeat.
  // Only appears when the couple writes Details text (resolveSectionOrder gates the `walimah`
  // code on `walimah.body`), so an unused stage never ships empty.
  details: {
    id: 'details',
    label: 'Details',
    bg: 'rsvp/background.webp',
    bgFit: 'cover',
    canvas: CANVAS_1024x1696,
    layers: [
      // Titles are plain text layers, not the shared makeTitleSlot factory — see the note above
      // welcome's hero text: a static label gets the full Style tab (font/size/line-height/color/
      // shadow) this way, which a slot only gives a single text-scale multiplier for. The body
      // stays a slot (walimahBody) since it's couple-authored rich text, not a static label.
      L({
        id: 'title', kind: 'text', text: 'Party Details',
        x: 50, y: 30, w: 74, h: 8, z: 7, order: 0, chain: false, depth: 0.3,
        color: INK, fontFamily: 'baloo-2', fontWeight: 800, fontSize: 7, label: 'Details Title',
      }),
      L({ id: 'body', kind: 'slot', slot: 'walimahBody', x: 50, y: 54, w: 80, h: 46, z: 7, order: 1, chain: false, depth: 0.2, label: 'Details Body' }),
    ],
  },

  itinerary: {
    id: 'itinerary',
    label: 'Itinerary',
    bg: 'itinerary/background.webp',
    bgFit: 'cover',
    canvas: CANVAS_1024x1696,
    layers: [
      L({ id: 'sun', kind: 'img', src: 'itinerary/sun.webp', x: 25, y: 13.8, w: 14.9, z: 2, order: 0 }),
      L({ id: 'compass', kind: 'img', src: 'itinerary/compass.webp', x: 76.7, y: 14.1, w: 26.4, z: 3, order: 1 }),
      L({
        id: 'title', kind: 'text', text: 'Our Safari Day',
        x: 50, y: 9, w: 72, h: 6, z: 7, order: 2, chain: false, depth: 0.3,
        color: INK, fontFamily: 'baloo-2', fontWeight: 800, fontSize: 6.5, label: 'Itinerary Title',
      }),
      L({ id: 'list', kind: 'slot', slot: 'itineraryList', x: 50, y: 40, w: 80, h: 46, z: 7, order: 3, chain: false, depth: 0.2, label: 'Itinerary List' }),
      L({ id: 'monkey-guide', kind: 'img', src: 'itinerary/monkey-guide.webp', x: 76.6, y: 51, w: 43.9, z: 5, order: 4 }),
      L({ id: 'binoculars', kind: 'img', src: 'itinerary/binoculars.webp', x: 24.7, y: 54.2, w: 38.4, z: 4, order: 5 }),
      L({ id: 'paw-print-ledge', kind: 'img', src: 'itinerary/paw-print-ledge.webp', x: 51.1, y: 83.9, w: 91.3, z: 4, order: 6 }),
    ],
  },

  rsvp: {
    id: 'rsvp',
    label: 'RSVP',
    bg: 'rsvp/background.webp',
    bgFit: 'cover',
    canvas: CANVAS_1024x1696,
    layers: [
      L({ id: 'scroll', kind: 'img', src: 'rsvp/scroll-leaves.webp', x: 24.3, y: 24.1, w: 36.9, z: 3, order: 0 }),
      L({ id: 'eagle', kind: 'img', src: 'rsvp/eagle.webp', x: 73.1, y: 25.7, w: 48, z: 3, order: 1 }),
      L({
        id: 'title', kind: 'text', text: 'Will You Join Us?',
        x: 50, y: 44, w: 70, h: 8, z: 7, order: 2, chain: false, depth: 0.3,
        color: INK, fontFamily: 'baloo-2', fontWeight: 800, fontSize: 7, label: 'RSVP Title',
      }),
      L({
        id: 'prompt', kind: 'text', text: 'Kindly reply soon!',
        x: 50, y: 52, w: 78, h: 6, z: 7, order: 3, chain: false, depth: 0.3,
        color: INK, fontFamily: 'nunito', fontWeight: 600, fontSize: 3.4, label: 'RSVP Prompt',
      }),
      L({ id: 'trigger', kind: 'slot', slot: 'sheetTrigger', sheetId: 'rsvp', x: 50, y: 61, w: 42, h: 9, z: 8, order: 4, chain: false, depth: 0.2, label: 'RSVP Button', animIdle: 'wave', animIdleSpeed: 0.75 }),
      L({ id: 'form', kind: 'slot', slot: 'rsvpForm', presentation: 'sheet', sheetId: 'rsvp', x: 50, y: 54, w: 74, h: 44, z: 5, order: 4, chain: false, depth: 0.15, label: 'RSVP Form (step 1) · in pop-up' }),
      L({ id: 'seating', kind: 'slot', slot: 'rsvpSeating', presentation: 'sheet', sheetId: 'rsvp', x: 50, y: 54, w: 74, h: 44, z: 4, order: 4, chain: false, depth: 0.15, label: 'Seating (step 2) · in pop-up' }),
      L({ id: 'drum', kind: 'img', src: 'rsvp/drum.webp', x: 21.6, y: 74.6, w: 21.6, z: 3, order: 5 }),
    ],
  },

  wishes: {
    id: 'wishes',
    label: 'Wishes',
    bg: 'wishes/background.webp',
    bgFit: 'cover',
    canvas: CANVAS_1024x1696,
    layers: [
      L({ id: 'sun', kind: 'img', src: 'wishes/sun.webp', x: 26.1, y: 12.2, w: 20.3, z: 2, order: 0 }),
      L({ id: 'cloud', kind: 'img', src: 'wishes/cloud.webp', x: 76.6, y: 12.4, w: 40, z: 2, order: 0 }),
      L({
        id: 'title', kind: 'text', text: 'Leave a Wish',
        x: 50, y: 16, w: 70, h: 8, z: 7, order: 1, chain: false, depth: 0.4,
        color: INK, fontFamily: 'baloo-2', fontWeight: 800, fontSize: 7, label: 'Wishes Title',
      }),
      L({
        id: 'prompt', kind: 'text', text: 'A little note for {{honoree}} to keep forever',
        x: 50, y: 25, w: 78, h: 6, z: 7, order: 2, chain: false, depth: 0.3,
        color: INK, fontFamily: 'nunito', fontWeight: 600, fontSize: 3.4, label: 'Wishes Prompt',
      }),
      L({ id: 'trigger', kind: 'slot', slot: 'sheetTrigger', sheetId: 'wish', x: 50, y: 33, w: 44, h: 8, z: 8, order: 3, chain: false, depth: 0.3, label: 'Write a Wish Button' }),
      L({ id: 'coconut-palm', kind: 'img', src: 'wishes/coconut-palm.webp', x: 28.8, y: 47.3, w: 50.1, z: 4, order: 4 }),
      L({ id: 'monkey-cheering', kind: 'img', src: 'wishes/monkey-cheering.webp', x: 70.7, y: 38.4, w: 27, z: 5, order: 5 }),
      L({ id: 'monkey-baby-1', kind: 'img', src: 'wishes/monkey-baby-1.webp', x: 86.6, y: 58.8, w: 15.7, z: 5, order: 6 }),
      L({ id: 'monkey-baby-2', kind: 'img', src: 'wishes/monkey-baby-2.webp', x: 53.9, y: 58.9, w: 15.6, z: 5, order: 6 }),
      L({ id: 'monkey-baby-3', kind: 'img', src: 'wishes/monkey-baby-3.webp', x: 69.6, y: 59, w: 15.6, z: 5, order: 6 }),
      L({ id: 'list', kind: 'slot', slot: 'wishList', x: 50, y: 78, w: 84, h: 36, z: 8, order: 7, chain: false, depth: 0, label: 'Wish List' }),
      L({ id: 'form', kind: 'slot', slot: 'wishForm', presentation: 'sheet', sheetId: 'wish', x: 50, y: 52, w: 78, h: 26, z: 5, order: 3, chain: false, depth: 0.2, label: 'Wish Form (step 1) · in pop-up' }),
      L({ id: 'wishPhoto', kind: 'slot', slot: 'wishPhoto', presentation: 'sheet', sheetId: 'wish', x: 50, y: 52, w: 78, h: 30, z: 4, order: 4, chain: false, depth: 0.2, label: 'Add a Photo (step 2) · in pop-up' }),
    ],
  },

  photobooth: {
    id: 'photobooth',
    label: 'Photo Booth',
    bg: 'photobooth/background.webp',
    bgFit: 'cover',
    canvas: CANVAS_1024x1696,
    layers: [
      L({ id: 'leaf-b', kind: 'img', src: 'photobooth/leaf-b.webp', x: 25, y: 14.3, w: 32.7, z: 3, order: 0 }),
      L({ id: 'leaf-a', kind: 'img', src: 'photobooth/leaf-a.webp', x: 71.5, y: 11.4, w: 42.4, z: 3, order: 0 }),
      L({ id: 'leaf-d', kind: 'img', src: 'photobooth/leaf-d.webp', x: 25.7, y: 36, w: 29.2, z: 3, order: 1 }),
      L({ id: 'leaf-c', kind: 'img', src: 'photobooth/leaf-c.webp', x: 71.4, y: 31.3, w: 32.4, z: 3, order: 1 }),
      // A single slot renders title + prompt + gallery + upload together (see PhotoBoothSlot.tsx)
      // — unlike RSVP/Wishes there's no separate title/prompt slot to wire up here.
      L({ id: 'booth', kind: 'slot', slot: 'photoBooth', x: 50, y: 45, w: 82, h: 55, z: 7, order: 2, chain: false, depth: 0.2, label: 'Photo Booth' }),
      L({ id: 'camera-tripod', kind: 'img', src: 'photobooth/camera-tripod.webp', x: 21.9, y: 61, w: 22.5, z: 4, order: 3 }),
      L({ id: 'monkey-camera', kind: 'img', src: 'photobooth/monkey-camera.webp', x: 74.7, y: 63.5, w: 31.3, z: 4, order: 4 }),
      L({ id: 'hand-1', kind: 'img', src: 'photobooth/hand-1.webp', x: 38.5, y: 83.7, w: 44.4, z: 5, order: 5 }),
      L({ id: 'hand-2', kind: 'img', src: 'photobooth/hand-2.webp', x: 56.8, y: 90.8, w: 38.4, z: 5, order: 6 }),
    ],
  },
};

/** Which logical `section.order` code each stage belongs to. One stage per code — Sunny Safari
 *  has no compiled/shared-backdrop row like T7's ceremony beats. */
export const STAGE_GROUPS: Record<string, string[]> = {
  welcome: ['welcome'],
  walimah: ['details'],
  itinerary: ['itinerary'],
  rsvp: ['rsvp'],
  wishes: ['wishes'],
  photobooth: ['photobooth'],
};

/** Schema-declared config defaults this template reads directly (not through the layout system).
 *  Mirrors T7's own T10_DEFAULTS-style export — documentation only; the real defaults live in
 *  `lib/templateConfigSchema.ts`. */
export const T10_DEFAULTS: Record<string, string> = {
  'invite.theme_label': 'Sunny Safari',
  'photobooth.frameArt': 'none',
};
