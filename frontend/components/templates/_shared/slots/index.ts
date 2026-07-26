import type { FC } from 'react';
import type { Layer, SlotProps } from '../types';
import { CountdownSlot, TimerSlot, ScrollCueSlot } from './HeroSlots';
import { WalimahBodySlot, CoupleNamesSlot, CeremonyDetailsSlot, ItinerarySlot } from './CeremonySlots';
import RsvpFormSlot from './RsvpFormSlot';
import { WishTitleSlot, WishPromptSlot, WishFormSlot, WishListSlot } from './WishSlots';
import PhotoBoothSlot from './PhotoBoothSlot';
import { NavSlot, MusicSlot, FooterSlot } from './ChromeSlots';

// Keyed by string (not the narrow SlotId) so a Layer's `slot: string` can index them — the shared
// Layer model doesn't carry T7's union.
/** What a `kind: 'slot'` layer actually renders. */
export const SLOT_REGISTRY: Record<string, FC<SlotProps>> = {
  countdown: CountdownSlot,
  timer: TimerSlot,
  scrollCue: ScrollCueSlot,
  walimahBody: WalimahBodySlot,
  coupleNames: CoupleNamesSlot,
  ceremonyDetails: CeremonyDetailsSlot,
  itinerary: ItinerarySlot,
  rsvpForm: RsvpFormSlot,
  wishTitle: WishTitleSlot,
  wishPrompt: WishPromptSlot,
  wishForm: WishFormSlot,
  wishList: WishListSlot,
  photoBooth: PhotoBoothSlot,
  nav: NavSlot,
  music: MusicSlot,
  footer: FooterSlot,
};

/**
 * A slot with nothing to show hides its whole layer — otherwise an empty ceremony stage or a
 * photo booth with the feature switched off would still occupy a full screen of scrolling.
 */
export const SLOT_AVAILABLE: Record<string, (p: SlotProps) => boolean> = {
  countdown: () => true,
  timer: () => true,
  scrollCue: () => true,
  walimahBody: (p) => Boolean(p.t('walimah.body', '')),
  coupleNames: () => true,
  ceremonyDetails: () => true,
  itinerary: (p) => p.itinerary.length > 0,
  rsvpForm: () => true,
  wishTitle: () => true,
  wishPrompt: () => true,
  wishForm: () => true,
  wishList: () => true,
  photoBooth: (p) => p.photoBoothEnabled,
  nav: () => true,
  music: (p) => Boolean(p.t('music.url', '')),
  footer: () => true,
};

/**
 * Shared stage-visibility rules, used by every consumer of the slot catalog (Template 7's own
 * compositor and `_shared/DataTemplate.tsx` alike) so the "hide an empty slot / drop an
 * all-empty stage" behavior can't drift between them. Moved out of Template7-romangarden/index.tsx
 * verbatim — T7's own rendering is unchanged, just no longer copy-pasted.
 */
export function stageHasContent(layers: Layer[], slotProps: SlotProps): boolean {
  const slots = layers.filter((l) => l.kind === 'slot' && l.slot);
  return slots.length === 0 || slots.some((l) => SLOT_AVAILABLE[l.slot!](slotProps));
}

/** Anchor layers have no visual — they're sub-layer metadata a slot applies internally.
 *  `presentation: 'sheet'` layers have no inline visual either — `DataTemplate` mounts them as a
 *  drag-to-dismiss bottom sheet instead (see DataTemplate.tsx / types.ts's `Layer.presentation`). */
export function visibleSlotLayers(layers: Layer[], slotProps: SlotProps): Layer[] {
  return layers.filter(
    (l) => l.kind !== 'anchor' && l.presentation !== 'sheet'
      && (l.kind !== 'slot' || !l.slot || SLOT_AVAILABLE[l.slot](slotProps)),
  );
}
