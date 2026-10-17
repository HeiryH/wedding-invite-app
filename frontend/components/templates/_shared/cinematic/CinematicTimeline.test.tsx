import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import { beatsFromSequence } from './sequence';
import CinematicTimeline from './CinematicTimeline';

const beats = beatsFromSequence(PAINTED_PROMISE_SEQUENCE);

function renderTimeline(overrides: Partial<React.ComponentProps<typeof CinematicTimeline>> = {}) {
  const onChange = vi.fn();
  const onExpandedChange = vi.fn();
  render(
    <CinematicTimeline
      progress={.4}
      beats={beats}
      tracks={PAINTED_PROMISE_SEQUENCE.tracks}
      expanded={false}
      onExpandedChange={onExpandedChange}
      onChange={onChange}
      {...overrides}
    />,
  );
  return { onChange, onExpandedChange };
}

describe('CinematicTimeline', () => {
  it('groups editable in-between bars under their source and exposes a dedicated filter', () => {
    const parent = { ...PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'dais')!, id: 'parent' };
    const motion = { ...parent, id: 'move', label: 'Board · Move left', kind: 'effect' as const,
      assetAnimation: { layerId: 'board', animationId: 'left', sourceTrackId: parent.id, startLimit: .2, endLimit: .8 },
      clip: { start: .25, enterEnd: .35, exitStart: .35, end: .35 } };
    const ambient = { ...parent, id: 'ambient', label: 'Cloud drift', kind: 'effect' as const };
    const { container } = render(<CinematicTimeline progress={.3} beats={beats} tracks={[parent, ambient, motion]} expanded
      onExpandedChange={vi.fn()} onChange={vi.fn()} onTrackClipChange={vi.fn()} />);
    const clips = [...container.querySelectorAll('[data-testid^="timeline-clip-"]')].map((node) => node.getAttribute('data-testid'));
    expect(clips).toEqual(['timeline-clip-parent', 'timeline-clip-move', 'timeline-clip-ambient']);
    expect(screen.getByRole('button', { name: 'Move start of Board · Move left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move end of Board · Move left' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Scene set' }));
    expect(screen.getByTestId('timeline-clip-move')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'In-between animations' }));
    expect(screen.queryByTestId('timeline-clip-parent')).toBeNull();
    expect(screen.queryByTestId('timeline-clip-ambient')).toBeNull();
    expect(screen.getByTestId('timeline-clip-move')).toBeInTheDocument();
  });

  it('keeps a visually moved animation inside the source interval without shortening its duration', () => {
    const track = { ...PAINTED_PROMISE_SEQUENCE.tracks[0], id: 'motion', label: 'Board move', kind: 'effect' as const,
      assetAnimation: { layerId: 'board', animationId: 'move', startLimit: .2, endLimit: .8 },
      clip: { start: .2, enterEnd: .3, exitStart: .3, end: .3 } };
    const onTrackClipChange = vi.fn();
    renderTimeline({ expanded: true, tracks: [track], onTrackClipChange });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move timing clip for Board move' }), { key: 'ArrowLeft', shiftKey: true });
    const next = onTrackClipChange.mock.calls[0][1];
    expect(next.start).toBeCloseTo(.2); expect(next.end).toBeCloseTo(.3);
  });

  it('resizes in-between moves with two boundaries without a stale inner handle preventing shortening', () => {
    const track = { ...PAINTED_PROMISE_SEQUENCE.tracks[0], id: 'motion', label: 'Board move', kind: 'effect' as const,
      assetAnimation: { layerId: 'board', animationId: 'move' }, clip: { start: .2, enterEnd: .5, exitStart: .5, end: .5 } };
    const onTrackClipChange = vi.fn();
    renderTimeline({ expanded: true, tracks: [track], onTrackClipChange,
      selectedAsset: { id: track.id, label: track.label, trackId: track.id, sourceTrackId: track.id, editableTrackId: track.id, timingStatus: 'independent' } });
    expect(screen.queryByRole('button', { name: 'Move fully visible of Board move' })).toBeNull();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move end of Board move' }), { key: 'ArrowLeft', altKey: true });
    expect(onTrackClipChange).toHaveBeenCalledWith(track.id, { start: .2, enterEnd: .499, exitStart: .499, end: .499 });
  });

  it('scrubs directly from the sticky camera rail without moving camera beats', () => {
    const onBeatMove = vi.fn();
    const { onChange } = renderTimeline({ expanded: true, editableBeats: true, onBeatMove });
    fireEvent.change(screen.getByRole('slider', { name: 'Scrub camera timeline' }), { target: { value: '.463' } });
    expect(onChange).toHaveBeenCalledWith(.463);
    expect(onBeatMove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Move or go to Bride close-up' }));
    expect(onChange).toHaveBeenLastCalledWith(.5);
  });

  it('keeps selected tracks in place without replacing their DOM node or changing scroll position', () => {
    const props = { progress: .4, beats, tracks: PAINTED_PROMISE_SEQUENCE.tracks, expanded: true,
      onExpandedChange: vi.fn(), onChange: vi.fn(), onTrackSelect: vi.fn(), onTrackClipChange: vi.fn() };
    const { rerender, container } = render(<CinematicTimeline {...props} />);
    const node = screen.getByTestId('timeline-clip-dais');
    const order = () => [...container.querySelectorAll('[data-testid^="timeline-clip-"]')].map((clip) => clip.getAttribute('data-testid'));
    const before = order();
    const scroller = screen.getByTestId('timeline-scroll-area'); scroller.scrollTop = 180;
    rerender(<CinematicTimeline {...props} selectedAsset={{ id: 'dais', label: 'Dais set', trackId: 'dais', sourceTrackId: 'dais', editableTrackId: 'dais', timingStatus: 'independent' }} />);
    expect(order()).toEqual(before);
    expect(screen.getByTestId('timeline-clip-dais')).toBe(node);
    expect(node.className).toContain('clipSelected');
    expect(scroller.scrollTop).toBe(180);
    expect(screen.getByRole('button', { name: 'Move timing clip for Dais set' })).toBeInTheDocument();
  });

  it('selects scene-set timing by double-clicking its bar without changing timing or scrubbing', () => {
    const onTrackSelect = vi.fn(), onTrackClipChange = vi.fn();
    const { onChange } = renderTimeline({ expanded: true, onTrackSelect, onTrackClipChange });
    fireEvent.doubleClick(screen.getByTestId('timeline-clip-dais'));
    expect(onTrackSelect).toHaveBeenCalledExactlyOnceWith('dais');
    expect(onTrackClipChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects read-only bars and supports keyboard activation on editable bars', () => {
    const onTrackSelect = vi.fn();
    const { rerender } = render(<CinematicTimeline progress={.4} beats={beats} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
      expanded onExpandedChange={vi.fn()} onChange={vi.fn()} onTrackSelect={onTrackSelect} />);
    fireEvent.doubleClick(screen.getByTestId('timeline-clip-dais'));
    expect(onTrackSelect).toHaveBeenLastCalledWith('dais');
    rerender(<CinematicTimeline progress={.4} beats={beats} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
      selectedAsset={{ id: 'dais', label: 'Dais set', trackId: 'dais', sourceTrackId: 'dais', editableTrackId: 'dais', timingStatus: 'independent' }}
      expanded onExpandedChange={vi.fn()} onChange={vi.fn()} onTrackSelect={onTrackSelect} onTrackClipChange={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move timing clip for Dais set' }), { key: 'Enter' });
    expect(onTrackSelect).toHaveBeenCalledTimes(2);
  });

  it('shows camera beats and a compact current-track view', () => {
    renderTimeline();
    expect(screen.getAllByText('Groom close-up').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Go to Bride close-up' })).toBeInTheDocument();
    expect(screen.getByTestId('timeline-clip-dais')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-clip-rsvp')).not.toBeInTheDocument();
  });

  it('shows a selected asset with the timing source it inherits', () => {
    renderTimeline({
      progress: .7,
      selectedAsset: { id: 'programme-board', label: 'Programme artwork', trackId: 'programme' },
    });
    expect(screen.getAllByText('Programme artwork').length).toBeGreaterThan(0);
    expect(screen.getByText('Follows Programme board')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-clip-selected-programme-board')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-clip-programme')).not.toBeInTheDocument();
  });

  it('highlights the ultimate named-set source for a linked asset', () => {
    const set = {
      ...PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'dais')!,
      id: 'portrait-pair', label: 'Portrait pair', kind: 'set' as const,
      target: { type: 'set' as const, id: 'portrait-pair' },
    };
    const linked = {
      ...set, id: 'layer-groom', label: 'Seated groom', kind: 'asset' as const,
      target: { type: 'layer' as const, id: 'groom' },
      timing: { mode: 'linked' as const, trackId: set.id },
    };
    renderTimeline({
      tracks: [...PAINTED_PROMISE_SEQUENCE.tracks, set, linked],
      selectedAsset: {
        id: 'groom', label: 'Seated groom', trackId: linked.id,
        sourceTrackId: set.id, timingStatus: 'linked',
      },
    });
    expect(screen.getByText('Follows Portrait pair')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-clip-portrait-pair')).toBeInTheDocument();
  });

  it('does not pretend a selected asset with legacy timing is always visible', () => {
    renderTimeline({
      selectedAsset: {
        id: 'welcome-ring', label: 'Wedding ring', timingStatus: 'hardcoded',
      },
    });
    expect(screen.getByText('Timing not migrated yet')).toBeInTheDocument();
    expect(screen.getByText('Hardcoded timing')).toBeInTheDocument();
  });

  it('requests All Tracks and scrubs or jumps through the story', () => {
    const { onChange, onExpandedChange } = renderTimeline();
    fireEvent.click(screen.getByRole('button', { name: `All tracks · ${PAINTED_PROMISE_SEQUENCE.tracks.length}` }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);

    fireEvent.change(screen.getByRole('slider', { name: 'Scrub cinematic story' }), {
      target: { value: '.55' },
    });
    expect(onChange).toHaveBeenCalledWith(.55);

    fireEvent.click(screen.getByRole('button', { name: 'Go to Memory wall' }));
    expect(onChange).toHaveBeenCalledWith(.985);
  });

  it('renders every persisted track in All Tracks mode', () => {
    renderTimeline({ expanded: true });
    expect(screen.getByTestId('timeline-clip-rsvp')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-clip-wishes')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-clip-memory')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Focus' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks functional availability and selects it directly from All Tracks', () => {
    const onTrackSelect = vi.fn();
    renderTimeline({ expanded: true, onTrackSelect });
    fireEvent.click(screen.getByRole('button', { name: 'Edit RSVP form availability timing' }));
    expect(onTrackSelect).toHaveBeenCalledWith('rsvp-availability');
    expect(screen.getByTestId('timeline-clip-rsvp-availability')).toHaveTextContent('Available');
    expect(screen.getByRole('button', { name: 'Edit Programme focus availability timing' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Best Wishes form availability timing' }))
      .toBeInTheDocument();
  });

  it('edits an interaction as a two-boundary availability range', () => {
    const onTrackClipChange = vi.fn();
    renderTimeline({
      selectedAsset: {
        id: 'rsvp-availability', label: 'RSVP form availability',
        trackId: 'rsvp-availability', sourceTrackId: 'rsvp-availability',
        editableTrackId: 'rsvp-availability', timingStatus: 'independent',
      },
      onTrackClipChange,
    });
    expect(screen.getByRole('button', { name: 'Move start of RSVP form availability' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move end of RSVP form availability' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move fully visible of RSVP form availability' }))
      .not.toBeInTheDocument();
    expect(screen.getByText(/Availability span:/)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move start of RSVP form availability' }), {
      key: 'ArrowRight',
    });
    expect(onTrackClipChange).toHaveBeenCalledWith('rsvp-availability', {
      start: .81, enterEnd: .81, exitStart: .855, end: .855,
    });
  });

  it('shows four direct-manipulation handles only for an independently timed asset', () => {
    const onTrackClipChange = vi.fn();
    renderTimeline({
      selectedAsset: {
        id: 'welcome-ring', label: 'Wedding ring', trackId: 'welcome-ring',
        editableTrackId: 'welcome-ring', timingStatus: 'independent',
      },
      onTrackClipChange,
    });
    expect(screen.getByRole('button', { name: 'Move start of Wedding ring' })).toBeInTheDocument();
    expect(screen.getByText('Independent timing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move fully visible of Wedding ring' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move fade out of Wedding ring' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move end of Wedding ring' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move timing clip for Wedding ring' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move start of Wedding ring' }), {
      key: 'ArrowRight',
    });
    expect(onTrackClipChange).toHaveBeenCalledWith('welcome-ring', expect.objectContaining({ start: .08 }));
  });

  it('edits a complete clip from the timeline and supports session undo', () => {
    const onTrackClipChange = vi.fn();
    renderTimeline({
      selectedAsset: {
        id: 'dais', label: 'Dais set', trackId: 'dais', sourceTrackId: 'dais',
        editableTrackId: 'dais', timingStatus: 'independent',
      },
      onTrackClipChange,
    });
    expect(screen.getByText('Start: Walimah words + 35%')).toBeInTheDocument();
    expect(screen.getByText('End: Programme · wide')).toBeInTheDocument();
    expect(screen.getByText(/Visible span: .* beats/)).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Move timing clip for Dais set' }), {
      key: 'ArrowRight', shiftKey: true,
    });
    expect(onTrackClipChange).toHaveBeenCalledWith('dais', {
      start: .265, enterEnd: .31, exitStart: .58, end: .64,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo timing' }));
    expect(onTrackClipChange).toHaveBeenLastCalledWith('dais', {
      start: .245, enterEnd: .29, exitStart: .56, end: .62,
    });
  });

  it('sets clip boundaries from the playhead while preserving a valid range', () => {
    const onTrackClipChange = vi.fn();
    renderTimeline({
      progress: .4,
      selectedAsset: {
        id: 'welcome-ring', label: 'Wedding ring', trackId: 'welcome-ring',
        editableTrackId: 'welcome-ring', timingStatus: 'independent',
      },
      onTrackClipChange,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set start at playhead' }));
    expect(onTrackClipChange).toHaveBeenCalledWith('welcome-ring', {
      start: .4, enterEnd: .4, exitStart: .4, end: .4,
    });
  });

  it('drags the full clip and snaps its leading edge to a camera beat', () => {
    const onTrackClipChange = vi.fn();
    renderTimeline({
      selectedAsset: {
        id: 'dais', label: 'Dais set', trackId: 'dais', sourceTrackId: 'dais',
        editableTrackId: 'dais', timingStatus: 'independent',
      },
      onTrackClipChange,
    });
    const move = screen.getByRole('button', { name: 'Move timing clip for Dais set' });
    const rail = move.closest('[data-timeline-rail]') as HTMLElement;
    vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue({
      left: 0, right: 1000, top: 0, bottom: 20, width: 1000, height: 20, x: 0, y: 0,
      toJSON: () => ({}),
    });
    Object.assign(move, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
    });
    fireEvent.pointerDown(move, { pointerId: 1, clientX: 245 });
    fireEvent.pointerMove(move, { pointerId: 1, clientX: 310 });
    fireEvent.pointerUp(move, { pointerId: 1, clientX: 310 });
    expect(onTrackClipChange).toHaveBeenCalledWith('dais', {
      start: .31, enterEnd: .355, exitStart: .625, end: .685,
    });
    expect(screen.queryByText('Full dais')).toBeInTheDocument();
  });

  it('moves camera beats with accessible keyboard steps while editing', () => {
    const onBeatMove = vi.fn();
    renderTimeline({ editableBeats: true, selectedBeat: 'groom', onBeatMove });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move or go to Groom close-up' }), {
      key: 'ArrowRight', shiftKey: true,
    });
    expect(onBeatMove).toHaveBeenCalledWith('groom', .42);
  });

  it('supports safe timeline navigation, filtering and clear selection shortcuts', () => {
    const onClearSelection = vi.fn();
    renderTimeline({
      expanded: true,
      dirty: true,
      selectedBeat: 'groom',
      onClearSelection,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom timeline in' }));
    expect(screen.getByText('1.5×')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Text timing' }));
    expect(screen.getByTestId('timeline-clip-groom-details')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-clip-rsvp')).not.toBeInTheDocument();
    const timeline = screen.getByRole('region', { name: 'Cinematic timeline' });
    const scrollArea = screen.getByRole('region', { name: 'Timeline tracks' });
    expect(scrollArea).toBeInTheDocument();
    fireEvent.wheel(scrollArea, { deltaY: 180, deltaX: 0 });
    expect(scrollArea.scrollTop).toBe(180);
    expect(fireEvent.doubleClick(timeline)).toBe(false);
    fireEvent.keyDown(timeline, { key: 'Escape' });
    expect(onClearSelection).toHaveBeenCalledOnce();
  });

  it('locks, hides, restores and resets tracks from editor controls', () => {
    const onResetTrack = vi.fn();
    renderTimeline({
      expanded: true,
      selectedAsset: {
        id: 'welcome-ring', label: 'Wedding ring', trackId: 'welcome-ring',
        sourceTrackId: 'welcome-ring', editableTrackId: 'welcome-ring', timingStatus: 'independent',
      },
      onTrackClipChange: vi.fn(),
      onTrackSelect: vi.fn(),
      onResetTrack,
    });
    expect(screen.getByRole('button', { name: 'Move timing clip for Wedding ring' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lock Wedding ring track' }));
    expect(screen.queryByRole('button', { name: 'Move timing clip for Wedding ring' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide Wedding ring track in editor' }));
    expect(screen.queryByTestId('timeline-clip-welcome-ring')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 hidden' }));
    expect(screen.getByTestId('timeline-clip-welcome-ring')).toBeInTheDocument();

    const edit = screen.getByRole('button', { name: 'Edit Wedding ring timing' });
    fireEvent.contextMenu(edit.closest('div')!);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reset track' }));
    expect(onResetTrack).toHaveBeenCalledWith('welcome-ring');
  });
});
