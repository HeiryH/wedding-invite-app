import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAINTED_PROMISE_BEATS, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_VISIBILITY, PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';
import { resolveCinematicWorld } from './world';
import CinematicAdjustPanel from './CinematicAdjustPanel';

describe('CinematicAdjustPanel', () => {
  it('selects director beats and exposes the editor-only reference controls', () => {
    const onSelectBeat = vi.fn();
    const onModeChange = vi.fn();
    const onReferenceVisibleChange = vi.fn();

    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="ring"
        progress={0.08}
        mode="scene"
        referenceVisible
        referenceOpacity={0.45}
        layers={[]}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        onSelectBeat={onSelectBeat}
        onProgressChange={vi.fn()}
        onModeChange={onModeChange}
        onReferenceVisibleChange={onReferenceVisibleChange}
        onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()}
        onLayersChange={vi.fn()}
        onResetLayer={vi.fn()}
        onResetWorld={vi.fn()}
        onCameraChange={vi.fn()}
        onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()}
        onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Cinematic · mobile')).toBeInTheDocument();
    expect(screen.getAllByText(/%$/)).toHaveLength(PAINTED_PROMISE_BEATS.length + 1);

    fireEvent.click(screen.getByRole('button', { name: /Groom close-up/ }));
    expect(onSelectBeat).toHaveBeenCalledWith('groom');

    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(onModeChange).toHaveBeenCalledWith('camera-compose');

    fireEvent.click(screen.getByRole('button', { name: 'Visible' }));
    expect(onReferenceVisibleChange).toHaveBeenCalledWith(false);
  });

  it('edits and resets the selected camera beat', () => {
    const onCameraChange = vi.fn();
    const onResetCamera = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="groom"
        progress={0.4}
        mode="camera-beat"
        referenceVisible={false}
        referenceOpacity={0.45}
        layers={[]}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        camera={{ id: 'groom', x: 28, y: 2, scale: 2.35, rotate: 0 }}
        onSelectBeat={vi.fn()}
        onProgressChange={vi.fn()}
        onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()}
        onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()}
        onLayersChange={vi.fn()}
        onResetLayer={vi.fn()}
        onResetWorld={vi.fn()}
        onCameraChange={onCameraChange}
        onResetCamera={onResetCamera}
        onCopyCameraToOther={vi.fn()}
        onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '35' } });
    expect(onCameraChange).toHaveBeenCalledWith({ x: 35 });
    fireEvent.click(screen.getByRole('button', { name: 'Reset camera' }));
    expect(onResetCamera).toHaveBeenCalledOnce();
  });

  it('keeps composition exploratory until Set as beat is clicked', () => {
    const onCreateBeat = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="groom" progress={0.46}
        mode="camera-compose" referenceVisible={false} referenceOpacity={0.45}
        layers={[]} shippedLayerIds={[]} visibilitySets={PAINTED_PROMISE_VISIBILITY}
        camera={{ x: 18, y: -2, scale: 1.7, rotate: 0 }}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onCreateBeat={onCreateBeat}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Nothing is committed/)).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('New camera beat'), { target: { value: 'Parents reveal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set as beat' }));
    expect(onCreateBeat).toHaveBeenCalledWith('Parents reveal');
  });

  it('edits a beat transition and exposes beat-level actions', () => {
    const onTransitionChange = vi.fn();
    const onDuplicateBeat = vi.fn();
    const onDeleteBeat = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="groom" progress={0.4}
        mode="camera-beat" referenceVisible={false} referenceOpacity={0.45}
        layers={[]} shippedLayerIds={[]} shippedBeatIds={PAINTED_PROMISE_BEATS.map((beat) => beat.id)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        camera={{ x: 28, y: 2, scale: 2.35, rotate: 0 }}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onDuplicateBeat={onDuplicateBeat} onDeleteBeat={onDeleteBeat}
        onTransitionChange={onTransitionChange} onResetBeat={vi.fn()}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Ease out'), { target: { value: 'hold' } });
    expect(onTransitionChange).toHaveBeenCalledWith('groom', 'hold');
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate beat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete moment' }));
    expect(screen.getByRole('alert')).toHaveTextContent('1 owned timeline item');
    expect(onDeleteBeat).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete moment' }));
    expect(onDuplicateBeat).toHaveBeenCalledWith('groom');
    expect(onDeleteBeat).toHaveBeenCalledWith('groom');
  });

  it('makes inherited set timing independent from layer geometry', () => {
    const onMakeTimingIndependent = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="programme-wide"
        progress={0.62}
        mode="scene"
        referenceVisible={false}
        referenceOpacity={0.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        selectedLayer="programme-board"
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        onSelectBeat={vi.fn()}
        onProgressChange={vi.fn()}
        onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()}
        onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()}
        onLayersChange={vi.fn()}
        onResetLayer={vi.fn()}
        onResetWorld={vi.fn()}
        onCameraChange={vi.fn()}
        onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()}
        onVisibilityChange={vi.fn()}
        onMakeTimingIndependent={onMakeTimingIndependent}
        onResetVisibility={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Following Programme board/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit separately' }));
    expect(onMakeTimingIndependent).toHaveBeenCalledWith('programme-board');
  });

  it('edits exact asset timing with percentage fields instead of ambiguous sliders', () => {
    const onTimingTrackChange = vi.fn();
    const programme = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!;
    const exact = { ...programme, id: 'layer-programme-board', label: 'Programme artwork',
      target: { type: 'layer' as const, id: 'programme-board' } };
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="programme-wide"
        progress={.62} mode="scene" referenceVisible={false} referenceOpacity={.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        selectedLayer="programme-board" visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={[...PAINTED_PROMISE_SEQUENCE.tracks, exact]}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onTimingTrackChange={onTimingTrackChange}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText(/In start/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', { name: /Starts/ }), { target: { value: '56' } });
    expect(onTimingTrackChange).toHaveBeenCalledWith('layer-programme-board', {
      clip: expect.objectContaining({ start: .56 }),
    });
  });

  it('organizes props into sets, reveals an off-beat prop, and resets only that prop', () => {
    const onSelectLayer = vi.fn();
    const onProgressChange = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="ring"
        progress={0.08}
        mode="scene"
        referenceVisible={false}
        referenceOpacity={0.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        onSelectBeat={vi.fn()}
        onProgressChange={onProgressChange}
        onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()}
        onReferenceOpacityChange={vi.fn()}
        onSelectLayer={onSelectLayer}
        onLayersChange={vi.fn()}
        onResetLayer={vi.fn()}
        onResetWorld={vi.fn()}
        onCameraChange={vi.fn()}
        onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()}
        onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Welcome ring action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Groom hand · dark formal cuff' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bride hand · white bridal lace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wedding ring' })).toBeInTheDocument();
    expect(screen.getByText('Programme')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Programme board' }));
    expect(onSelectLayer).toHaveBeenCalledWith('programme-board');
    expect(onProgressChange).toHaveBeenCalledWith((.59 + .745) / 2);
  });

  it('deselects a selected scene layer on the second click', () => {
    const onSelectLayer = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="programme-wide"
        progress={0.62}
        mode="scene"
        referenceVisible={false}
        referenceOpacity={0.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        selectedLayer="programme-board"
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={onSelectLayer} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Appearance timing')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Programme board' }));
    expect(onSelectLayer).toHaveBeenCalledWith(undefined);
  });

  it('adds a token-aware text layer through the floating Add card', () => {
    const onLayersChange = vi.fn();
    const onSelectLayer = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="ring"
        progress={0.08}
        mode="scene"
        referenceVisible={false}
        referenceOpacity={0.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={onSelectLayer} onLayersChange={onLayersChange} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add to scene' }));
    expect(screen.getByText('Literal copy or a dynamic token')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Text/ }));
    expect(onLayersChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ kind: 'text', group: 'welcome', space: 'viewport', text: 'Your text here' }),
    ]));
    expect(onSelectLayer).toHaveBeenCalledWith(expect.stringMatching(/^custom-cinematic-/));
  });

  it('places an uploaded dais behind the current set and can bring a subject directly to front', () => {
    const onLayersChange = vi.fn();
    const base = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined);
    const uploaded = {
      id: 'custom-cinematic-dais', label: 'Uploaded dais', group: 'custom' as const,
      space: 'world' as const, kind: 'img' as const, src: '/uploads/dais.png',
      x: 50, y: 50, w: 90, h: 70, z: 50, rotation: 0, flipX: false,
      hidden: false, locked: false, opacity: 1, fit: 'contain' as const,
    };
    const common = {
      beats: PAINTED_PROMISE_BEATS, breakpoint: 'mobile' as const, selectedBeat: 'groom',
      progress: 0.4, mode: 'scene' as const, referenceVisible: false, referenceOpacity: 0.45,
      visibilitySets: PAINTED_PROMISE_VISIBILITY,
      shippedLayerIds: PAINTED_PROMISE_WORLD.map((layer) => layer.id),
      onSelectBeat: vi.fn(), onProgressChange: vi.fn(), onModeChange: vi.fn(),
      onReferenceVisibleChange: vi.fn(), onReferenceOpacityChange: vi.fn(),
      onSelectLayer: vi.fn(), onResetLayer: vi.fn(), onResetWorld: vi.fn(),
      onCameraChange: vi.fn(), onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(),
      onVisibilityChange: vi.fn(), onResetVisibility: vi.fn(), onClose: vi.fn(),
    };
    const view = render(
      <CinematicAdjustPanel {...common} layers={[...base, uploaded]}
        selectedLayer={uploaded.id} onLayersChange={onLayersChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Place behind current set' }));
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: uploaded.id, group: 'dais', space: 'world', z: 4 }),
    ]));

    view.rerender(
      <CinematicAdjustPanel {...common} layers={[...base, uploaded]}
        selectedLayer="groom" onLayersChange={onLayersChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bring to front' }));
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'groom', z: 51 }),
    ]));
  });
});
