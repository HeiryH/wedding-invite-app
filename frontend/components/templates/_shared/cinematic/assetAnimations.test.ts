import { describe, expect, it } from 'vitest';
import { assetAnimationWindow, compileAssetAnimationTracks, normalizeAssetAnimations, retimeAssetAnimation, sampleAssetAnimations, type CinematicAssetAnimation } from './assetAnimations';
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
  it('projects timing within the fully-visible interval and follows linked/source retiming', () => {
    const animated = { ...layer, animations: [move('left', 0, .5, -20)] };
    expect(assetAnimationWindow(animated, [track])).toMatchObject({ start: .2, end: .8 });
    expect(compileAssetAnimationTracks([animated], [track])[0].clip).toEqual({ start: .2, enterEnd: .5, exitStart: .5, end: .5 });
    const linked = { ...track, id: 'layer-timing', target: { type: 'layer' as const, id: layer.id }, timing: { mode: 'linked' as const, trackId: track.id } };
    const retimed = { ...track, clip: { start: .2, enterEnd: .4, exitStart: .9, end: 1 } };
    expect(compileAssetAnimationTracks([animated], [retimed, linked])[0].clip.end).toBe(.65);
    expect(compileAssetAnimationTracks([animated], [{ ...track, clip: { start: .2, enterEnd: .5, exitStart: .5, end: .8 } }])).toEqual([]);
  });
  it('edits projected timeline handles without changing entrance/exit or storing a second sequence', () => {
    const animated = { ...layer, animations: [move('left', 0, .5, -20)] };
    const next = retimeAssetAnimation(animated, 'left', { start: .35, enterEnd: .65, exitStart: .65, end: .65 }, [track]);
    expect(next.animations?.[0].start).toBeCloseTo(.25); expect(next.animations?.[0].end).toBeCloseTo(.75);
    expect(track.clip).toEqual({ start: .1, enterEnd: .2, exitStart: .8, end: .9 });
    expect(compileAssetAnimationTracks([next], [track])[0].clip.end).toBeCloseTo(.65);
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
    const projected = compileAssetAnimationTracks([copied], []);
    expect(projected[0].id).toBe('asset-motion:second-programme-programme-board:left');
  });
});
