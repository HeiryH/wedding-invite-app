import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CinematicSceneLayer from './CinematicSceneLayer';
import { cinematicWorldKey, resolveCinematicWorld, serializeCinematicWorld, type CinematicWorldLayer } from './world';
import { textShadowPresets } from './textEffects';

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

  it('round-trips text styling and keeps the unrevealed words accessible', () => {
    const authored: CinematicWorldLayer = {
      ...layer, text: 'Hariz, and Aisyah', radius: 8, borderWidth: 2,
      textEffects: {
        shadow: textShadowPresets.glow,
        outline: { color: '#311e17', width: 1, opacity: .75 },
        gradient: { start: '#fff0cd', end: '#b47a32', angle: 135 },
        box: { color: '#fff7e9', opacity: .7, paddingX: .4, paddingY: .2 },
      },
    };
    const config = { [cinematicWorldKey('t15', 'mobile')]: serializeCinematicWorld([layer], 'mobile', [authored]) };
    const resolved = resolveCinematicWorld('t15', [layer], 'mobile', config)[0];
    expect(resolved.textEffects).toEqual(authored.textEffects);
    expect(resolveCinematicWorld('t15', [layer], 'desktop', config)[0].textEffects).toBeUndefined();
    const { container } = render(<CinematicSceneLayer layer={resolved}
      textMotion={{ textReveal: 'words', revealAmount: .34, shadowOpacity: .3 }}
      boxClassName="box" imageClassName="image" selectedClassName="selected" resizeHandleClassName="handle" />);
    const visible = container.querySelector('span[aria-hidden="true"]')!;
    expect(visible.firstChild?.textContent).toBe('Hariz, ');
    expect(visible.lastChild?.textContent).toBe('and Aisyah');
    expect(visible.parentElement).toHaveStyle({ borderRadius: '8px', padding: '0.2em 0.4em' });
    expect(screen.getByText('Hariz, and Aisyah')).toBeInTheDocument();
  });

  it('preserves rich text markup when applying a gradient and text box', () => {
    const { container } = render(<CinematicSceneLayer layer={{ ...layer, text: undefined, textEffects: {
      gradient: { start: '#fff0cd', end: '#b47a32', angle: 135 },
      box: { color: '#fff7e9', opacity: 1, paddingX: .4, paddingY: .2 },
    } }} localElement={<div dangerouslySetInnerHTML={{ __html: '<p>With <strong>love</strong></p>' }} />}
    boxClassName="box" imageClassName="image" selectedClassName="selected" resizeHandleClassName="handle" />);
    expect(container.querySelector('p strong')).toHaveTextContent('love');
    expect(container.querySelector('[data-cinematic-layer]')).toHaveStyle({ padding: '0.2em 0.4em' });
  });
});
