import { describe, expect, it } from 'vitest';
import { buildDefaultConfig, getConfigFields } from './templateConfigSchema';

describe('Inkbound Revelry customization', () => {
  it('exposes only the copy and display switches the DOM template consumes', () => {
    const fields = getConfigFields(16, 'ORGANIZER_ADMIN', 'PREMIUM');
    expect(fields.map((field) => field.key)).toContain('inkbound.eventTitle');
    expect(fields.map((field) => field.key)).toContain('walimah.body');
    expect(fields.some((field) => field.fieldType === 'layout')).toBe(false);
    expect(fields.some((field) => field.key.startsWith('t16.layout.'))).toBe(false);
    expect(fields.some((field) => field.key === 'photobooth.frameArt')).toBe(false);
    expect(buildDefaultConfig(16)['rsvp.title']).toBe('Join the celebration');
  });
});
