import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CinematicCameraSurface from './CinematicCameraSurface';

describe('CinematicCameraSurface', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('targets the edited beat and accumulates wheel zoom before the next frame', () => {
    let frame: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);

    render(
      <CinematicCameraSurface
        camera={{ x: 28, y: 2, scale: 2, rotate: 0 }}
        beatId="groom"
        className="surface"
      />,
    );

    const surface = screen.getByRole('application');
    fireEvent.wheel(surface, { deltaY: -100 });
    fireEvent.wheel(surface, { deltaY: -100 });
    frame?.(0);

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PREVIEW_CINEMATIC_CAMERA_EDIT', beatId: 'groom',
        patch: { scale: expect.closeTo(2 * Math.exp(0.3), 5) },
      }),
      window.location.origin,
    );
  });
});
