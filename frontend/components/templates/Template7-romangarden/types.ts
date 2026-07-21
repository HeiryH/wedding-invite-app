/**
 * Template 7 uses the shared stage-and-layer engine (`_shared/`). This file re-exports the shared
 * model types and narrows `StageId`/`SlotId` to T7's own stages and slots for local readability —
 * both narrow unions are assignable to the shared `string` types.
 */
export type {
  Breakpoint,
  LayerKind,
  ObjectFit,
  Layer,
  StageDef,
  StageLayout,
  SlotProps,
  EditorHandle,
} from '@/components/templates/_shared/types';

export type StageId =
  | 'welcome'
  | 'ceremony-walimah'
  | 'ceremony-couple'
  | 'ceremony-details'
  | 'ceremony-programme'
  | 'ceremony-rail'
  | 'rsvp'
  | 'wishes'
  | 'photobooth';

export type SlotId =
  | 'countdown'
  | 'scrollCue'
  | 'walimahBody'
  | 'coupleNames'
  | 'ceremonyDetails'
  | 'itinerary'
  | 'rsvpForm'
  | 'wishTitle'
  | 'wishPrompt'
  | 'wishForm'
  | 'wishList'
  | 'photoBooth';
