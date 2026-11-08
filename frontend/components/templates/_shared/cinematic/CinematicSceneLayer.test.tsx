import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CinematicSceneLayer from './CinematicSceneLayer';
import type { CinematicWorldLayer } from './world';

const layer: CinematicWorldLayer = {
  id: 'custom-cinematic-0', label: 'Custom text', group: 'custom', space: 'viewport',
  kind: 'text', text: '{{brideName}}', x: 50, y: 50, w: 40, h: 10, z: 12,
  rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
};

describe('CinematicSceneLayer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the selected layer and its inspector open when clicked again', () => {
    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
    render(
      <div data-cinematic-space="viewport">
        <CinematicSceneLayer
          layer={layer}
          editor={{
            enabled: true, breakpoint: 'mobile', selectedLayer: layer.id,
            cinematic: { progress: 0.1, mode: 'scene' },
          }}
          boxClassName="box" imageClassName="image" selectedClassName="selected"
          resizeHandleClassName="handle"
        />
      </div>,
    );

    const editableLayer = screen.getByRole('button', { name: 'Edit Custom text' });
    expect(editableLayer).toHaveStyle({ zIndex: String(layer.z) });
    fireEvent.click(editableLayer);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
