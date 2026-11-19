import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import AdjustPanel from '../_shared/adjust/AdjustPanel';
import { resolveStage, serializeStage } from '../_shared/layout';
import { useAnchors } from './useAnchors';
import { T5_STAGES, t5Stages } from './data/t5Stages';

afterEach(cleanup);

it('groups countdown under Welcome and writes edits to its original layout key', () => {
  const changed = vi.fn();
  function Editor() {
    const [stage, setStage] = useState('welcome');
    const [layer, setLayer] = useState<string>();
    const [config, setConfig] = useState({
      't5.layout.mobile.countdown': JSON.stringify({ layers: [{ id: 'label', x: 61 }] }),
      't5.layout.desktop.countdown': JSON.stringify({ layers: [{ id: 'grid', x: 72 }] }),
    });
    return <AdjustPanel stages={T5_STAGES} keyPrefix="t5" stageIds={['welcome', 'countdown', 'ceremony']}
      breakpoint="mobile" config={config} selectedStage={stage} selectedLayer={layer}
      onSelectStage={setStage} onSelectLayer={setLayer} onClose={vi.fn()}
      onLayoutChange={(key, value) => { changed(key, value); setConfig(current => ({ ...current, [key]: value })); }} />;
  }
  render(<Editor />);
  expect(screen.queryByRole('button', { name: 'Countdown' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Welcome Card' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Countdown Label' }));
  expect(screen.getByRole('spinbutton', { name: 'Nudge X' })).toHaveValue(61);
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: '65' } });
  const [key, value] = changed.mock.lastCall!;
  expect(key).toBe('t5.layout.mobile.countdown');
  const patch = JSON.parse(value);
  expect(patch.layers).toContainEqual(expect.objectContaining({ id: 'label', x: 61, boxW: 65 }));
  expect(screen.getByRole('button', { name: 'Welcome Card' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Copy to desktop' }));
  expect(changed.mock.calls.map(([key]) => key)).toContain('t5.layout.desktop.welcome');
  expect(changed.mock.calls.map(([key]) => key)).toContain('t5.layout.desktop.countdown');
});

it('round-trips card dimensions and background styling without painting its text children', () => {
  const layers = T5_STAGES.welcome.layers.map(layer => layer.id === 'card'
    ? { ...layer, boxW: 75, boxH: 38, radius: 48, containerBlur: 8, fill: '#123456', containerOpacity: 40 }
    : layer);
  const value = serializeStage(T5_STAGES.welcome, 'mobile', layers, resolveStage('t5', T5_STAGES.welcome, 'mobile', {}));
  const config = { 't5.layout.mobile.welcome': value };
  const { result } = renderHook(() => useAnchors(config, 'mobile'));
  expect(result.current.a('welcome', 'card')).toMatchObject({ width: '75%', height: '38em' });
  expect(result.current.cx('welcome', 'card')).toMatchObject({ borderRadius: 48, backdropFilter: 'blur(8px) saturate(140%)', background: 'color-mix(in srgb, #123456 40%, transparent)' });
  expect(result.current.sx('welcome', 'card')).toEqual({});
  expect(resolveStage('t5', T5_STAGES.welcome, 'desktop', config).layers.find(layer => layer.id === 'card')?.boxW).toBeUndefined();
  expect(t5Stages({ 'invite.layout': 'minimal' }).welcome.layers.find(layer => layer.id === 'card')?.radius).toBe(28);
});

it('exposes card background controls and responsive text dimensions', () => {
  const change = vi.fn();
  const props = { stages: T5_STAGES, keyPrefix: 't5', stageIds: ['welcome'], breakpoint: 'mobile' as const,
    config: {}, selectedStage: 'welcome', selectedLayer: 'card', onLayoutChange: change,
    onSelectStage: vi.fn(), onSelectLayer: vi.fn(), onClose: vi.fn() };
  const view = render(<AdjustPanel {...props} />);
  expect(screen.getByRole('spinbutton', { name: 'Width' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Style' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Corner radius' }), { target: { value: '40' } });
  expect(JSON.parse(change.mock.lastCall![1]).layers).toContainEqual(expect.objectContaining({ id: 'card', radius: 40 }));
  view.rerender(<AdjustPanel {...props} selectedStage="ceremony" selectedLayer="body" stageIds={['ceremony']} />);
  fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
  expect(screen.getByRole('spinbutton', { name: 'Width' })).toBeVisible();
  expect(screen.getByRole('spinbutton', { name: 'Height' })).toBeVisible();
});

it('allows built-in and added layers to be selected for grouping', () => {
  const props = { stages: T5_STAGES, keyPrefix: 't5', stageIds: ['welcome', 'countdown'],
    breakpoint: 'mobile' as const, selectedStage: 'welcome', onLayoutChange: vi.fn(),
    onSelectStage: vi.fn(), onSelectLayer: vi.fn(), onClose: vi.fn(), classicGroups: true, groupMotion: true };
  const view = render(<AdjustPanel {...props} config={{}} />);
  expect(screen.getByRole('button', { name: 'Select layers to group' })).toBeEnabled();
  const decoration = (id: string, z: number) => ({ ...T5_STAGES.welcome.layers[0], id, kind: 'shape' as const, label: id, z });
  const config = { 't5.layout.mobile.welcome': serializeStage(T5_STAGES.welcome, 'mobile',
    [...T5_STAGES.welcome.layers, decoration('flower', 2), decoration('frame', 3)], resolveStage('t5', T5_STAGES.welcome, 'mobile', {})) };
  view.rerender(<AdjustPanel {...props} config={config} />);
  fireEvent.click(screen.getByRole('button', { name: 'Select layers to group' }));
  expect(screen.getByText('Grouping in Welcome. Each section keeps its own group.')).toBeVisible();
  expect(screen.getByRole('checkbox', { name: 'Select Welcome Card for grouping' })).toBeVisible();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select flower for grouping' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select frame for grouping' }));
  fireEvent.click(screen.getByRole('button', { name: 'Group selected' }));
  const [key, value] = props.onLayoutChange.mock.lastCall!;
  expect(key).toBe('t5.layout.mobile.welcome');
  expect(resolveStage('t5', T5_STAGES.welcome, 'mobile', { [key]: value }).groups[0].memberIds).toEqual(['frame', 'flower']);
});

it('keeps saved countdown groups visible and edits their original key from Welcome', () => {
  const change = vi.fn();
  const layers = ['flower', 'frame'].map((id, index) => ({ ...T5_STAGES.countdown.layers[0],
    id, label: id, kind: 'shape' as const, z: index + 2 }));
  const value = serializeStage(T5_STAGES.countdown, 'mobile', [...T5_STAGES.countdown.layers, ...layers], resolveStage('t5', T5_STAGES.countdown, 'mobile', {}),
    [{ id: 'countdown-art', label: 'Countdown art', memberIds: ['flower', 'frame'] }]);
  const config = { 't5.layout.mobile.countdown': value, 't5.layout.mobile.welcome': JSON.stringify({ layers: [{ id: 'card', x: 62 }] }) };
  render(<AdjustPanel stages={T5_STAGES} keyPrefix="t5" classicGroups groupMotion
    stageIds={['welcome', 'countdown']} breakpoint="mobile" config={config} selectedStage="welcome"
    onLayoutChange={change} onSelectStage={vi.fn()} onSelectLayer={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByLabelText('Group Countdown art')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Rename Countdown art' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Group name' }), { target: { value: 'Timer decoration' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
  expect(change.mock.lastCall![0]).toBe('t5.layout.mobile.countdown');
  const saved = resolveStage('t5', T5_STAGES.countdown, 'mobile', { ...config, [change.mock.lastCall![0]]: change.mock.lastCall![1] });
  expect(saved.groups[0]).toMatchObject({ label: 'Timer decoration', memberIds: ['flower', 'frame'] });
  expect(saved.layers.filter(layer => ['flower', 'frame'].includes(layer.id))).toEqual(layers);
  fireEvent.click(screen.getByRole('button', { name: 'Collapse Countdown art' }));
  expect(screen.queryByRole('button', { name: 'flower' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Expand Countdown art' }));
  expect(screen.getByRole('button', { name: 'flower' })).toBeVisible();
});
