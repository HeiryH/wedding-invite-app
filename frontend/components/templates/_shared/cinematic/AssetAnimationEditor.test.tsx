import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AssetAnimationEditor from './AssetAnimationEditor';
import { PAINTED_PROMISE_WORLD, PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import { NEUTRAL_ASSET_MOTION } from './assetAnimations';
import type { CinematicWorldLayer } from './world';

describe('asset animation editor', () => {
  it('manages saved moves without exposing pose or easing controls', () => {
    const onPreview = vi.fn(), onSelectTrack = vi.fn();
    function Fixture() {
      const [layer, setLayer] = useState<CinematicWorldLayer>({
        ...PAINTED_PROMISE_WORLD.find((layer) => layer.id === 'programme-board')!,
        animations: [{
          ...NEUTRAL_ASSET_MOTION, id: 'move-1', label: 'Move right',
          x: 10, enabled: true, start: .25, end: .5, easing: 'ease-in-out',
        }],
      });
      return <AssetAnimationEditor layer={layer} tracks={PAINTED_PROMISE_SEQUENCE.tracks}
        onChange={(animations) => setLayer({ ...layer, animations })} onPreview={onPreview} onSelectTrack={onSelectTrack} />;
    }
    render(<Fixture />);
    fireEvent.click(screen.getByText('Legacy moves'));
    expect(screen.queryByRole('button', { name: 'Add animation' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('x of animation 1')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Easing of animation 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Preview move' }));
    expect(onPreview.mock.calls[0][0].enter.easing).toBe('ease-in-out');
    fireEvent.click(screen.getByRole('button', { name: 'Select on timeline' }));
    expect(onSelectTrack).toHaveBeenCalledWith('asset-motion:programme-board:move-1');
    fireEvent.click(screen.getByRole('button', { name: 'Animation actions 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove animation' }));
    expect(screen.getByLabelText('Animation name 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm remove animation' }));
    expect(screen.queryByText('Legacy moves')).not.toBeInTheDocument();
  });
});
