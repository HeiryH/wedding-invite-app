import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SceneSetManager from './SceneSetManager';
import { PAINTED_PROMISE_SCENE_SETS, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';

describe('collapsible scene sets', () => {
  beforeEach(() => localStorage.clear());
  it('starts collapsed on every mount and opens the section when creating a set', () => {
    const props = { sets: PAINTED_PROMISE_SCENE_SETS, layers: PAINTED_PROMISE_WORLD, tracks: PAINTED_PROMISE_SEQUENCE.tracks, onSelect: vi.fn(), onAction: vi.fn() };
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
  it('shows set actions directly without an overflow menu', () => {
    render(<SceneSetManager sets={PAINTED_PROMISE_SCENE_SETS} layers={PAINTED_PROMISE_WORLD} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
      selectedId="programme" onSelect={vi.fn()} onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand scene sets' }));
    expect(screen.getByRole('button', { name: 'Duplicate set' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Delete set…' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Delete');
    expect(screen.queryByRole('button', { name: 'Scene set actions' })).toBeNull();
  });
});
