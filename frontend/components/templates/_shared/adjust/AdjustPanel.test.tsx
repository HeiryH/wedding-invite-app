import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { T12_STAGES } from '../../Template12-dreamywoodland/data/dreamyWoodlandStages';
import AdjustPanel from './AdjustPanel';

describe('AdjustPanel sheet form controls', () => {
  it('clears the parent layer selection only when opening a popover', () => {
    const onSelection = vi.fn();
    function Workspace() {
      const [selectedLayer, setSelectedLayer] = useState<string | undefined>('rsvpForm');
      return <AdjustPanel
        stages={T12_STAGES}
        keyPrefix="t12"
        stageIds={['rsvp']}
        breakpoint="mobile"
        config={{}}
        onLayoutChange={vi.fn()}
        selectedStage="rsvp"
        selectedLayer={selectedLayer}
        onSelectStage={vi.fn()}
        onSelectLayer={(id) => {
          onSelection(id);
          setSelectedLayer(id);
        }}
        onClose={vi.fn()}
      />;
    }

    render(<StrictMode><Workspace /></StrictMode>);
    const add = screen.getByRole('button', { name: 'Add to stage' });
    fireEvent.click(add);
    expect(add).toHaveAttribute('aria-pressed', 'true');
    expect(onSelection).toHaveBeenCalledExactlyOnceWith(undefined);
    fireEvent.click(add);
    expect(add).toHaveAttribute('aria-pressed', 'false');
    expect(onSelection).toHaveBeenCalledTimes(1);
  });

  it('offers separate text and container tabs for a popup form', () => {
    const onLayoutChange = vi.fn();
    render(
      <AdjustPanel
        stages={T12_STAGES}
        keyPrefix="t12"
        stageIds={['rsvp']}
        breakpoint="mobile"
        config={{}}
        onLayoutChange={onLayoutChange}
        selectedStage="rsvp"
        selectedLayer="rsvpForm"
        onSelectStage={vi.fn()}
        onSelectLayer={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Container' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Animation' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    expect(screen.getByText('Accent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset text style' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Container' }));
    expect(screen.getByText('Background')).toBeInTheDocument();
    const opacity = screen.getByRole('slider', { name: 'Background opacity' });
    expect(opacity).toHaveValue('100');
    fireEvent.change(opacity, { target: { value: '0' } });
    const [key, delta] = onLayoutChange.mock.lastCall!;
    expect(key).toBe('t12.layout.mobile.rsvp');
    expect(JSON.parse(delta).layers).toEqual([
      expect.objectContaining({ id: 'rsvpForm', fill: '#fffaf2', containerOpacity: 0 }),
    ]);
    expect(screen.getByRole('button', { name: 'Reset container' })).toBeInTheDocument();
  });
});
