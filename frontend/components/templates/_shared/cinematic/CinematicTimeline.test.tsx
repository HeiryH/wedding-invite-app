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
    expect(screen.getByTestId('timeline-clip-programme')).toBeInTheDocument();
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
    expect(screen.getByText('Asset timing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move fully visible of Wedding ring' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move fade out of Wedding ring' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move end of Wedding ring' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move start of Wedding ring' }), {
      key: 'ArrowRight',
    });
    expect(onTrackClipChange).toHaveBeenCalledWith('welcome-ring', expect.objectContaining({ start: .08 }));
  });

  it('moves camera beats with accessible keyboard steps while editing', () => {
    const onBeatMove = vi.fn();
    renderTimeline({ editableBeats: true, selectedBeat: 'groom', onBeatMove });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move or go to Groom close-up' }), {
      key: 'ArrowRight', shiftKey: true,
    });
    expect(onBeatMove).toHaveBeenCalledWith('groom', .42);
  });
});
