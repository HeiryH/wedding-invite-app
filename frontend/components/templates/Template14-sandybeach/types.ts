/**
 * Template 14 uses the shared stage-and-layer engine (`_shared/`). This file re-exports the
 * shared model types and narrows `StageId` to T14's own stages for local readability — the
 * narrow union is assignable to the shared `string` type.
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
  | 'walimah'
  | 'itinerary'
  | 'rsvp'
  | 'wishes'
  | 'photobooth';
