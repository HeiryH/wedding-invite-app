import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_VISIBILITY } from '../../Template15-paintedpromise/data/cinematic';
import {
  cinematicSetOpacity,
  cinematicVisibilityKey,
  promoteLegacyCinematicVisibilityTracks,
  resolveCinematicVisibility,
  serializeCinematicVisibility,
} from './visibility';

describe('cinematic set visibility', () => {
  it('scrubs a set in, holds it, and scrubs it out reversibly', () => {
    const set = PAINTED_PROMISE_VISIBILITY.find((candidate) => candidate.id === 'programme');
    expect(cinematicSetOpacity(.54, set)).toBe(0);
    expect(cinematicSetOpacity(.57, set)).toBeCloseTo(.5);
    expect(cinematicSetOpacity(.7, set)).toBe(1);
    expect(cinematicSetOpacity(.77, set)).toBe(0);
  });

  it('keeps a finale visible at the end of the timeline', () => {
    const set = PAINTED_PROMISE_VISIBILITY.find((candidate) => candidate.id === 'memory');
    expect(cinematicSetOpacity(1, set)).toBe(1);
  });

  it('stores only timing fields changed from the shipped direction', () => {
    const sets = resolveCinematicVisibility('t15', PAINTED_PROMISE_VISIBILITY, 'mobile', undefined);
    const changed = sets.map((set) => set.id === 'rsvp' ? { ...set, enterStart: .8 } : set);
    const saved = serializeCinematicVisibility(PAINTED_PROMISE_VISIBILITY, changed);
    expect(JSON.parse(saved)).toEqual({ sets: [{ id: 'rsvp', enterStart: .8 }] });
    expect(resolveCinematicVisibility('t15', PAINTED_PROMISE_VISIBILITY, 'mobile', {
      [cinematicVisibilityKey('t15', 'mobile')]: saved,
    }).find((set) => set.id === 'rsvp')?.enterStart).toBe(.8);
  });

  it('promotes legacy breakpoint timing into sequence tracks without mutating the source', () => {
    const tracks = [{
      id: 'dais', label: 'Dais', kind: 'set' as const,
      target: { type: 'group' as const, id: 'dais' as const },
      timing: { mode: 'independent' as const },
      clip: { start: .2, enterEnd: .3, exitStart: .5, end: .6 },
      enter: { kind: 'fade' as const, easing: 'ease-out' as const },
      exit: { kind: 'fade' as const, easing: 'ease-in' as const },
      ownership: { kind: 'shared' as const },
    }];
    const promoted = promoteLegacyCinematicVisibilityTracks(tracks, [{
      id: 'legacy-dais', label: 'Dais', group: 'dais',
      enterStart: .1, enterEnd: .2, exitStart: .7, exitEnd: .8,
    }]);
    expect(promoted[0].clip).toEqual({ start: .1, enterEnd: .2, exitStart: .7, end: .8 });
    expect(tracks[0].clip).toEqual({ start: .2, enterEnd: .3, exitStart: .5, end: .6 });
  });
});
