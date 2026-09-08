/**
 * Template 10 uses the shared stage-and-layer engine (`_shared/`). This file re-exports the
 * shared model types and narrows `StageId`/`SlotId` to T10's own stages and slots for local
 * readability — both narrow unions are assignable to the shared `string` types.
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
  | 'details'
  | 'itinerary'
  | 'rsvp'
  | 'wishes'
  | 'photobooth';

export type SlotId =
  | 'scrollCue'
  | 'walimahTitle'
  | 'walimahBody'
  | 'itineraryTitle'
  | 'itineraryList'
  | 'rsvpTitle'
  | 'rsvpPrompt'
  | 'rsvpForm'
  | 'rsvpSeating'
  | 'sheetTrigger'
  | 'wishTitle'
  | 'wishPrompt'
  | 'wishForm'
  | 'wishPhoto'
  | 'wishList'
  | 'photoBooth';
