import { TemplateConfigField, TemplateConfigBlock, TemplateConfigSection } from './api/types';

/**
 * The single source of truth for every per-wedding config key.
 *
 * The customize inspector renders itself from this file — a key that isn't declared here gets no
 * control, and a key declared for a template that never reads it renders a control that does
 * nothing. So `templateIds` is load-bearing: it records which templates actually look the key up.
 * (Verify with `grep -rl "<key>" frontend/components/templates/` before widening it.)
 *
 * `adminOnly: true` is enforced client-side by getConfigFields and server-side by
 * backend/WeddingInvite.Core/Config/TemplateConfigPolicy.cs — keep the two in step.
 */

/** Where a section's fields land in the inspector rail when a field doesn't override it. */
export const SECTION_BLOCK: Record<TemplateConfigSection, TemplateConfigBlock> = {
  invitation: 'welcome',
  ceremony: 'walimah',
  rsvp: 'rsvp',
  wishes: 'wishes',
  photobooth: 'photobooth',
  music: 'music',
  scene: 'welcome',
  styling: 'welcome',
  general: 'details',
  footer: 'details',
  // A dedicated tab, not buried in Details — nav bar controls (size/text size/layout on T7/T10;
  // the admin-only per-section nav labels on T1-T3/T5) are common enough to edit that they earned
  // their own place in the rail rather than being the last, easy-to-miss group on another tab.
  navigation: 'navigation',
};

const COMMON_FIELDS: TemplateConfigField[] = [
  // ── Cover / invitation ──────────────────────────────────────────────────────
  {
    key: 'invite.heading',
    label: 'Heading Text',
    defaultValue: 'Together with their families',
    maxLength: 50,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'invitation',
    group: 'Heading',
    chip: 'Content',
    templateIds: [1, 2, 3, 4, 5, 6, 8, 9, 12],
  },
  {
    key: 'invite.heading.color',
    label: 'Heading Color',
    defaultValue: '',
    maxLength: 20,
    richText: false,
    fieldType: 'color',
    adminOnly: false,
    section: 'invitation',
    attachTo: 'invite.heading',
    presets: 'heading',
    templateIds: [1, 2, 3, 4, 5, 6, 8, 9],
  },
  {
    key: 'invite.heading.shadow',
    label: 'Heading Shadow',
    defaultValue: 'none',
    maxLength: 20,
    richText: false,
    fieldType: 'select',
    options: ['none', 'soft', 'strong', 'glow'],
    adminOnly: false,
    section: 'invitation',
    attachTo: 'invite.heading',
    templateIds: [1, 2, 3, 4, 6, 8, 9],
  },
  {
    key: 'invite.heading.align',
    label: 'Alignment',
    defaultValue: 'center',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['left', 'center', 'right'],
    adminOnly: false,
    section: 'invitation',
    group: 'Heading',
    chip: 'Content',
    templateIds: [1, 2, 3, 4, 6, 8, 9],
  },
  {
    key: 'invite.heading.animation',
    label: 'Animation',
    defaultValue: 'none',
    maxLength: 20,
    richText: false,
    fieldType: 'select',
    options: ['none', 'fade', 'slide', 'typewriter'],
    adminOnly: false,
    section: 'invitation',
    group: 'Heading',
    chip: 'Content',
    templateIds: [1, 2, 3, 4, 6, 8, 9],
  },
  {
    key: 'invite.body',
    label: 'Invitation Message',
    defaultValue: 'We joyfully invite you to share in the celebration of our wedding',
    maxLength: 200,
    richText: true,
    fieldType: 'richtext',
    adminOnly: false,
    section: 'invitation',
    group: 'Invitation Message',
    chip: 'Content',
    templateIds: [1, 2, 3, 4, 6, 7, 8, 9],
  },
  {
    key: 'invite.body.align',
    label: 'Alignment',
    defaultValue: 'center',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['left', 'center', 'right'],
    adminOnly: false,
    section: 'invitation',
    group: 'Invitation Message',
    chip: 'Content',
    templateIds: [1, 2, 3, 4, 8, 9],
  },

  // ── General / details ───────────────────────────────────────────────────────
  {
    key: 'general.showIslamicDate',
    label: 'Show Islamic (Hijri) Date',
    hint: 'Auto-calculated from the wedding date',
    defaultValue: 'false',
    maxLength: 5,
    richText: false,
    fieldType: 'boolean',
    adminOnly: false,
    section: 'general',
    group: 'Display',
    chip: 'Display',
  },
  {
    key: 'general.showAddToCalendar',
    label: 'Add to Calendar button',
    hint: 'Guests can save the date in one tap',
    defaultValue: 'false',
    maxLength: 5,
    richText: false,
    fieldType: 'boolean',
    adminOnly: false,
    section: 'general',
    block: 'details',
    attachTo: 'wedding.weddingDate',
    templateIds: [5, 7],
  },
  {
    key: 'general.showVenueMap',
    label: 'Show venue map',
    defaultValue: 'false',
    maxLength: 5,
    richText: false,
    fieldType: 'boolean',
    adminOnly: false,
    section: 'general',
    block: 'details',
    attachTo: 'wedding.venue',
    templateIds: [5, 7],
  },
  // Not adminOnly: couples reorder sections via the add/move/remove controls in the rail, and
  // handleSave always writes this key. It has no inspector control of its own — the rail is it.
  {
    key: 'section.order',
    label: 'Section Order',
    defaultValue: 'welcome,walimah,rsvp,itinerary,wishes,photobooth',
    maxLength: 100,
    richText: false,
    fieldType: 'hidden',
    adminOnly: false,
    section: 'general',
    templateIds: [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14],
  },

  // ── Ceremony ────────────────────────────────────────────────────────────────
  {
    key: 'walimah.body',
    label: 'Ceremony Details',
    hint: 'Supports bold and italic formatting',
    defaultValue: '',
    maxLength: 500,
    richText: true,
    fieldType: 'richtext',
    adminOnly: false,
    section: 'ceremony',
    group: 'Ceremony / Walimah',
    chip: 'Content',
  },
  {
    key: 'walimah.body.align',
    label: 'Text Alignment',
    defaultValue: 'center',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['left', 'center', 'right'],
    adminOnly: false,
    section: 'ceremony',
    group: 'Ceremony / Walimah',
    chip: 'Content',
    templateIds: [1, 2, 3, 4, 6, 8, 9],
  },

  // ── RSVP ────────────────────────────────────────────────────────────────────
  {
    key: 'rsvp.title',
    label: 'RSVP Title',
    defaultValue: 'RSVP',
    maxLength: 30,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'rsvp',
    group: 'RSVP',
    chip: 'RSVP',
    // Drives the shared rsvpTitle slot (_shared/slots/RsvpFormSlot.tsx) — T1-T6/T8/T9 all render
    // a hardcoded "RSVP" heading in their own bespoke markup and never read this key at all (see
    // lib/__tests__/templateConfigSchema.scope.test.ts). T10's RSVP title is a plain text layer
    // (Adjust panel edits it directly, with full font/size/line-height control) instead of the
    // shared slot, so it's excluded too — only T7 actually uses this field.
    templateIds: [7, 12],
  },
  {
    key: 'rsvp.subtitle',
    label: 'RSVP Subtitle',
    defaultValue: 'Kindly reply by one week before the wedding date',
    maxLength: 80,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'rsvp',
    group: 'RSVP',
    chip: 'RSVP',
    templateIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
  },

  // RSVP form fields + the seating step. Same reasoning as the Wishes form block below: these
  // live in the shared _shared/slots/RsvpFormSlot.tsx (RsvpFormSlot + RsvpSeatingSlot), used by
  // both T7 and T10, and until now every one of these strings was hardcoded there — invisible to
  // the couple no matter what they typed. `rsvp.seating_prompt` already existed but was declared
  // only in TEMPLATE7_EXTRA_FIELDS (an array TEMPLATE_CONFIGS[10] never composes), so T10 couples
  // could never reach it either — moved here and rescoped alongside its new siblings.
  { key: 'rsvp.name_placeholder', label: 'Name Placeholder', fieldType: 'text', defaultValue: 'Full name *', maxLength: 40, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.email_placeholder', label: 'Email Placeholder', fieldType: 'text', defaultValue: 'Email', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.phone_placeholder', label: 'Phone Placeholder', fieldType: 'text', defaultValue: 'Phone', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.bride_side_label', label: "Bride's Side Option", fieldType: 'text', defaultValue: "Bride's side", maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.groom_side_label', label: "Groom's Side Option", fieldType: 'text', defaultValue: "Groom's side", maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.attending_label', label: 'Attending Button', fieldType: 'text', defaultValue: 'Joyfully accept', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.declining_label', label: 'Declining Button', fieldType: 'text', defaultValue: 'Regretfully decline', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.song_placeholder', label: 'Song Request Placeholder', fieldType: 'text', defaultValue: 'Song request (optional)', maxLength: 40, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.submit_label', label: 'Send RSVP Button', fieldType: 'text', defaultValue: 'Send RSVP', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.continue_label', label: 'Continue to Seating Button', hint: 'Shown instead of Send RSVP when seating is enabled and the guest is attending.', fieldType: 'text', defaultValue: 'Continue', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.closed_message', label: 'RSVPs Closed Message', fieldType: 'text', defaultValue: 'RSVPs are closed — thank you for your interest.', maxLength: 120, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.done_message', label: 'RSVP Sent Message', fieldType: 'text', defaultValue: 'Thank you. We look forward to celebrating with you.', maxLength: 120, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.seating_prompt', label: 'Seating Prompt', fieldType: 'text', defaultValue: 'Choose your table', maxLength: 60, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.seating_back_label', label: 'Seating Back Button', fieldType: 'text', defaultValue: 'Back', maxLength: 20, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.seating_empty_message', label: 'No Tables Message', hint: 'Shown when the couple hasn’t set up any tables yet.', fieldType: 'text', defaultValue: 'No tables have been set up yet — your seat will be assigned by the couple.', maxLength: 160, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.seating_party_prompt', label: 'Party Size Prompt', hint: 'The guest’s party size and a period are appended automatically, e.g. "…party of 4."', fieldType: 'text', defaultValue: 'Showing tables that can seat your party of', maxLength: 80, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.seating_full_label', label: 'Table Full Label', fieldType: 'text', defaultValue: 'Full', maxLength: 20, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.seating_seats_left_label', label: 'Seats Left Label', hint: 'The number of open seats is prepended automatically, e.g. "3 seats left."', fieldType: 'text', defaultValue: 'seats left', maxLength: 20, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 13] },
  { key: 'rsvp.name_placeholder', label: 'Name Placeholder', fieldType: 'text', defaultValue: 'Full name *', maxLength: 40, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.email_placeholder', label: 'Email Placeholder', fieldType: 'text', defaultValue: 'Email', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.phone_placeholder', label: 'Phone Placeholder', fieldType: 'text', defaultValue: 'Phone', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.bride_side_label', label: "Bride's Side Option", fieldType: 'text', defaultValue: "Bride's side", maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.groom_side_label', label: "Groom's Side Option", fieldType: 'text', defaultValue: "Groom's side", maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.attending_label', label: 'Attending Button', fieldType: 'text', defaultValue: 'Joyfully accept', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.declining_label', label: 'Declining Button', fieldType: 'text', defaultValue: 'Regretfully decline', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.song_placeholder', label: 'Song Request Placeholder', fieldType: 'text', defaultValue: 'Song request (optional)', maxLength: 40, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.submit_label', label: 'Send RSVP Button', fieldType: 'text', defaultValue: 'Send RSVP', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.continue_label', label: 'Continue to Seating Button', hint: 'Shown instead of Send RSVP when seating is enabled and the guest is attending.', fieldType: 'text', defaultValue: 'Continue', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.closed_message', label: 'RSVPs Closed Message', fieldType: 'text', defaultValue: 'RSVPs are closed — thank you for your interest.', maxLength: 120, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.done_message', label: 'RSVP Sent Message', fieldType: 'text', defaultValue: 'Thank you. We look forward to celebrating with you.', maxLength: 120, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.seating_prompt', label: 'Seating Prompt', fieldType: 'text', defaultValue: 'Choose your table', maxLength: 60, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.seating_back_label', label: 'Seating Back Button', fieldType: 'text', defaultValue: 'Back', maxLength: 20, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.seating_empty_message', label: 'No Tables Message', hint: 'Shown when the couple hasn’t set up any tables yet.', fieldType: 'text', defaultValue: 'No tables have been set up yet — your seat will be assigned by the couple.', maxLength: 160, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.seating_party_prompt', label: 'Party Size Prompt', hint: 'The guest’s party size and a period are appended automatically, e.g. "…party of 4."', fieldType: 'text', defaultValue: 'Showing tables that can seat your party of', maxLength: 80, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.seating_full_label', label: 'Table Full Label', fieldType: 'text', defaultValue: 'Full', maxLength: 20, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },
  { key: 'rsvp.seating_seats_left_label', label: 'Seats Left Label', hint: 'The number of open seats is prepended automatically, e.g. "3 seats left."', fieldType: 'text', defaultValue: 'seats left', maxLength: 20, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [7, 10, 12, 14] },

  // ── Wishes ──────────────────────────────────────────────────────────────────
  {
    key: 'wish.prompt',
    label: 'Wish Prompt',
    defaultValue: 'Leave a message for the happy couple',
    maxLength: 80,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'wishes',
    group: 'Wishes & Guestbook',
    chip: 'Content',
    // T10's wishes prompt is a plain text layer, edited directly via the Adjust panel.
    templateIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
  },

  // Wish form + its optional photo step. These live in the shared wish slots
  // (_shared/slots/WishSlots.tsx) — only T7 and T10 render through that catalog; T1-T6/T8/T9 have
  // their own bespoke, hardcoded wish-form markup that never reads these keys (see
  // lib/__tests__/templateConfigSchema.scope.test.ts, which caught this: these were previously
  // undeclared with any templateIds at all, i.e. offered on every template's inspector while only
  // ever doing something on two of them). An authored template that drops in `wishForm` also gets
  // these controls, same as T7/T10 — TemplateConfigPolicy.LayoutKeyPattern's `ta?\d+` authored-id
  // handling is a separate mechanism (layout keys only), so authored templates simply aren't
  // listed here; add their numeric ids if that ever needs the same treatment.
  { key: 'wish.form_title', label: 'Wish Form Title', fieldType: 'text', defaultValue: 'Leave a Wish', maxLength: 40, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.message_placeholder', label: 'Message Placeholder', fieldType: 'text', defaultValue: 'Write your wish for the couple…', maxLength: 120, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.name_placeholder', label: 'Name Placeholder', fieldType: 'text', defaultValue: 'Your name *', maxLength: 40, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.submit_label', label: 'Send Wish Button', fieldType: 'text', defaultValue: 'Send Wish', maxLength: 30, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.sent_message', label: 'Wish Sent Message', fieldType: 'text', defaultValue: 'Thank you — your wish was sent.', maxLength: 120, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.photo_title', label: 'Photo Step Title', fieldType: 'text', defaultValue: 'Add a photo?', maxLength: 40, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.photo_prompt', label: 'Photo Step Prompt', fieldType: 'text', defaultValue: 'Optional — share a snapshot to go with your wish.', maxLength: 120, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.photo_choose_label', label: 'Choose Photo Button', fieldType: 'text', defaultValue: 'Choose a Photo', maxLength: 30, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.photo_caption_placeholder', label: 'Photo Caption Placeholder', fieldType: 'text', defaultValue: 'Caption (optional)', maxLength: 60, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.photo_skip_label', label: 'Skip Photo Button', fieldType: 'text', defaultValue: 'Skip', maxLength: 20, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 13] },
  { key: 'wish.form_title', label: 'Wish Form Title', fieldType: 'text', defaultValue: 'Leave a Wish', maxLength: 40, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.message_placeholder', label: 'Message Placeholder', fieldType: 'text', defaultValue: 'Write your wish for the couple…', maxLength: 120, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.name_placeholder', label: 'Name Placeholder', fieldType: 'text', defaultValue: 'Your name *', maxLength: 40, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.submit_label', label: 'Send Wish Button', fieldType: 'text', defaultValue: 'Send Wish', maxLength: 30, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.sent_message', label: 'Wish Sent Message', fieldType: 'text', defaultValue: 'Thank you — your wish was sent.', maxLength: 120, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.photo_title', label: 'Photo Step Title', fieldType: 'text', defaultValue: 'Add a photo?', maxLength: 40, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.photo_prompt', label: 'Photo Step Prompt', fieldType: 'text', defaultValue: 'Optional — share a snapshot to go with your wish.', maxLength: 120, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.photo_choose_label', label: 'Choose Photo Button', fieldType: 'text', defaultValue: 'Choose a Photo', maxLength: 30, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.photo_caption_placeholder', label: 'Photo Caption Placeholder', fieldType: 'text', defaultValue: 'Caption (optional)', maxLength: 60, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },
  { key: 'wish.photo_skip_label', label: 'Skip Photo Button', fieldType: 'text', defaultValue: 'Skip', maxLength: 20, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [7, 10, 12, 14] },

  // ── Section backgrounds ─────────────────────────────────────────────────────
  {
    key: 'section.welcome.bg',
    label: 'Welcome',
    defaultValue: '',
    maxLength: 500,
    richText: false,
    fieldType: 'image',
    adminOnly: false,
    section: 'styling',
    block: 'welcome',
    group: 'Section Background',
    chip: 'Background',
    templateIds: [1, 2, 3, 8, 9],
  },
  {
    // Key name is historical and does NOT match what this paints — verified at every read site
    // (Template1/2/3/4/8/9) it's the RSVP section's background, not a "ceremony" section (T1-T4
    // don't have one). Keeping the key as-is: it's already saved on real weddings, and renaming it
    // needs a data migration — see docs/FIX_QUEUE.md. Label + tab are fixed to match reality.
    key: 'section.ceremony.bg',
    label: 'RSVP',
    defaultValue: '',
    maxLength: 500,
    richText: false,
    fieldType: 'image',
    adminOnly: false,
    section: 'styling',
    block: 'rsvp',
    group: 'Section Background',
    chip: 'Background',
    templateIds: [1, 2, 3, 4, 8, 9],
  },
  {
    // Same historical-key situation as section.ceremony.bg above — this paints the Wishes section.
    key: 'section.celebration.bg',
    label: 'Wishes',
    defaultValue: '',
    maxLength: 500,
    richText: false,
    fieldType: 'image',
    adminOnly: false,
    section: 'styling',
    block: 'wishes',
    group: 'Section Background',
    chip: 'Background',
    templateIds: [1, 2, 3, 4, 8, 9],
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  {
    key: 'footer.tagline',
    label: 'Footer Tagline',
    defaultValue: 'Made with love for our special day',
    maxLength: 80,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'footer',
    group: 'Footer',
    chip: 'Footer',
  },

  // ── Navigation — super admin only ───────────────────────────────────────────
  {
    key: 'nav.invite',
    label: 'Nav: Invitation',
    defaultValue: 'Invitation',
    maxLength: 20,
    richText: false,
    fieldType: 'text',
    adminOnly: true,
    section: 'navigation',
    group: 'Navigation Labels',
    chip: 'Display',
    templateIds: [1, 2, 3],
  },
  {
    key: 'nav.walimah',
    label: 'Nav: Ceremony',
    defaultValue: 'Ceremony',
    maxLength: 20,
    richText: false,
    fieldType: 'text',
    adminOnly: true,
    section: 'navigation',
    group: 'Navigation Labels',
    chip: 'Display',
    templateIds: [1, 2, 3],
  },
  {
    key: 'nav.itinerary',
    label: 'Nav: Itinerary',
    defaultValue: 'Itinerary',
    maxLength: 20,
    richText: false,
    fieldType: 'text',
    adminOnly: true,
    section: 'navigation',
    group: 'Navigation Labels',
    chip: 'Display',
    templateIds: [1, 2, 3],
  },
  {
    key: 'nav.rsvp',
    label: 'Nav: RSVP',
    defaultValue: 'RSVP',
    maxLength: 20,
    richText: false,
    fieldType: 'text',
    adminOnly: true,
    section: 'navigation',
    group: 'Navigation Labels',
    chip: 'Display',
    templateIds: [1, 2, 3, 5],
  },
  {
    key: 'nav.wishes',
    label: 'Nav: Wishes',
    defaultValue: 'Wishes',
    maxLength: 20,
    richText: false,
    fieldType: 'text',
    adminOnly: true,
    section: 'navigation',
    group: 'Navigation Labels',
    chip: 'Display',
    templateIds: [1, 2, 3, 5],
  },
  {
    key: 'nav.photos',
    label: 'Nav: Photos',
    defaultValue: 'Photos',
    maxLength: 20,
    richText: false,
    fieldType: 'text',
    adminOnly: true,
    section: 'navigation',
    block: 'photobooth',
    group: 'Photo Booth',
    chip: 'Content',
    templateIds: [1, 2, 3, 5],
  },

  // ── Music ───────────────────────────────────────────────────────────────────
  {
    key: 'music.url',
    label: 'Background Music URL',
    fieldType: 'text',
    defaultValue: '',
    maxLength: 500,
    richText: false,
    adminOnly: false,
    section: 'music',
    group: 'Audio',
    chip: 'Audio',
    templateIds: [5, 6, 7, 10, 13, 14],
  },
  {
    key: 'music.loop',
    label: 'Loop Music',
    fieldType: 'boolean',
    defaultValue: 'true',
    maxLength: 5,
    richText: false,
    adminOnly: false,
    section: 'music',
    group: 'Audio',
    chip: 'Settings',
    templateIds: [5, 6, 7, 10, 13, 14],
  },

  // ── Photo Booth ─────────────────────────────────────────────────────────────
  {
    key: 'photobooth.autoApprove',
    label: 'Auto-approve Guest Photos',
    hint: 'When off, photos require manual approval',
    defaultValue: 'true',
    maxLength: 5,
    richText: false,
    fieldType: 'boolean',
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Content',
  },
];

// ── Section titles — only Templates 5 and 7 render them ──────────────────────
const SECTION_TITLE_FIELDS: TemplateConfigField[] = [
  {
    key: 'walimah.title',
    label: 'Section Title',
    defaultValue: 'Walimatul Urus',
    maxLength: 40,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'ceremony',
    group: 'Ceremony / Walimah',
    chip: 'Content',
    // T10's Details title is a plain text layer (Adjust panel), not this shared makeTitleSlot field.
    templateIds: [5, 7, 12],
  },
  {
    key: 'itinerary.title',
    label: 'Section Title',
    defaultValue: 'Aturcara Majlis',
    maxLength: 40,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'ceremony',
    block: 'itinerary',
    group: 'Schedule / Itinerary',
    chip: 'Schedule',
    // T10's Itinerary title is a plain text layer (Adjust panel), not this shared field.
    templateIds: [5, 7, 12],
  },
  {
    key: 'wish.title',
    label: 'Section Title',
    defaultValue: 'Wishes & Blessings',
    maxLength: 40,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'wishes',
    group: 'Wishes & Guestbook',
    chip: 'Content',
    // T10's Wishes title is a plain text layer (Adjust panel), not this shared field.
    templateIds: [5, 7, 12],
  },
  {
    key: 'photobooth.title',
    label: 'Section Title',
    defaultValue: 'Photo Booth',
    maxLength: 40,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Content',
    templateIds: [7, 10, 12, 13, 14],
  },
  {
    key: 'photobooth.prompt',
    label: 'Prompt',
    defaultValue: 'Snap a photo, leave it in our gallery, and cherish it with us forever.',
    maxLength: 120,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Content',
    templateIds: [7, 10, 12, 13, 14],
  },
  {
    key: 'photobooth.upload_label',
    label: 'Photo Upload Button',
    defaultValue: 'Upload a Photo',
    maxLength: 30,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Content',
    templateIds: [7, 10, 12, 13, 14],
  },
  {
    key: 'general.brideFirst',
    label: "Bride's name first",
    hint: "Toggle to put the groom's name first",
    defaultValue: 'true',
    maxLength: 5,
    richText: false,
    fieldType: 'boolean',
    adminOnly: false,
    section: 'general',
    group: 'Display',
    chip: 'Display',
    templateIds: [5, 7],
  },
  {
    key: 'invite.countdown_prefix',
    label: 'Countdown Label',
    defaultValue: 'Counting down to our special day',
    maxLength: 60,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'invitation',
    group: 'Countdown',
    chip: 'Style',
    // T7's countdown hero has no prefix-text element that reads this key at all — dropped from
    // its templateIds (was listed but dead; see lib/__tests__/templateConfigSchema.scope.test.ts).
    templateIds: [3, 4, 5],
  },
];

// T3 previously had its own 'invite.theme_label' Theme Banner field here — removed along with
// every other template's theme badge (a naming label, not part of the rendered design; see
// docs/FIX_QUEUE.md). Kept as an empty array rather than removing template 3's whole entry from
// TEMPLATE_CONFIGS below, so a future T3-only field has an obvious home.
const TEMPLATE3_EXTRA_FIELDS: TemplateConfigField[] = [];

const TEMPLATE6_EXTRA_FIELDS: TemplateConfigField[] = [
  // ── Scene / 3D controls ─────────────────────────────────────────────────────
  { key: 'scene.quality', label: '3D Quality', defaultValue: 'auto', maxLength: 10, richText: false, fieldType: 'select', options: ['auto', 'high', 'low', 'off'], adminOnly: false, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style' },
  { key: 'scene.firefly.count', label: 'Firefly Count', defaultValue: 'medium', maxLength: 10, richText: false, fieldType: 'select', options: ['low', 'medium', 'high'], adminOnly: false, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style' },
  { key: 'scene.petal.color', label: 'Petal Colour', defaultValue: '#f7c6d7', maxLength: 20, richText: false, fieldType: 'color', adminOnly: false, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style', presets: 'generic' },
  { key: 'scene.petal.count', label: 'Falling Petal Density', defaultValue: 'medium', maxLength: 10, richText: false, fieldType: 'select', options: ['none', 'low', 'medium', 'high'], adminOnly: false, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style' },
  { key: 'scene.bloom', label: 'Firefly Glow (Bloom)', defaultValue: 'true', maxLength: 5, richText: false, fieldType: 'boolean', adminOnly: false, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style' },
  { key: 'scene.fog.color', label: 'Forest Fog Colour', defaultValue: '#0d1a0e', maxLength: 20, richText: false, fieldType: 'color', adminOnly: true, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style', presets: 'generic' },
  { key: 'scene.environment', label: 'Lighting Preset', defaultValue: 'forest', maxLength: 10, richText: false, fieldType: 'select', options: ['forest', 'night', 'dawn'], adminOnly: true, section: 'scene', group: 'Fairy Garden Scene', chip: 'Style' },
  // ── T6 invitation extras ────────────────────────────────────────────────────
  { key: 'invite.firefly_greeting', label: 'Firefly Intro Line', defaultValue: 'Follow the light to our garden', maxLength: 60, richText: false, fieldType: 'text', adminOnly: false, section: 'invitation', group: 'Heading', chip: 'Content' },
];

const TEMPLATE5_EXTRA_FIELDS: TemplateConfigField[] = [
  // Only ever switches T5's welcome-section arc-text presentation (Template5.tsx's `layout`
  // const) — nothing global. Filed under 'welcome', not 'details', and relabeled so it can't be
  // confused with the PRO Adjust dock's stage layout (a much bigger, unrelated thing).
  { key: 'invite.layout', label: 'Welcome Style', defaultValue: 'classic', maxLength: 10, richText: false, fieldType: 'select', options: ['classic', 'minimal', 'ornate'], adminOnly: false, section: 'invitation', block: 'welcome', group: 'Welcome Style', chip: 'Layout' },
  // The T5/T7 PRO Adjust dock is launched from a dedicated header button now, not a schema field.
  { key: 'template.bg', label: 'Page Background', defaultValue: '', maxLength: 500, richText: false, fieldType: 'image', adminOnly: false, section: 'styling', block: 'welcome', group: 'Page Background', chip: 'Background' },
  { key: 'template.bgSize', label: 'Size', defaultValue: 'cover', maxLength: 10, richText: false, fieldType: 'select', options: ['cover', 'contain', 'auto'], optionLabels: { auto: 'Natural' }, adminOnly: false, section: 'styling', block: 'welcome', group: 'Page Background', chip: 'Background' },
  { key: 'template.bgPosition', label: 'Position', defaultValue: 'center', maxLength: 20, richText: false, fieldType: 'select', options: ['center', 'top center', 'bottom center', 'left center', 'right center'], optionLabels: { 'top center': 'Top', 'bottom center': 'Bottom', 'left center': 'Left', 'right center': 'Right' }, adminOnly: false, section: 'styling', block: 'welcome', group: 'Page Background', chip: 'Background' },

  // ── Per-element colours & shadows. `attachTo` folds these into the card of the
  //    field (or wedding-record input) they style, instead of a wall of pickers.
  { key: 'names.bride.color',      label: 'Bride Name Color',       fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'styling', block: 'details', attachTo: 'wedding.brideName',  presets: 'bride' },
  { key: 'names.bride.shadow',     label: 'Bride Name Shadow',      fieldType: 'select', defaultValue: 'none', maxLength: 10, richText: false, adminOnly: false, section: 'styling', block: 'details', attachTo: 'wedding.brideName',  options: ['none', 'soft', 'strong', 'glow'] },
  { key: 'names.groom.color',      label: 'Groom Name Color',       fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'styling', block: 'details', attachTo: 'wedding.groomName',  presets: 'groom' },
  { key: 'names.groom.shadow',     label: 'Groom Name Shadow',      fieldType: 'select', defaultValue: 'none', maxLength: 10, richText: false, adminOnly: false, section: 'styling', block: 'details', attachTo: 'wedding.groomName',  options: ['none', 'soft', 'strong', 'glow'] },
  { key: 'names.ampersand.color',  label: 'Ampersand (&) Color',    fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'styling', block: 'details', group: 'Wedding Details', chip: 'Details', presets: 'amp' },
  { key: 'date.color',             label: 'Date Card Color',        fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', block: 'details', attachTo: 'wedding.weddingDate', presets: 'date' },
  { key: 'venue.color',            label: 'Venue Card Color',       fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', block: 'details', attachTo: 'wedding.venue',      presets: 'venue' },
  { key: 'footer.tagline.color',   label: 'Footer Tagline Color',   fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'footer',   attachTo: 'footer.tagline',   presets: 'generic' },

  { key: 'countdown.label.color',  label: 'Countdown Label Color',  fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'invitation', attachTo: 'invite.countdown_prefix', presets: 'date' },
  { key: 'countdown.number.color', label: 'Number Color',           fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'invitation', group: 'Countdown', chip: 'Style', presets: 'heading' },

  { key: 'ceremony.title.color',   label: 'Ceremony Title Color',   fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', attachTo: 'walimah.title', presets: 'heading' },
  { key: 'ceremony.title.shadow',  label: 'Ceremony Title Shadow',  fieldType: 'select', defaultValue: 'none', maxLength: 10, richText: false, adminOnly: false, section: 'ceremony', attachTo: 'walimah.title', options: ['none', 'soft', 'strong', 'glow'] },
  { key: 'walimah.body.color',     label: 'Body Text Color',        fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony / Walimah', chip: 'Content', presets: 'body' },
  { key: 'ceremony.names.color',   label: 'Color',                  fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', group: 'Couple Names in Card', chip: 'Style', presets: 'generic' },
  { key: 'ceremony.names.shadow',  label: 'Shadow',                 fieldType: 'select', defaultValue: 'none', maxLength: 10, richText: false, adminOnly: false, section: 'ceremony', group: 'Couple Names in Card', chip: 'Style', options: ['none', 'soft', 'strong', 'glow'] },

  { key: 'itinerary.title.color',  label: 'Schedule Title Color',   fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', block: 'itinerary', attachTo: 'itinerary.title', presets: 'heading' },
  { key: 'itinerary.item.color',   label: 'Item Text Color',        fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', block: 'itinerary', group: 'Schedule / Itinerary', chip: 'Schedule', presets: 'body' },

  { key: 'rsvp.subtitle.color',    label: 'RSVP Subtitle Color',    fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'rsvp',   attachTo: 'rsvp.subtitle', presets: 'body' },
  { key: 'wish.prompt.color',      label: 'Wish Prompt Color',      fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'wishes', attachTo: 'wish.prompt',   presets: 'body' },

  { key: 'section.heading.color',  label: 'Color',                  fieldType: 'color',  defaultValue: '',     maxLength: 20, richText: false, adminOnly: false, section: 'styling', block: 'photobooth', group: 'Section Headings', chip: 'Content', presets: 'generic', hint: 'Applies to Wishes & Photo Booth headings' },
  { key: 'section.heading.shadow', label: 'Shadow',                 fieldType: 'select', defaultValue: 'none', maxLength: 10, richText: false, adminOnly: false, section: 'styling', block: 'photobooth', group: 'Section Headings', chip: 'Content', options: ['none', 'soft', 'strong', 'glow'] },

  { key: 'nav.welcome',  label: 'Nav: Welcome',  fieldType: 'text', defaultValue: 'Welcome',  maxLength: 20, richText: false, adminOnly: true, section: 'navigation', group: 'Navigation Labels', chip: 'Display' },
  { key: 'nav.ceremony', label: 'Nav: Ceremony', fieldType: 'text', defaultValue: 'Ceremony', maxLength: 20, richText: false, adminOnly: true, section: 'navigation', group: 'Navigation Labels', chip: 'Display' },
];

// ── Template 7 — Roman Garden ───────────────────────────────────────────────
// The art is baked monochrome sepia, so a single ink tint re-tones every stage.
const TEMPLATE7_EXTRA_FIELDS: TemplateConfigField[] = [
  { key: 'scene.parallax', label: 'Parallax Depth', hint: 'How far the scenery layers drift apart as you scroll.', fieldType: 'select', defaultValue: 'on', maxLength: 10, richText: false, adminOnly: false, options: ['on', 'subtle', 'off'], section: 'scene', group: 'Roman Garden Scene', chip: 'Style', templateIds: [7] },
  { key: 'scene.ink.tint', label: 'Ink Tone', hint: 'Re-tones every engraved stage at once — warmer or cooler.', fieldType: 'color', defaultValue: '#3D3833', maxLength: 20, richText: false, adminOnly: false, section: 'scene', group: 'Roman Garden Scene', chip: 'Style', presets: 'generic' },
  { key: 'scene.paper.grain', label: 'Paper Grain', hint: 'Subtle printed-paper texture over the whole invitation.', fieldType: 'boolean', defaultValue: 'true', maxLength: 5, richText: false, adminOnly: false, section: 'scene', group: 'Roman Garden Scene', chip: 'Style' },

  { key: 'scene.ceremony.layout', label: 'Ceremony Layout', hint: 'Stacked = scroll down through each beat. Row = the beats share one background and pan sideways as you scroll.', fieldType: 'select', defaultValue: 'stack', maxLength: 10, richText: false, adminOnly: false, options: ['stack', 'row'], section: 'ceremony', group: 'Ceremony Stages', chip: 'Style' },

  { key: 'ceremony.panel.couple_title', label: 'Couple Stage Title', fieldType: 'text', defaultValue: 'The Bride & Groom', maxLength: 40, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.panel.details_title', label: 'Details Stage Title', fieldType: 'text', defaultValue: 'Ceremony Details', maxLength: 40, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.when_label', label: 'Date Row Label', fieldType: 'text', defaultValue: 'When', maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.where_label', label: 'Venue Row Label', fieldType: 'text', defaultValue: 'Where', maxLength: 20, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.calendar_label', label: 'Add to Calendar Button', fieldType: 'text', defaultValue: 'Add to Calendar', maxLength: 30, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.map_label', label: 'View Map Button', fieldType: 'text', defaultValue: 'View Map', maxLength: 30, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.map_hide_label', label: 'Hide Map Button', fieldType: 'text', defaultValue: 'Hide Map', maxLength: 30, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  // rsvp.seating_prompt and the rest of the RSVP/seating form fields now live in COMMON_FIELDS
  // (shared by T7 and T10 — this array is T7-only) — see the "RSVP form fields + the seating
  // step" block above.

  // Pop-up triggers. T7's RSVP and wish forms live in bottom sheets rather than on the stage (a
  // stage is an art composition; a form is variable-height content, and inline it has to reserve a
  // box its neighbours can never reflow into). What stays on the stage is the button that opens
  // them — so its wording, and optionally its artwork, are the couple's to set. Read by
  // `_shared/slots/SheetTriggerSlot.tsx` as `sheet.<sheetId>.label` / `.image`.
  { key: 'sheet.rsvp.label', label: 'RSVP Button Text', fieldType: 'text', defaultValue: 'RSVP Now', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP' },
  { key: 'sheet.rsvp.image', label: 'RSVP Button Artwork', hint: 'Optional — replaces the button with your own image.', fieldType: 'image', defaultValue: '', maxLength: 500, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP' },
  { key: 'sheet.wish.label', label: 'Wish Button Text', fieldType: 'text', defaultValue: 'Write a Wish', maxLength: 30, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content' },
  { key: 'sheet.wish.image', label: 'Wish Button Artwork', hint: 'Optional — replaces the button with your own image (it gently floats in place).', fieldType: 'image', defaultValue: '', maxLength: 500, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content' },
  // The T7 PRO Adjust dock is launched from a dedicated header button now, not a schema field.

  // T7's own bottom nav pill is position:fixed chrome, outside any one stage's box — not a
  // draggable layer, so it's tuned here (like scene.parallax / scene.ink.tint) rather than in the
  // Adjust dock. `nav.size` scales the whole pill (padding/gap/buttons together, via transform —
  // fine for a small fixed-size control with no reflow-sensitive content); `nav.textSize` is an
  // independent multiplier on just the button labels. (These previously lived, unreachably, inside
  // TEMPLATE5_EXTRA_FIELDS — an array TEMPLATE_CONFIGS[7] never composes — so the controls existed
  // in the schema but no couple could ever see them. See lib/__tests__/templateConfigSchema.scope.test.ts.)
  { key: 'nav.size', label: 'Nav Bar Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [7] },
  { key: 'nav.textSize', label: 'Nav Bar Text Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [7] },
  // T7's own nav-layout control — see nav.layout under TEMPLATE10_EXTRA_FIELDS for the shared
  // documentation (this pair only exists twice, once per template, because TEMPLATE7_EXTRA_FIELDS
  // and TEMPLATE10_EXTRA_FIELDS are never composed together).
  { key: 'nav.layout', label: 'Nav Bar Layout', fieldType: 'select', defaultValue: 'bottom-pill', maxLength: 12, richText: false, adminOnly: false, options: ['bottom-pill', 'top-pill', 'bottom-bar', 'hidden'], optionLabels: { 'bottom-pill': 'Bottom (pill)', 'top-pill': 'Top (pill)', 'bottom-bar': 'Bottom (full bar)', hidden: 'Hidden' }, section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [7] },
];

// ── Template 8 — Gilded Arch (PARTY) ────────────────────────────────────────
// One honoree (event.name1), no "sides". `party.age` is the hero's big milestone numeral — a
// genuinely new field, nothing else in the schema models it.
const TEMPLATE8_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'party.age',
    label: 'Age / Milestone Number',
    hint: 'The big number in the hero (e.g. 30, 7, 1st)',
    defaultValue: '1',
    maxLength: 6,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'invitation',
    group: 'Hero',
    chip: 'Content',
    templateIds: [8],
  },
  {
    key: 'names.honoree.color',
    label: 'Honoree Name Color',
    fieldType: 'color',
    defaultValue: '',
    maxLength: 20,
    richText: false,
    adminOnly: false,
    section: 'styling',
    block: 'details',
    attachTo: 'event.name1',
    presets: 'generic',
    templateIds: [8],
  },
  {
    key: 'names.honoree.shadow',
    label: 'Honoree Name Shadow',
    fieldType: 'select',
    options: ['none', 'soft', 'strong', 'glow'],
    defaultValue: 'none',
    maxLength: 10,
    richText: false,
    adminOnly: false,
    section: 'styling',
    block: 'details',
    attachTo: 'event.name1',
    templateIds: [8],
  },
];

// ── Template 9 — Engraved Certificate (CEREMONY) ────────────────────────────
// No individual honoree — event.eventTitle carries the whole hero, so it gets the same
// color/shadow attachment pair the *.bride/groom.color fields give WEDDING's names.
const TEMPLATE9_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'title.color',
    label: 'Event Title Color',
    fieldType: 'color',
    defaultValue: '',
    maxLength: 20,
    richText: false,
    adminOnly: false,
    section: 'styling',
    block: 'details',
    attachTo: 'event.eventTitle',
    presets: 'heading',
    templateIds: [9],
  },
  {
    key: 'title.shadow',
    label: 'Event Title Shadow',
    fieldType: 'select',
    options: ['none', 'soft', 'strong', 'glow'],
    defaultValue: 'none',
    maxLength: 10,
    richText: false,
    adminOnly: false,
    section: 'styling',
    block: 'details',
    attachTo: 'event.eventTitle',
    templateIds: [9],
  },
];

// ── Template 10 — Sunny Safari (PARTY) ──────────────────────────────────────
// Names/title/date/venue in the hero are plain `kind:'text'` layers (see data/stages.ts), not DOM
// elements — so unlike T8/T9 they need no `names.*.color`/`.shadow` + `attachTo` schema fields at
// all; the couple restyles them straight through the Adjust panel like any other layer.
const TEMPLATE10_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'photobooth.frameArt',
    label: 'Photo Frame Style',
    hint: "Sunny Safari's own gallery card, or Roman Garden's engraved frame overlay.",
    defaultValue: 'none',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['none', 'roman'],
    optionLabels: { none: 'Safari (plain)', roman: 'Engraved (Roman Garden)' },
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Style',
    templateIds: [10],
  },
  // T10's own nav pill is position:fixed chrome, outside any one stage's box — not a draggable
  // layer, so it's tuned here (like T7's own nav.size/nav.textSize, and scene.parallax below)
  // rather than in the Adjust dock. Declared fresh rather than reusing T7's entries because
  // TEMPLATE7_EXTRA_FIELDS and TEMPLATE10_EXTRA_FIELDS are never composed together.
  { key: 'nav.size', label: 'Nav Bar Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [10] },
  { key: 'nav.textSize', label: 'Nav Bar Text Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [10] },
  { key: 'nav.layout', label: 'Nav Bar Layout', fieldType: 'select', defaultValue: 'bottom-pill', maxLength: 12, richText: false, adminOnly: false, options: ['bottom-pill', 'top-pill', 'bottom-bar', 'hidden'], optionLabels: { 'bottom-pill': 'Bottom (pill)', 'top-pill': 'Top (pill)', 'bottom-bar': 'Bottom (full bar)', hidden: 'Hidden' }, section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [10] },
  // T10 shares the same useParallax engine T7 uses but never got the couple-facing control for
  // it (T7's scene.parallax is declared in TEMPLATE7_EXTRA_FIELDS, which this template never
  // composes) — added here so both Stage-family templates expose the same knob.
  { key: 'scene.parallax', label: 'Parallax Depth', hint: 'How far the scenery layers drift apart as you scroll.', fieldType: 'select', defaultValue: 'on', maxLength: 10, richText: false, adminOnly: false, options: ['on', 'subtle', 'off'], section: 'scene', group: 'Sunny Safari Scene', chip: 'Style', templateIds: [10] },
];

const TEMPLATE12_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'photobooth.frameArt',
    label: 'Photo Frame Style',
    hint: "Dreamy Woodland's clean gallery cards, or Roman Garden's engraved frame overlay.",
    defaultValue: 'none',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['none', 'roman'],
    optionLabels: { none: 'Woodland (plain)', roman: 'Engraved (Roman Garden)' },
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Style',
    templateIds: [12],
  },
  { key: 'sheet.rsvp.label', label: 'RSVP Button Text', fieldType: 'text', defaultValue: 'RSVP Now', maxLength: 30, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [12] },
  { key: 'sheet.rsvp.image', label: 'RSVP Button Artwork', hint: 'Optional — replaces the button with your own image.', fieldType: 'image', defaultValue: '', maxLength: 500, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP', templateIds: [12] },
  { key: 'sheet.wish.label', label: 'Wish Button Text', fieldType: 'text', defaultValue: 'Write a Wish', maxLength: 30, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [12] },
  { key: 'sheet.wish.image', label: 'Wish Button Artwork', hint: 'Optional — replaces the button with your own image.', fieldType: 'image', defaultValue: '', maxLength: 500, richText: false, adminOnly: false, section: 'wishes', group: 'Wishes & Guestbook', chip: 'Content', templateIds: [12] },
];

// ── Template 13 — Dino Doodle Party (PARTY, Stage family) ──────────────────
const TEMPLATE13_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'photobooth.frameArt',
    label: 'Photo Frame Style',
    hint: "Dino Doodle's field-journal gallery, or Roman Garden's engraved frame overlay.",
    defaultValue: 'none',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['none', 'roman'],
    optionLabels: { none: 'Expedition (plain)', roman: 'Engraved (Roman Garden)' },
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Style',
    templateIds: [13],
  },
  { key: 'nav.size', label: 'Nav Bar Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [13] },
  { key: 'nav.textSize', label: 'Nav Bar Text Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [13] },
  { key: 'nav.layout', label: 'Nav Bar Layout', fieldType: 'select', defaultValue: 'bottom-pill', maxLength: 12, richText: false, adminOnly: false, options: ['bottom-pill', 'top-pill', 'bottom-bar', 'hidden'], optionLabels: { 'bottom-pill': 'Bottom (pill)', 'top-pill': 'Top (pill)', 'bottom-bar': 'Bottom (full bar)', hidden: 'Hidden' }, section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [13] },
  { key: 'scene.parallax', label: 'Parallax Depth', hint: 'How far the expedition scenery drifts as guests scroll.', fieldType: 'select', defaultValue: 'on', maxLength: 10, richText: false, adminOnly: false, options: ['on', 'subtle', 'off'], section: 'scene', group: 'Dino Doodle Scene', chip: 'Style', templateIds: [13] },
];

// ── Template 14 — Sandy Beach (WEDDING, Stage family) ──────────────────────
// Same control set as T10 (see its notes above): the titles/labels are plain `kind:'text'` layers
// restyled through the Adjust panel, so none of the shared makeTitleSlot fields apply; the nav pill
// and parallax are position:fixed / engine-wide knobs that live here rather than in the dock.
const TEMPLATE14_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'photobooth.frameArt',
    label: 'Photo Frame Style',
    hint: "Sandy Beach's own gallery cards, or Roman Garden's engraved frame overlay.",
    defaultValue: 'none',
    maxLength: 10,
    richText: false,
    fieldType: 'select',
    options: ['none', 'roman'],
    optionLabels: { none: 'Sandy Beach (plain)', roman: 'Engraved (Roman Garden)' },
    adminOnly: false,
    section: 'photobooth',
    group: 'Photo Booth',
    chip: 'Style',
    templateIds: [14],
  },
  { key: 'nav.size', label: 'Nav Bar Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [14] },
  { key: 'nav.textSize', label: 'Nav Bar Text Size', fieldType: 'select', defaultValue: 'default', maxLength: 10, richText: false, adminOnly: false, options: ['compact', 'default', 'large', 'xlarge'], section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [14] },
  { key: 'nav.layout', label: 'Nav Bar Layout', fieldType: 'select', defaultValue: 'bottom-pill', maxLength: 12, richText: false, adminOnly: false, options: ['bottom-pill', 'top-pill', 'bottom-bar', 'hidden'], optionLabels: { 'bottom-pill': 'Bottom (pill)', 'top-pill': 'Top (pill)', 'bottom-bar': 'Bottom (full bar)', hidden: 'Hidden' }, section: 'navigation', group: 'Navigation Bar', chip: 'Display', templateIds: [14] },
  { key: 'scene.parallax', label: 'Parallax Depth', hint: 'How far the scenery layers drift apart as you scroll.', fieldType: 'select', defaultValue: 'on', maxLength: 10, richText: false, adminOnly: false, options: ['on', 'subtle', 'off'], section: 'scene', group: 'Sandy Beach Scene', chip: 'Style', templateIds: [14] },
];

const TEMPLATE_CONFIGS: Record<number, TemplateConfigField[]> = {
  1: COMMON_FIELDS,
  2: COMMON_FIELDS,
  3: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE3_EXTRA_FIELDS],
  4: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS],
  5: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE5_EXTRA_FIELDS],
  6: [...COMMON_FIELDS, ...TEMPLATE6_EXTRA_FIELDS],
  7: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE7_EXTRA_FIELDS],
  8: [...COMMON_FIELDS, ...TEMPLATE8_EXTRA_FIELDS],
  9: [...COMMON_FIELDS, ...TEMPLATE9_EXTRA_FIELDS],
  10: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE10_EXTRA_FIELDS],
  12: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE12_EXTRA_FIELDS],
  13: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE13_EXTRA_FIELDS],
  14: [...COMMON_FIELDS, ...SECTION_TITLE_FIELDS, ...TEMPLATE14_EXTRA_FIELDS],
};

function fieldsFor(templateId: number): TemplateConfigField[] {
  const fields = TEMPLATE_CONFIGS[templateId] ?? COMMON_FIELDS;
  return fields.filter((f) => !f.templateIds || f.templateIds.includes(templateId));
}

// Mirrors TierEntitlements.Rank on the backend.
const TIER_RANK: Record<string, number> = { BASIC: 0, PREMIUM: 1, PRO: 2 };
const rank = (tier?: string) => TIER_RANK[tier ?? 'BASIC'] ?? 0;

export function getConfigFields(templateId: number, role: string, tier?: string): TemplateConfigField[] {
  let fields = fieldsFor(templateId);
  if (role !== 'SUPER_ADMIN') fields = fields.filter((f) => !f.adminOnly);
  // Tier-gated fields (e.g. the PRO stage-layout launcher) drop for lower tiers. Super admins
  // preview everything.
  if (role !== 'SUPER_ADMIN') fields = fields.filter((f) => !f.minTier || rank(tier) >= rank(f.minTier));
  return fields;
}

export function buildDefaultConfig(templateId: number): Record<string, string> {
  return Object.fromEntries(
    fieldsFor(templateId)
      .filter((f) => f.fieldType !== 'layout') // launcher, not a stored key
      .map((f) => [f.key, f.defaultValue]),
  );
}

/** The block a field renders in — its own override, else its section's default. */
export function blockOf(field: TemplateConfigField): TemplateConfigBlock {
  return field.block ?? SECTION_BLOCK[field.section];
}

/**
 * The curated field set for the guest self-serve Personalise page — content the
 * guest writes, not the styling/layout "chrome" a couple tweaks in the full editor.
 *
 * Derived from getConfigFields (as a BASIC organizer) so it inherits templateIds /
 * adminOnly / minTier gating for free and stays in sync as the schema grows.
 * A field can opt in/out explicitly via `guestEssential`.
 */
const GUEST_CONTENT_CHIPS = new Set(['Content', 'Schedule', 'RSVP', 'Wishes', 'Footer', 'Display']);
const GUEST_CONTENT_TYPES = new Set(['text', 'richtext', 'boolean']);

export function getGuestFields(templateId: number): TemplateConfigField[] {
  return getConfigFields(templateId, 'ORGANIZER_ADMIN', 'BASIC').filter((f) => {
    if (f.guestEssential !== undefined) return f.guestEssential;
    return (
      GUEST_CONTENT_TYPES.has(f.fieldType) &&
      f.chip != null &&
      GUEST_CONTENT_CHIPS.has(f.chip) &&
      !f.attachTo
    );
  });
}
