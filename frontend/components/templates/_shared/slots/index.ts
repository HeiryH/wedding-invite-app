import type { FC } from 'react';
import type { Layer, SlotProps } from '../types';
import { CountdownSlot, TimerSlot, ScrollCueSlot, HeroThemeSlot, HeroDateSlot } from './HeroSlots';
import {
  WalimahTitleSlot, WalimahBodySlot, CoupleTitleSlot, CoupleNamesSlot,
  DetailsTitleSlot, CeremonyDetailsSlot, ItineraryTitleSlot, ItineraryListSlot,
} from './CeremonySlots';
import { RsvpTitleSlot, RsvpPromptSlot, RsvpFormSlot, RsvpSeatingSlot } from './RsvpFormSlot';
import { WishTitleSlot, WishPromptSlot, WishFormSlot, WishPhotoSlot, WishListSlot } from './WishSlots';
import PhotoBoothSlot, { PhotoGallerySlot } from './PhotoBoothSlot';
import SheetTriggerSlot from './SheetTriggerSlot';
import { DEFAULT_SHEET } from './sheets';
import { NavSlot, MusicSlot, FooterSlot } from './ChromeSlots';

// Keyed by string (not the narrow SlotId) so a Layer's `slot: string` can index them — the shared
// Layer model doesn't carry T7's union.
/** What a `kind: 'slot'` layer actually renders. */
export const SLOT_REGISTRY: Record<string, FC<SlotProps>> = {
  countdown: CountdownSlot,
  timer: TimerSlot,
  scrollCue: ScrollCueSlot,
  heroTheme: HeroThemeSlot,
  heroDate: HeroDateSlot,
  walimahTitle: WalimahTitleSlot,
  walimahBody: WalimahBodySlot,
  coupleTitle: CoupleTitleSlot,
  coupleNames: CoupleNamesSlot,
  detailsTitle: DetailsTitleSlot,
  ceremonyDetails: CeremonyDetailsSlot,
  itineraryTitle: ItineraryTitleSlot,
  itineraryList: ItineraryListSlot,
  rsvpTitle: RsvpTitleSlot,
  rsvpPrompt: RsvpPromptSlot,
  rsvpForm: RsvpFormSlot,
  rsvpSeating: RsvpSeatingSlot,
  wishTitle: WishTitleSlot,
  wishPrompt: WishPromptSlot,
  wishForm: WishFormSlot,
  wishPhoto: WishPhotoSlot,
  wishList: WishListSlot,
  photoBooth: PhotoBoothSlot,
  photoGallery: PhotoGallerySlot,
  sheetTrigger: SheetTriggerSlot,
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
  heroTheme: () => true,
  heroDate: () => true,
  // Title checks the same key as its body so it can never show alone over an empty body — the
  // beat's stage-level gate (STAGE_GROUPS.walimah / resolveSectionOrder's hasWalimah) already
  // hides the whole beat on an empty body; this keeps the individual layer consistent with that.
  walimahTitle: (p) => Boolean(p.t('walimah.body', '')),
  walimahBody: (p) => Boolean(p.t('walimah.body', '')),
  coupleTitle: () => true,
  coupleNames: () => true,
  detailsTitle: () => true,
  ceremonyDetails: () => true,
  itineraryTitle: (p) => p.itinerary.length > 0,
  itineraryList: (p) => p.itinerary.length > 0,
  rsvpTitle: () => true,
  rsvpPrompt: () => true,
  rsvpForm: () => true,
  // Gated on the same tier/feature-derived flag every other seating-aware control already uses —
  // a lower-tier or seating-disabled wedding never sees this layer in the Adjust panel at all.
  rsvpSeating: (p) => p.seatingEnabled,
  wishTitle: () => true,
  wishPrompt: () => true,
  wishForm: () => true,
  // Step 2 of the wish sheet only exists when there's a gallery to add to — same flag the booth
  // itself uses. With it off, WishFormSlot closes the sheet after step 1 instead of advancing.
  wishPhoto: (p) => p.photoBoothEnabled,
  wishList: () => true,
  photoBooth: (p) => p.photoBoothEnabled,
  photoGallery: (p) => p.photoBoothEnabled,
  sheetTrigger: () => true,
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
  // No slots at all ⇒ a pure-art stage, which is legitimately its own scene — keep it. Otherwise
  // the stage earns its screen only if something renders *inline*: a sheet-presented slot draws
  // nothing here (it's in the bottom sheet), so a stage whose slots are all sheets would
  // otherwise cost the guest a full screen of empty scrolling.
  if (slots.length === 0) return true;
  return slots.some((l) => l.presentation !== 'sheet' && SLOT_AVAILABLE[l.slot!]?.(slotProps));
}

/** Anchor layers have no visual — they're sub-layer metadata a slot applies internally.
 *  `presentation: 'sheet'` layers have no inline visual either — `_shared/SheetHost.tsx` mounts
 *  them in a drag-to-dismiss bottom sheet instead (see types.ts's `Layer.presentation`). */
export function visibleSlotLayers(layers: Layer[], slotProps: SlotProps): Layer[] {
  return layers.filter(
    (l) => l.kind !== 'anchor' && l.presentation !== 'sheet'
      && (l.kind !== 'slot' || !l.slot || SLOT_AVAILABLE[l.slot]?.(slotProps)),
  );
}

/**
 * Buckets every sheet-presented slot layer on the page by the sheet it belongs to
 * (`Layer.sheetId`, defaulting to `'default'`), so `SheetHost` can mount them.
 *
 * Sorted by `z` **descending**, not by `order`: the Adjust panel has no Z or Order slider — its
 * layer list is front-to-back and dragging a row rewrites `z` alone. So "which step comes first"
 * is exactly "which row is higher in the list", and reading `order` here would silently ignore
 * the only control the couple actually has.
 *
 * Shared by T7 and `DataTemplate` for the same reason `stageHasContent`/`visibleSlotLayers` are —
 * so the two renderers can't drift.
 */
export function sheetLayerGroups(
  stages: { layers: Layer[] }[],
  slotProps: SlotProps,
): Record<string, Layer[]> {
  const groups: Record<string, Layer[]> = {};
  for (const stage of stages) {
    for (const l of stage.layers) {
      if (l.kind !== 'slot' || !l.slot || l.presentation !== 'sheet' || l.hidden) continue;
      if (!SLOT_AVAILABLE[l.slot]?.(slotProps)) continue;
      (groups[l.sheetId || DEFAULT_SHEET] ??= []).push(l);
    }
  }
  for (const list of Object.values(groups)) list.sort((a, b) => b.z - a.z);
  return groups;
}
