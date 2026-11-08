import { describe, expect, it } from 'vitest';
import { sectionAtScrollLine } from './useScrollSection';

describe('sectionAtScrollLine', () => {
  const sections = [
    { id: 'cover', top: 0 },
    { id: 'rsvp', top: 800 },
    { id: 'programme', top: 2400 },
  ];

  it('keeps the highlight stable near a boundary in either direction', () => {
    expect(sectionAtScrollLine(sections, 804, 'cover')).toBe('cover');
    expect(sectionAtScrollLine(sections, 809, 'cover')).toBe('rsvp');
    expect(sectionAtScrollLine(sections, 796, 'rsvp')).toBe('rsvp');
    expect(sectionAtScrollLine(sections, 791, 'rsvp')).toBe('cover');
  });

  it('uses screen positions even if source order differs', () => {
    expect(sectionAtScrollLine([sections[2], sections[0], sections[1]], 1800, 'cover')).toBe('rsvp');
    expect(sectionAtScrollLine([], 1800, 'cover')).toBe('');
  });

  it('tracks long sections and jumps by their starts', () => {
    expect(sectionAtScrollLine(sections, 1800, 'cover')).toBe('rsvp');
    expect(sectionAtScrollLine(sections, 2500, 'cover')).toBe('programme');
    expect(sectionAtScrollLine(sections, 0, '')).toBe('cover');
  });
});
