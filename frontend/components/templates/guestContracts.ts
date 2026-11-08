import type { CreateGuest, CreateWish } from '@/lib/api';

/** Legacy template vocabulary, adapted to guestSide once at the public API boundary. */
export type TemplateRsvpSubmission = Omit<CreateGuest, 'guestSide'> & {
  brideOrGroomSide?: 'Bride' | 'Groom' | null;
};

/** Templates pass a plain object; only the API service serializes multipart FormData. */
export interface PhotoUploadSubmission {
  file: File;
  guestName: string;
  caption: string;
}

/** T5 preserves its optional family-side wish metadata at the template boundary. */
export type TemplateWishSubmission = CreateWish & { brideOrGroomSide?: 'Bride' | 'Groom' | null };
