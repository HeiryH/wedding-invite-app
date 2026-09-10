import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 11 has no anchor-nudgeable elements yet (see PropLayer.tsx's known-gap note), so
 * every stage ships with empty layers. This exists only so the registry/customize page's
 * "select a stage" navigation has section ids to scroll to — the same reason T1-T6 register
 * stage data even though their real content isn't stage-compositor art.
 */
function stage(id: string, label: string): StageDef {
  const layers: Layer[] = [];
  return { id, label, bg: '', bgFit: 'cover', layers };
}

export const T11_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Welcome'),
  walimah: stage('walimah', 'Ceremony'),
  rsvp: stage('rsvp', 'RSVP'),
  itinerary: stage('itinerary', 'Schedule'),
  wishes: stage('wishes', 'Wishes'),
  photobooth: stage('photobooth', 'Photos'),
};

export function t11StageIds(sectionOrder: string[]): string[] {
  return sectionOrder.filter((id) => id in T11_STAGES);
}
