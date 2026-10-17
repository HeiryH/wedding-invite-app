import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import {
  beatsFromSequence,
  cinematicClipBeatSpan,
  cinematicTrackIsActive,
  cinematicTrackPhase,
  cinematicTrackPresentation,
  cinematicSequenceKey,
  constrainCinematicClip,
  createCinematicTimingSet,
  deleteCinematicTimingSet,
  describeCinematicStoryPosition,
  duplicateCinematicTimingSet,
  moveCinematicClip,
  removeCinematicNarrativeMoment,
  restoreCinematicNarrativeMoment,
  resolveCinematicLayerTiming,
  resolveCinematicTrackClip,
  resolveCinematicSequence,
  serializeCinematicSequence,
  snapCinematicStoryValue,
  unlinkCinematicLayerTiming,
  validateCinematicSequence,
  visibilityFromSequence,
  type CinematicSequence,
} from './sequence';

describe('cinematic sequence', () => {
  it('accepts a valid template-defined scene-set id without engine registration', () => {
    const customSet = {
      id: 'moonlit-terrace', label: 'Moonlit terrace', kind: 'set' as const,
      target: { type: 'group' as const, id: 'moonlit-terrace' },
      timing: { mode: 'independent' as const },
      clip: { start: .2, enterEnd: .25, exitStart: .7, end: .75 },
      enter: { kind: 'fade' as const, easing: 'ease-out' as const },
      exit: { kind: 'fade' as const, easing: 'ease-in' as const },
      ownership: { kind: 'shared' as const },
    };
    const definition = { ...PAINTED_PROMISE_SEQUENCE, tracks: [...PAINTED_PROMISE_SEQUENCE.tracks, customSet] };
    const resolved = resolveCinematicSequence('t15', definition, undefined);
    expect(resolved.issues).toEqual([]);
    expect(resolved.sequence.tracks).toContainEqual(customSet);
  });

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
    expect(removal.freedSpan).toBeCloseTo(.095);
    expect(removal.nextBeatId).toBe('bride');
    expect(removal.sequence.beats.find((beat) => beat.id === 'dais')?.at).toBeCloseTo(.31 / .905);
    expect(removal.sequence.beats.find((beat) => beat.id === 'bride')?.at).toBeCloseTo(.405 / .905);
    expect(removal.sequence.beats.find((beat) => beat.id === 'bride')?.transitionIn).toBe('ease-out');
    expect(removal.sequence.tracks.every((track) =>
      track.clip.start <= track.clip.enterEnd && track.clip.enterEnd <= track.clip.exitStart &&
      track.clip.exitStart <= track.clip.end)).toBe(true);

    const saved = JSON.parse(serializeCinematicSequence(
      PAINTED_PROMISE_SEQUENCE, removal.sequence,
    ));
    expect(saved.beats).toContainEqual({ id: 'groom', deleted: true });
    expect(saved.tracks).toContainEqual({ id: 'groom-details', deleted: true });
  });

  it('detaches surviving shared assets when their linked timing source leaves with a beat', () => {
    const groomDetails = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'groom-details')!;
    const linkedShared = {
      ...groomDetails,
      id: 'shared-caption-frame',
      label: 'Shared caption frame',
      kind: 'asset' as const,
      target: { type: 'layer' as const, id: 'caption-frame' },
      timing: { mode: 'linked' as const, trackId: groomDetails.id },
      ownership: { kind: 'shared' as const },
    };
    const sequence = {
      ...PAINTED_PROMISE_SEQUENCE,
      tracks: [...PAINTED_PROMISE_SEQUENCE.tracks, linkedShared],
    };
    const removal = removeCinematicNarrativeMoment(sequence, 'groom');
    expect(removal.sequence.tracks.find((track) => track.id === linkedShared.id)).toMatchObject({
      timing: { mode: 'independent' },
    });
  });

  it('restores a deleted shipped moment with its camera order and exclusive timeline content', () => {
    const removed = removeCinematicNarrativeMoment(PAINTED_PROMISE_SEQUENCE, 'groom').sequence;
    const restored = restoreCinematicNarrativeMoment(
      PAINTED_PROMISE_SEQUENCE, removed, 'groom',
    );
    const orderedIds = [...restored.beats]
      .sort((left, right) => left.at - right.at)
      .map((beat) => beat.id);
    expect(orderedIds.slice(2, 5)).toEqual(['dais', 'groom', 'bride']);
    expect(restored.tracks.filter((track) => track.id === 'groom-details')).toHaveLength(1);
    expect(restored.tracks.filter((track) => track.id === 'dais')).toHaveLength(1);

    const saved = JSON.parse(serializeCinematicSequence(PAINTED_PROMISE_SEQUENCE, restored));
    expect(saved.beats).not.toContainEqual({ id: 'groom', deleted: true });
    expect(saved.tracks ?? []).not.toContainEqual({ id: 'groom-details', deleted: true });
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

  it('directs slide distance on both axes and scale strength without hardcoded geometry', () => {
    const source = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!;
    const vertical = {
      ...source,
      enter: {
        kind: 'fade-slide' as const,
        easing: 'linear' as const,
        direction: 'up' as const,
        distance: 20,
      },
    };
    const verticalMidpoint = cinematicTrackPresentation(.57, vertical, [vertical]);
    expect(verticalMidpoint.opacity).toBeCloseTo(.5);
    expect(verticalMidpoint.xVw).toBe(0);
    expect(verticalMidpoint.yVh).toBeCloseTo(-10);
    expect(verticalMidpoint.scale).toBe(1);

    const scaled = {
      ...source,
      enter: { kind: 'scale' as const, easing: 'linear' as const, scale: .5 },
    };
    expect(cinematicTrackPresentation(.57, scaled, [scaled]).scale).toBeCloseTo(.75);
  });

  it('repairs unsafe transition strength while retaining valid direction settings', () => {
    const source = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!;
    const result = validateCinematicSequence({
      version: 1,
      beats: PAINTED_PROMISE_SEQUENCE.beats,
      tracks: [{
        ...source,
        enter: {
          kind: 'fade-slide', easing: 'ease-out', direction: 'down', distance: 90, scale: .01,
        },
      }],
    });
    expect(result.sequence.tracks[0].enter).toEqual({
      kind: 'fade-slide', easing: 'ease-out', direction: 'down', distance: 50, scale: .1,
    });
    expect(result.issues).toContainEqual(expect.objectContaining({ path: 'tracks.programme.enter' }));
  });

  it('drives formerly component-owned effect timing from editable sequence clips', () => {
    const tracks = PAINTED_PROMISE_SEQUENCE.tracks;
    const groomMotion = tracks.find((track) => track.id === 'groom-hand-motion')!;
    const backgroundBlur = tracks.find((track) => track.id === 'memory-background-blur')!;
    const scrollCue = tracks.find((track) => track.id === 'scroll-cue')!;
    const programmeFocus = tracks.find((track) => track.id === 'programme-focus-availability')!;

    expect(cinematicTrackPhase(.0575, groomMotion, tracks)).toBeCloseTo(.5);
    expect(cinematicTrackPhase(.115, groomMotion, tracks)).toBe(1);
    expect(cinematicTrackPhase(.9625, backgroundBlur, tracks)).toBeCloseTo(.5);
    expect(cinematicTrackPresentation(.075, scrollCue, tracks).opacity).toBeCloseTo(.5);
    expect(cinematicTrackIsActive(.71, programmeFocus, tracks)).toBe(true);
    expect(cinematicTrackIsActive(.8, programmeFocus, tracks)).toBe(false);
  });

  it('honours persisted timing edits for effect and interaction tracks', () => {
    const resolved = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, {
      [cinematicSequenceKey('t15')]: JSON.stringify({
        version: 1,
        tracks: [
          { id: 'groom-hand-motion', clip: { start: .1, enterEnd: .3, exitStart: .35, end: .4 } },
          { id: 'programme-focus-availability', clip: { start: .8, enterEnd: .8, exitStart: .9, end: .9 } },
        ],
      }),
    }).sequence;
    const groomMotion = resolved.tracks.find((track) => track.id === 'groom-hand-motion')!;
    const programmeFocus = resolved.tracks.find((track) => track.id === 'programme-focus-availability')!;

    expect(cinematicTrackPhase(.2, groomMotion, resolved.tracks)).toBeCloseTo(.5);
    expect(cinematicTrackPhase(.0575, groomMotion, resolved.tracks)).toBe(0);
    expect(cinematicTrackIsActive(.71, programmeFocus, resolved.tracks)).toBe(false);
    expect(cinematicTrackIsActive(.85, programmeFocus, resolved.tracks)).toBe(true);
  });

  it('moves linked assets with a named set while an unlinked asset keeps its own clip', () => {
    const members = [
      { id: 'groom', label: 'Seated groom', group: 'dais' as const },
      { id: 'bride', label: 'Seated bride', group: 'dais' as const },
    ];
    const created = createCinematicTimingSet(PAINTED_PROMISE_SEQUENCE.tracks, 'Portrait pair', members);
    const set = created.tracks.find((track) => track.id === created.setId)!;
    expect(set).toMatchObject({
      label: 'Portrait pair', kind: 'set', target: { type: 'set', id: created.setId },
    });
    expect(resolveCinematicLayerTiming('groom', 'dais', created.tracks).source?.id).toBe(created.setId);
    expect(resolveCinematicLayerTiming('bride', 'dais', created.tracks).source?.id).toBe(created.setId);

    const movedClip = { start: .42, enterEnd: .46, exitStart: .7, end: .76 };
    const moved = created.tracks.map((track) => track.id === created.setId
      ? { ...track, clip: movedClip }
      : track);
    const groom = moved.find((track) => track.target.type === 'layer' && track.target.id === 'groom')!;
    expect(resolveCinematicTrackClip(groom, moved)).toEqual(movedClip);

    const unlinked = unlinkCinematicLayerTiming(moved, members[1]);
    const bride = unlinked.find((track) => track.target.type === 'layer' && track.target.id === 'bride')!;
    expect(bride.timing).toEqual({ mode: 'independent' });
    const movedAgain = unlinked.map((track) => track.id === created.setId
      ? { ...track, clip: { start: .5, enterEnd: .54, exitStart: .8, end: .86 } }
      : track);
    expect(resolveCinematicTrackClip(bride, movedAgain)).toEqual(movedClip);
  });

  it('duplicates an empty reusable set and safely detaches assets when deleting their set', () => {
    const members = [
      { id: 'groom', label: 'Seated groom', group: 'dais' as const },
      { id: 'bride', label: 'Seated bride', group: 'dais' as const },
    ];
    const created = createCinematicTimingSet(PAINTED_PROMISE_SEQUENCE.tracks, 'Portrait pair', members);
    const duplicated = duplicateCinematicTimingSet(created.tracks, created.setId);
    expect(duplicated.setId).toBeDefined();
    expect(duplicated.tracks.find((track) => track.id === duplicated.setId)).toMatchObject({
      label: 'Portrait pair copy', target: { type: 'set' }, timing: { mode: 'independent' },
    });
    expect(duplicated.tracks.filter((track) =>
      track.timing.mode === 'linked' && track.timing.trackId === duplicated.setId)).toHaveLength(0);

    const effective = resolveCinematicTrackClip(
      created.tracks.find((track) => track.target.type === 'layer' && track.target.id === 'groom')!,
      created.tracks,
    );
    const deleted = deleteCinematicTimingSet(created.tracks, created.setId);
    expect(deleted.some((track) => track.id === created.setId)).toBe(false);
    for (const id of ['groom', 'bride']) {
      const layerTrack = deleted.find((track) => track.target.type === 'layer' && track.target.id === id)!;
      expect(layerTrack.timing).toEqual({ mode: 'independent' });
      expect(layerTrack.clip).toEqual(effective);
    }
  });

  it('round-trips custom timing-set targets through persisted sequence validation', () => {
    const created = createCinematicTimingSet(PAINTED_PROMISE_SEQUENCE.tracks, 'Portrait pair', [
      { id: 'groom', label: 'Seated groom', group: 'dais' },
    ]);
    const current = { ...PAINTED_PROMISE_SEQUENCE, tracks: created.tracks };
    const saved = serializeCinematicSequence(PAINTED_PROMISE_SEQUENCE, current);
    const resolved = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, {
      [cinematicSequenceKey('t15')]: saved,
    });
    expect(resolved.issues).toEqual([]);
    expect(resolved.sequence.tracks.find((track) => track.id === created.setId)?.target)
      .toEqual({ type: 'set', id: created.setId });
  });

  it('moves a complete clip without changing its transition spans or leaving the story', () => {
    const clip = { start: .2, enterEnd: .25, exitStart: .5, end: .6 };
    expect(moveCinematicClip(clip, .1)).toEqual({
      start: .3, enterEnd: .35, exitStart: .6, end: .7,
    });
    expect(moveCinematicClip(clip, .8)).toEqual({
      start: .6, enterEnd: .65, exitStart: .9, end: 1,
    });
  });

  it('snaps and describes clip positions using camera-beat language', () => {
    const beats = beatsFromSequence(PAINTED_PROMISE_SEQUENCE);
    expect(snapCinematicStoryValue(.304, beats)).toMatchObject({
      value: .31, beat: { id: 'dais' },
    });
    expect(snapCinematicStoryValue(.304, beats, .001)).toEqual({ value: .304 });
    expect(describeCinematicStoryPosition(.31, beats)).toBe('Full dais');
    expect(describeCinematicStoryPosition(.321, beats)).toBe('Full dais + 12%');
    expect(cinematicClipBeatSpan({ start: .31, enterEnd: .31, exitStart: .47, end: .47 }, beats))
      .toBeCloseTo(1.7, 1);
  });

  it('constrains invalid direct-editor values before persistence', () => {
    expect(constrainCinematicClip({ start: .8, enterEnd: .2, exitStart: 2, end: -.5 }))
      .toEqual({ start: .8, enterEnd: .8, exitStart: 1, end: 1 });
  });
});
