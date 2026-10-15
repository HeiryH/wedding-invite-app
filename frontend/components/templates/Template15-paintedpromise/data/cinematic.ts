import type { CameraKeyframe } from '@/components/templates/_shared/cinematic/useCinematicScroll';
import type { CinematicWorldLayer } from '@/components/templates/_shared/cinematic/world';
import {
  beatsFromSequence,
  CINEMATIC_SEQUENCE_VERSION,
  visibilityFromSequence,
  type CinematicSequence,
} from '@/components/templates/_shared/cinematic/sequence';

export type PaintedPromiseBeatId =
  | 'ring'
  | 'walimah'
  | 'dais'
  | 'groom'
  | 'bride'
  | 'dais-return'
  | 'programme-wide'
  | 'programme-focus'
  | 'table-rsvp'
  | 'rsvp-letter'
  | 'table-wishes'
  | 'wishes-book'
  | 'memory-wall';

const REFS = '/templates/painted-promise/editor-references';

/**
 * The global story contract. Camera geometry and layer placement remain breakpoint-specific, but
 * beat order, narrative ownership and appearance timing are shared so the invitation tells the
 * same story on every device.
 */
export const PAINTED_PROMISE_SEQUENCE: CinematicSequence = {
  version: CINEMATIC_SEQUENCE_VERSION,
  beats: [
    { id: 'ring', label: 'Ring close-up', at: 0.08, order: 0, transitionIn: 'ease-out', referenceSrc: `${REFS}/welcome.png`, referenceLabel: 'Welcome reference' },
    { id: 'walimah', label: 'Walimah words', at: 0.21, order: 1, transitionIn: 'ease-out', referenceSrc: `${REFS}/background.webp`, referenceLabel: 'Backdrop reference' },
    { id: 'dais', label: 'Full dais', at: 0.31, order: 2, transitionIn: 'ease-out', referenceSrc: `${REFS}/details.png`, referenceLabel: 'Dais reference' },
    { id: 'groom', label: 'Groom close-up', at: 0.40, order: 3, transitionIn: 'ease-out', referenceSrc: `${REFS}/details.png`, referenceLabel: 'Details reference' },
    { id: 'bride', label: 'Bride close-up', at: 0.50, order: 4, transitionIn: 'ease-out', referenceSrc: `${REFS}/details.png`, referenceLabel: 'Details reference' },
    { id: 'dais-return', label: 'Dais zoom-out', at: 0.585, order: 5, transitionIn: 'ease-out', referenceSrc: `${REFS}/details.png`, referenceLabel: 'Dais reference' },
    { id: 'programme-wide', label: 'Programme · wide', at: 0.62, order: 6, transitionIn: 'ease-out', referenceSrc: `${REFS}/itinerary.png`, referenceLabel: 'Itinerary reference' },
    { id: 'programme-focus', label: 'Programme · focus', at: 0.71, order: 7, transitionIn: 'ease-out', referenceSrc: `${REFS}/itinerary.png`, referenceLabel: 'Itinerary reference' },
    { id: 'table-rsvp', label: 'Table · RSVP', at: 0.78, order: 8, transitionIn: 'ease-out', referenceSrc: `${REFS}/rsvp.png`, referenceLabel: 'RSVP reference' },
    { id: 'rsvp-letter', label: 'RSVP letter', at: 0.825, order: 9, transitionIn: 'ease-out', referenceSrc: `${REFS}/rsvp.png`, referenceLabel: 'RSVP reference' },
    { id: 'table-wishes', label: 'Table · guest book', at: 0.865, order: 10, transitionIn: 'ease-out', referenceSrc: `${REFS}/wishes.png`, referenceLabel: 'Wishes reference' },
    { id: 'wishes-book', label: 'Best Wishes book', at: 0.90, order: 11, transitionIn: 'ease-out', referenceSrc: `${REFS}/wishes.png`, referenceLabel: 'Wishes reference' },
    { id: 'memory-wall', label: 'Memory wall', at: 0.985, order: 12, transitionIn: 'ease-out', referenceSrc: `${REFS}/photobooth.png`, referenceLabel: 'Photobooth reference' },
  ],
  tracks: [
    {
      id: 'welcome', label: 'Welcome hands', kind: 'set', target: { type: 'group', id: 'welcome' },
      timing: { mode: 'independent' },
      clip: { start: 0, enterEnd: 0, exitStart: .13, end: .19 },
      enter: { kind: 'cut', easing: 'linear' }, exit: { kind: 'fade', easing: 'ease-in-out' },
      ownership: { kind: 'beat', beatId: 'ring' },
    },
    {
      id: 'welcome-ring', label: 'Wedding ring', kind: 'asset', target: { type: 'layer', id: 'welcome-ring' },
      timing: { mode: 'independent' },
      clip: { start: .075, enterEnd: .105, exitStart: .13, end: .19 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in-out' },
      ownership: { kind: 'beat', beatId: 'ring' },
    },
    {
      id: 'walimah-copy', label: 'Walimah words', kind: 'text', target: { type: 'narrative', id: 'walimah-copy' },
      timing: { mode: 'independent' },
      clip: { start: .155, enterEnd: .21, exitStart: .21, end: .285 },
      enter: { kind: 'fade', easing: 'linear' }, exit: { kind: 'fade', easing: 'linear' },
      ownership: { kind: 'beat', beatId: 'walimah' },
    },
    {
      id: 'dais', label: 'Dais set', kind: 'set', target: { type: 'group', id: 'dais' },
      timing: { mode: 'independent' },
      clip: { start: .245, enterEnd: .29, exitStart: .56, end: .62 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in' },
      ownership: { kind: 'shared' },
    },
    {
      id: 'groom-details', label: 'Groom details', kind: 'text', target: { type: 'narrative', id: 'groom-details' },
      timing: { mode: 'independent' },
      clip: { start: .345, enterEnd: .4, exitStart: .4, end: .445 },
      enter: { kind: 'fade', easing: 'linear' }, exit: { kind: 'fade', easing: 'linear' },
      ownership: { kind: 'beat', beatId: 'groom' },
    },
    {
      id: 'bride-details', label: 'Bride details', kind: 'text', target: { type: 'narrative', id: 'bride-details' },
      timing: { mode: 'independent' },
      clip: { start: .445, enterEnd: .5, exitStart: .5, end: .555 },
      enter: { kind: 'fade', easing: 'linear' }, exit: { kind: 'fade', easing: 'linear' },
      ownership: { kind: 'beat', beatId: 'bride' },
    },
    {
      id: 'programme', label: 'Programme board', kind: 'set', target: { type: 'group', id: 'programme' },
      timing: { mode: 'independent' },
      clip: { start: .55, enterEnd: .59, exitStart: .745, end: .77 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in' },
      ownership: { kind: 'shared' },
    },
    {
      id: 'table', label: 'Reception table', kind: 'set', target: { type: 'group', id: 'table' },
      timing: { mode: 'independent' },
      clip: { start: .735, enterEnd: .77, exitStart: .77, end: .965 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in' },
      ownership: { kind: 'shared' },
    },
    {
      id: 'table-wishes', label: 'Guest book on table', kind: 'set', target: { type: 'group', id: 'table-wishes' },
      timing: { mode: 'independent' },
      clip: { start: .85, enterEnd: .875, exitStart: .93, end: .965 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in' },
      ownership: { kind: 'beat', beatId: 'table-wishes' },
    },
    {
      id: 'rsvp', label: 'RSVP envelope', kind: 'interaction', target: { type: 'group', id: 'rsvp' },
      timing: { mode: 'independent' },
      clip: { start: .785, enterEnd: .825, exitStart: .825, end: .865 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in' },
      ownership: { kind: 'beat', beatId: 'rsvp-letter' },
    },
    {
      id: 'wishes', label: 'Best Wishes book', kind: 'interaction', target: { type: 'group', id: 'wishes' },
      timing: { mode: 'independent' },
      clip: { start: .865, enterEnd: .9, exitStart: .9, end: .945 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'fade', easing: 'ease-in' },
      ownership: { kind: 'beat', beatId: 'wishes-book' },
    },
    {
      id: 'memory', label: 'Memory wall', kind: 'interaction', target: { type: 'group', id: 'memory' },
      timing: { mode: 'independent' },
      clip: { start: .925, enterEnd: .99, exitStart: 1, end: 1 },
      enter: { kind: 'fade', easing: 'ease-out' }, exit: { kind: 'cut', easing: 'linear' },
      ownership: { kind: 'beat', beatId: 'memory-wall' },
    },
  ],
};

/** Compatibility projections for the current editor/runtime while the timeline UI is phased in. */
export const PAINTED_PROMISE_BEATS = beatsFromSequence(PAINTED_PROMISE_SEQUENCE);
export const PAINTED_PROMISE_VISIBILITY = visibilityFromSequence(PAINTED_PROMISE_SEQUENCE);

export const PAINTED_PROMISE_CAMERA: CameraKeyframe[] = [
  { at: 0, x: 0, y: 72, scale: 1.22 },
  { at: 0.2, x: 0, y: 68, scale: 1.18 },
  { at: 0.3, x: 0, y: 2, scale: 1.02 },
  { at: 0.4, x: 28, y: 2, scale: 2.35 },
  { at: 0.5, x: -26, y: 2, scale: 2.35 },
  { at: 0.59, x: 0, y: 8, scale: 0.88, rotate: -0.8 },
  { at: 0.66, x: -26, y: 4, scale: 1.18, rotate: -1.4 },
  { at: 0.71, x: -8, y: -28, scale: 1.65, rotate: 0, desktop: { x: -44 } },
  { at: 0.77, x: 0, y: -18, scale: 0.83 },
  { at: 0.92, x: 0, y: -22, scale: 0.78 },
  { at: 1, x: 0, y: -28, scale: 0.68 },
];

const ASSETS = '/templates/painted-promise/assets';

/** Mobile is the primary composition; desktop overrides preserve the original wider staging. */
export const PAINTED_PROMISE_WORLD: CinematicWorldLayer[] = [
  {
    id: 'clouds', label: 'Cloud background', group: 'background', space: 'viewport',
    src: `${ASSETS}/background-v1/cloud-bg.png`, x: 50, y: 50, w: 124, h: 124,
    z: 0, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1, fit: 'cover',
  },
  {
    id: 'welcome-groom-hand', label: 'Groom hand · dark formal cuff', group: 'welcome', space: 'viewport',
    src: `${ASSETS}/welcome-source-v1/groom-hand.png`, x: 20, y: 56, w: 86,
    z: 8, rotation: 3, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 30.6, y: 66, w: 54.2 },
  },
  {
    id: 'welcome-bride-hand', label: 'Bride hand · white bridal lace', group: 'welcome', space: 'viewport',
    src: `${ASSETS}/welcome-source-v1/bride-hand.png`, x: 89, y: 45, w: 84,
    z: 9, rotation: -3, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 73.8, y: 41.1, w: 50.7 },
  },
  {
    id: 'welcome-ring', label: 'Wedding ring', group: 'welcome', space: 'viewport',
    src: `${ASSETS}/welcome-source-v1/ring.png`, x: 52.5, y: 50, w: 9,
    z: 10, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 50.9, y: 51.8, w: 5.7 },
  },
  {
    id: 'walkway', label: 'Walkway', group: 'venue', space: 'world',
    src: `${ASSETS}/background-v1/walkway.png`, x: 50, y: 66.5, w: 100, h: 67,
    z: 1, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1, fit: 'fill',
  },
  {
    id: 'wall-left', label: 'Side wall · left', group: 'venue', space: 'world',
    src: `${ASSETS}/background-v1/side-walls.webp`, x: 25.5, y: 49.5, w: 51, h: 45,
    z: 2, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1, fit: 'fill',
  },
  {
    id: 'wall-right', label: 'Side wall · right', group: 'venue', space: 'world',
    src: `${ASSETS}/background-v1/side-walls.webp`, x: 74.5, y: 49.5, w: 51, h: 45,
    z: 2, rotation: 0, flipX: true, hidden: false, locked: false, opacity: 1, fit: 'fill',
  },
  {
    id: 'petals-left', label: 'Petal trail · left', group: 'venue', space: 'world',
    src: `${ASSETS}/background-v1/petal-trails.webp`, x: 37.5, y: 76, w: 25, h: 48,
    z: 3, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1, fit: 'fill',
  },
  {
    id: 'petals-right', label: 'Petal trail · right', group: 'venue', space: 'world',
    src: `${ASSETS}/background-v1/petal-trails.webp`, x: 62.5, y: 76, w: 25, h: 48,
    z: 3, rotation: 0, flipX: true, hidden: false, locked: false, opacity: 1, fit: 'fill',
  },
  {
    id: 'groom-chair', label: 'Groom chair', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/groom-chair.png`, x: 36, y: 55, w: 21,
    z: 5, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 45.1, y: 52, w: 6.6 },
  },
  {
    id: 'bride-chair', label: 'Bride chair', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/bride-chair.png`, x: 64, y: 55, w: 21,
    z: 5, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 54.9, y: 52, w: 6.6 },
  },
  {
    id: 'groom', label: 'Seated groom', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/seated-groom.png`, x: 35, y: 54, w: 18,
    z: 6, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 45.5, y: 51, w: 5.6 },
  },
  {
    id: 'bride', label: 'Seated bride', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/seated-bride.png`, x: 65, y: 54, w: 28,
    z: 6, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 54.2, y: 51, w: 8.6 },
  },
  {
    id: 'centre-floral', label: 'Centre floral', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/centre-floral.png`, x: 50, y: 72, w: 34,
    z: 7, rotation: 0, flipX: false, hidden: true, locked: false, opacity: 1,
    desktop: { y: 59, w: 11 },
  },
  {
    id: 'floral-left', label: 'Floral branch · left', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/left-floral-branch.png`, x: 12, y: 54, w: 28,
    z: 7, rotation: 0, flipX: false, hidden: true, locked: false, opacity: 1,
    desktop: { x: 39, y: 52, w: 9 },
  },
  {
    id: 'floral-right', label: 'Floral branch · right', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/right-floral-branch.png`, x: 88, y: 54, w: 28,
    z: 7, rotation: 0, flipX: false, hidden: true, locked: false, opacity: 1,
    desktop: { x: 61, y: 52, w: 9 },
  },
  {
    id: 'lanterns-left', label: 'Lanterns · left', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/left-lantern-cluster.png`, x: 17, y: 70, w: 15,
    z: 8, rotation: 0, flipX: false, hidden: true, locked: false, opacity: 1,
    desktop: { x: 41, y: 59, w: 5 },
  },
  {
    id: 'lanterns-right', label: 'Lanterns · right', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/right-lantern-cluster.png`, x: 83, y: 70, w: 15,
    z: 8, rotation: 0, flipX: false, hidden: true, locked: false, opacity: 1,
    desktop: { x: 59, y: 59, w: 5 },
  },
  {
    id: 'loose-petals', label: 'Loose dais petals', group: 'dais', space: 'world',
    src: `${ASSETS}/walimah-v2/loose-petals.png`, x: 50, y: 78, w: 45,
    z: 9, rotation: 0, flipX: false, hidden: true, locked: false, opacity: 1,
    desktop: { y: 63, w: 14 },
  },
  {
    id: 'programme-board', label: 'Programme board', group: 'programme', space: 'world',
    src: `${ASSETS}/itinerary-v1/programme-board.png`, x: 54, y: 52, w: 22,
    z: 12, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    aspectRatio: .72, desktop: { x: 72, y: 54, w: 14 },
  },
  {
    id: 'reception-table', label: 'Reception table', group: 'table', space: 'world',
    src: `${ASSETS}/cinematic/reception-table.png`, x: 50, y: 78, w: 42.2,
    z: 10, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { w: 32.2 },
  },
  {
    id: 'reception-chair-left', label: 'Reception chair · left', group: 'table', space: 'world',
    src: `${ASSETS}/cinematic/reception-chair.png`, x: 27.2, y: 78, w: 12.9,
    z: 11, rotation: -7, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { x: 32.6, w: 9.9 },
  },
  {
    id: 'reception-chair-right', label: 'Reception chair · right', group: 'table', space: 'world',
    src: `${ASSETS}/cinematic/reception-chair.png`, x: 72.8, y: 78, w: 12.9,
    z: 11, rotation: 7, flipX: true, hidden: false, locked: false, opacity: 1,
    desktop: { x: 67.4, w: 9.9 },
  },
  {
    id: 'table-guest-book', label: 'Guest book on table', group: 'table-wishes', space: 'world',
    src: `${ASSETS}/wishes-v1/open-blank-guest-book.png`, x: 50, y: 75, w: 17.7,
    z: 13, rotation: -3, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { w: 13.5 },
  },
  {
    id: 'rsvp-letter', label: 'RSVP envelope and letter', group: 'rsvp', space: 'viewport',
    src: `${ASSETS}/rsvp-v1/sealed-blush-envelope.png`, x: 50, y: 50, w: 76, h: 66,
    z: 20, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { w: 52, h: 66 },
  },
  {
    id: 'wishes-book', label: 'Best Wishes guest book', group: 'wishes', space: 'viewport',
    src: `${ASSETS}/wishes-v1/open-blank-guest-book.png`, x: 50, y: 50, w: 88,
    z: 21, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    aspectRatio: 1.732, desktop: { w: 53 },
  },
  {
    id: 'memory-wall', label: 'Memory wall', group: 'memory', space: 'viewport',
    src: `${ASSETS}/cinematic/photobooth-arch.png`, x: 50, y: 50, w: 98, h: 92,
    z: 22, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
    desktop: { w: 53, h: 92 },
  },
];
