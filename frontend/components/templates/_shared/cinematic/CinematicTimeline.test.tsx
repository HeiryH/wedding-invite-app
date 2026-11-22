import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => localStorage.clear());
  it('keeps a full-story scrubber available while collapsed without reopening the tracks', () => {
    const onChange = vi.fn(), onCollapsedChange = vi.fn();
    const props = { progress: .77, beats, tracks: PAINTED_PROMISE_SEQUENCE.tracks, expanded: true, collapsed: true,
      onExpandedChange: vi.fn(), onChange, onCollapsedChange };
    const view = render(<CinematicTimeline {...props} />);
    const scrub = screen.getByRole('slider', { name: 'Scrub story' });
    expect(scrub).toHaveValue('77');
    expect(scrub).toHaveAttribute('min', '0');
    expect(scrub).toHaveAttribute('max', '100');
    fireEvent.change(scrub, { target: { value: '32.5' } });
    expect(onChange).toHaveBeenLastCalledWith(.325);
    fireEvent.change(scrub, { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.change(scrub, { target: { value: '100' } });
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(onCollapsedChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Timeline tracks' })).not.toBeInTheDocument();
    view.rerender(<CinematicTimeline {...props} progress={.45} />);
    expect(scrub).toHaveValue('45');
    view.rerender(<CinematicTimeline {...props} collapsed={false} />);
    expect(screen.queryByRole('slider', { name: 'Scrub story' })).not.toBeInTheDocument();
  });
  it('adds a scroll stop at the playhead and detaches timing when a linked stop is moved', () => {
    const stop = { id: 'rsvp-stop', label: 'RSVP guest book', at: .8,
      interactionId: 'rsvp', easing: 'ease-out' as const, durationMs: 280 };
    const onScrollStopsChange = vi.fn();
    const { onChange } = renderTimeline({ scrollStops: [{ stop, at: .81, active: true }], onScrollStopsChange });
    fireEvent.click(screen.getByRole('button', { name: 'Add scroll stop at playhead' }));
    expect(onScrollStopsChange).toHaveBeenLastCalledWith([stop, expect.objectContaining({ at: .4 })]);

    fireEvent.click(screen.getByRole('button', { name: 'Edit RSVP guest book scroll stop at 81.0%' }));
    expect(onChange).toHaveBeenLastCalledWith(.81);
    fireEvent.change(screen.getByLabelText('Easing'), { target: { value: 'ease-in-out' } });
    expect(onScrollStopsChange).toHaveBeenLastCalledWith([{ ...stop, easing: 'ease-in-out' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Move to playhead' }));
    expect(onScrollStopsChange).toHaveBeenLastCalledWith([{ ...stop, at: .4, interactionId: undefined, visibilityLayerId: undefined }]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onScrollStopsChange).toHaveBeenLastCalledWith([]);
  });
  it('includes the selected layer’s dedicated effects in its focused timeline', () => {
    const select = vi.fn();
    renderTimeline({ selectedAsset: { id: 'welcome-ring', label: 'Wedding ring', trackId: 'welcome-ring', effectTrackIds: ['ring-motion'] }, onTrackSelect: select });
    fireEvent.click(screen.getByRole('button', { name: 'Edit Ring fitting movement timing' }));
    expect(select).toHaveBeenCalledWith('ring-motion');
    expect(screen.queryByRole('button', { name: 'Edit Groom hand movement timing' })).not.toBeInTheDocument();
  });
  it('reports intrinsic Focus height instead of stretching the empty scroller', () => {
    const measured = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { height: this.hasAttribute('data-focus-size') ? 30 : 500 } as DOMRect;
    });
    try {
      const onFocusHeightChange = vi.fn();
      renderTimeline({ onFocusHeightChange });
      // Header, camera body, hint, plus the outer border. No false filter-empty message.
      expect(onFocusHeightChange).toHaveBeenLastCalledWith(92);
      expect(screen.queryByText(/No tracks match/)).not.toBeInTheDocument();
    } finally { measured.mockRestore(); }
  });
  it('collapses without losing the selected track and exposes explicit appearance navigation', () => {
    const onChange = vi.fn(), onCollapsedChange = vi.fn();
    const common = { progress: .1, beats, tracks: PAINTED_PROMISE_SEQUENCE.tracks, expanded: false,
      onExpandedChange: vi.fn(), onChange, onCollapsedChange,
      selectedAsset: { id: 'programme-board', label: 'Board', trackId: 'programme' } };
    const view = render(<CinematicTimeline {...common} />);
    expect(screen.getByRole('button', { name: 'Collapse timeline' }).querySelector('svg')).toHaveAttribute('width', '20');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Go to appearance' }));
    const clip = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'programme')!.clip;
    expect(onChange).toHaveBeenCalledWith((clip.enterEnd + clip.exitStart) / 2);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse timeline' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    view.rerender(<CinematicTimeline {...common} collapsed />);
    expect(screen.queryByRole('region', { name: 'Timeline tracks' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand timeline' })).toBeVisible();
  });
  it('restores the timeline when the saved filter came from the old animation editor', () => {
    localStorage.setItem('einvite.cinematic.timeline-controls.v1', JSON.stringify({
      filter: 'motion', collapsedKinds: ['motion'], zoom: 1,
    }));
    renderTimeline({ expanded: true });
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('timeline-clip-programme')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /In-between animations/ })).toBeNull();
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

  it('does not reserve an empty selection toolbar in All tracks', () => {
    renderTimeline({ expanded: true });
    expect(screen.queryByText('Double-click a bar to edit its timing.')).toBeNull();
    expect(document.querySelector('[aria-label="Timeline selection controls"]')).toBeNull();
    expect(screen.getByRole('slider', { name: 'Scrub camera timeline' })).toBeVisible();
  });

  it('keeps an unselected focus view quiet while retaining camera scrubbing', () => {
    renderTimeline();
    expect(screen.getAllByText('Groom close-up').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Go to Bride close-up' })).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-clip-dais')).not.toBeInTheDocument();
    expect(screen.getByText(/Select an object to see its timing/)).toBeInTheDocument();
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
      key: 'ArrowRight', altKey: true,
    });
    const clip = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'rsvp-availability')!.clip;
    const start = Number((clip.start + .001).toFixed(3));
    expect(onTrackClipChange).toHaveBeenCalledWith('rsvp-availability', {
      ...clip, start, enterEnd: start,
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

  it('Shift-drags the selected camera beat in Scene mode and commits only on release', () => {
    const onBeatMove = vi.fn();
    const { onChange } = renderTimeline({ selectedBeat: 'groom', onBeatMove });
    const marker = screen.getByRole('button', { name: 'Go to Groom close-up' });
    const rail = marker.parentElement!;
    vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue({
      left: 20, right: 1020, top: 0, bottom: 26, width: 1000, height: 26, x: 20, y: 0,
      toJSON: () => ({}),
    });
    const setPointerCapture = vi.fn();
    Object.assign(marker, { setPointerCapture, hasPointerCapture: vi.fn(() => true), releasePointerCapture: vi.fn() });
    const start = { pointerId: 1, button: 0, clientX: 424 };

    fireEvent.pointerDown(marker, start);
    fireEvent.pointerMove(marker, { ...start, clientX: 474 });
    fireEvent.pointerUp(marker, { ...start, clientX: 474 });
    fireEvent.click(marker);
    expect(onChange).toHaveBeenCalledWith(.4);
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(onBeatMove).not.toHaveBeenCalled();
    onChange.mockClear();

    fireEvent.pointerDown(marker, { ...start, shiftKey: true });
    fireEvent.pointerMove(marker, { ...start, clientX: 474, shiftKey: true });
    expect(marker).toHaveStyle({ left: '45%' });
    expect(onBeatMove).not.toHaveBeenCalled();
    fireEvent.pointerUp(marker, { ...start, clientX: 474, shiftKey: true });
    fireEvent.click(marker);
    expect(onBeatMove).toHaveBeenCalledExactlyOnceWith('groom', .45);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(marker, { ...start, shiftKey: true });
    fireEvent.pointerMove(marker, { ...start, clientX: 500, shiftKey: true });
    fireEvent.pointerCancel(marker, start);
    expect(marker).toHaveStyle({ left: '40%' });
    expect(onBeatMove).toHaveBeenCalledTimes(1);
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
