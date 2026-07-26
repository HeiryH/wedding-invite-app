import type { Layer } from '../types';

/** One entry in the authoring editor's "+ Block" menu. */
export interface SlotCatalogEntry {
  id: string;
  label: string;
  group: 'Hero' | 'Ceremony' | 'Schedule' | 'RSVP' | 'Wishes' | 'Media' | 'Chrome';
  /** Starting geometry, so a freshly dropped block lands somewhere reasonable rather than a tiny
   *  box dead-center. Sourced from Template7-romangarden/data/stages.ts's own placements — the
   *  only template that ships these slots today. */
  defaultLayer: Omit<Layer, 'id' | 'kind' | 'slot'>;
}

const base: Omit<Layer, 'id' | 'kind' | 'slot'> = {
  x: 50, y: 50, w: 76, h: 50, s: 1, z: 5, order: 0,
  chain: false, hidden: false, opacity: 1,
};

/** In `_shared/slots/`'s render order (Layer.tsx's `case 'slot'`), not the visual catalog order —
 *  see `SLOT_CATALOG_GROUPS` for how the authoring UI actually lists these. */
export const SLOT_CATALOG: SlotCatalogEntry[] = [
  { id: 'countdown', label: 'Countdown & Names', group: 'Hero',
    defaultLayer: { ...base, y: 40, w: 74, h: 42, z: 7, chain: false, depth: 0.2, anim: 'none' } },
  { id: 'timer', label: 'Countdown Timer (only)', group: 'Hero',
    defaultLayer: { ...base, y: 70, w: 70, h: 14, z: 7, chain: false, depth: 0.2, anim: 'none' } },
  { id: 'scrollCue', label: 'Scroll Cue', group: 'Hero',
    defaultLayer: { ...base, y: 95, w: 50, h: 7, z: 8, depth: 0 } },

  { id: 'coupleNames', label: 'Couple Names', group: 'Ceremony',
    defaultLayer: { ...base, y: 44, w: 74, h: 52, depth: 0.2 } },
  { id: 'ceremonyDetails', label: 'Ceremony Details (Date & Venue)', group: 'Ceremony',
    defaultLayer: { ...base, y: 44, w: 76, h: 54, depth: 0.2 } },
  { id: 'walimahBody', label: 'Ceremony Body Text', group: 'Ceremony',
    defaultLayer: { ...base, y: 44, w: 72, h: 52, depth: 0.2 } },

  { id: 'itinerary', label: 'Itinerary', group: 'Schedule',
    defaultLayer: { ...base, y: 46, w: 78, h: 62, depth: 0.2 } },

  { id: 'rsvpForm', label: 'RSVP Form', group: 'RSVP',
    defaultLayer: { ...base, y: 44, w: 74, h: 52, depth: 0.15 } },

  { id: 'wishTitle', label: 'Wishes Title', group: 'Wishes',
    defaultLayer: { ...base, y: 15, w: 66, h: 9, z: 6, depth: 0.4 } },
  { id: 'wishPrompt', label: 'Wishes Prompt', group: 'Wishes',
    defaultLayer: { ...base, y: 27, w: 80, h: 7, depth: 0.3 } },
  { id: 'wishForm', label: 'Wish Form', group: 'Wishes',
    defaultLayer: { ...base, y: 52, w: 78, h: 26, depth: 0.2 } },
  { id: 'wishList', label: 'Wish List', group: 'Wishes',
    defaultLayer: { ...base, y: 86, w: 88, h: 22, depth: 0 } },

  { id: 'photoBooth', label: 'Photo Booth', group: 'Media',
    defaultLayer: { ...base, y: 46, w: 76, h: 46, depth: 0.15 } },

  { id: 'nav', label: 'Scroll Nav (fixed)', group: 'Chrome',
    defaultLayer: { ...base, y: 95, w: 10, h: 6, z: 20, depth: 0, anim: 'none' } },
  { id: 'music', label: 'Music Bubble (fixed)', group: 'Chrome',
    defaultLayer: { ...base, y: 5, w: 8, h: 6, z: 20, depth: 0, anim: 'none' } },
  { id: 'footer', label: 'Footer Tagline', group: 'Chrome',
    defaultLayer: { ...base, y: 98, w: 90, h: 8, z: 3, depth: 0 } },
];

/** Group display order for the "+ Block" menu. */
export const SLOT_CATALOG_GROUPS: SlotCatalogEntry['group'][] =
  ['Hero', 'Ceremony', 'Schedule', 'RSVP', 'Wishes', 'Media', 'Chrome'];
