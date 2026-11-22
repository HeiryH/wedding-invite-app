import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAINTED_PROMISE_BEATS, PAINTED_PROMISE_SCENE_SETS, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_VISIBILITY, PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';
import { resolveCinematicWorld } from './world';
import AdjustPanel from './CinematicAdjustPanel';
import type { ComponentProps } from 'react';
import { PAINTED_PROMISE_DIRECTION } from '../../Template15-paintedpromise/data/direction';

const CinematicAdjustPanel = (props: ComponentProps<typeof AdjustPanel>) =>
  <AdjustPanel sceneSets={PAINTED_PROMISE_SCENE_SETS} {...props} />;

describe('CinematicAdjustPanel', () => {
  beforeEach(() => localStorage.clear());
  it('opens and closes scene set properties beside the preview', () => {
    const onSceneSetAction = vi.fn();
    const props: ComponentProps<typeof AdjustPanel> = {
      beats: PAINTED_PROMISE_BEATS, selectedBeat: 'ring', breakpoint: 'mobile', mode: 'scene', progress: 0,
      layers: PAINTED_PROMISE_WORLD, shippedLayerIds: [], visibilitySets: PAINTED_PROMISE_VISIBILITY,
      tracks: PAINTED_PROMISE_SEQUENCE.tracks, onSceneSetAction, onSelectBeat: vi.fn(), onProgressChange: vi.fn(),
      onModeChange: vi.fn(), onSelectLayer: vi.fn(), onLayersChange: vi.fn(), onResetLayer: vi.fn(),
      onResetWorld: vi.fn(), onCameraChange: vi.fn(), onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(),
      onVisibilityChange: vi.fn(), onResetVisibility: vi.fn(), onClose: vi.fn(),
    };
    const { rerender } = render(<CinematicAdjustPanel {...props} />);
    const manager = within(screen.getByRole('region', { name: 'Scene set manager' }));
    fireEvent.click(manager.getByRole('button', { name: 'Expand scene sets' }));
    fireEvent.click(manager.getByRole('button', { name: 'Manage Cloud backdrop' }));
    const floating = within(screen.getByLabelText('Floating adjustment window'));
    expect(floating.getByRole('region', { name: 'Scene set properties Cloud backdrop' })).toBeVisible();
    expect(manager.queryByRole('region', { name: 'Scene set properties Cloud backdrop' })).toBeNull();

    fireEvent.click(manager.getByRole('button', { name: 'Manage Programme' }));
    const properties = within(floating.getByRole('region', { name: 'Scene set properties Programme' }));
    fireEvent.blur(properties.getByRole('textbox', { name: 'Name' }), { target: { value: 'Order of events' } });
    expect(onSceneSetAction).toHaveBeenCalledWith({ type: 'patch', id: 'programme', patch: { label: 'Order of events' } });
    fireEvent.click(properties.getByRole('button', { name: 'Close scene set properties' }));
    expect(screen.queryByLabelText('Floating adjustment window')).toBeNull();

    fireEvent.click(manager.getByRole('button', { name: 'Manage Programme' }));
    rerender(<CinematicAdjustPanel {...props} selectedLayer="groom" />);
    expect(screen.queryByRole('region', { name: 'Scene set properties Programme' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Object inspector' })).toBeVisible();
  });

  it('opens the group animator and keeps legacy effect pose controls out of the inspector', () => {
    const onSceneSetAction = vi.fn();
    const onAnimateLayer = vi.fn();
    const onProgressChange = vi.fn();
    const source = PAINTED_PROMISE_DIRECTION.effects[0];
    const effect = { ...source, target: 'group' as const, targetId: 'layer-group:dais:portraits', trackId: 'dais' };
    render(<CinematicAdjustPanel beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="dais"
      progress={.31} mode="scene" layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', {})}
      sceneSets={PAINTED_PROMISE_SCENE_SETS.map((set) => set.id === 'dais' ? { ...set,
        layerGroups: { mobile: [{ id: 'portraits', label: 'Portraits', memberIds: ['bride', 'groom'] }] },
      } : set)} onSceneSetAction={onSceneSetAction}
      direction={{ ...PAINTED_PROMISE_DIRECTION, effects: [effect] }} onDirectionChange={vi.fn()}
      canAnimateLayer={() => true} onAnimateLayer={onAnimateLayer}
      shippedLayerIds={[]} visibilitySets={PAINTED_PROMISE_VISIBILITY} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
      onSelectBeat={vi.fn()} onProgressChange={onProgressChange} onModeChange={vi.fn()}
      onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()} onResetWorld={vi.fn()}
      onCameraChange={vi.fn()} onResetCamera={vi.fn()} onCopyCameraToOther={vi.fn()}
      onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()} />);
    const groomRow = screen.getByRole('button', { name: /^Seated groom/ }).closest('[data-scene-layer]')!;
    const daisSection = groomRow.closest('section')!;
    const dais = within(daisSection as HTMLElement);
    expect(dais.getByRole('button', { name: 'Seek to Portraits' })).toBeEnabled();
    fireEvent.click(dais.getByRole('button', { name: 'Hide Portraits' }));
    expect(onSceneSetAction).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'patch-layer-group', groupId: 'portraits', patch: { hidden: true },
    }));
    fireEvent.click(dais.getByRole('button', { name: 'Seek to Seated groom' }));
    expect(onProgressChange).toHaveBeenLastCalledWith(expect.closeTo(.425));
    fireEvent.click(dais.getByRole('button', { name: 'Collapse Bridal dais' }));
    expect(dais.queryByRole('button', { name: 'Seek to Seated groom' })).toBeNull();
    fireEvent.click(dais.getByRole('button', { name: 'Actions for Bridal dais' }));
    fireEvent.click(dais.getByRole('button', { name: 'New group' }));
    expect(dais.getByRole('button', { name: 'Collapse Bridal dais' })).toHaveAttribute('aria-expanded', 'true');
    const chairRow = dais.getByRole('button', { name: /^Groom chair/ }).closest('[data-scene-layer]')!;
    const chairCheckbox = within(chairRow as HTMLElement).getByRole('checkbox', { name: 'Include Groom chair in group' });
    fireEvent.click(chairCheckbox);
    expect(chairCheckbox).toBeChecked();
    expect(within(groomRow as HTMLElement).queryByRole('checkbox')).toBeNull();
    fireEvent.click(dais.getByRole('button', { name: 'Cancel' }));
    expect(screen.getAllByRole('button', { name: /^Seated groom/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Portraits' }));
    expect(screen.queryByRole('button', { name: /^Seated groom/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Portraits' }));
    expect(screen.getByRole('button', { name: /^Seated groom/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /^Portraits/ }));
    const inspector = within(screen.getByRole('region', { name: 'Group inspector' }));
    expect(inspector.queryByRole('tab', { name: 'Style' })).toBeNull();
    fireEvent.change(inspector.getByRole('spinbutton', { name: 'Scale %' }), { target: { value: '125' } });
    expect(onSceneSetAction).toHaveBeenLastCalledWith({
      type: 'patch-layer-group', id: 'dais', breakpoint: 'mobile', groupId: 'portraits', patch: { scale: 1.25 },
    });
    fireEvent.click(inspector.getByRole('tab', { name: 'Animation' }));
    fireEvent.click(inspector.getByRole('button', { name: 'Animate group' }));
    expect(onAnimateLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'layer-group:dais:portraits' }));
    fireEvent.click(inspector.getByText('Legacy group effects', { exact: true }));
    expect(inspector.getByRole('checkbox', { name: 'Enabled' })).toBeChecked();
    expect(inspector.queryByRole('button', { name: 'Add group effect' })).toBeNull();
    expect(inspector.queryByRole('spinbutton', { name: 'xVw from' })).toBeNull();
    expect(inspector.queryByRole('button', { name: /Edit (From|To) on canvas/ })).toBeNull();
    fireEvent.click(inspector.getByRole('button', { name: 'Close group inspector' }));
    expect(screen.queryByRole('region', { name: 'Group inspector' })).toBeNull();
  });

  it('locks the current width and height without resizing when toggled', () => {
    const onLayersChange = vi.fn();
    const layers = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', {}).map((layer) => layer.id === 'walkway' ? { ...layer, w: 30, h: 24 } : layer);
    const common: ComponentProps<typeof AdjustPanel> = {
      beats: PAINTED_PROMISE_BEATS, breakpoint: 'mobile', selectedBeat: 'groom', progress: .4, mode: 'scene', layers,
      selectedLayer: 'walkway', shippedLayerIds: [], visibilitySets: PAINTED_PROMISE_VISIBILITY, tracks: PAINTED_PROMISE_SEQUENCE.tracks,
      onSelectBeat: vi.fn(), onProgressChange: vi.fn(), onModeChange: vi.fn(), onSelectLayer: vi.fn(), onLayersChange, onResetLayer: vi.fn(),
      onResetWorld: vi.fn(), onCameraChange: vi.fn(), onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(),
      onVisibilityChange: vi.fn(), onResetVisibility: vi.fn(), onClose: vi.fn(),
    };
    const view = render(<CinematicAdjustPanel {...common} />);
    const toggle = screen.getByRole('button', { name: 'Link width and height' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    const linked = onLayersChange.mock.calls.at(-1)![0];
    expect(linked.find((layer: { id: string }) => layer.id === 'walkway')).toMatchObject({ w: 30, h: 24, lockAspect: true });
    view.rerender(<CinematicAdjustPanel {...common} layers={linked} />);
    fireEvent.change(within(screen.getByRole('group', { name: 'Position and size' })).getAllByLabelText('Width')[1], { target: { value: '60' } });
    expect(onLayersChange.mock.calls.at(-1)![0].find((layer: { id: string }) => layer.id === 'walkway')).toMatchObject({ w: 60, h: 48 });
    fireEvent.change(within(screen.getByRole('group', { name: 'Position and size' })).getAllByLabelText('Height')[1], { target: { value: '12' } });
    expect(onLayersChange.mock.calls.at(-1)![0].find((layer: { id: string }) => layer.id === 'walkway')).toMatchObject({ w: 15, h: 12 });
    fireEvent.click(screen.getByRole('button', { name: 'Link width and height' }));
    const free = onLayersChange.mock.calls.at(-1)![0];
    view.rerender(<CinematicAdjustPanel {...common} layers={free} />);
    fireEvent.change(within(screen.getByRole('group', { name: 'Position and size' })).getAllByLabelText('Width')[1], { target: { value: '60' } });
    expect(onLayersChange.mock.calls.at(-1)![0].find((layer: { id: string }) => layer.id === 'walkway')).toMatchObject({ w: 60, h: 24, lockAspect: false });
  });
  it('separates workspaces and remembers their independent scroll positions without clearing selection', () => {
    const common: ComponentProps<typeof AdjustPanel> = {
      beats: PAINTED_PROMISE_BEATS, breakpoint: 'mobile', selectedBeat: 'groom', progress: .4, mode: 'scene',
      referenceVisible: false, referenceOpacity: .45,
      layers: resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', {}), selectedLayer: 'programme-board--items',
      shippedLayerIds: [], visibilitySets: PAINTED_PROMISE_VISIBILITY, tracks: PAINTED_PROMISE_SEQUENCE.tracks,
      onSelectBeat: vi.fn(), onProgressChange: vi.fn(), onModeChange: vi.fn(), onReferenceVisibleChange: vi.fn(),
      onReferenceOpacityChange: vi.fn(), onSelectLayer: vi.fn(), onLayersChange: vi.fn(), onResetLayer: vi.fn(),
      onResetWorld: vi.fn(), onCameraChange: vi.fn(), onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(),
      onVisibilityChange: vi.fn(), onResetVisibility: vi.fn(), onClose: vi.fn(),
    };
    const view = render(<CinematicAdjustPanel {...common} />);
    const body = document.getElementById('cinematic-editing-panel')!;
    expect(screen.queryByRole('region', { name: 'Camera beats' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Object inspector' })).toBeVisible();
    for (const name of ['Story actions', 'Layer actions']) {
      const actions = screen.getByRole('button', { name }).closest('details')!;
      expect(actions).toHaveAttribute('data-align', 'start');
      expect(actions.parentElement?.firstElementChild).toBe(actions);
    }
    expect(body).not.toContainElement(screen.getByRole('region', { name: 'Object inspector' }));
    expect(body).toContainElement(screen.getByRole('button', { name: /^Programme board/ }));
    expect(screen.getByRole('button', { name: /^Programme items/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /^Programme items/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Programme board/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Scene layers · front to back')).toBeVisible();
    body.scrollTop = 180;
    fireEvent.scroll(body);
    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(common.onModeChange).toHaveBeenLastCalledWith('camera-compose');
    view.rerender(<CinematicAdjustPanel {...common} mode="camera-beat" />);
    expect(body.scrollTop).toBe(0);
    expect(screen.getByRole('region', { name: 'Camera beats' })).toBeVisible();
    expect(screen.queryByText('Scene layers · front to back')).toBeNull();
    body.scrollTop = 90;
    fireEvent.scroll(body);
    view.rerender(<CinematicAdjustPanel {...common} />);
    expect(body.scrollTop).toBe(180);
    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(common.onModeChange).toHaveBeenLastCalledWith('camera-beat');
    view.rerender(<CinematicAdjustPanel {...common} mode="camera-compose" />);
    expect(body.scrollTop).toBe(90);
    expect(common.onSelectLayer).not.toHaveBeenCalled();
    expect(common.onProgressChange).not.toHaveBeenCalled();
    view.rerender(<CinematicAdjustPanel {...common} layers={common.layers.map((layer) => layer.id === 'programme-board' ? { ...layer, hidden: true } : layer)} />);
    const filters = screen.getByRole('group', { name: 'Filter scene layers' });
    fireEvent.click(within(filters).getByRole('button', { name: /^Hidden/ }));
    expect(screen.getByRole('button', { name: /^Programme heading/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^Cloud background/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show Programme board' }));
    expect(common.onLayersChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'programme-board', hidden: false })]));
    fireEvent.click(within(filters).getByRole('button', { name: /^Visible/ }));
    expect(screen.queryByRole('button', { name: /^Programme heading/ })).toBeNull();
    expect(screen.getByRole('region', { name: 'Object inspector' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /^Show selected layer/ }));
    expect(screen.getByRole('button', { name: /^Programme heading/ })).toBeVisible();
    expect(within(filters).getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows compact programme and frame controls without exposing legacy leaf layers', () => {
    const onLayersChange = vi.fn();
    const onDirectionChange = vi.fn();
    const common: ComponentProps<typeof AdjustPanel> = {
      beats: PAINTED_PROMISE_BEATS, breakpoint: 'mobile', selectedBeat: 'programme-wide', progress: .65, mode: 'scene',
      referenceVisible: false, referenceOpacity: .45,
      layers: resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', {}, { frames: 12, programmeItems: 10 }),
      shippedLayerIds: [], visibilitySets: PAINTED_PROMISE_VISIBILITY,
      tracks: PAINTED_PROMISE_SEQUENCE.tracks, direction: PAINTED_PROMISE_DIRECTION, onDirectionChange,
      onSelectBeat: vi.fn(), onProgressChange: vi.fn(), onModeChange: vi.fn(), onReferenceVisibleChange: vi.fn(),
      onReferenceOpacityChange: vi.fn(), onSelectLayer: vi.fn(), onLayersChange, onResetLayer: vi.fn(),
      onResetWorld: vi.fn(), onCameraChange: vi.fn(), onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(),
      onVisibilityChange: vi.fn(), onResetVisibility: vi.fn(), onClose: vi.fn(),
    };
    const view = render(<CinematicAdjustPanel {...common} selectedLayer="programme-board--items" />);
    expect(screen.getByRole('tabpanel', { name: 'Layout' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Text width %', { selector: 'input[type="number"]' }), { target: { value: '65' } });
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'programme-board--items', textWidth: 65, w: 100 })]));
    expect(document.getElementById('object-style-panel')).not.toBeVisible();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Layout' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Style' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Style' })).toBeVisible();
    expect(common.onProgressChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Go to appearance' }));
    const clip = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!.clip;
    expect(common.onProgressChange).toHaveBeenCalledWith((clip.enterEnd + clip.exitStart) / 2);
    expect(screen.queryByRole('button', { name: /^Board artwork/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Programme entry/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Photo frame \d/ })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Layer text' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Row spacing', { selector: 'input[type="number"]' }), { target: { value: '1.2' } });
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ part: 'items', rowGap: 1.2 })]));
    view.rerender(<CinematicAdjustPanel {...common} selectedLayer="memory-wall--frames" />);
    fireEvent.change(screen.getByLabelText('Frame count', { selector: 'input[type="number"]' }), { target: { value: '10' } });
    expect(onDirectionChange).toHaveBeenLastCalledWith(expect.objectContaining({ theme: expect.objectContaining({ memory: expect.objectContaining({ frames: 10 }) }) }));
    fireEvent.change(screen.getByLabelText('Border', { selector: 'input[type="number"]' }), { target: { value: '8' } });
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ part: 'frames', borderWidth: 8 })]));
    expect(screen.queryByRole('button', { name: 'Replace image' })).toBeNull();
    view.rerender(<CinematicAdjustPanel {...common} selectedLayer="programme-board--items" selectedTimingTrack="motion" selectedAnimationTrack />);
    expect(screen.getByRole('tab', { name: 'Animation' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Style' }));
    view.rerender(<CinematicAdjustPanel {...common} layers={[...common.layers]} selectedLayer="programme-board--items" selectedTimingTrack="motion" selectedAnimationTrack />);
    expect(screen.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');
  });

  it('isolates story settings in the bottom Advanced tab and returns to editing for a timing selection', () => {
    const props: ComponentProps<typeof AdjustPanel> = {
      beats: PAINTED_PROMISE_BEATS, breakpoint: 'mobile', selectedBeat: 'dais', progress: .31, mode: 'scene',
      referenceVisible: false, referenceOpacity: .45, layers: [], shippedLayerIds: [], visibilitySets: PAINTED_PROMISE_VISIBILITY,
      tracks: PAINTED_PROMISE_SEQUENCE.tracks, direction: PAINTED_PROMISE_DIRECTION, onDirectionChange: vi.fn(),
      onSelectBeat: vi.fn(), onProgressChange: vi.fn(), onModeChange: vi.fn(), onReferenceVisibleChange: vi.fn(),
      onReferenceOpacityChange: vi.fn(), onSelectLayer: vi.fn(), onLayersChange: vi.fn(), onResetLayer: vi.fn(),
      onResetWorld: vi.fn(), onCameraChange: vi.fn(), onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(),
      onVisibilityChange: vi.fn(), onResetVisibility: vi.fn(), onClose: vi.fn(),
    };
    const { rerender } = render(<CinematicAdjustPanel {...props} />);
    expect(screen.queryByRole('heading', { name: 'Story settings' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Advanced' }));
    expect(screen.getByRole('heading', { name: 'Story settings' })).toBeVisible();
    expect(screen.queryByText('Editing mode')).not.toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: 'Theme' }));
    rerender(<CinematicAdjustPanel {...props} selectedTimingTrack="dais" />);
    expect(screen.getByRole('tab', { name: 'Editing' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('region', { name: 'Timing track Dais set' })).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: 'Advanced' }));
    expect(screen.getByRole('tab', { name: 'Theme' })).toHaveAttribute('aria-selected', 'true');
  });

  it('guards and confirms effect clip removal from the timing inspector', () => {
    const onDeleteEffectTrack = vi.fn();
    const props: ComponentProps<typeof AdjustPanel> = {
      beats: PAINTED_PROMISE_BEATS, breakpoint: 'mobile', selectedBeat: 'ring', progress: 0, mode: 'scene',
      layers: PAINTED_PROMISE_WORLD, shippedLayerIds: [], visibilitySets: PAINTED_PROMISE_VISIBILITY,
      tracks: PAINTED_PROMISE_SEQUENCE.tracks, selectedTimingTrack: 'groom-hand-motion',
      onSelectBeat: vi.fn(), onProgressChange: vi.fn(), onModeChange: vi.fn(), onSelectLayer: vi.fn(),
      onLayersChange: vi.fn(), onResetLayer: vi.fn(), onResetWorld: vi.fn(), onCameraChange: vi.fn(),
      onResetCamera: vi.fn(), onCopyCameraToOther: vi.fn(), onVisibilityChange: vi.fn(),
      onResetVisibility: vi.fn(), onClose: vi.fn(), onDeleteEffectTrack,
    };
    const { rerender } = render(<CinematicAdjustPanel {...props} />);
    expect(screen.queryByRole('button', { name: 'Delete track' })).toBeNull();
    const effect = PAINTED_PROMISE_DIRECTION.effects.find((item) => item.trackId === 'groom-hand-motion')!;
    const effects = { mobile: [effect], desktop: [effect] };
    rerender(<CinematicAdjustPanel {...props} effectTracks={new Map([['groom-hand-motion', {
      dependencies: ['Navigation · Welcome'], effects,
    }]])} />);
    expect(screen.getByRole('button', { name: 'Delete track' })).toBeDisabled();
    expect(screen.getByText('Navigation · Welcome')).toBeVisible();

    rerender(<CinematicAdjustPanel {...props} effectTracks={new Map([['groom-hand-motion', { dependencies: [], effects }]])} />);
    const editor = within(screen.getByRole('region', { name: 'Timing track Groom hand movement' }));
    expect(editor.getByRole('button', { name: 'Open layer effects' })).toBeVisible();
    fireEvent.click(editor.getByRole('button', { name: 'Delete track' }));
    expect(editor.getByRole('alert')).toHaveTextContent('Groom hand entrance will stop running');
    expect(onDeleteEffectTrack).not.toHaveBeenCalled();
    fireEvent.click(editor.getByRole('button', { name: 'Confirm delete track' }));
    expect(onDeleteEffectTrack).toHaveBeenCalledExactlyOnceWith('groom-hand-motion');
  });

  it('keeps track and full-story resets at distinct confirmed scopes', () => {
    const onResetTrack = vi.fn();
    const onResetSequence = vi.fn();
    const onSelectTimingTrack = vi.fn();
    const onClose = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="dais" progress={.31}
        mode="scene" referenceVisible={false} referenceOpacity={.45}
        layers={[]} shippedLayerIds={[]} visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={PAINTED_PROMISE_SEQUENCE.tracks} selectedTimingTrack="dais"
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onResetTrack={onResetTrack}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()}
        onResetSequence={onResetSequence} onSelectTimingTrack={onSelectTimingTrack} onClose={onClose}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Timing track actions' })).toBeNull();
    const timingHeader = screen.getByRole('button', { name: 'Go to appearance' }).parentElement!;
    expect(timingHeader).toHaveTextContent('Dais set');
    expect(screen.getByRole('button', { name: 'Go to appearance' }).querySelector('svg')).not.toBeNull();
    expect(within(screen.getByRole('group', { name: 'Timing track actions' })).getByRole('button', { name: 'Reset track' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reset track' }));
    expect(onResetTrack).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset track' }));
    expect(onResetTrack).toHaveBeenCalledWith('dais');
    fireEvent.click(screen.getByRole('button', { name: 'Story actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset entire story' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Reset entire story?');
    expect(screen.getByRole('alert')).toHaveTextContent('layer and scene-set edits');
    expect(screen.getByRole('alert')).toHaveTextContent('both devices');
    expect(onResetSequence).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset entire story' }));
    expect(onResetSequence).toHaveBeenCalledOnce();
    fireEvent(window, new Event('preview-dismiss-inspectors'));
    const timingEditor = screen.getByRole('region', { name: 'Timing track Dais set' });
    expect(timingEditor).toBeVisible();
    fireEvent.click(within(timingEditor).getByRole('button', { name: 'Close timing track editor' }));
    expect(screen.queryByRole('region', { name: 'Timing track Dais set' })).toBeNull();
    expect(onSelectTimingTrack).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('selects director beats in Camera without duplicating preview reference controls', () => {
    const onSelectBeat = vi.fn();
    const onModeChange = vi.fn();
    const onReferenceVisibleChange = vi.fn();

    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS}
        breakpoint="mobile"
        selectedBeat="ring"
        progress={0.08}
        mode="camera-compose"
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
    expect(screen.getAllByText(/%$/)).toHaveLength(PAINTED_PROMISE_BEATS.length);

    fireEvent.change(screen.getByRole('combobox', { name: 'Camera beat' }), { target: { value: 'groom' } });
    expect(onSelectBeat).toHaveBeenCalledWith('groom');

    fireEvent.click(screen.getByRole('button', { name: 'Camera' }));
    expect(onModeChange).toHaveBeenCalledWith('camera-compose');

    expect(screen.queryByText('Reference overlay')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Visible' })).toBeNull();
    expect(onReferenceVisibleChange).not.toHaveBeenCalled();
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
    expect(screen.queryByRole('button', { name: 'Close camera inspector' })).toBeNull();
    const cameraActions = screen.getByRole('button', { name: 'Camera and beat actions' }).closest('details')!;
    expect(cameraActions).toHaveAttribute('data-align', 'start');
    expect(cameraActions.parentElement?.firstElementChild).toBe(cameraActions);
    fireEvent.click(screen.getByRole('button', { name: 'Camera and beat actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset camera' }));
    expect(onResetCamera).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset camera' }));
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
    expect(screen.getByRole('alert')).toHaveTextContent('Delete “Groom close-up”?');
    expect(screen.getByRole('alert')).toHaveTextContent('Camera composition');
    expect(screen.getByRole('alert')).toHaveTextContent('Groom details text and details');
    expect(screen.getByRole('alert')).toHaveTextContent('Allocated scroll segment');
    expect(screen.getByRole('alert')).toHaveTextContent('Shared scenery and timing sets stay');
    expect(onDeleteBeat).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete moment' }));
    expect(onDuplicateBeat).toHaveBeenCalledWith('groom');
    expect(onDeleteBeat).toHaveBeenCalledWith('groom');
  });

  it('warns when deleting a functional beat removes a guest interaction', () => {
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="rsvp-letter" progress={.825}
        mode="camera-beat" referenceVisible={false} referenceOpacity={.45}
        layers={[]} shippedLayerIds={[]} visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        camera={{ x: 0, y: 0, scale: 1, rotate: 0 }}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onDeleteBeat={vi.fn()}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete moment' }));
    expect(screen.getByRole('alert')).toHaveTextContent('RSVP guest book exclusive artwork or set');
    expect(screen.getByRole('alert')).toHaveTextContent('RSVP form availability interaction entry point');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Guests will lose this form or interaction entry point.',
    );
  });

  it('restores a deleted shipped narrative moment from the camera editor', () => {
    const onRestoreBeat = vi.fn();
    const deletedGroom = PAINTED_PROMISE_BEATS.find((beat) => beat.id === 'groom')!;
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS.filter((beat) => beat.id !== 'groom')}
        deletedBeats={[deletedGroom]}
        breakpoint="mobile" selectedBeat="bride" progress={.5}
        mode="camera-beat" referenceVisible={false} referenceOpacity={.45}
        layers={[]} shippedLayerIds={[]} visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={PAINTED_PROMISE_SEQUENCE.tracks.filter((track) => track.id !== 'groom-details')}
        camera={{ x: -28, y: 2, scale: 2.35, rotate: 0 }}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onRestoreBeat={onRestoreBeat}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore Groom close-up' }));
    expect(onRestoreBeat).toHaveBeenCalledWith('groom');
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

    fireEvent.click(screen.getByRole('tab', { name: 'Animation' }));
    expect(screen.getByText(/Following Programme board/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unlink timing' }));
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
    fireEvent.click(screen.getByRole('tab', { name: 'Animation' }));
    expect(screen.queryByText(/In start/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', { name: /Starts/ }), { target: { value: '56' } });
    expect(onTimingTrackChange).toHaveBeenCalledWith('layer-programme-board', {
      clip: expect.objectContaining({ start: .56 }),
    });
  });

  it('directs and previews entrance and exit transitions from the selected timing clip', () => {
    const onTimingTrackChange = vi.fn();
    const onProgressChange = vi.fn();
    const programme = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!;
    const exact = {
      ...programme,
      id: 'layer-programme-board',
      label: 'Programme artwork',
      target: { type: 'layer' as const, id: 'programme-board' },
      enter: { kind: 'fade-slide' as const, easing: 'ease-out' as const, direction: 'up' as const, distance: 18 },
      exit: { kind: 'scale' as const, easing: 'ease-in' as const, scale: .72 },
    };
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="programme-wide"
        progress={.62} mode="scene" referenceVisible={false} referenceOpacity={.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        selectedLayer="programme-board" visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={[...PAINTED_PROMISE_SEQUENCE.tracks, exact]}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        onSelectBeat={vi.fn()} onProgressChange={onProgressChange} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onTimingTrackChange={onTimingTrackChange}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Animation' }));
    expect(screen.getByRole('combobox', { name: 'enter direction for Programme artwork' }))
      .toHaveValue('up');
    expect(screen.getByRole('slider', { name: 'enter distance for Programme artwork' }))
      .toHaveValue('18');
    expect(screen.getByRole('slider', { name: 'exit scale for Programme artwork' }))
      .toHaveValue('72');

    fireEvent.change(screen.getByRole('combobox', { name: 'enter direction for Programme artwork' }), {
      target: { value: 'down' },
    });
    expect(onTimingTrackChange).toHaveBeenCalledWith('layer-programme-board', {
      enter: expect.objectContaining({ direction: 'down', distance: 18 }),
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);
    expect(onProgressChange).toHaveBeenCalledWith(exact.clip.start);
  });

  it('selects an off-beat prop without changing the playhead', () => {
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
    expect(screen.getByRole('button', { name: /^Groom hand · dark formal cuff/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Bride hand · white bridal lace/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Wedding ring/ })).toBeInTheDocument();
    expect(screen.getByText('Programme')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Programme board/ }));
    expect(onSelectLayer).toHaveBeenCalledWith('programme-board');
    expect(onProgressChange).not.toHaveBeenCalled();
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
    expect(screen.queryByRole('button', { name: 'Layers' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Programme board/ }));
    expect(onSelectLayer).toHaveBeenCalledWith(undefined);
  });

  it('creates a named timing set from multiple selected scene assets', () => {
    const onCreateTimingSet = vi.fn(() => 'set-portrait-pair');
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="dais" progress={.31}
        mode="scene" referenceVisible={false} referenceOpacity={.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()} onCreateTimingSet={onCreateTimingSet} onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Organize timing sets' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Seated groom in timing set' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Seated bride in timing set' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New timing set name' }), {
      target: { value: 'Portrait pair' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create set' }));
    expect(onCreateTimingSet).toHaveBeenCalledWith('Portrait pair', ['groom', 'bride']);
  });

  it('renames, duplicates, and confirms safe deletion of a custom timing set', () => {
    const onRenameTimingSet = vi.fn();
    const onDuplicateTimingSet = vi.fn(() => 'portrait-pair-copy');
    const onDeleteTimingSet = vi.fn();
    const set = {
      ...PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'dais')!,
      id: 'portrait-pair', label: 'Portrait pair', kind: 'set' as const,
      target: { type: 'set' as const, id: 'portrait-pair' },
    };
    const linked = ['groom', 'bride'].map((id) => ({
      ...set, id: `layer-${id}`, label: id, kind: 'asset' as const,
      target: { type: 'layer' as const, id },
      timing: { mode: 'linked' as const, trackId: set.id },
    }));
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="dais" progress={.31}
        mode="scene" referenceVisible={false} referenceOpacity={.45}
        layers={resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined)}
        visibilitySets={PAINTED_PROMISE_VISIBILITY}
        tracks={[...PAINTED_PROMISE_SEQUENCE.tracks, set, ...linked]}
        shippedLayerIds={PAINTED_PROMISE_WORLD.map((layer) => layer.id)}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onVisibilityChange={vi.fn()}
        onResetVisibility={vi.fn()} onRenameTimingSet={onRenameTimingSet}
        onDuplicateTimingSet={onDuplicateTimingSet} onDeleteTimingSet={onDeleteTimingSet}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Portrait pair2 linked/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Timing set name' }), {
      target: { value: 'Couple portraits' },
    });
    expect(onRenameTimingSet).toHaveBeenCalledWith(set.id, 'Couple portraits');
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate set' }));
    expect(onDuplicateTimingSet).toHaveBeenCalledWith(set.id);
    fireEvent.click(screen.getByRole('button', { name: /Portrait pair2 linked/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete set' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '2 linked assets will keep their current timing as independent clips.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete set' }));
    expect(onDeleteTimingSet).toHaveBeenCalledWith(set.id);
  });

  it('edits a functional interaction as availability rather than form-open duration', () => {
    const onTimingTrackChange = vi.fn();
    render(
      <CinematicAdjustPanel
        beats={PAINTED_PROMISE_BEATS} breakpoint="mobile" selectedBeat="rsvp-letter" progress={.825}
        mode="scene" referenceVisible={false} referenceOpacity={.45}
        layers={[]} selectedTimingTrack="rsvp-availability" shippedLayerIds={[]}
        visibilitySets={PAINTED_PROMISE_VISIBILITY} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        onSelectBeat={vi.fn()} onProgressChange={vi.fn()} onModeChange={vi.fn()}
        onReferenceVisibleChange={vi.fn()} onReferenceOpacityChange={vi.fn()}
        onSelectLayer={vi.fn()} onLayersChange={vi.fn()} onResetLayer={vi.fn()}
        onResetWorld={vi.fn()} onCameraChange={vi.fn()} onResetCamera={vi.fn()}
        onCopyCameraToOther={vi.fn()} onTimingTrackChange={onTimingTrackChange}
        onVisibilityChange={vi.fn()} onResetVisibility={vi.fn()} onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('region', { name: 'Timing track RSVP form availability' }))
      .toBeInTheDocument();
    expect(screen.getByText(/Time spent inside the open form is not added/)).toBeInTheDocument();
    const clip = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'rsvp-availability')!.clip;
    const start = Number(((clip.start + clip.end) / 2).toFixed(3));
    fireEvent.change(screen.getByRole('spinbutton', {
      name: 'Available from for RSVP form availability',
    }), { target: { value: String(start * 100) } });
    expect(onTimingTrackChange).toHaveBeenCalledWith('rsvp-availability', {
      clip: { ...clip, start: expect.closeTo(start, 6), enterEnd: expect.closeTo(start, 6) },
    });
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
    fireEvent.click(screen.getByRole('tab', { name: 'Layout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bring to front' }));
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'groom', z: 51 }),
    ]));
  });
});
