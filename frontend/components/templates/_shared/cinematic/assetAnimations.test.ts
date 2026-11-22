import { describe, expect, it } from 'vitest';
import { assetAnimationWindow, convertAssetAnimations, convertAssetEffect, normalizeAssetAnimations, sampleAssetAnimations, type CinematicAssetAnimation } from './assetAnimations';
import { assetClipPosition, assetPoseClip, sampleAssetKeyframes } from './assetKeyframes';
import { MOTION_DEFAULT, type CinematicEffect } from './direction';
import type { CinematicWorldLayer } from './world';
import { resolveCinematicWorld, serializeCinematicWorld, cinematicWorldKey } from './world';
import type { CinematicSequenceTrack } from './sequence';
import { updateCinematicProjectValue, resolveCinematicProjectConfig } from './project';
import { CINEMATIC_ENGINES } from './registry';
import { editCinematicSceneSets } from './sceneSetEditing';

const track: CinematicSequenceTrack = { id: 'room', label: 'Room', kind: 'set', target: { type: 'group', id: 'room' },
  timing: { mode: 'independent' }, clip: { start: .1, enterEnd: .2, exitStart: .8, end: .9 },
  enter: { kind: 'fade', easing: 'linear' }, exit: { kind: 'fade', easing: 'linear' }, ownership: { kind: 'shared' } };
const move = (id: string, start: number, end: number, x: number): CinematicAssetAnimation => ({ id, label: id, start, end, x, y: 0, scale: 1, rotate: 0, easing: 'linear', enabled: true });
const layer: CinematicWorldLayer = { id: 'board', label: 'Board', group: 'room', space: 'world', kind: 'img', src: '/board.png',
  x: 50, y: 50, w: 20, z: 1, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1 };
const at = (local: number) => .2 + local * .6;

describe('in-between asset animations', () => {
  it('chains moves continuously, holds in gaps/through exit and reverses deterministically', () => {
    const animated = { ...layer, animations: [move('left', 0, .25, -20), move('right', .5, .75, 20)] };
    expect(sampleAssetAnimations(animated, [track], .1).x).toBe(0);
    expect(sampleAssetAnimations(animated, [track], at(.125)).x).toBeCloseTo(-10);
    expect(sampleAssetAnimations(animated, [track], at(.4)).x).toBeCloseTo(-20);
    expect(sampleAssetAnimations(animated, [track], at(.625)).x).toBeCloseTo(0);
    expect(sampleAssetAnimations(animated, [track], .87).x).toBe(20);
    expect(sampleAssetAnimations(animated, [track], at(.125)).x).toBeCloseTo(-10);
  });
  it('redirects overlapping moves from the sampled current pose rather than snapping', () => {
    const animated = { ...layer, animations: [move('left', 0, .8, -20), move('right', .4, .8, 20)] };
    expect(sampleAssetAnimations(animated, [track], at(.4)).x).toBeCloseTo(-10);
    expect(sampleAssetAnimations(animated, [track], at(.6)).x).toBeCloseTo(5);
  });
  it('supports easing, scale, rotation, vertical movement, disabled moves and zero-length moves', () => {
    const animation = { ...move('zoom', 0, .5, -20), y: 10, scale: 2, rotate: 30, easing: 'ease-in' as const };
    const animated = { ...layer, animations: [animation, { ...move('disabled', .3, .4, 99), enabled: false }] };
    const sampled = sampleAssetAnimations(animated, [track], at(.25));
    for (const [key, expected] of Object.entries({ x: -2.5, y: 1.25, scale: 1.125, rotate: 3.75 })) {
      expect(sampled[key as keyof typeof sampled]).toBeCloseTo(expected);
    }
    expect(sampleAssetAnimations({ ...layer, animations: [move('cut', .2, .2, 10)] }, [track], at(.3)).x).toBe(10);
  });
  it('samples legacy moves within linked and retimed visibility windows', () => {
    const animated = { ...layer, animations: [move('left', 0, .5, -20)] };
    expect(assetAnimationWindow(animated, [track])).toMatchObject({ start: .2, end: .8 });
    const linked = { ...track, id: 'layer-timing', target: { type: 'layer' as const, id: layer.id }, timing: { mode: 'linked' as const, trackId: track.id } };
    const retimed = { ...track, clip: { start: .2, enterEnd: .4, exitStart: .9, end: 1 } };
    expect(sampleAssetAnimations(animated, [retimed, linked], .525).x).toBeCloseTo(-10);
    expect(sampleAssetAnimations(animated, [retimed, linked], .65).x).toBeCloseTo(-20);
  });
  it('converts Programme board motion with a slide entrance', () => {
    const engine = CINEMATIC_ENGINES[15];
    const board = { ...engine.world.find(({ id }) => id === 'programme-board')!,
      animations: [{ ...move('move', .21855580661005636, .46855958639267237, 50), easing: 'ease-in-out' as const }] };
    const appearance = { ...engine.sequence.tracks.find(({ id }) => id === 'programme')!,
      clip: { start: .63443, enterEnd: .685681, exitStart: .878778, end: .918978 },
      enter: { kind: 'fade-slide' as const, easing: 'ease-in' as const } };
    const points = convertAssetAnimations(board, [appearance], [board]);
    expect(points?.map(({ pose }) => pose.x)).toEqual([0, 50]);
  });
  it('persists on the layer at the selected breakpoint and deletes the last move without resurrection', () => {
    const animated = { ...layer, animations: [move('left', 0, .5, -20)] };
    let config = updateCinematicProjectValue('t15', {}, cinematicWorldKey('t15', 'mobile'), serializeCinematicWorld([layer], 'mobile', [animated]));
    let expanded = resolveCinematicProjectConfig('t15', config).config;
    expect(resolveCinematicWorld('t15', [layer], 'mobile', expanded)[0].animations).toEqual(animated.animations);
    expect(resolveCinematicWorld('t15', [layer], 'desktop', expanded)[0].animations).toBeUndefined();
    config = updateCinematicProjectValue('t15', config, cinematicWorldKey('t15', 'mobile'), serializeCinematicWorld([layer], 'mobile', [{ ...layer, animations: [] }]));
    expanded = resolveCinematicProjectConfig('t15', config).config;
    expect(resolveCinematicWorld('t15', [layer], 'mobile', expanded)[0].animations).toEqual([]);
  });
  it('repairs malformed records and ignores duplicate ids', () => {
    const normalized = normalizeAssetAnimations([null, { ...move('one', -5, 4, Infinity), scale: -1 }, move('one', 0, 1, 5)]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({ start: 0, end: 1, x: 0, scale: .05 });
    expect(normalizeAssetAnimations('bad')).toEqual([]);
  });
  it('reproduces legacy easing and holds when converting simple moves', () => {
    const animated = { ...layer, animations: [
      { ...move('out', 0, .4, 14), rotate: 8, scale: 1.2, easing: 'ease-in-out' as const },
      move('return', .6, 1, 0),
    ] };
    const points = convertAssetAnimations(animated, [track], [animated]);
    expect(points).toHaveLength(4);
    const clip = assetPoseClip(animated, [track], [animated]);
    for (const progress of [.1, .2, .25, .38, .5, .68, .8, .9]) {
      const legacy = sampleAssetAnimations(animated, [track], progress, [animated]);
      const converted = sampleAssetKeyframes(points, assetClipPosition(progress, clip))!;
      expect(converted.x).toBeCloseTo(legacy.x, 2);
      expect(converted.rotate).toBeCloseTo(legacy.rotate, 2);
      expect(converted.scale).toBeCloseTo(legacy.scale, 3);
    }
  });

  it('preserves legacy playback for overlapping moves, cuts, reception props, and spatial entrances', () => {
    const animated = { ...layer, animations: [move('one', 0, .5, 10)] };
    const overlap = { ...animated, animations: [...animated.animations, move('two', .3, .9, 20)] };
    const cut = { ...animated, animations: [move('cut', .2, .2, 10)] };
    const reception = { ...animated, behavior: 'rsvp-envelope' };
    expect(convertAssetAnimations(overlap, [track], [overlap])).toBeUndefined();
    expect(convertAssetAnimations(cut, [track], [cut])).toBeUndefined();
    expect(convertAssetAnimations(reception, [track], [reception])).toBeUndefined();
    expect(convertAssetAnimations(animated, [{ ...track, enter: { kind: 'slide', easing: 'linear' } }], [animated])).toBeUndefined();
  });

  it('transfers an aligned effect with opacity and blur and preserves independently timed effects', () => {
    const clip = { ...track, clip: { start: .1, enterEnd: .3, exitStart: .8, end: .9 } };
    const effect: CinematicEffect = { id: 'effect', label: 'Effect', enabled: true, trackId: clip.id,
      target: 'layer', targetId: layer.id, kind: 'transform', easing: 'linear',
      from: { ...MOTION_DEFAULT, xVw: -10, opacity: .2, blur: 8 },
      to: MOTION_DEFAULT, amplitudeX: 0, amplitudeY: 0, frequency: 1 };
    const points = convertAssetEffect(layer, [clip], [layer], effect);
    expect(points?.map((point) => point.at)).toEqual([0, .25]);
    const middle = sampleAssetKeyframes(points, .125);
    expect(middle).toMatchObject({ x: -5, blur: 4 });
    expect(middle?.opacity).toBeCloseTo(.6);
    expect(convertAssetEffect(layer, [clip], [layer], { ...effect, kind: 'drift' })).toBeUndefined();
    const separate = { ...clip, id: 'separate', clip: { start: .15, enterEnd: .25, exitStart: .5, end: .65 } };
    expect(convertAssetEffect(layer, [clip, separate], [layer], { ...effect, trackId: separate.id })).toBeUndefined();
  });

  it('converts the combined frame offsets of a compatible group effect', () => {
    const clip = { ...track, clip: { start: .1, enterEnd: .34567, exitStart: .8, end: .9 } };
    const effect: CinematicEffect = { id: 'group-effect', label: 'Group effect', enabled: true, trackId: clip.id,
      target: 'group', targetId: layer.id, kind: 'transform', easing: 'linear',
      from: { ...MOTION_DEFAULT, x: 45, xVw: 25, y: -30, yVh: -15 },
      to: { ...MOTION_DEFAULT, x: 76, xVw: -74 }, amplitudeX: 0, amplitudeY: 0, frequency: 1 };
    const points = convertAssetEffect(layer, [clip], [layer], effect);
    expect(points?.map(({ at, pose }) => [at, pose.x, pose.y])).toEqual([[0, 70, -45], [.3071, 2, 0]]);
    expect(convertAssetEffect(layer, [clip], [layer], { ...effect, from: { ...effect.from, x: 500 } })).toBeUndefined();
  });

  it('copies animation chains with a duplicated scene set using the new layer identity', () => {
    const engine = CINEMATIC_ENGINES[15];
    const source = engine.world.find((layer) => layer.id === 'programme-board')!;
    const animations = [move('left', 0, .5, -20)];
    let config = updateCinematicProjectValue('t15', {}, cinematicWorldKey('t15', 'mobile'), serializeCinematicWorld(engine.world, 'mobile', engine.world.map((layer) => layer.id === source.id ? { ...layer, animations } : layer)));
    config = editCinematicSceneSets(engine, config, { type: 'duplicate', id: 'programme', copyId: 'second-programme' });
    const expanded = resolveCinematicProjectConfig('t15', config).config;
    const layers = resolveCinematicWorld('t15', engine.world, 'mobile', expanded);
    const copied = layers.find((layer) => layer.id === 'second-programme-programme-board')!;
    expect(copied.animations).toEqual(animations);
    expect(sampleAssetAnimations(copied, [], .25).x).toBeCloseTo(-10);
  });
});
