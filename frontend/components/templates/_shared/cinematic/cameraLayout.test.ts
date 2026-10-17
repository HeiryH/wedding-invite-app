import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_BEATS, PAINTED_PROMISE_CAMERA } from '../../Template15-paintedpromise/data/cinematic';
import { baseBeatCameras, cinematicCameraKey, resolveCinematicCamera, serializeCinematicCamera } from './cameraLayout';
import { sampleCamera } from './useCinematicScroll';

describe('cinematic camera layout', () => {
  it('keeps the shipped timeline byte-for-byte when no beat is edited', () => {
    const resolved = resolveCinematicCamera(
      't15', PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, 'mobile', undefined,
    );
    expect(resolved.timeline).toBe(PAINTED_PROMISE_CAMERA);
  });

  it('uses shipped desktop framing without changing the mobile camera', () => {
    const mobile = resolveCinematicCamera(
      't15', PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, 'mobile', undefined,
    );
    const desktop = resolveCinematicCamera(
      't15', PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, 'desktop', undefined,
    );
    expect(mobile.timeline.find((frame) => frame.at === .71)?.x).toBe(-8);
    expect(desktop.timeline.find((frame) => frame.at === .71)?.x).toBe(-44);
  });

  it('compiles an edited camera path from named beats without hidden shipped points', () => {
    const key = cinematicCameraKey('t15', 'mobile');
    const resolved = resolveCinematicCamera(
      't15', PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, 'mobile', {
        [key]: JSON.stringify({ frames: [{ id: 'groom', x: 42, scale: 2.8 }] }),
      },
    );
    expect(resolved.beatCameras.find((camera) => camera.id === 'groom')).toMatchObject({ x: 42, scale: 2.8 });
    expect(resolved.timeline.find((frame) => frame.at === 0.4)).toMatchObject({ x: 42, scale: 2.8 });
    expect(resolved.timeline.some((frame) => frame.at === .59)).toBe(false);
    expect(resolved.timeline.filter((frame) => frame.at > 0 && frame.at < 1).map((frame) => frame.at))
      .toEqual(PAINTED_PROMISE_BEATS.map((beat) => beat.progress));
  });

  it('prevents a hidden shipped keyframe from reversing the dais-to-programme zoom', () => {
    const key = cinematicCameraKey('t15', 'mobile');
    const resolved = resolveCinematicCamera(
      't15', PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, 'mobile', {
        [key]: JSON.stringify({ frames: [
          { id: 'dais-return', scale: .3 },
          { id: 'programme-wide', x: -15, y: -23.5, scale: .37 },
        ] }),
      },
    );
    const segment = resolved.timeline.filter((frame) => frame.at >= .585 && frame.at <= .62);
    expect(segment.map((frame) => ({ at: frame.at, scale: frame.scale }))).toEqual([
      { at: .585, scale: .3 },
      { at: .62, scale: .37 },
    ]);
    const middle = sampleCamera(.59, resolved.timeline).scale;
    expect(middle).toBeGreaterThan(.3);
    expect(middle).toBeLessThan(.37);
  });

  it('serializes only changed camera properties and resets cleanly', () => {
    const cameras = baseBeatCameras(PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS);
    const changed = cameras.map((camera) => camera.id === 'bride' ? { ...camera, rotate: 1.5 } : camera);
    expect(JSON.parse(serializeCinematicCamera(PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, changed)))
      .toEqual({ frames: [{ id: 'bride', rotate: 1.5 }] });
    expect(serializeCinematicCamera(PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, cameras)).toBe('');
  });

  it('turns a beat transition choice into an actual camera keyframe', () => {
    const beats = PAINTED_PROMISE_BEATS.map((beat) =>
      beat.id === 'groom' ? { ...beat, transitionIn: 'linear' as const } : beat);
    const resolved = resolveCinematicCamera('t15', PAINTED_PROMISE_CAMERA, beats, 'mobile', undefined);
    expect(resolved.timeline.find((frame) => frame.at === .4)?.transitionIn).toBe('linear');
  });

  it('repairs out-of-range or malformed saved camera geometry', () => {
    const config = {
      [cinematicCameraKey('t15', 'mobile')]: JSON.stringify({ frames: [
        { id: 'groom', x: 180, y: -220, scale: 10, rotate: -90 },
        { id: 'bride', scale: 'huge' },
        { nope: true },
      ] }),
    };
    const resolved = resolveCinematicCamera(
      't15', PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_BEATS, 'mobile', config,
    );
    expect(resolved.beatCameras.find((camera) => camera.id === 'groom')).toMatchObject({
      x: 100, y: -100, scale: 4, rotate: -15,
    });
    expect(resolved.beatCameras.find((camera) => camera.id === 'bride')?.scale).toBe(2.35);
  });

  it('samples linear, eased, cut and held transitions differently', () => {
    const from = { at: 0, x: 0, y: 0, scale: 1, rotate: 0 };
    const target = { at: 1, x: 100, y: 0, scale: 2, rotate: 0 };
    expect(sampleCamera(.5, [from, { ...target, transitionIn: 'linear' }]).x).toBe(50);
    expect(sampleCamera(.5, [from, { ...target, transitionIn: 'ease-in' }]).x).toBe(12.5);
    expect(sampleCamera(.5, [from, { ...target, transitionIn: 'cut' }]).x).toBe(0);
    expect(sampleCamera(.5, [from, { ...target, transitionIn: 'hold' }]).x).toBe(0);
  });
});
