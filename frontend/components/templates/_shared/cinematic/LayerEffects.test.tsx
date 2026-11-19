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
    tracks: sequence.tracks, onPreview: vi.fn(), standalone: true };

  it('manages saved layer effects without editing their poses', () => {
    const change = vi.fn();
    render(<DirectorSettings {...props} effectScope={ring.id} onChange={change} />);
    const options = within(screen.getByLabelText('Effect')).getAllByRole('option').map((node) => node.textContent);
    expect(options).toEqual(['Select effect', 'Ring fitting']);
    expect(screen.queryByRole('tablist', { name: 'Story settings' })).not.toBeInTheDocument();
    expect(screen.getByText('Use Animate asset to edit motion.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit .* on canvas|add layer effect|add drift/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Effect easing')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }));
    expect(change.mock.calls.at(-1)![0].effects.find((item: { id: string }) => item.id === effect.id))
      .toEqual({ ...effect, enabled: false });
  });

  it('can disable a saved effect on desktop while retaining shared movement', () => {
    const change = vi.fn();
    render(<DirectorSettings {...props} breakpoint="desktop" effectScope={ring.id} onChange={change} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }));
    const edited = change.mock.calls.at(-1)![0].effects.find((item: { id: string }) => item.id === effect.id);
    expect(edited).toEqual({ ...effect, desktop: { ...effect.desktop, enabled: false } });
  });

  it('keeps layer movements out of Advanced and preserves legacy content effects', () => {
    render(<DirectorSettings {...props} effectScope="__world" />);
    const options = within(screen.getByLabelText('Effect')).getAllByRole('option').map((node) => node.textContent);
    expect(options).not.toContain('Ring fitting');
    expect(options).toContain('Memory background blur');
    expect(options).toContain('RSVP paper lift');
    const panel = within(screen.getByRole('tabpanel', { name: 'Effects' }));
    expect(panel.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(panel.queryByRole('button', { name: 'Add effect' })).not.toBeInTheDocument();
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

  it('routes a group member’s canvas pose controls to the group effect', () => {
    const post = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
    const targetId = 'layer-group:dais:portraits';
    const groupEffect = { ...effect, target: 'group' as const, targetId };
    const pose = { effectId: effect.id, layerId: targetId, side: 'to' as const, motion: effect.to, memberIds: [ring.id, 'other'] };
    const sampled = sampleCinematicEffects([groupEffect], sequence.tracks, 0, 'mobile', pose);
    expect(sampled.groups.get(targetId)).toMatchObject(effect.to);
    expect(sampled.layers.size).toBe(0);
    render(<CinematicSceneLayer layer={ring} visibility={0} editor={{ enabled: true, breakpoint: 'mobile',
      cinematic: { mode: 'scene', progress: 0, effectPose: pose } }}
      boxClassName="box" imageClassName="image" selectedClassName="selected" resizeHandleClassName="handle" />);
    const member = screen.getByRole('button', { name: 'Edit Wedding ring' });
    fireEvent.click(member);
    fireEvent.keyDown(member, { key: 'ArrowRight' });
    expect(post).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      type: 'PREVIEW_CINEMATIC_EFFECT_POSE_EDIT', layerId: targetId, side: 'to',
      patch: { xVw: effect.to.xVw + .5, yVh: effect.to.yVh },
    }), window.location.origin);
    post.mockRestore();
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
