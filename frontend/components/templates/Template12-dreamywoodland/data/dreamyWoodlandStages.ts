import type { Layer, StageDef } from '@/components/templates/_shared/types';

const ROOT = '/templates/dreamy-woodland';

const anchor = (id: string, label: string): Layer => ({
  id, kind: 'anchor', label, styleable: true,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 20, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const prop = (
  id: string, file: string, x: number, y: number, w: number, h: number, z: number,
  extra: Partial<Layer> = {},
): Layer => ({
  id, kind: 'img', label: id.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' '),
  src: `${ROOT}/props/${file}`, x, y, w, h, z, s: 1, order: z,
  chain: false, hidden: false, opacity: 1, depth: Math.min(0.45, z / 20),
  anim: 'fade', animDur: 1.15,
  ...extra,
});

const v2Prop = (
  id: string, file: string, x: number, y: number, w: number, h: number, z: number,
  extra: Partial<Layer> = {},
): Layer => ({
  ...prop(id, file, x, y, w, h, z, extra),
  src: `${ROOT}/props-v2/${file}`,
});

const ground = (id: string, file: string): Layer => v2Prop(id, file, 50, 82, 112, 48, 1, {
  depth: 0.08,
  anim: 'slide-up',
  animDur: 0.95,
  animOut: 'slide-fade-out-down',
  order: 0,
});

const leftCorner = (id: string, file: string, x: number, y: number, w: number, h: number): Layer =>
  v2Prop(id, file, x, y, w, h, 2, {
    depth: 0.14,
    anim: 'slide-right',
    animDur: 1.05,
    animOut: 'slide-fade-out-left',
    order: 1,
  });

const rightCorner = (id: string, file: string, x: number, y: number, w: number, h: number): Layer =>
  v2Prop(id, file, x, y, w, h, 2, {
    depth: 0.14,
    flipX: true,
    anim: 'slide-left',
    animDur: 1.05,
    animOut: 'slide-fade-out-right',
    order: 1,
  });

const slot = (id: string, slotId: string, label: string, extra: Partial<Layer> = {}): Layer => ({
  id, kind: 'slot', slot: slotId, label,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 10, order: 0,
  chain: false, hidden: false, opacity: 1,
  ...extra,
});

const stage = (id: string, label: string, layers: Layer[], desktop: StageDef['desktop'] = {}): StageDef => ({
  id,
  label,
  bg: '',
  bgFit: 'cover',
  bgPosition: 'center center',
  layers,
  desktop,
});

export const T12_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome', [
    ground('ground-meadow', 'ground-meadow-v2.webp'),
    prop('rose-arch', 'rose-arch.webp', 50, 42, 92, 64, 2),
    prop('flowering-tree', 'flowering-tree.webp', 80, 84, 40, 28, 3),
    prop('deer', 'deer.webp', 22, 78, 25, 14, 4),
    prop('doves', 'doves.webp', 78, 26, 18, 6, 4, { flipX: true }),
    prop('moon-stars', 'moon-stars.webp', 20, 19, 17, 8, 3),
    anchor('themeLabel', 'Invitation Line'),
    anchor('nameFirst', 'First Name'),
    anchor('nameSecond', 'Second Name'),
    anchor('date', 'Date'),
    anchor('timer', 'Countdown Timer'),
    anchor('hijri', 'Hijri Date'),
    anchor('venue', 'Venue'),
  ], {
    'ground-meadow': { x: 50, y: 82, w: 104, h: 70 },
    'rose-arch': { x: 50, y: 48, w: 39, h: 94 },
    'flowering-tree': { x: 76, y: 70, w: 22, h: 53 },
    deer: { x: 28, y: 81, w: 12, h: 23 },
    doves: { x: 69, y: 25, w: 10, h: 10 },
    'moon-stars': { x: 31, y: 20, w: 9, h: 14 },
  }),
  walimah: stage('walimah', 'Ceremony', [
    ground('ground-garden', 'ground-garden-v2.webp'),
    prop('potted-botanicals', 'potted-botanicals.webp', 50, 91, 58, 27, 3),
    prop('rose-sprig', 'rose-sprig.webp', 12, 22, 20, 9, 2),
    prop('doves', 'doves.webp', 85, 20, 15, 5, 3, { flipX: true }),
    anchor('title', 'Ceremony Title'),
  ], {
    'ground-garden': { x: 50, y: 82, w: 104, h: 70 },
    'potted-botanicals': { w: 27, h: 43 },
    'rose-sprig': { x: 21, w: 11, h: 18 },
    doves: { x: 78, w: 8, h: 8 },
  }),
  rsvp: stage('rsvp', 'RSVP', [
    ground('ground-meadow', 'ground-meadow-v2.webp'),
    prop('deer', 'deer.webp', 82, 76, 25, 14, 3, { flipX: true }),
    prop('rose-sprig', 'rose-sprig.webp', 14, 78, 22, 10, 2),
    slot('rsvpTitle', 'rsvpTitle', 'RSVP Title', { order: 0, z: 14 }),
    slot('rsvpPrompt', 'rsvpPrompt', 'RSVP Prompt', { order: 1, z: 13 }),
    slot('rsvpForm', 'rsvpForm', 'RSVP Form · in pop-up', { order: 2, z: 12, presentation: 'sheet', sheetId: 'rsvp' }),
    slot('rsvpSeating', 'rsvpSeating', 'Seating · in pop-up', { order: 2, z: 11, presentation: 'sheet', sheetId: 'rsvp' }),
    slot('rsvpTrigger', 'sheetTrigger', 'RSVP Button', { order: 3, z: 10, sheetId: 'rsvp' }),
  ], {
    'ground-meadow': { x: 50, y: 82, w: 104, h: 70 },
    deer: { x: 76, y: 77, w: 13, h: 25 },
    'rose-sprig': { x: 24, w: 12, h: 19 },
  }),
  itinerary: stage('itinerary', 'Schedule', [
    ground('ground-path', 'ground-path-v2.webp'),
    leftCorner('corner-rose-left', 'corner-rose-vine-v2.webp', 8, 45, 34, 76),
    rightCorner('corner-rose-right', 'corner-rose-vine-v2.webp', 92, 45, 34, 76),
    prop('fox-rabbit', 'fox-rabbit.webp', 82, 82, 28, 13, 3),
    prop('moon-stars', 'moon-stars.webp', 15, 18, 16, 7, 2),
    slot('itineraryTitle', 'itineraryTitle', 'Schedule Title', { order: 0, z: 12 }),
    slot('itineraryList', 'itineraryList', 'Schedule List', { order: 1, z: 11 }),
    { ...anchor('itin-time', 'Time'), parent: 'itineraryList' },
    { ...anchor('itin-title', 'Label'), parent: 'itineraryList' },
  ], {
    'ground-path': { x: 50, y: 82, w: 104, h: 70 },
    'corner-rose-left': { x: 9, y: 48, w: 19, h: 88 },
    'corner-rose-right': { x: 91, y: 48, w: 19, h: 88 },
    'fox-rabbit': { x: 76, w: 15, h: 24 },
    'moon-stars': { x: 25, w: 9, h: 14 },
  }),
  wishes: stage('wishes', 'Wishes', [
    ground('ground-meadow', 'ground-meadow-v2.webp'),
    leftCorner('corner-canopy-left', 'corner-flower-canopy-v2.webp', 16, 20, 48, 46),
    rightCorner('corner-canopy-right', 'corner-flower-canopy-v2.webp', 84, 20, 48, 46),
    prop('flowering-tree', 'flowering-tree.webp', 84, 79, 34, 24, 2, { flipX: true }),
    prop('rose-sprig', 'rose-sprig.webp', 12, 19, 21, 10, 3),
    slot('wishTitle', 'wishTitle', 'Wishes Title', { order: 0, z: 15 }),
    slot('wishPrompt', 'wishPrompt', 'Wishes Prompt', { order: 1, z: 14 }),
    slot('wishForm', 'wishForm', 'Wish Form · in pop-up', { order: 2, z: 13, presentation: 'sheet', sheetId: 'wish' }),
    slot('wishPhoto', 'wishPhoto', 'Add a Photo · in pop-up', { order: 2, z: 12, presentation: 'sheet', sheetId: 'wish' }),
    slot('wishTrigger', 'sheetTrigger', 'Write a Wish Button', { order: 3, z: 11, sheetId: 'wish' }),
    slot('wishList', 'wishList', 'Wishes List', { order: 4, z: 10 }),
  ], {
    'ground-meadow': { x: 50, y: 82, w: 104, h: 70 },
    'corner-canopy-left': { x: 12, y: 24, w: 27, h: 68 },
    'corner-canopy-right': { x: 88, y: 24, w: 27, h: 68 },
    'flowering-tree': { x: 76, y: 78, w: 19, h: 40 },
    'rose-sprig': { x: 22, w: 11, h: 18 },
  }),
  photobooth: stage('photobooth', 'Photos', [
    ground('ground-gallery', 'ground-gallery-v2.webp'),
    prop('potted-botanicals', 'potted-botanicals.webp', 50, 94, 50, 23, 2),
    prop('doves', 'doves.webp', 86, 15, 15, 5, 2),
    slot('photoBooth', 'photoBooth', 'Photo Booth', { order: 0, z: 10 }),
  ], {
    'ground-gallery': { x: 50, y: 82, w: 104, h: 70 },
    'potted-botanicals': { w: 25, h: 40 },
    doves: { x: 77, w: 8, h: 8 },
  }),
};

export const SHIPPED_PROP_IDS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(T12_STAGES).map(([id, def]) => [id, new Set(def.layers.filter((layer) => layer.kind === 'img').map((layer) => layer.id))]),
);

export function t12StageIds(sectionOrder: string[]) {
  return sectionOrder.filter((id) => id in T12_STAGES);
}
