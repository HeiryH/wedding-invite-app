import { describe, expect, it } from 'vitest';
import { assetAnchorLocalDelta, assetClipPosition, assetPoseBlur, moveAssetKeyframe, normalizeAssetKeyframes, openAssetKeyframeTime, rebaseAssetAnchor, resolveAssetPose, sampleAssetKeyframes, sampleTextGlitch, neutralAssetPose, supportsAssetKeyframes, type AssetKeyframe } from './assetKeyframes';
import { PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';
import { resolveCinematicProjectConfig, updateCinematicProjectValue } from './project';
import { cinematicWorldKey, resolveCinematicWorld, serializeCinematicWorld, type CinematicWorldLayer } from './world';

const points: AssetKeyframe[] = [
  { id: 'table', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 1, rotate: 0, anchor: 'table', frame: 0, paper: 0 } },
  { id: 'lift', at: .4, easing: 'hold', pose: { x: 10, y: -20, scale: 2, rotate: 15, frame: 0, paper: 0 } },
  { id: 'open', at: .8, easing: 'linear', pose: { x: 10, y: -20, scale: 2, rotate: 15, frame: 1, paper: 1 } },
];

describe('asset keyframes', () => {
  it('supports keyframes on the complete Programme board', () => {
    const board = PAINTED_PROMISE_WORLD.find(({ id }) => id === 'programme-board')!;
    expect(supportsAssetKeyframes(board)).toBe(true);
  });
  it('moves keyframes across other poses without changing their content or overwriting occupied times', () => {
    expect(moveAssetKeyframe(points, 'table', .6)?.points).toEqual([points[1], { ...points[0], at: .6 }, points[2]]);
    expect(moveAssetKeyframe(points, 'table', .4)?.at).toBe(.4001);
    expect(moveAssetKeyframe(points, 'open', .4)?.at).toBe(.3999);
    expect(moveAssetKeyframe(points, 'lift', 0)?.points).toEqual([points[0], { ...points[1], at: .0001 }, points[2]]);
    expect(openAssetKeyframeTime([{ ...points[2], at: .9999 }, { ...points[1], at: 1 }], 1, 1)).toBe(.9998);
  });

  it('resolves moving anchors, sample times, holds and exact frame endpoints', () => {
    const table = { x: -10, y: 30 };
    const anchor = () => table;
    expect(sampleAssetKeyframes(points, 0, anchor)).toEqual(points[0].pose);
    expect(resolveAssetPose(sampleAssetKeyframes(points, 0, anchor)!, anchor)).toMatchObject(table);
    expect(sampleAssetKeyframes(points, .2, anchor)).toMatchObject({ x: 0, y: 5, rotate: 7.5, scale: 1.5, frame: 0 });
    expect(sampleAssetKeyframes(points, .2, () => ({ x: -20, y: 30 }))?.x).toBe(-5);
    expect(sampleAssetKeyframes(points, .8, anchor)).toEqual(points[2].pose);
    expect(sampleAssetKeyframes(points, .7, anchor)).toEqual(points[1].pose);
    expect(sampleAssetKeyframes(points, 1, anchor)).toEqual(points[2].pose);
    expect(assetClipPosition(.4, { start: .3, end: .5 })).toBeCloseTo(.5);
    expect(assetClipPosition(.7, { start: .6, end: .8 })).toBeCloseTo(.5);
    expect(assetClipPosition(.5, { start: .5, end: .5 })).toBe(1);
  });

  it('sorts and validates saved points without merging near-identical times', () => {
    expect(normalizeAssetKeyframes([points[2], { ...points[1], at: NaN }, points[0],
      { ...points[1], at: .00001 }, { id: 'bad', at: .6, pose: {} }]))
      .toMatchObject([points[0], points[2]]);
  });

  it('follows a moving anchor without changing the framing when inheritance is toggled', () => {
    const anchor = 'point:hand:finger';
    const positionOnly = { ...neutralAssetPose, x: 4, y: 2, blur: 6, anchor } as const;
    const initial = { x: 10, y: 0, aspect: .5, transform: { scale: 1, rotate: 0 }, blur: 8 };
    const following = { ...rebaseAssetAnchor(positionOnly, initial, initial, anchor, initial.transform), anchorBlur: 1 };
    const moved = { ...initial, x: 20, transform: { scale: 2, rotate: 90 } };
    const display = resolveAssetPose(following, () => moved);
    expect(display.x).toBeCloseTo(12);
    expect(display.y).toBeCloseTo(4);
    expect(display).toMatchObject({ scale: 2, rotate: 90, blur: 6 });
    expect(assetPoseBlur(display)).toBe(10);
    expect(assetAnchorLocalDelta(following, { x: 0, y: 2 }, moved).x).toBeCloseTo(2);
    expect(resolveAssetPose(rebaseAssetAnchor(following, moved, moved, anchor, false), () => moved)).toEqual(display);
  });

  it('blends attachment across keyframes without persisting computed blur', () => {
    const frames = normalizeAssetKeyframes([
      { id: 'docked', at: 0, pose: { ...neutralAssetPose, anchor: 'layer:table', anchorBlur: 1, anchorTransform: { scale: 1, rotate: 0 } } },
      { id: 'lifted', at: 1, pose: neutralAssetPose },
    ]);
    const anchor = () => ({ x: 20, y: 0, blur: 8, transform: { scale: 3, rotate: 20 } });
    const middle = sampleAssetKeyframes(frames, .5, anchor)!;
    expect(middle).toMatchObject({ x: 10, scale: 2, rotate: 10, inheritedBlur: 4 });
    expect(normalizeAssetKeyframes([{ id: 'sample', at: .5, pose: middle }])?.[0].pose).not.toHaveProperty('inheritedBlur');
  });

  it('persists breakpoint tracks independently, with an explicit empty override and reset', () => {
    const layer: CinematicWorldLayer = { id: 'envelope', label: 'Envelope', group: 'rsvp', space: 'viewport',
      x: 50, y: 50, w: 60, rotation: 0, z: 1, flipX: false, hidden: false, locked: false, opacity: 1, keyframes: points };
    const key = cinematicWorldKey('t15', 'mobile');
    const save = (keyframes?: AssetKeyframe[]) => updateCinematicProjectValue('t15', {}, key,
      serializeCinematicWorld([layer], 'mobile', [{ ...layer, keyframes }]));
    const read = (config: Record<string, string>, breakpoint: 'mobile' | 'desktop') =>
      resolveCinematicWorld('t15', [layer], breakpoint, resolveCinematicProjectConfig('t15', config).config)[0].keyframes;
    const anchored: AssetKeyframe[] = [{ ...points[0], pose: { ...points[0].pose, anchor: 'layer:custom-cinematic-1',
      anchorBlur: 1, anchorTransform: { scale: 2, rotate: 15 } } }, ...points.slice(1)];
    expect(read(save(anchored), 'mobile')).toEqual(anchored);
    expect(read(save([]), 'mobile')).toEqual([]);
    expect(read(save([]), 'desktop')).toEqual(points);
    expect(read(save(undefined), 'mobile')).toEqual(points);
  });

  it('interpolates text effects and samples each glitch only during its authored burst', () => {
    const frames = normalizeAssetKeyframes([
      { id: 'hidden', at: .1, easing: 'linear', pose: {
        ...neutralAssetPose, textReveal: 'words', revealAmount: 0, shadowOpacity: 0, blur: 8,
        glitch: { intensity: 1, split: .5, duration: .2 },
      } },
      { id: 'visible', at: .5, easing: 'hold', pose: { ...neutralAssetPose, blur: 0 } },
    ]);
    const middle = sampleAssetKeyframes(frames, .3, undefined, { shadowOpacity: .8 });
    expect(middle?.textReveal).toBe('words');
    expect(middle?.revealAmount).toBeCloseTo(.5);
    expect(middle?.shadowOpacity).toBeCloseTo(.4);
    expect(middle?.blur).toBeCloseTo(4);
    expect(sampleAssetKeyframes(frames, .3)?.glitch).toBeUndefined();
    expect(sampleTextGlitch(frames, .099)).toBeUndefined();
    expect(sampleTextGlitch(frames, .35)).toBeUndefined();
    expect(sampleTextGlitch(frames, .2)?.glitch).toEqual({ intensity: .5, split: .5, duration: .2 });
    expect(sampleTextGlitch(frames, .1)?.glitch.intensity).toBe(1);
  });
});
