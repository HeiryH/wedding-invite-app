import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_DIRECTION as defaults } from '../../Template15-paintedpromise/data/direction';
import { PAINTED_PROMISE_SEQUENCE as sequence } from '../../Template15-paintedpromise/data/cinematic';
import { cinematicPacingNodes, mapCinematicProgress, normalizeEffect, normalizeInteraction, resolveCinematicDirection, sampleCinematicEffects, saveCinematicDirection, interactionAvailable } from './direction';
import { readCinematicProject, updateCinematicProjectValue } from './project';
import { cinematicWorldKey } from './world';
import { beatsFromSequence, resolveCinematicSequence, serializeCinematicSequence, cinematicSequenceKey } from './sequence';
import { CINEMATIC_ENGINES } from './registry';
import { editCinematicSceneSets } from './sceneSetEditing';

describe('cinematic director data', () => {
  it('upgrades the original programme camera action without changing custom actions', () => {
    const legacy = { ...defaults, interactions: [{ ...defaults.interactions[0], action: 'focus' as const,
      targetBeatId: 'programme-focus', availabilityTrackId: 'programme-focus-availability', returnMode: 'previous' as const }] };
    const config = saveCinematicDirection('t15', {}, legacy);
    expect(resolveCinematicDirection('t15', defaults, config).interactions[0]).toMatchObject({ action: 'programme', targetBeatId: '', availabilityTrackId: '', returnMode: 'stay', lockScroll: true });
    const custom = { ...legacy, interactions: [{ ...legacy.interactions[0], targetBeatId: 'groom' }] };
    expect(resolveCinematicDirection('t15', defaults, saveCinematicDirection('t15', {}, custom)).interactions[0]).toMatchObject({ action: 'focus', targetBeatId: 'groom' });
  });
  it('preserves legacy geometry and content when saving every direction section', () => {
    const legacy = { [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers: [{ id: 'groom', x: 61 }] }), 'walimah.body': '<p>Family invitation</p>' };
    const next = { ...defaults, effects: [], interactions: [], navigation: [], theme: { ...defaults.theme, accent: '#123456' } };
    const config = saveCinematicDirection('t15', legacy, next);
    const resolved = resolveCinematicDirection('t15', defaults, config);
    expect(resolved.effects).toEqual([]); expect(resolved.interactions).toEqual([]); expect(resolved.navigation).toEqual([]);
    expect(resolved.theme.accent).toBe('#123456');
    expect(config['walimah.body']).toBe(legacy['walimah.body']);
    expect(readCinematicProject('t15', config).project?.layers.mobile).toEqual({ layers: [{ id: 'groom', x: 61 }] });
  });
  it('validates finite bounds and repairs malformed definitions', () => {
    const effect = normalizeEffect({ id: 'blur', from: { scale: -5, blur: 200 }, to: { opacity: 5 }, desktop: { to: { blur: 8 } } })!;
    expect(effect.from.scale).toBe(.05); expect(effect.from.blur).toBe(40); expect(effect.to.opacity).toBe(1);
    expect(effect.desktop?.to?.blur).toBe(8); expect(normalizeEffect(null)).toBeUndefined();
    expect(normalizeInteraction({ id: 'open', action: 'script', closeMs: -1 })).toMatchObject({ action: 'info', closeMs: 0 });
  });
  it('samples transform, drift, blur and breakpoint overrides from timing tracks', () => {
    const groom = defaults.effects.find((effect) => effect.id === 'groom-hand-motion')!;
    const track = sequence.tracks.find((track) => track.id === groom.trackId)!;
    const midway = (track.clip.start + track.clip.enterEnd) / 2;
    expect(sampleCinematicEffects([groom], sequence.tracks, midway, 'mobile').layers.get(groom.targetId)?.xVw).toBeCloseTo(-24);
    const paper = defaults.effects.find((effect) => effect.id === 'rsvp-paper')!;
    const end = sequence.tracks.find((track) => track.id === paper.trackId)!.clip.enterEnd;
    expect(sampleCinematicEffects([paper], sequence.tracks, end, 'mobile').layers.get(paper.targetId)?.y).toBe(-50);
    expect(sampleCinematicEffects([paper], sequence.tracks, end, 'desktop').layers.get(paper.targetId)?.y).toBe(-18);
    expect(sampleCinematicEffects([{ ...groom, enabled: false }], sequence.tracks, midway, 'mobile').layers.size).toBe(0);
    expect(sampleCinematicEffects([{ ...groom, trackId: 'missing' }], sequence.tracks, midway, 'mobile').layers.size).toBe(0);
    expect(sampleCinematicEffects(defaults.effects, sequence.tracks, 1, 'mobile').world.blur).toBe(8);
  });
  it('keeps automatic pacing linear and maps camera holds in both directions', () => {
    const automatic = cinematicPacingNodes(sequence.beats, defaults.pacing, 'mobile', sequence.beats.length);
    expect(automatic.heightVh).toBe(1350);
    for (let at = 0; at <= 1; at += .02) expect(mapCinematicProgress(at, automatic.points)).toBeCloseTo(at);
    const held = cinematicPacingNodes(sequence.beats, { ...defaults.pacing, beats: { groom: { holdVh: 100, mobileVh: 150 } } }, 'mobile', sequence.beats.length);
    const points = held.points.filter((point) => point.story === sequence.beats.find((beat) => beat.id === 'groom')!.at);
    expect(points).toHaveLength(2);
    expect((points[1].scroll - points[0].scroll) * (held.heightVh - 100)).toBeCloseTo(100);
    expect(mapCinematicProgress((points[0].scroll + points[1].scroll) / 2, held.points)).toBe(points[0].story);
    for (const at of [.1, .6, .9]) expect(mapCinematicProgress(mapCinematicProgress(at, held.points, true), held.points)).toBeCloseTo(at);
  });
  it('does not allow actions to bypass deleted availability tracks', () => {
    const rsvp = defaults.interactions.find((record) => record.id === 'rsvp')!;
    expect(interactionAvailable(rsvp, sequence.tracks, .825)).toBe(true);
    expect(interactionAvailable(rsvp, [], .825)).toBe(false);
    expect(interactionAvailable({ ...rsvp, enabled: false }, sequence.tracks, .825)).toBe(false);
    expect(interactionAvailable({ ...rsvp, availabilityTrackId: '' }, [], .1)).toBe(true);
  });
  it('round trips beat reference replacement, removal, opacity and fit', () => {
    const edited = { ...sequence, beats: sequence.beats.map((beat, index) => index ? beat : { ...beat, referenceSrc: '', referenceOpacity: .2, referenceFit: 'cover' as const }) };
    const config = { [cinematicSequenceKey('t15')]: serializeCinematicSequence(sequence, edited) };
    const result = beatsFromSequence(resolveCinematicSequence('t15', sequence, config).sequence)[0];
    expect(result).toMatchObject({ referenceSrc: '', referenceOpacity: .2, referenceFit: 'cover' });
  });
  it('duplicates functional actions, paper effects and narrative timing on both breakpoints', () => {
    const engine = CINEMATIC_ENGINES[15];
    const duplicated = editCinematicSceneSets(engine, {}, { type: 'duplicate', id: 'rsvp', copyId: 'second-rsvp' });
    const direction = resolveCinematicDirection('t15', defaults, duplicated);
    expect(direction.interactions.find((record) => record.triggerLayerId === 'second-rsvp-rsvp-letter')?.action).toBe('rsvp');
    expect(direction.effects.some((effect) => effect.targetId === 'second-rsvp-rsvp-letter:content')).toBe(true);
    const narrative = editCinematicSceneSets(engine, {}, { type: 'duplicate', id: 'narrative', copyId: 'second-copy' });
    const project = readCinematicProject('t15', narrative).project!;
    expect(JSON.stringify(project.layers.mobile)).toContain('second-copy-walimah-copy');
    expect(JSON.stringify(project.sequence)).toContain('second-copy-walimah-copy');
  });
  it('disables deleted trigger actions while preserving actions on moved props', () => {
    const engine = CINEMATIC_ENGINES[15];
    const deleted = resolveCinematicDirection('t15', defaults, editCinematicSceneSets(engine, {}, { type: 'delete', id: 'rsvp' }));
    expect(deleted.interactions.find((record) => record.id === 'rsvp')?.enabled).toBe(false);
    expect(deleted.effects.some((effect) => effect.targetId === 'rsvp-letter:content')).toBe(false);
    const moved = resolveCinematicDirection('t15', defaults, editCinematicSceneSets(engine, {}, { type: 'delete', id: 'rsvp', moveTo: 'table' }));
    expect(moved.interactions.find((record) => record.id === 'rsvp')?.enabled).toBe(true);
  });
  it('keeps direction edits when a subsequent track edit updates the same project', () => {
    let config = saveCinematicDirection('t15', {}, { ...defaults, effects: [] });
    config = updateCinematicProjectValue('t15', config, cinematicSequenceKey('t15'), JSON.stringify({ version: 1, tracks: [{ id: 'rsvp', label: 'Response' }] }));
    expect(resolveCinematicDirection('t15', defaults, config).effects).toEqual([]);
    expect(JSON.stringify(readCinematicProject('t15', config).project?.sequence)).toContain('Response');
  });
});
