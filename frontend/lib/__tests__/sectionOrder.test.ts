import { describe, expect, it } from 'vitest';
import { resolveSectionOrder } from '../templateUtils';

describe('resolveSectionOrder', () => {
  it('keeps explicitly removed sections hidden while backfilling newly available sections', () => {
    expect(resolveSectionOrder('welcome,rsvp,wishes,!walimah', true, true, false))
      .toEqual(['welcome', 'rsvp', 'itinerary', 'wishes']);
  });

  it('restores the canonical position after removing the exclusion', () => {
    expect(resolveSectionOrder('welcome,rsvp,wishes', true, false, false))
      .toEqual(['welcome', 'walimah', 'rsvp', 'wishes']);
  });
});
