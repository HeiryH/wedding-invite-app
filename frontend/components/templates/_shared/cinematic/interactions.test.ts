import { describe, expect, it } from 'vitest';
import {
  INITIAL_CINEMATIC_INTERACTIONS,
  cinematicInteractionReducer,
} from './interactions';

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
});
