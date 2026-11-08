import type { TemplateConfigField, TemplateConfigSection } from './api/types';

// Explicit opt-in: do not inherit controls this DOM/flow template does not implement.
const text = (key: string, label: string, defaultValue: string, section: TemplateConfigSection, richText = false): TemplateConfigField => ({
  key, label, defaultValue, section, richText, fieldType: richText ? 'richtext' : 'text',
  adminOnly: false, maxLength: richText ? 4000 : 200, templateIds: [16], chip: 'Content',
});
const toggle = (key: string, label: string, defaultValue = 'false'): TemplateConfigField => ({
  key, label, defaultValue, section: 'general', richText: false, fieldType: 'boolean',
  adminOnly: false, maxLength: 5, templateIds: [16], chip: 'Display',
});
export const TEMPLATE16_FIELDS: TemplateConfigField[] = [
  text('invite.heading', 'Heading', 'Together with our families', 'invitation'),
  text('inkbound.eventTitle', 'Event title', 'The Wedding Celebration', 'invitation'),
  toggle('general.brideFirst', 'Bride first', 'true'),
  toggle('general.showIslamicDate', 'Show Islamic date'),
  toggle('general.showVenueMap', 'Show map link'),
  toggle('general.showAddToCalendar', 'Show calendar links'),
  text('walimah.title', 'Ceremony title', 'Walimatul Urus', 'ceremony'),
  text('walimah.body', 'Invitation message', '<p>With gratitude and joy, our families invite you to celebrate our marriage.</p>', 'ceremony', true),
  text('ceremony.map_label', 'Map button', 'View Map', 'ceremony'),
  text('ceremony.calendar_label', 'Calendar button', 'Add to Calendar', 'ceremony'),
  text('rsvp.title', 'Reply title', 'Join the celebration', 'rsvp'),
  text('rsvp.subtitle', 'Reply prompt', 'Kindly reply before our celebration', 'rsvp'),
  text('rsvp.bride_side_label', 'Bride side', 'Bride’s side', 'rsvp'),
  text('rsvp.groom_side_label', 'Groom side', 'Groom’s side', 'rsvp'),
  text('rsvp.attending_label', 'Accept choice', 'Joyfully accept', 'rsvp'),
  text('rsvp.declining_label', 'Decline choice', 'Regretfully decline', 'rsvp'),
  { ...text('rsvp.continue_label', 'Continue button', 'Continue', 'rsvp'), block: 'seating', group: 'Seating', chip: 'Seating' },
  text('rsvp.submit_label', 'Reply button', 'Send RSVP', 'rsvp'),
  text('rsvp.closed_message', 'Reply closed', 'RSVPs are closed — thank you for your interest.', 'rsvp'),
  text('rsvp.done_message', 'Reply sent', 'Thank you. We look forward to celebrating with you.', 'rsvp'),
  { ...text('rsvp.seating_prompt', 'Seating title', 'Choose your table', 'rsvp'), block: 'seating', group: 'Seating', chip: 'Seating' },
  { ...text('rsvp.seating_back_label', 'Back button', 'Back', 'rsvp'), block: 'seating', group: 'Seating', chip: 'Seating' },
  { ...text('itinerary.title', 'Programme title', 'The order of the day', 'ceremony'), block: 'itinerary' },
  text('wish.title', 'Guestbook title', 'Words to keep', 'wishes'),
  text('wish.prompt', 'Guestbook prompt', 'Leave a little joy for our next chapter', 'wishes'),
  text('wish.form_title', 'Message label', 'Leave a Wish', 'wishes'),
  text('wish.submit_label', 'Wish button', 'Send Wish', 'wishes'),
  text('wish.sent_message', 'Wish sent', 'Thank you — your wish was sent.', 'wishes'),
  text('photobooth.title', 'Gallery title', 'Our shared moments', 'photobooth'),
  text('photobooth.prompt', 'Gallery prompt', 'Share a photograph from the day', 'photobooth'),
  text('photobooth.upload_label', 'Upload button', 'Upload a Photo', 'photobooth'),
];
