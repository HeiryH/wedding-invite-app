import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DirectorSettings from './DirectorSettings';
import CinematicSceneLayer from './CinematicSceneLayer';
import { PAINTED_PROMISE_DIRECTION as direction } from '../../Template15-paintedpromise/data/direction';
import { PAINTED_PROMISE_SEQUENCE as sequence, PAINTED_PROMISE_WORLD as layers } from '../../Template15-paintedpromise/data/cinematic';
import { sampleCinematicEffects, saveCinematicDirection, resolveCinematicDirection } from './direction';

describe('layer effects and canvas poses', () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
  const effect = direction.effects.find((item) => item.id === 'ring-motion')!;
  const ring = layers.find((item) => item.id === effect.targetId)!;
  const props = { value: direction, onChange: vi.fn(), breakpoint: 'mobile' as const, layers, sets: [], beats: sequence.beats,
    tracks: sequence.tracks, onPreview: vi.fn(), onAddEffectTrack: vi.fn(), standalone: true };

  it('shows only the selected layer effects, with explicit pose controls', () => {
    const edit = vi.fn(), change = vi.fn();
    render(<DirectorSettings {...props} effectScope={ring.id} onEditPose={edit} onChange={change} pose={{ effectId: effect.id, side: 'from' }} />);
    const options = within(screen.getByLabelText('Effect')).getAllByRole('option').map((node) => node.textContent);
    expect(options).toEqual(['Select effect', 'Ring fitting']);
    expect(screen.queryByRole('tablist', { name: 'Story settings' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit To on canvas' }));
    expect(edit).toHaveBeenLastCalledWith({ effectId: effect.id, side: 'to' });
    fireEvent.change(screen.getByLabelText('xVw from'), { target: { value: '20' } });
    expect(change.mock.calls.at(-1)![0].effects.find((item: { id: string }) => item.id === effect.id).from.xVw).toBe(20);
    fireEvent.click(screen.getByRole('button', { name: 'Done editing pose' }));
    expect(edit).toHaveBeenLastCalledWith();
  });

  it('adds a layer-owned effect and its dedicated timing track', () => {
    const change = vi.fn(), addTrack = vi.fn();
    render(<DirectorSettings {...props} effectScope={ring.id} onChange={change} onAddEffectTrack={addTrack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add layer effect' }));
    const added = change.mock.calls.at(-1)![0].effects.at(-1);
    expect(added).toMatchObject({ target: 'layer', targetId: ring.id, trackId: added.id });
    expect(addTrack).toHaveBeenCalledWith(added.id, added.label);
  });

  it('writes desktop endpoints without overwriting shared movement', () => {
    const change = vi.fn();
    render(<DirectorSettings {...props} breakpoint="desktop" effectScope={ring.id} onChange={change} />);
    fireEvent.change(screen.getByLabelText('xVw from'), { target: { value: '24' } });
    const edited = change.mock.calls.at(-1)![0].effects.find((item: { id: string }) => item.id === effect.id);
    expect(edited.from.xVw).toBe(8);
    expect(edited.desktop.from.xVw).toBe(24);
  });

  it('keeps layer movements out of Advanced and preserves legacy content effects', () => {
    render(<DirectorSettings {...props} effectScope="__world" />);
    const options = within(screen.getByLabelText('Effect')).getAllByRole('option').map((node) => node.textContent);
    expect(options).not.toContain('Ring fitting');
    expect(options).toContain('Memory background blur');
    expect(options).toContain('RSVP paper lift');
  });

  it('samples exactly the chosen endpoint without changing normal guest playback', () => {
    expect(sampleCinematicEffects([effect], sequence.tracks, .05, 'mobile', { effectId: effect.id, side: 'from' }).layers.get(ring.id)).toMatchObject(effect.from);
    expect(sampleCinematicEffects([effect], sequence.tracks, .05, 'mobile', { effectId: effect.id, side: 'to' }).layers.get(ring.id)).toMatchObject(effect.to);
    const config = saveCinematicDirection('t15', {}, { ...direction, effects: direction.effects.map((item) => item.id === effect.id
      ? { ...item, desktop: { from: { ...item.from, xVw: 32 } } } : item) });
    const saved = resolveCinematicDirection('t15', direction, config);
    expect(sampleCinematicEffects(saved.effects, sequence.tracks, 0, 'desktop').layers.get(ring.id)?.xVw).toBe(32);
    expect(sampleCinematicEffects(saved.effects, sequence.tracks, 0, 'mobile').layers.get(ring.id)?.xVw).toBe(8);
    expect(sampleCinematicEffects([effect], sequence.tracks, .05, 'mobile').layers.get(ring.id)?.xVw).not.toBe(8);
  });

  it('routes pose nudges to the effect, not base layout, even at a faded endpoint', () => {
    const post = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
    const { rerender } = render(<CinematicSceneLayer layer={ring} visibility={0} editor={{ enabled: true, breakpoint: 'mobile', selectedLayer: ring.id,
      cinematic: { mode: 'scene', progress: 0, effectPose: { effectId: effect.id, layerId: ring.id, side: 'from', motion: effect.from } } }}
      boxClassName="box" imageClassName="image" selectedClassName="selected" resizeHandleClassName="handle" />);
    const artwork = screen.getByRole('button', { name: 'Edit Wedding ring' });
    fireEvent.keyDown(artwork, { key: 'ArrowRight' });
    expect(post).toHaveBeenLastCalledWith({ type: 'PREVIEW_CINEMATIC_EFFECT_POSE_EDIT', effectId: effect.id, layerId: ring.id, side: 'from', patch: { xVw: 8.5, yVh: 7 } }, window.location.origin);
    fireEvent.click(artwork);
    expect(post).toHaveBeenCalledTimes(1);
    rerender(<CinematicSceneLayer layer={ring} editor={{ enabled: true, breakpoint: 'mobile', selectedLayer: ring.id, cinematic: { mode: 'scene', progress: .1 } }}
      boxClassName="box" imageClassName="image" selectedClassName="selected" resizeHandleClassName="handle" />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit Wedding ring' }), { key: 'ArrowRight' });
    expect(post).toHaveBeenLastCalledWith({ type: 'PREVIEW_CINEMATIC_LAYER_EDIT', layerId: ring.id, patch: { x: ring.x + .5 } }, window.location.origin);
  });
});
