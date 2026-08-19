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
  navigation: 'details',
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
    templateIds: [1, 2, 3, 4, 5, 6, 8, 9],
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
    templateIds: [1, 2, 3, 4, 6, 7, 8, 9],
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
  },

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
  },

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
    templateIds: [1, 2, 3, 8],
  },
  {
    key: 'section.ceremony.bg',
    label: 'Ceremony',
    defaultValue: '',
    maxLength: 500,
    richText: false,
    fieldType: 'image',
    adminOnly: false,
    section: 'styling',
    block: 'itinerary',
    group: 'Section Background',
    chip: 'Background',
    templateIds: [1, 2, 3, 4, 8],
  },
  {
    key: 'section.celebration.bg',
    label: 'Celebration',
    defaultValue: '',
    maxLength: 500,
    richText: false,
    fieldType: 'image',
    adminOnly: false,
    section: 'styling',
    block: 'photobooth',
    group: 'Section Background',
    chip: 'Background',
    templateIds: [1, 2, 3, 4, 8],
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
    templateIds: [5, 6, 7],
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
    templateIds: [5, 6, 7],
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
    templateIds: [5, 7],
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
    templateIds: [5, 7],
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
    templateIds: [5, 7],
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
    templateIds: [7],
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
    templateIds: [3, 4, 5, 7],
  },
];

const TEMPLATE3_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'invite.theme_label',
    label: 'Theme Banner',
    defaultValue: 'Garden Romance',
    maxLength: 30,
    richText: false,
    fieldType: 'text',
    adminOnly: false,
    section: 'invitation',
    group: 'Heading',
    chip: 'Content',
  },
];

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
  { key: 'invite.enchantment_label', label: 'Theme Badge Text', defaultValue: 'Enchanted Garden', maxLength: 30, richText: false, fieldType: 'text', adminOnly: false, section: 'invitation', group: 'Heading', chip: 'Content' },
  { key: 'invite.firefly_greeting', label: 'Firefly Intro Line', defaultValue: 'Follow the light to our garden', maxLength: 60, richText: false, fieldType: 'text', adminOnly: false, section: 'invitation', group: 'Heading', chip: 'Content' },
];

const TEMPLATE5_EXTRA_FIELDS: TemplateConfigField[] = [
  { key: 'invite.layout', label: 'Layout Style', defaultValue: 'classic', maxLength: 10, richText: false, fieldType: 'select', options: ['classic', 'minimal', 'ornate'], adminOnly: false, section: 'invitation', block: 'details', group: 'Invitation Layout', chip: 'Layout' },
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
  { key: 'invite.theme_label', label: 'Theme Badge', fieldType: 'text', defaultValue: 'Roman Garden', maxLength: 40, richText: false, adminOnly: false, section: 'invitation', group: 'Roman Garden Scene', chip: 'Style' },
  { key: 'scene.parallax', label: 'Parallax Depth', hint: 'How far the scenery layers drift apart as you scroll.', fieldType: 'select', defaultValue: 'on', maxLength: 10, richText: false, adminOnly: false, options: ['on', 'subtle', 'off'], section: 'scene', group: 'Roman Garden Scene', chip: 'Style' },
  { key: 'scene.ink.tint', label: 'Ink Tone', hint: 'Re-tones every engraved stage at once — warmer or cooler.', fieldType: 'color', defaultValue: '#3D3833', maxLength: 20, richText: false, adminOnly: false, section: 'scene', group: 'Roman Garden Scene', chip: 'Style', presets: 'generic' },
  { key: 'scene.paper.grain', label: 'Paper Grain', hint: 'Subtle printed-paper texture over the whole invitation.', fieldType: 'boolean', defaultValue: 'true', maxLength: 5, richText: false, adminOnly: false, section: 'scene', group: 'Roman Garden Scene', chip: 'Style' },

  { key: 'scene.ceremony.layout', label: 'Ceremony Layout', hint: 'Stacked = scroll down through each beat. Row = the beats share one background and pan sideways as you scroll.', fieldType: 'select', defaultValue: 'stack', maxLength: 10, richText: false, adminOnly: false, options: ['stack', 'row'], section: 'ceremony', group: 'Ceremony Stages', chip: 'Style' },

  { key: 'ceremony.panel.couple_title', label: 'Couple Stage Title', fieldType: 'text', defaultValue: 'The Bride & Groom', maxLength: 40, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },
  { key: 'ceremony.panel.details_title', label: 'Details Stage Title', fieldType: 'text', defaultValue: 'Ceremony Details', maxLength: 40, richText: false, adminOnly: false, section: 'ceremony', group: 'Ceremony Stages', chip: 'Content' },

  { key: 'rsvp.seating_prompt', label: 'Seating Prompt', fieldType: 'text', defaultValue: 'Choose your table', maxLength: 60, richText: false, adminOnly: false, section: 'rsvp', group: 'RSVP', chip: 'RSVP' },
  // The T7 PRO Adjust dock is launched from a dedicated header button now, not a schema field.
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
};

function fieldsFor(templateId: number): TemplateConfigField[] {
  const fields = TEMPLATE_CONFIGS[templateId] ?? COMMON_FIELDS;
  return fields.filter((f) => !f.templateIds || f.templateIds.includes(templateId));
}

// Mirrors TierEntitlements.Rank on the backend.
const TIER_RANK: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };
const rank = (tier?: string) => TIER_RANK[tier ?? 'FREE'] ?? 0;

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
 * Derived from getConfigFields (as a FREE organizer) so it inherits templateIds /
 * adminOnly / minTier gating for free and stays in sync as the schema grows.
 * A field can opt in/out explicitly via `guestEssential`.
 */
const GUEST_CONTENT_CHIPS = new Set(['Content', 'Schedule', 'RSVP', 'Wishes', 'Footer', 'Display']);
const GUEST_CONTENT_TYPES = new Set(['text', 'richtext', 'boolean']);

export function getGuestFields(templateId: number): TemplateConfigField[] {
  return getConfigFields(templateId, 'ORGANIZER_ADMIN', 'FREE').filter((f) => {
    if (f.guestEssential !== undefined) return f.guestEssential;
    return (
      GUEST_CONTENT_TYPES.has(f.fieldType) &&
      f.chip != null &&
      GUEST_CONTENT_CHIPS.has(f.chip) &&
      !f.attachTo
    );
  });
}
