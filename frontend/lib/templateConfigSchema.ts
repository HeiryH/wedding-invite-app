import { TemplateConfigField } from './api/types';

const COMMON_FIELDS: TemplateConfigField[] = [
  // Invitation section
  {
    key: 'invite.heading',
    label: 'Welcome Heading',
    defaultValue: 'Together with their families',
    maxLength: 50,
    richText: false,
    adminOnly: false,
    section: 'invitation',
  },
  {
    key: 'invite.body',
    label: 'Invitation Message',
    defaultValue: 'We joyfully invite you to share in the celebration of our wedding',
    maxLength: 200,
    richText: true,
    adminOnly: false,
    section: 'invitation',
  },

  // RSVP section
  {
    key: 'rsvp.subtitle',
    label: 'RSVP Subtitle',
    defaultValue: 'Kindly reply by one week before the wedding date',
    maxLength: 80,
    richText: false,
    adminOnly: false,
    section: 'rsvp',
  },

  // Wishes section
  {
    key: 'wish.prompt',
    label: 'Wish Prompt',
    defaultValue: 'Leave a message for the happy couple',
    maxLength: 80,
    richText: false,
    adminOnly: false,
    section: 'wishes',
  },

  // Footer section
  {
    key: 'footer.tagline',
    label: 'Footer Tagline',
    defaultValue: 'Made with love for our special day',
    maxLength: 80,
    richText: false,
    adminOnly: false,
    section: 'footer',
  },

  // Navigation — super admin only
  {
    key: 'nav.invite',
    label: 'Nav: Invitation',
    defaultValue: 'Invitation',
    maxLength: 20,
    richText: false,
    adminOnly: true,
    section: 'navigation',
  },
  {
    key: 'nav.rsvp',
    label: 'Nav: RSVP',
    defaultValue: 'RSVP',
    maxLength: 20,
    richText: false,
    adminOnly: true,
    section: 'navigation',
  },
  {
    key: 'nav.wishes',
    label: 'Nav: Wishes',
    defaultValue: 'Wishes',
    maxLength: 20,
    richText: false,
    adminOnly: true,
    section: 'navigation',
  },
  {
    key: 'nav.photos',
    label: 'Nav: Photos',
    defaultValue: 'Photos',
    maxLength: 20,
    richText: false,
    adminOnly: true,
    section: 'navigation',
  },
];

const TEMPLATE3_EXTRA_FIELDS: TemplateConfigField[] = [
  {
    key: 'invite.theme_label',
    label: 'Theme Banner',
    defaultValue: 'Garden Romance',
    maxLength: 30,
    richText: false,
    adminOnly: false,
    section: 'invitation',
  },
  {
    key: 'invite.countdown_prefix',
    label: 'Countdown Prefix',
    defaultValue: 'Days until we say I do',
    maxLength: 30,
    richText: false,
    adminOnly: false,
    section: 'invitation',
  },
];

const TEMPLATE_CONFIGS: Record<number, TemplateConfigField[]> = {
  1: COMMON_FIELDS,
  2: COMMON_FIELDS,
  3: [...COMMON_FIELDS, ...TEMPLATE3_EXTRA_FIELDS],
  4: COMMON_FIELDS,
  5: COMMON_FIELDS,
};

export function getConfigFields(templateId: number, role: string): TemplateConfigField[] {
  const fields = TEMPLATE_CONFIGS[templateId] ?? COMMON_FIELDS;
  if (role === 'SUPER_ADMIN') return fields;
  return fields.filter((f) => !f.adminOnly);
}

export function buildDefaultConfig(templateId: number): Record<string, string> {
  const fields = TEMPLATE_CONFIGS[templateId] ?? COMMON_FIELDS;
  return Object.fromEntries(fields.map((f) => [f.key, f.defaultValue]));
}
