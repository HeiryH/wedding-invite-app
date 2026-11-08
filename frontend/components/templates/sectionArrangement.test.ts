import { describe, expect, it } from 'vitest';
import { moveIndependentSection, sectionArrangement } from './sectionArrangement';

describe('grouped Minimal Noir ordering', () => {
  const saved = ['wishes', 'welcome', 'rsvp', 'walimah', 'photobooth', 'itinerary'];
  it('projects the fixed composition without rewriting the saved order', () => {
    expect(sectionArrangement(4, saved).displayed).toEqual(['welcome', 'walimah', 'itinerary', 'wishes', 'rsvp', 'photobooth']);
    expect(saved[0]).toBe('wishes');
    expect(moveIndependentSection(4, saved, 'welcome', 'down')).toEqual(saved);
    expect(moveIndependentSection(4, saved, 'wishes', 'up')).toEqual(saved);
    expect(moveIndependentSection(4, saved, 'rsvp', 'up')).toEqual(['rsvp', 'welcome', 'wishes', 'walimah', 'photobooth', 'itinerary']);
  });
  it('does not offer unsupported prototype or cinematic section reorder', () => {
    for (const id of [8, 9, 15, 16]) expect(sectionArrangement(id, saved).movable).toEqual([]);
    expect(sectionArrangement(3, saved).movable).toEqual(saved);
  });
});
