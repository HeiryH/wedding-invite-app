import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AssetAnimationEditor from './AssetAnimationEditor';
import { PAINTED_PROMISE_WORLD, PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import type { CinematicWorldLayer } from './world';

describe('asset animation editor', () => {
  it('adds multiple moves, edits easing, previews/selects a timeline range and removes moves', () => {
    const onPreview = vi.fn(), onSelectTrack = vi.fn();
    function Fixture() {
      const [layer, setLayer] = useState<CinematicWorldLayer>({ ...PAINTED_PROMISE_WORLD.find((layer) => layer.id === 'programme-board')! });
      return <AssetAnimationEditor layer={layer} tracks={PAINTED_PROMISE_SEQUENCE.tracks} onChange={(animations) => setLayer({ ...layer, animations })} onPreview={onPreview} onSelectTrack={onSelectTrack} />;
    }
    render(<Fixture />);
    fireEvent.click(screen.getByRole('button', { name: 'Add animation' }));
    expect(screen.getByLabelText('x of animation 1')).toHaveValue(-10);
    fireEvent.change(screen.getByRole('combobox', { name: 'New animation type' }), { target: { value: 'right' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add animation' }));
    expect(screen.getByLabelText('x of animation 2')).toHaveValue(10);
    fireEvent.change(screen.getByLabelText('Easing of animation 2'), { target: { value: 'linear' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Preview move' })[1]);
    expect(onPreview.mock.calls[0][0].enter.easing).toBe('linear');
    fireEvent.click(screen.getAllByRole('button', { name: 'Select on timeline' })[1]);
    expect(onSelectTrack).toHaveBeenCalledWith('asset-motion:programme-board:move-2');
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove animation' })[1]);
    expect(screen.queryByLabelText('x of animation 2')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove animation' }));
    expect(screen.queryByLabelText('x of animation 1')).toBeNull();
  });
});
