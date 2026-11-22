import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SceneSetManager, { SceneSetProperties } from './SceneSetManager';
import { PAINTED_PROMISE_SCENE_SETS, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';

describe('collapsible scene sets', () => {
  beforeEach(() => localStorage.clear());
  it('starts collapsed on every mount and opens the section when creating a set', () => {
    const props = { sets: PAINTED_PROMISE_SCENE_SETS, layers: PAINTED_PROMISE_WORLD, onSelect: vi.fn(), onAction: vi.fn() };
    const view = render(<SceneSetManager {...props} />);
    expect(screen.queryByRole('region', { name: 'Scene sets' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand scene sets' }));
    expect(screen.getByRole('region', { name: 'Scene sets' })).toBeVisible();
    expect(props.onAction).not.toHaveBeenCalled();
    view.unmount();
    render(<SceneSetManager {...props} />);
    expect(screen.getByRole('button', { name: 'Expand scene sets' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: '+ New set' }));
    expect(screen.getByRole('region', { name: 'Scene sets' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Set name' })).toBeVisible();
    expect(props.onAction).not.toHaveBeenCalled();
  });
  it('marks sets with zero layers, including the selected set', () => {
    const layers = PAINTED_PROMISE_WORLD.map((layer) => layer.group === 'programme' ? { ...layer, hidden: true } : layer)
      .filter((layer) => layer.group !== 'venue');
    render(<SceneSetManager sets={PAINTED_PROMISE_SCENE_SETS} layers={layers}
      selectedId="venue" onSelect={vi.fn()} onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand scene sets' }));
    const venue = screen.getByRole('button', { name: 'Manage Venue structure' });
    expect(venue).toHaveAttribute('aria-pressed', 'true');
    expect(venue.parentElement).toHaveAttribute('data-empty', 'true');
    expect(venue).toHaveTextContent('0 layers');
    const programme = screen.getByRole('button', { name: 'Manage Programme' });
    expect(programme.parentElement).not.toHaveAttribute('data-empty');
  });

  it('shows set actions directly without an overflow menu', () => {
    render(<SceneSetProperties active={PAINTED_PROMISE_SCENE_SETS.find(({ id }) => id === 'programme')!}
      sets={PAINTED_PROMISE_SCENE_SETS} layers={PAINTED_PROMISE_WORLD} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
      breakpoint="mobile" onSelect={vi.fn()} onAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Duplicate set' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Delete set…' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Delete');
    expect(screen.queryByRole('button', { name: 'Scene set actions' })).toBeNull();
  });
});
