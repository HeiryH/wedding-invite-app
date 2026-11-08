import { getTemplateCapabilities } from './templateCapabilities';

const grouped = ['welcome', 'walimah', 'itinerary'];
const independent = ['rsvp', 'wishes', 'photobooth'];

/** Editor projection only. Never serialize this over the saved logical order. */
export function sectionArrangement(templateId: number, saved: readonly string[]) {
  const capability = getTemplateCapabilities(templateId);
  if (capability.sectionOrder === 'partial') return {
    displayed: [...grouped.filter((id) => saved.includes(id)), ...saved.filter((id) => independent.includes(id))],
    movable: saved.filter((id) => independent.includes(id)),
    note: 'The cover, details and schedule share a fixed composition. RSVP, Wishes and Photo Booth can be reordered below it.',
  };
  const movable = capability.sectionOrder === 'dom' || capability.sectionOrder === 'visual' ? [...saved] : [];
  return { displayed: [...saved], movable, note: movable.length ? '' : 'This design has a fixed composition; its sections cannot be reordered independently.' };
}

export function moveIndependentSection(templateId: number, saved: readonly string[], code: string, direction: 'up' | 'down') {
  const { movable } = sectionArrangement(templateId, saved);
  const index = movable.indexOf(code), other = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || other < 0 || other >= movable.length) return [...saved];
  const next = [...saved], from = next.indexOf(code), to = next.indexOf(movable[other]);
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
