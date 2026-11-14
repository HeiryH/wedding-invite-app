import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GroupedLayers from './GroupedLayers';
import type { Layer } from './types';

const layer = (id: string, z: number): Layer => ({
  id, kind: 'img', x: 50, y: 50, w: 30, h: 20, s: 1, z, order: 0,
  chain: false, hidden: false, opacity: 1,
});
const first = layer('frame', 1);
const second = layer('pots', 2);
const group = {
  id: 'decor', label: 'RSVP decor', memberIds: [first.id, second.id],
  anim: 'fade' as const, animOut: 'fade-out' as const, animIdle: 'float' as const,
};
const renderLayer = (item: Layer) => <div key={item.id} data-layer={item.id} />;

describe('group motion rendering', () => {
  it('wraps both layers in one entrance and exit while retaining the child layers', () => {
    const { container } = render(<GroupedLayers layers={[first, second]} groups={[group]} renderLayer={renderLayer} />);
    expect(container.querySelector('[data-layer="decor"] [data-sl-anim="fade"] [data-sl-out="fade-out"]')
      ?.querySelectorAll('[data-layer]')).toHaveLength(2);
  });

  it('preserves stacking when a layer has been reordered between group members', () => {
    const { container } = render(<GroupedLayers layers={[first, layer('text', 1.5), second]} groups={[group]} renderLayer={renderLayer} />);
    expect([...container.querySelectorAll('[data-layer]')].map((item) => item.getAttribute('data-layer')))
      .toEqual(['frame', 'text', 'pots']);
  });
});

it('renders both halves of a mixed group with a single drag handle', () => {
  const props = {
    groups: [group], selectedLayer: group.id, renderLayer,
    sharedCanvasGroups: new Set([group.id]),
  };
  const { container } = render(<>
    <GroupedLayers {...props} layers={[first]} secondaryCanvas />
    <GroupedLayers {...props} layers={[second]} />
  </>);
  expect(container.querySelectorAll('[data-shared-canvas-exit="true"][data-sl-out="fade-out"]')).toHaveLength(2);
  expect(container.querySelectorAll('button[aria-label="Drag RSVP decor"]')).toHaveLength(1);
});
