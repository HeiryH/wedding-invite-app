import { describe, expect, it } from 'vitest';
import { getConfigFields, getGuestFields } from '../templateConfigSchema';

describe('template config field identities', () => {
  it.each(Array.from({ length: 15 }, (_, i) => i + 1))(
    'template %i has unique keys in both the full and public editors',
    (templateId) => {
      for (const fields of [getConfigFields(templateId, 'SUPER_ADMIN'), getGuestFields(templateId)]) {
        const keys = fields.map((field) => field.key);
        expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([]);
      }
    },
  );

  it.each([7, 10, 12, 13, 14, 15])('keeps shared form controls available to template %i', (templateId) => {
    const keys = getGuestFields(templateId).map((field) => field.key);
    expect(keys).toContain('rsvp.name_placeholder');
    expect(keys).toContain('rsvp.seating_seats_left_label');
    expect(keys).toContain('wish.form_title');
    expect(keys).toContain('wish.photo_skip_label');
  });
});
