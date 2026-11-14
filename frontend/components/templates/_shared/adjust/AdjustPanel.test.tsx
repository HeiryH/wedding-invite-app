import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { T12_STAGES } from '../../Template12-dreamywoodland/data/dreamyWoodlandStages';
import { T7_STAGES } from '../../Template7-romangarden/data/stages';
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

describe('AdjustPanel layer groups', () => {
  it('creates, renames and changes RSVP group membership without changing geometry', () => {
    const onLayoutChange = vi.fn();
    function Workspace() {
      const [config, setConfig] = useState<Record<string, string>>({});
      const [selectedLayer, setSelectedLayer] = useState<string>();
      return <AdjustPanel
        stages={T7_STAGES}
        keyPrefix="t7"
        groupMotion
        stageIds={['rsvp']}
        breakpoint="mobile"
        config={config}
        onLayoutChange={(key, value) => {
          setConfig((previous) => ({ ...previous, [key]: value }));
          onLayoutChange(key, value);
        }}
        selectedStage="rsvp"
        selectedLayer={selectedLayer}
        onSelectStage={vi.fn()}
        onSelectLayer={setSelectedLayer}
        onClose={vi.fn()}
      />;
    }

    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Select layers to group' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select frame for grouping' }));
    expect(screen.getByRole('button', { name: 'Group selected' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select pots for grouping' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group selected' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Group name' }), { target: { value: 'RSVP decor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    const saved = () => JSON.parse(onLayoutChange.mock.lastCall![1]);
    expect(saved()).toEqual({ groups: [expect.objectContaining({ label: 'RSVP decor', memberIds: ['pots', 'frame'] })] });
    fireEvent.click(screen.getByRole('button', { name: 'RSVP decor' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Group X' }), { target: { value: '10' } });
    expect(saved().layers).toEqual([
      { id: 'frame', x: 60 },
      { id: 'pots', x: 60 },
    ]);
    fireEvent.change(screen.getByLabelText('Entrance'), { target: { value: 'fade' } });
    expect(saved().groups[0]).toMatchObject({ x: 10, anim: 'fade' });
    fireEvent.change(screen.getByRole('slider', { name: 'Group X' }), { target: { value: '0' } });
    expect(saved().layers).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse RSVP decor' }));
    expect(screen.queryByRole('button', { name: 'frame' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand RSVP decor' }));
    fireEvent.click(screen.getByRole('button', { name: 'frame' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move out of group' }));
    expect(saved().groups[0].memberIds).toEqual(['pots']);
    fireEvent.change(screen.getByRole('combobox', { name: 'Move into group' }), {
      target: { value: saved().groups[0].id },
    });
    expect(saved().groups[0].memberIds).toEqual(['pots', 'frame']);
    const dataTransfer = { setData: vi.fn() };
    const frame = screen.getByRole('button', { name: 'frame' }).closest('[data-layer-row]')!;
    fireEvent.dragStart(frame, { dataTransfer });
    fireEvent.drop(screen.getByText('Drop to move out of group'), { dataTransfer });
    expect(saved().groups[0].memberIds).toEqual(['pots']);
    fireEvent.dragStart(screen.getByRole('button', { name: 'frame' }).closest('[data-layer-row]')!, { dataTransfer });
    fireEvent.drop(screen.getByLabelText('Group RSVP decor'), { dataTransfer });
    expect(saved().groups[0].memberIds).toEqual(['pots', 'frame']);
    fireEvent.click(screen.getByRole('button', { name: 'Ungroup' }));
    expect(onLayoutChange.mock.lastCall).toEqual(['t7.layout.mobile.rsvp', '']);
    expect(screen.getByRole('button', { name: 'frame' })).toBeInTheDocument();
  });
});

describe('Roman Garden grouping compatibility', () => {
  it.each(['mobile', 'desktop'] as const)('groups Wishes artwork with its prompt on %s', (breakpoint) => {
    const onLayoutChange = vi.fn();
    render(<AdjustPanel stages={T7_STAGES} keyPrefix="t7" groupMotion stageIds={['wishes']}
      breakpoint={breakpoint} config={{}} onLayoutChange={onLayoutChange} selectedStage="wishes"
      onSelectStage={vi.fn()} onSelectLayer={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select layers to group' }));
    const group = screen.getByRole('button', { name: 'Group selected' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select partition for grouping' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select leaf for grouping' }));
    expect(group).toBeEnabled();

    const prompt = screen.getByRole('checkbox', { name: /Select .*wishPrompt for grouping/ });
    fireEvent.click(prompt);
    expect(group).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('3 layers selected');
    fireEvent.click(group);
    expect(JSON.parse(onLayoutChange.mock.lastCall![1]).groups[0].memberIds).toEqual(expect.arrayContaining(['leaf', 'partition', 'prompt']));
  });

  it.each([
    ['ceremony-rail', 'rail-potL', 'rail-potR'],
    ['photobooth', 'frame', 'partition'],
  ])('keeps valid artwork pairs selectable in %s', (stageId, first, second) => {
    render(<AdjustPanel stages={T7_STAGES} keyPrefix="t7" groupMotion stageIds={[stageId]}
      breakpoint="mobile" config={{}} onLayoutChange={vi.fn()} selectedStage={stageId}
      onSelectStage={vi.fn()} onSelectLayer={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select layers to group' }));
    fireEvent.click(screen.getByRole('checkbox', { name: `Select ${first} for grouping` }));
    fireEvent.click(screen.getByRole('checkbox', { name: `Select ${second} for grouping` }));
    expect(screen.getByRole('button', { name: 'Group selected' })).toBeEnabled();
  });
});
