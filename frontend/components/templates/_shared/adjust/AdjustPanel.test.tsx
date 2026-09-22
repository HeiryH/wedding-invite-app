import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { T12_STAGES } from '../../Template12-dreamywoodland/data/dreamyWoodlandStages';
import AdjustPanel from './AdjustPanel';

describe('AdjustPanel sheet form controls', () => {
  it('offers separate text and container tabs for a popup form', () => {
    render(
      <AdjustPanel
        stages={T12_STAGES}
        keyPrefix="t12"
        stageIds={['rsvp']}
        breakpoint="mobile"
        config={{}}
        onLayoutChange={vi.fn()}
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
    expect(screen.getByRole('button', { name: /Transparent/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset container' })).toBeInTheDocument();
  });
});
