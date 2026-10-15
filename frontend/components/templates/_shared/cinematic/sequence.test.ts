import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import {
  beatsFromSequence,
  cinematicTrackPresentation,
  cinematicSequenceKey,
  removeCinematicNarrativeMoment,
  resolveCinematicTrackClip,
  resolveCinematicSequence,
  serializeCinematicSequence,
  validateCinematicSequence,
  visibilityFromSequence,
  type CinematicSequence,
} from './sequence';

describe('cinematic sequence', () => {
  it('projects the shipped story into the legacy camera and visibility contracts', () => {
    const resolved = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, undefined);
    expect(resolved.issues).toEqual([]);
    expect(beatsFromSequence(resolved.sequence).find((beat) => beat.id === 'groom')).toMatchObject({
      label: 'Groom close-up', progress: .4,
    });
    expect(visibilityFromSequence(resolved.sequence).find((track) => track.id === 'programme')).toEqual({
      id: 'programme', label: 'Programme board', group: 'programme',
      enterStart: .55, enterEnd: .59, exitStart: .745, exitEnd: .77,
    });
  });

  it('stores only changes plus tombstones for deleted shipped items', () => {
    const current: CinematicSequence = {
      ...PAINTED_PROMISE_SEQUENCE,
      beats: PAINTED_PROMISE_SEQUENCE.beats
        .filter((beat) => beat.id !== 'groom')
        .map((beat) => beat.id === 'bride' ? { ...beat, label: 'Bride portrait' } : beat),
    };
    const saved = serializeCinematicSequence(PAINTED_PROMISE_SEQUENCE, current);
    expect(JSON.parse(saved)).toEqual({
      version: 1,
      beats: [
        { id: 'groom', deleted: true },
        { id: 'bride', label: 'Bride portrait' },
      ],
    });

    const resolved = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, {
      [cinematicSequenceKey('t15')]: saved,
    }).sequence;
    expect(resolved.beats.some((beat) => beat.id === 'groom')).toBe(false);
    expect(resolved.beats.find((beat) => beat.id === 'bride')?.label).toBe('Bride portrait');
  });

  it('removes beat-exclusive tracks with their deleted narrative moment but preserves shared sets', () => {
    const resolved = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, {
      [cinematicSequenceKey('t15')]: JSON.stringify({
        version: 1,
        beats: [{ id: 'rsvp-letter', deleted: true }],
      }),
    }).sequence;
    expect(resolved.tracks.some((track) => track.id === 'rsvp')).toBe(false);
    expect(resolved.tracks.some((track) => track.id === 'table')).toBe(true);
  });

  it('cascades a director deletion through its camera beat and owned narrative tracks', () => {
    const removal = removeCinematicNarrativeMoment(PAINTED_PROMISE_SEQUENCE, 'groom');
    expect(removal.sequence.beats.some((beat) => beat.id === 'groom')).toBe(false);
    expect(removal.removedTracks.map((track) => track.id)).toEqual(['groom-details']);
    expect(removal.sequence.tracks.some((track) => track.id === 'groom-details')).toBe(false);
    expect(removal.sequence.tracks.some((track) => track.id === 'dais')).toBe(true);
    expect(removal.sequence.beats.find((beat) => beat.id === 'bride')?.at).toBe(.5);

    const saved = JSON.parse(serializeCinematicSequence(
      PAINTED_PROMISE_SEQUENCE, removal.sequence,
    ));
    expect(saved.beats).toContainEqual({ id: 'groom', deleted: true });
    expect(saved.tracks).toContainEqual({ id: 'groom-details', deleted: true });
  });

  it('repairs unsafe clip geometry and broken timing links without taking down the invitation', () => {
    const invalid: CinematicSequence = {
      version: 1,
      beats: PAINTED_PROMISE_SEQUENCE.beats,
      tracks: [{
        ...PAINTED_PROMISE_SEQUENCE.tracks[0],
        timing: { mode: 'linked', trackId: 'missing' },
        clip: { start: .8, enterEnd: .2, exitStart: 2, end: -.5 },
      }],
    };
    const resolved = validateCinematicSequence(invalid);
    expect(resolved.issues.length).toBeGreaterThan(0);
    expect(resolved.sequence.tracks[0]).toMatchObject({
      timing: { mode: 'independent' },
      clip: { start: .8, enterEnd: .8, exitStart: 1, end: 1 },
    });
  });

  it('ignores malformed persisted data and returns a usable shipped sequence', () => {
    const resolved = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, {
      [cinematicSequenceKey('t15')]: '{not-json',
    });
    expect(resolved.sequence.beats).toHaveLength(PAINTED_PROMISE_SEQUENCE.beats.length);
    expect(resolved.issues[0]?.path).toBe('sequence');
  });

  it('resolves linked clips and produces reversible asset transition geometry', () => {
    const source = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!;
    const linked = {
      ...source, id: 'linked-art', target: { type: 'layer' as const, id: 'programme-board' },
      timing: { mode: 'linked' as const, trackId: source.id },
      enter: { kind: 'fade-slide' as const, easing: 'linear' as const },
    };
    const tracks = [...PAINTED_PROMISE_SEQUENCE.tracks, linked];
    expect(resolveCinematicTrackClip(linked, tracks)).toEqual(source.clip);
    const entering = cinematicTrackPresentation(.57, linked, tracks);
    expect(entering.opacity).toBeCloseTo(.5);
    expect(entering.xVw).toBeCloseTo(3);
    expect(cinematicTrackPresentation(.2, linked, tracks).opacity).toBe(0);
  });
});
