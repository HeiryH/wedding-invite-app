import type { Wedding, Guest, Wish, Photo, ItineraryItem, SeatingTable } from '@/lib/api';
import type { EditorHandle, SlotProps } from './_shared/types';

/** The existing invitation/preview contract. Importing this type never imports a template. */
export interface TemplateRenderProps {
  wedding: Wedding;
  onRSVP: SlotProps['onRSVP'];
  onSubmitWish: SlotProps['onSubmitWish'];
  onUploadPhoto?: SlotProps['onUploadPhoto'];
  guests?: Guest[];
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  editor?: EditorHandle;
  /** Display-only preview: no persistence or success claims, even outside Adjust mode. */
  previewOnly?: boolean;
}
