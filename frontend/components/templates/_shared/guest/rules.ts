import type { Wedding, SeatingTable } from '@/lib/api';
import type { TemplateRsvpSubmission, PhotoUploadSubmission } from '../../guestContracts';

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export function validateGuestPhoto(file: File) {
  if (!file.size) throw new Error('Choose a photo that is not empty.');
  if (!/\.(jpe?g|png|gif|webp)$/i.test(file.name)) throw new Error('Choose a JPG, PNG, GIF or WebP photo.');
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('File size must be less than 10MB.');
}
export const seatsAvailable = (table: SeatingTable) => Math.max(0, table.capacity - table.guestCount);
export const tableCanFit = (table: SeatingTable, party: number) => seatsAvailable(table) >= party;
export const guestLimit = (wedding?: Pick<Wedding, 'maxPax'>) => Math.min(10, (wedding?.maxPax ?? 0) > 0 ? wedding!.maxPax! : 10);
export function normalizeRsvp(data: TemplateRsvpSubmission, wedding?: Pick<Wedding, 'eventType' | 'maxPax'>, tables?: SeatingTable[]): TemplateRsvpSubmission {
  const party = Math.max(1, Math.min(guestLimit(wedding), Math.floor(Number(data.numberOfAttendees) || 1)));
  const tableId = data.isAttending && data.tableId != null && (!tables || tables.some((table) => table.tableId === data.tableId && tableCanFit(table, party))) ? data.tableId : null;
  return { ...data, numberOfAttendees: party, tableId,
    brideOrGroomSide: (wedding?.eventType ?? 'WEDDING') === 'WEDDING' ? data.brideOrGroomSide : null };
}

export function validatedPhoto(data: PhotoUploadSubmission) { validateGuestPhoto(data.file); return data; }
