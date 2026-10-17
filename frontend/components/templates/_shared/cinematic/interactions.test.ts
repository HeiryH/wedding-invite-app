import { describe, expect, it } from 'vitest';
import {
  INITIAL_CINEMATIC_INTERACTIONS,
  cinematicInteractionAvailable,
  cinematicInteractionReducer,
  cinematicInteractionReturnsToScene,
  findCinematicInteractionTrack,
} from './interactions';
import { PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';

describe('cinematic interaction lifecycle', () => {
  it('closes a sheet through a visible closing state before dismissal', () => {
    const opened = cinematicInteractionReducer(INITIAL_CINEMATIC_INTERACTIONS, { type: 'open', id: 'rsvp' });
    const closing = cinematicInteractionReducer(opened, { type: 'close', id: 'rsvp' });
    const dismissed = cinematicInteractionReducer(closing, { type: 'finish-close', id: 'rsvp' });
    expect(opened.rsvp).toBe('open');
    expect(closing.rsvp).toBe('closing');
    expect(dismissed.rsvp).toBe('dismissed');
  });

  it('resets one interaction without disturbing the other', () => {
    const state = { rsvp: 'dismissed', wish: 'open' } as const;
    expect(cinematicInteractionReducer(state, { type: 'reset', id: 'rsvp' })).toEqual({
      rsvp: 'ready', wish: 'open',
    });
  });

  it('ignores a stale finish event unless the object is closing', () => {
    expect(cinematicInteractionReducer(INITIAL_CINEMATIC_INTERACTIONS, {
      type: 'finish-close', id: 'wish',
    })).toBe(INITIAL_CINEMATIC_INTERACTIONS);
  });

  it('treats the timeline clip as availability rather than time spent in a form', () => {
    const tracks = PAINTED_PROMISE_SEQUENCE.tracks;
    expect(findCinematicInteractionTrack(tracks, 'rsvp')?.id).toBe('rsvp-availability');
    expect(findCinematicInteractionTrack(tracks, 'wish')?.id).toBe('wishes-availability');
    expect(cinematicInteractionAvailable(tracks, 'rsvp', .82)).toBe(true);
    expect(cinematicInteractionAvailable(tracks, 'rsvp', .77)).toBe(false);
    expect(cinematicInteractionAvailable(tracks, 'wish', .90)).toBe(true);
  });

  it('returns to the same table scene after dismissing within the availability range', () => {
    const tracks = PAINTED_PROMISE_SEQUENCE.tracks;
    expect(cinematicInteractionReturnsToScene(tracks, 'rsvp', 'open', .83)).toBe(false);
    expect(cinematicInteractionReturnsToScene(tracks, 'rsvp', 'closing', .83)).toBe(true);
    expect(cinematicInteractionReturnsToScene(tracks, 'rsvp', 'dismissed', .87)).toBe(false);
  });
});
