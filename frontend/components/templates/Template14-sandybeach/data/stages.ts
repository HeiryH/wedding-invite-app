import type { StageDef, Layer } from '../types';

export const T14_ASSETS = '/templates/sandy-beach';

/**
 * Default composition for every stage, authored mobile-first.
 *
 * Art provenance: the pipeline's Sandy Beach run (docs/sandy-beach-probe/ + the
 * `wt/sandy-beach-20260920` spec). Each section was rendered by hand from the approved section-spec
 * as three images — a full design, a background plate with props/text removed, and a transparent
 * prop sheet — and the prop sheet was cut into the individual WebPs under
 * public/templates/sandy-beach/<section>/ by connected-component analysis of its alpha channel
 * (the arch and its dune-grass shared a sand skirt and were split by hand). Unlike Template 10,
 * the prop sheets here are a *catalogue* (each prop drawn once, arbitrary layout), not a same-size
 * overlay of the design — so every position below was read off the design render, not measured.
 *
 * Canvas: the backgrounds are 941×1672 (≈9:16). Real phones are taller (≈9:19.5), and a 9:16 canvas
 * cover-fitted to one loses ~9% of the picture at each side — enough to cut the welcome arch's posts
 * clean off. So the stages declare `canvas.mobile = 836×1672` (aspect 0.5), halfway between the art
 * and the devices: ~4% side crop on a 9:19.5 phone, ~5% top/bottom crop on a 9:16 one. The
 * background is cover-fitted independently by `Stage`, so the two drift by at most a few percent
 * on either extreme — acceptable because every prop sits on open sand/sky/water, none is registered
 * to a background feature. `x`/`w` below are percentages of that 836-wide canvas (design x/w × 1.126),
 * `y` is unchanged from the design.
 *
 * Desktop: `canvas.desktop = 1440×900` with explicit `desktop` overrides on every stage — the
 * portrait backgrounds turn into a horizontal band of sea/sand on a landscape screen, so the props
 * are re-composed as a wide frame (scenery pushed to the corners, smaller) rather than trusting the
 * mobile fallback, which would build a 2900px-tall canvas and crop two thirds of it.
 *
 * These are starting positions, meant to be tuned in the Adjust panel, which writes a delta
 * against them into `t14.layout.<breakpoint>.<stageId>`.
 */

// Defaults every layer inherits, so each entry below only states what's interesting about it.
const L = (layer: Partial<Layer> & Pick<Layer, 'id' | 'kind'>): Layer => ({
  x: 50, y: 50, w: 40, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
  ...layer,
});

const CANVAS = { mobile: { w: 836, h: 1672 }, desktop: { w: 1440, h: 900 } };

// Style lock (spec/style.json): dark-brown ink for every line of type. The two type roles from the
// section-spec — "soft high-contrast serif italic for names and headings" and "letter-spaced small
// capitals for labels" — are expressed as reusable partials so every stage's pair matches.
const INK = '#8c6858';
const INK_SOFT = '#a58e80';
const FONT = 'cormorant';

/** Small-caps eyebrow label, e.g. "KINDLY RESPOND". */
const eyebrow = (id: string, text: string, y: number, label: string, extra: Partial<Layer> = {}): Layer =>
  L({
    id, kind: 'text', text,
    x: 50, y, w: 80, h: 4, z: 7, order: 0, chain: false, depth: 0.3,
    color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 3.3, letterSpacing: 0.3, textTransform: 'uppercase',
    label, ...extra,
  });

/** Italic serif heading, e.g. "Will you join us by the sea?" */
const heading = (id: string, text: string, y: number, label: string, extra: Partial<Layer> = {}): Layer =>
  L({
    id, kind: 'text', text,
    x: 50, y, w: 84, h: 12, z: 7, order: 1, chain: false, depth: 0.3,
    color: INK, fontFamily: FONT, fontWeight: 500, fontStyle: 'italic', fontSize: 7.2, lineHeight: 1.1,
    label, ...extra,
  });

export const T14_STAGES: Record<string, StageDef> = {
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    bg: 'welcome/background.webp',
    bgFit: 'cover',
    canvas: CANVAS,
    layers: [
      // ── Sky (behind the arch) ────────────────────────────────────────────
      L({ id: 'cloud-large', kind: 'img', src: 'welcome/cloud-large.webp', x: 20, y: 6, w: 56, z: 2, order: 0, depth: 0.6 }),
      L({ id: 'cloud-wisp', kind: 'img', src: 'welcome/cloud-wisp.webp', x: 62, y: 16, w: 44, z: 2, order: 0, depth: 0.6, opacity: 0.9 }),
      L({ id: 'cloud-small', kind: 'img', src: 'welcome/cloud-small.webp', x: 86, y: 9, w: 28, z: 2, order: 0, depth: 0.6 }),
      // The sun sits on the background's horizon (~30%); its reflection stripes run down the sea.
      L({ id: 'sun', kind: 'img', src: 'welcome/sun.webp', x: 69, y: 33, w: 25, z: 2, order: 0, depth: 0.7 }),
      // ── The driftwood arch frames the whole stage; the sheet's arch is squatter than the
      //    design's (0.81 vs 0.55 aspect) so it stands on the sand line at ~63% rather than
      //    running to the bottom edge, and the hero text sits in and under its opening. ──
      L({ id: 'arch', kind: 'img', src: 'welcome/arch.webp', x: 50, y: 33, w: 96, z: 3, order: 1, label: 'Driftwood Arch' }),
      // ── Hero — the standard STAGE hero shape (see EventHeroSlot/HeroSlots.tsx and T10). The
      //    event-title sub-layer is hidden by default: a WEDDING has names, not a title. ──
      L({ id: 'hero', kind: 'slot', slot: 'eventHero', x: 50, y: 65, w: 86, h: 40, z: 7, order: 2, chain: false, depth: 0.2, anim: 'none', canvasAnchor: true, textScale: 1.2, label: 'Hero' }),
      L({ id: 'hero-eyebrow', kind: 'anchor', parent: 'hero', label: 'Eyebrow', order: 0, styleable: true, hasText: true, text: '{{heading}}',
          color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 3.3, letterSpacing: 0.3, textTransform: 'uppercase' }),
      L({ id: 'hero-title', kind: 'anchor', parent: 'hero', label: 'Event Title', order: 1, styleable: true, hasText: true, text: '{{eventTitle}}', hidden: true,
          color: INK, fontFamily: FONT, fontWeight: 500, fontStyle: 'italic', fontSize: 7 }),
      L({ id: 'hero-names', kind: 'anchor', parent: 'hero', label: 'Names', order: 2, styleable: true, hasText: true, text: '{{firstName}} {{connector}} {{secondName}}',
          color: INK, fontFamily: FONT, fontWeight: 500, fontStyle: 'italic', fontSize: 12, lineHeight: 1.05 }),
      L({ id: 'hero-date', kind: 'anchor', parent: 'hero', label: 'Date', order: 3, styleable: true, hasText: true, text: '{{date:weekday}}, {{date:long}}',
          color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 3.1, letterSpacing: 0.26, textTransform: 'uppercase' }),
      L({ id: 'hero-venue', kind: 'anchor', parent: 'hero', label: 'Venue', order: 4, styleable: true, hasText: true, text: '{{venue}}',
          color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 2.9, letterSpacing: 0.26, textTransform: 'uppercase' }),
      L({ id: 'hero-timer', kind: 'anchor', parent: 'hero', label: 'Countdown Timer', order: 5, styleable: true }),
      // ── Foreground shore ─────────────────────────────────────────────────
      L({ id: 'frangipani-cluster', kind: 'img', src: 'welcome/frangipani-cluster.webp', x: 9, y: 88, w: 34, z: 5, order: 5 }),
      L({ id: 'blossom', kind: 'img', src: 'welcome/blossom.webp', x: 39, y: 92, w: 10, z: 6, order: 7 }),
      L({ id: 'sprig', kind: 'img', src: 'welcome/sprig.webp', x: 72, y: 91, w: 11, z: 5, order: 7 }),
      L({ id: 'grass', kind: 'img', src: 'welcome/grass.webp', x: 89, y: 84, w: 29, z: 5, order: 6 }),
      L({ id: 'pebbles', kind: 'img', src: 'welcome/pebbles.webp', x: 92, y: 91, w: 22, z: 6, order: 7 }),
      L({ id: 'cue', kind: 'slot', slot: 'scrollCue', x: 50, y: 95, w: 50, h: 6, z: 8, order: 8, chain: false, depth: 0, anim: 'none' }),
    ],
    desktop: {
      'cloud-large': { x: 14, y: 12, w: 26 },
      'cloud-wisp': { x: 50, y: 8, w: 22 },
      'cloud-small': { x: 88, y: 10, w: 14 },
      sun: { x: 74, y: 30, w: 11 },
      arch: { x: 50, y: 47, w: 46 },
      hero: { x: 50, y: 62, w: 44, h: 60 },
      'hero-names': { fontSize: 6.5 },
      'hero-eyebrow': { fontSize: 1.7 },
      'hero-date': { fontSize: 1.6 },
      'hero-venue': { fontSize: 1.5 },
      'frangipani-cluster': { x: 8, y: 90, w: 16 },
      blossom: { x: 20, y: 96, w: 4 },
      sprig: { x: 79, y: 95, w: 5 },
      grass: { x: 90, y: 86, w: 13 },
      pebbles: { x: 93, y: 95, w: 9 },
    },
  },

  // "Walimatul Urus" — under the coconut palm. Only appears when the couple writes Details text
  // (resolveSectionOrder gates the `walimah` code on `walimah.body`).
  walimah: {
    id: 'walimah',
    label: 'Ceremony',
    bg: 'walimah/background.webp',
    bgFit: 'cover',
    canvas: CANVAS,
    layers: [
      // The sheet's palm is a whole tree leaning right; flipped, its canopy fills the top of the
      // frame and the trunk runs down the right edge to the sand slope.
      L({ id: 'palm', kind: 'img', src: 'walimah/palm.webp', x: 62, y: 18, w: 132, z: 3, order: 0, depth: 0.3, flipX: true, label: 'Coconut Palm' }),
      eyebrow('eyebrow', 'Walimatul Urus', 36, 'Ceremony Label'),
      L({ id: 'body', kind: 'slot', slot: 'walimahBody', x: 50, y: 49, w: 84, h: 24, z: 7, order: 1, chain: false, depth: 0.2, textScale: 1.35, label: 'Ceremony Body' }),
      L({ id: 'grass', kind: 'img', src: 'walimah/grass.webp', x: 1, y: 89, w: 22, z: 4, order: 2 }),
      L({ id: 'signpost', kind: 'img', src: 'walimah/signpost.webp', x: 9, y: 73, w: 29, z: 5, order: 2 }),
      L({ id: 'chair', kind: 'img', src: 'walimah/chair.webp', x: 67, y: 80, w: 33, z: 5, order: 3 }),
      L({ id: 'chair-hat', kind: 'img', src: 'walimah/chair-hat.webp', x: 94, y: 79, w: 35, z: 5, order: 3 }),
      L({ id: 'lantern', kind: 'img', src: 'walimah/lantern.webp', x: 27, y: 85, w: 12, z: 6, order: 4 }),
      L({ id: 'coconut', kind: 'img', src: 'walimah/coconut.webp', x: 45, y: 90, w: 16, z: 6, order: 5 }),
      L({ id: 'blossom', kind: 'img', src: 'walimah/blossom.webp', x: 64, y: 91, w: 9, z: 6, order: 6 }),
      L({ id: 'pebbles', kind: 'img', src: 'walimah/pebbles.webp', x: 39, y: 93, w: 13, z: 6, order: 6 }),
      L({ id: 'shell', kind: 'img', src: 'walimah/shell.webp', x: 81, y: 93, w: 7, z: 6, order: 6 }),
    ],
    desktop: {
      palm: { x: 82, y: 30, w: 62 },
      eyebrow: { y: 30, fontSize: 1.5 },
      body: { x: 50, y: 50, w: 48, h: 34 },
      grass: { x: 2, y: 90, w: 9 },
      signpost: { x: 8, y: 76, w: 12 },
      chair: { x: 70, y: 83, w: 13 },
      'chair-hat': { x: 82, y: 83, w: 14 },
      lantern: { x: 17, y: 88, w: 5 },
      coconut: { x: 26, y: 94, w: 7 },
      blossom: { x: 60, y: 95, w: 4 },
      pebbles: { x: 40, y: 97, w: 6 },
      shell: { x: 93, y: 97, w: 3 },
    },
  },

  // Down the jetty.
  itinerary: {
    id: 'itinerary',
    label: 'Itinerary',
    bg: 'itinerary/background.webp',
    bgFit: 'cover',
    canvas: CANVAS,
    layers: [
      L({ id: 'cloud', kind: 'img', src: 'itinerary/cloud.webp', x: 92, y: 8, w: 33, z: 2, order: 0, depth: 0.6 }),
      eyebrow('eyebrow', 'The Day', 30, 'Itinerary Label'),
      heading('title', 'Programme', 36, 'Itinerary Title'),
      // Centred like the design's time | event rows — see --slot-itin-* overrides in index.tsx.
      L({ id: 'list', kind: 'slot', slot: 'itineraryList', x: 50, y: 57, w: 74, h: 34, z: 7, order: 2, chain: false, depth: 0.2, label: 'Itinerary List' }),
      // Every rendered item shares one Time style and one Label style — same sub-layer + Style tab
      // structure as the hero (see ItineraryListSlot/subLayerStyle.ts).
      L({ id: 'itin-time', kind: 'anchor', parent: 'list', label: 'Time', order: 0, styleable: true, color: INK, fontFamily: FONT, fontWeight: 600, fontSize: 4.4, letterSpacing: 0.08 }),
      L({ id: 'itin-title', kind: 'anchor', parent: 'list', label: 'Label', order: 1, styleable: true, color: INK, fontFamily: FONT, fontWeight: 500, fontSize: 5 }),
      L({ id: 'boat', kind: 'img', src: 'itinerary/boat.webp', x: 3, y: 50, w: 29, z: 3, order: 1, label: 'Moored Boat' }),
      L({ id: 'lantern', kind: 'img', src: 'itinerary/lantern.webp', x: 12, y: 79, w: 12, z: 5, order: 3 }),
      L({ id: 'rope-buoy', kind: 'img', src: 'itinerary/rope-buoy.webp', x: 92, y: 86, w: 29, z: 5, order: 4 }),
      L({ id: 'shells', kind: 'img', src: 'itinerary/shells.webp', x: 76, y: 90, w: 27, z: 6, order: 5 }),
      L({ id: 'shell-small', kind: 'img', src: 'itinerary/shell-small.webp', x: 60, y: 92, w: 7, z: 6, order: 5 }),
    ],
    desktop: {
      cloud: { x: 90, y: 10, w: 16 },
      eyebrow: { y: 20, fontSize: 1.5 },
      title: { y: 28, fontSize: 4 },
      list: { x: 50, y: 58, w: 46, h: 44 },
      'itin-time': { fontSize: 2.4 },
      'itin-title': { fontSize: 2.7 },
      boat: { x: 9, y: 66, w: 16 },
      lantern: { x: 24, y: 84, w: 5 },
      'rope-buoy': { x: 92, y: 86, w: 14 },
      shells: { x: 80, y: 93, w: 12 },
      'shell-small': { x: 70, y: 96, w: 3 },
    },
  },

  // The rock pool.
  rsvp: {
    id: 'rsvp',
    label: 'RSVP',
    bg: 'rsvp/background.webp',
    bgFit: 'cover',
    canvas: CANVAS,
    layers: [
      // Ambient motion over the painted pool (see _shared/effects/WaterLayer.tsx): a drifting
      // translucent water texture, three faint ripple rings, a few glints and a slow peach light
      // drift. The box covers the pool's interior; the layer's radial mask fades it out before the
      // rock rim. Bottle/lantern/crab/rocks stay static — they rest on something; only the floating
      // blossoms carry an idle float.
      L({ id: 'water', kind: 'water', x: 50, y: 44, w: 76, h: 52, z: 3, order: 0, chain: false, anim: 'none', label: 'Pool Water',
          waterDrift: 15, waterRipples: 3, waterGlints: 6, waterGlow: 0.08, waterGlowColor: '#f8bfb1' }),
      L({ id: 'crab', kind: 'img', src: 'rsvp/crab.webp', x: 6, y: 9, w: 13, z: 4, order: 0, animIdle: 'sway', animIdleSpeed: 0.6, animIdleIntensity: 0.5 }),
      eyebrow('eyebrow', 'Kindly Respond', 38, 'RSVP Label'),
      heading('title', 'Will you join us by the sea?', 46, 'RSVP Title', { h: 16 }),
      L({
        id: 'prompt', kind: 'text', text: 'We would love to celebrate with you',
        x: 50, y: 56, w: 90, h: 5, z: 7, order: 2, chain: false, depth: 0.3,
        color: INK_SOFT, fontFamily: FONT, fontWeight: 700, fontSize: 2.7, letterSpacing: 0.2, textTransform: 'uppercase', label: 'RSVP Prompt',
      }),
      L({ id: 'trigger', kind: 'slot', slot: 'sheetTrigger', sheetId: 'rsvp', x: 50, y: 64, w: 44, h: 8, z: 8, order: 3, chain: false, depth: 0.2, label: 'RSVP Button' }),
      L({ id: 'form', kind: 'slot', slot: 'rsvpForm', presentation: 'sheet', sheetId: 'rsvp', x: 50, y: 54, w: 74, h: 44, z: 5, order: 4, chain: false, depth: 0.15, label: 'RSVP Form (step 1) · in pop-up' }),
      L({ id: 'seating', kind: 'slot', slot: 'rsvpSeating', presentation: 'sheet', sheetId: 'rsvp', x: 50, y: 54, w: 74, h: 44, z: 4, order: 4, chain: false, depth: 0.15, label: 'Seating (step 2) · in pop-up' }),
      L({ id: 'frangipani-pair', kind: 'img', src: 'rsvp/frangipani-pair.webp', x: 20, y: 70, w: 18, z: 5, order: 4, animIdle: 'float', animIdleSpeed: 0.5, animIdleIntensity: 0.4 }),
      L({ id: 'petal', kind: 'img', src: 'rsvp/petal.webp', x: 37, y: 76, w: 6, z: 5, order: 5, animIdle: 'float', animIdleSpeed: 0.4, animIdleIntensity: 0.4 }),
      L({ id: 'bottle', kind: 'img', src: 'rsvp/bottle.webp', x: 12, y: 84, w: 31, z: 5, order: 2, label: 'Message in a Bottle' }),
      L({ id: 'lantern', kind: 'img', src: 'rsvp/lantern.webp', x: 88, y: 83, w: 16, z: 5, order: 3 }),
      L({ id: 'pebbles-starfish', kind: 'img', src: 'rsvp/pebbles-starfish.webp', x: 30, y: 92, w: 20, z: 6, order: 5 }),
    ],
    desktop: {
      water: { x: 50, y: 50, w: 70, h: 80 },
      crab: { x: 6, y: 12, w: 6 },
      eyebrow: { y: 30, fontSize: 1.5 },
      title: { y: 40, w: 60, fontSize: 4 },
      prompt: { y: 50, fontSize: 1.35 },
      trigger: { y: 60, w: 18, h: 9 },
      form: { w: 40, h: 60 },
      seating: { w: 40, h: 60 },
      'frangipani-pair': { x: 22, y: 78, w: 8 },
      petal: { x: 30, y: 86, w: 3 },
      bottle: { x: 10, y: 86, w: 14 },
      lantern: { x: 91, y: 82, w: 7 },
      'pebbles-starfish': { x: 80, y: 95, w: 10 },
    },
  },

  // Blue-hour dunes.
  wishes: {
    id: 'wishes',
    label: 'Wishes',
    bg: 'wishes/background.webp',
    bgFit: 'cover',
    canvas: CANVAS,
    layers: [
      L({ id: 'cloud-left', kind: 'img', src: 'wishes/cloud-left.webp', x: 28, y: 9, w: 70, z: 2, order: 0, depth: 0.6 }),
      L({ id: 'cloud-right', kind: 'img', src: 'wishes/cloud-right.webp', x: 88, y: 14, w: 31, z: 2, order: 0, depth: 0.6, opacity: 0.9 }),
      eyebrow('eyebrow', 'Wishes', 27, 'Wishes Label'),
      heading('title', 'Leave us a note in the sand', 33, 'Wishes Title', { fontSize: 6.4 }),
      L({ id: 'trigger', kind: 'slot', slot: 'sheetTrigger', sheetId: 'wish', x: 50, y: 41, w: 44, h: 7, z: 8, order: 2, chain: false, depth: 0.3, label: 'Write a Wish Button' }),
      L({ id: 'list', kind: 'slot', slot: 'wishList', x: 50, y: 56, w: 82, h: 20, z: 8, order: 3, chain: false, depth: 0, label: 'Wish List' }),
      L({ id: 'form', kind: 'slot', slot: 'wishForm', presentation: 'sheet', sheetId: 'wish', x: 50, y: 52, w: 78, h: 26, z: 5, order: 3, chain: false, depth: 0.2, label: 'Wish Form (step 1) · in pop-up' }),
      L({ id: 'wishPhoto', kind: 'slot', slot: 'wishPhoto', presentation: 'sheet', sheetId: 'wish', x: 50, y: 52, w: 78, h: 30, z: 4, order: 4, chain: false, depth: 0.2, label: 'Add a Photo (step 2) · in pop-up' }),
      L({ id: 'garland-posts', kind: 'img', src: 'wishes/garland-posts.webp', x: 50, y: 79, w: 92, z: 4, order: 1, label: 'Shell Garland' }),
      L({ id: 'wish-notes', kind: 'img', src: 'wishes/wish-notes.webp', x: 8, y: 90, w: 22, z: 5, order: 3 }),
      L({ id: 'sand-heart', kind: 'img', src: 'wishes/sand-heart.webp', x: 46, y: 92, w: 22, z: 5, order: 4 }),
      L({ id: 'stick', kind: 'img', src: 'wishes/stick.webp', x: 59, y: 92, w: 14, z: 5, order: 4 }),
      L({ id: 'pebble-stack', kind: 'img', src: 'wishes/pebble-stack.webp', x: 88, y: 91, w: 18, z: 5, order: 3 }),
      L({ id: 'blossom', kind: 'img', src: 'wishes/blossom.webp', x: 96, y: 93, w: 7, z: 6, order: 5 }),
    ],
    desktop: {
      'cloud-left': { x: 20, y: 12, w: 34 },
      'cloud-right': { x: 86, y: 10, w: 16 },
      eyebrow: { y: 18, fontSize: 1.5 },
      title: { y: 25, w: 60, fontSize: 3.8 },
      trigger: { y: 34, w: 18, h: 9 },
      list: { x: 50, y: 58, w: 46, h: 30 },
      form: { w: 40, h: 50 },
      wishPhoto: { w: 40, h: 50 },
      'garland-posts': { x: 50, y: 82, w: 44 },
      'wish-notes': { x: 8, y: 92, w: 10 },
      'sand-heart': { x: 22, y: 95, w: 10 },
      stick: { x: 30, y: 95, w: 6 },
      'pebble-stack': { x: 90, y: 92, w: 9 },
      blossom: { x: 97, y: 97, w: 3 },
    },
  },

  // Sand close-up.
  photobooth: {
    id: 'photobooth',
    label: 'Photo Booth',
    bg: 'photobooth/background.webp',
    bgFit: 'cover',
    canvas: CANVAS,
    layers: [
      L({ id: 'garland', kind: 'img', src: 'photobooth/garland.webp', x: 50, y: 7, w: 112, z: 4, order: 0, label: 'Shell Garland' }),
      // A single slot renders title + prompt + gallery + upload together (see PhotoBoothSlot.tsx).
      L({ id: 'booth', kind: 'slot', slot: 'photoBooth', x: 50, y: 47, w: 82, h: 52, z: 7, order: 1, chain: false, depth: 0.2, textScale: 1.2, label: 'Photo Booth' }),
      L({ id: 'grass', kind: 'img', src: 'photobooth/grass.webp', x: 0, y: 92, w: 20, z: 4, order: 1 }),
      L({ id: 'frame', kind: 'img', src: 'photobooth/frame.webp', x: 14, y: 88, w: 38, z: 5, order: 2, label: 'Driftwood Frame' }),
      L({ id: 'towel', kind: 'img', src: 'photobooth/towel.webp', x: 94, y: 85, w: 34, z: 5, order: 2 }),
      L({ id: 'starfish', kind: 'img', src: 'photobooth/starfish.webp', x: 41, y: 91, w: 11, z: 6, order: 3 }),
      L({ id: 'blossoms', kind: 'img', src: 'photobooth/blossoms.webp', x: 61, y: 92, w: 13, z: 6, order: 3 }),
      L({ id: 'conch', kind: 'img', src: 'photobooth/conch.webp', x: 52, y: 93, w: 6, z: 6, order: 4 }),
      L({ id: 'pebbles', kind: 'img', src: 'photobooth/pebbles.webp', x: 81, y: 93, w: 7, z: 6, order: 4 }),
      // Spare props from the sheet, shipped hidden so a couple can switch them on in Adjust.
      L({ id: 'jar-candle', kind: 'img', src: 'photobooth/jar-candle.webp', x: 72, y: 88, w: 13, z: 6, order: 4, hidden: true, label: 'Candle Jar' }),
      L({ id: 'shell-pile', kind: 'img', src: 'photobooth/shell-pile.webp', x: 33, y: 93, w: 11, z: 6, order: 4, hidden: true, label: 'Shell Pile' }),
    ],
    desktop: {
      garland: { x: 50, y: 8, w: 60 },
      booth: { x: 50, y: 52, w: 54, h: 66 },
      grass: { x: 3, y: 94, w: 10 },
      frame: { x: 11, y: 84, w: 18 },
      towel: { x: 91, y: 84, w: 16 },
      starfish: { x: 22, y: 95, w: 5 },
      blossoms: { x: 78, y: 96, w: 6 },
      conch: { x: 27, y: 97, w: 3 },
      pebbles: { x: 86, y: 98, w: 4 },
      'jar-candle': { x: 74, y: 90, w: 6 },
      'shell-pile': { x: 30, y: 98, w: 6 },
    },
  },
};

/** Which logical `section.order` code each stage belongs to. One stage per code — no compiled/
 *  shared-backdrop row like T7's ceremony beats. */
export const STAGE_GROUPS: Record<string, string[]> = {
  welcome: ['welcome'],
  walimah: ['walimah'],
  itinerary: ['itinerary'],
  rsvp: ['rsvp'],
  wishes: ['wishes'],
  photobooth: ['photobooth'],
};

/** Schema-declared config defaults this template reads directly (not through the layout system).
 *  Documentation only — the real defaults live in `lib/templateConfigSchema.ts`. */
export const T14_DEFAULTS: Record<string, string> = {
  'photobooth.frameArt': 'none',
};
