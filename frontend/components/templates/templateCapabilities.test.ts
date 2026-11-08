import { describe, expect, it } from 'vitest';
import { TEMPLATE_IDS_BY_CODE } from './templateCatalog';
import { getTemplateCapabilities, TEMPLATE_CAPABILITIES } from './templateCapabilities';
import { getConfigFields } from '@/lib/templateConfigSchema';
import { inlineFormSheet } from './_shared/layout';
import type { PhotoUploadSubmission, TemplateRsvpSubmission } from './guestContracts';

// Compile-time regressions: callback objects cannot silently become multipart payloads.
function contracts(file: File): PhotoUploadSubmission {
  // @ts-expect-error API serialization belongs in the service, not in template callbacks.
  const invalid: PhotoUploadSubmission = new FormData();
  void invalid;
  // @ts-expect-error A family side is a closed vocabulary.
  const rsvp: TemplateRsvpSubmission = { brideOrGroomSide: 'Unknown' };
  void rsvp;
  return { file, guestName: 'Guest', caption: '' };
}
void contracts;

describe('template capability contract', () => {
  it('covers all numbered templates without conflating authored compositions and fallback', () => {
    expect(Object.keys(TEMPLATE_CAPABILITIES).map(Number)).toEqual(Object.values(TEMPLATE_IDS_BY_CODE));
    expect(getTemplateCapabilities(99)).toEqual(getTemplateCapabilities(1));
    expect(getTemplateCapabilities(99, true)).toMatchObject({ editor: 'authored', sectionOrder: 'composition', coupleGallery: false });
    expect(getTemplateCapabilities(15).editor).toBe('cinematic');
    expect(getTemplateCapabilities(8)).toMatchObject({ prototype: true, editor: 'none' });
    expect(getTemplateCapabilities(9)).toMatchObject({ prototype: true, editor: 'none' });
  });

  it.each(Object.values(TEMPLATE_IDS_BY_CODE))('T%i exposes only its implemented shared controls', (id) => {
    const keys = new Set(getConfigFields(id, 'SUPER_ADMIN', 'PRO').map((field) => field.key));
    const capability = getTemplateCapabilities(id);
    expect(keys.has('seating.mode')).toBe(capability.seating && !capability.prototype);
    expect(keys.has('rsvp.form_layout')).toBe(capability.configurableForms);
    expect(keys.has('wish.form_layout')).toBe(capability.configurableForms);
    expect(keys.has('rsvp.fields.email')).toBe(capability.configurableRsvpFields);
    expect(keys.has('nav.style')).toBe(capability.sharedNavigation);
    expect(keys.has('gallery.title')).toBe(capability.coupleGallery);
    expect(inlineFormSheet(`t${id}`, 'rsvp', { 'rsvp.form_layout': 'inline' })).toBe(capability.configurableForms ? 'rsvp' : undefined);
  });

  it('retains current production control scopes exactly', () => {
    const ids = (key: string) => Object.values(TEMPLATE_IDS_BY_CODE).filter((id) => getConfigFields(id, 'SUPER_ADMIN', 'PRO').some((f) => f.key === key));
    expect(ids('rsvp.form_layout')).toEqual([7, 10, 11, 12, 13, 14]);
    expect(ids('seating.mode')).toEqual([1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 14, 15, 16]);
    expect(ids('gallery.title')).toEqual([7, 11, 12, 16]);
    expect(inlineFormSheet('ta99', 'rsvp', { 'rsvp.form_layout': 'inline' })).toBeUndefined();
  });
});
