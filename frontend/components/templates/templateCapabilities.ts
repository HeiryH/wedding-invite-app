/** Data only: importing capabilities must never load a template, stage map or engine. */
export interface TemplateCapabilities {
  editor: 'classic' | 'stage' | 'cinematic' | 'none' | 'authored';
  sectionOrder: 'visual' | 'dom' | 'partial' | 'fixed' | 'sequence' | 'composition';
  guestForms: 'bespoke' | 'shared' | 'authored';
  seating: boolean;
  configurableForms: boolean;
  configurableRsvpFields: boolean;
  sharedNavigation: boolean;
  music: 'none' | 'legacy' | 'shared' | 'authored';
  coupleGallery: boolean;
  prototype: boolean;
}

const classic: TemplateCapabilities = {
  editor: 'classic', sectionOrder: 'visual', guestForms: 'bespoke', seating: true,
  configurableForms: false, configurableRsvpFields: false, sharedNavigation: false,
  music: 'none', coupleGallery: false, prototype: false,
};
const stage: TemplateCapabilities = {
  ...classic, editor: 'stage', sectionOrder: 'dom', guestForms: 'shared',
  configurableForms: true, configurableRsvpFields: true, sharedNavigation: true, music: 'legacy',
};

/** Describes current implementation, including known gaps; does not grant tier/feature access. */
export const TEMPLATE_CAPABILITIES: Readonly<Record<number, Readonly<TemplateCapabilities>>> = {
  1: { ...classic },
  2: { ...classic },
  3: { ...classic },
  4: { ...classic, sectionOrder: 'partial' },
  5: { ...classic, sectionOrder: 'dom', music: 'legacy' },
  6: { ...classic, sectionOrder: 'fixed', seating: false, music: 'legacy' },
  7: { ...stage, coupleGallery: true },
  8: { ...classic, editor: 'none', sectionOrder: 'fixed', prototype: true },
  9: { ...classic, editor: 'none', sectionOrder: 'fixed', prototype: true },
  10: { ...stage },
  11: { ...stage, editor: 'classic', music: 'shared', coupleGallery: true },
  12: { ...stage, editor: 'classic', music: 'shared', coupleGallery: true },
  13: { ...stage },
  14: { ...stage },
  15: { ...stage, editor: 'cinematic', sectionOrder: 'sequence', configurableForms: false, music: 'shared' },
  16: { ...classic, sectionOrder: 'fixed', sharedNavigation: true, music: 'shared', coupleGallery: true },
};

const authored: Readonly<TemplateCapabilities> = {
  ...classic, editor: 'authored', sectionOrder: 'composition', guestForms: 'authored',
  seating: true, music: 'authored',
};

export function getTemplateCapabilities(templateId: number, hasAuthoredStages = false): Readonly<TemplateCapabilities> {
  return hasAuthoredStages ? authored : TEMPLATE_CAPABILITIES[templateId] ?? TEMPLATE_CAPABILITIES[1];
}

export function templatesWith(capability: 'seating' | 'configurableForms' | 'configurableRsvpFields' | 'sharedNavigation' | 'coupleGallery') {
  // Prototype renderers support seating but do not expose the production Seating editor.
  return Object.entries(TEMPLATE_CAPABILITIES)
    .filter(([, value]) => value[capability] && !value.prototype)
    .map(([id]) => Number(id));
}
