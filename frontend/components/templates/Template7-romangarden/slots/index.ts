import type { FC } from 'react';
import type { SlotProps } from '../types';
import { CountdownSlot, ScrollCueSlot } from './HeroSlots';
import { WalimahBodySlot, CoupleNamesSlot, CeremonyDetailsSlot, ItinerarySlot } from './CeremonySlots';
import RsvpFormSlot from './RsvpFormSlot';
import { WishTitleSlot, WishPromptSlot, WishFormSlot, WishListSlot } from './WishSlots';
import PhotoBoothSlot from './PhotoBoothSlot';

// Keyed by string (not the narrow SlotId) so a Layer's `slot: string` can index them — the shared
// Layer model doesn't carry T7's union.
/** What a `kind: 'slot'` layer actually renders. */
export const SLOT_REGISTRY: Record<string, FC<SlotProps>> = {
  countdown: CountdownSlot,
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
};

/**
 * A slot with nothing to show hides its whole layer — otherwise an empty ceremony stage or a
 * photo booth with the feature switched off would still occupy a full screen of scrolling.
 */
export const SLOT_AVAILABLE: Record<string, (p: SlotProps) => boolean> = {
  countdown: () => true,
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
};
