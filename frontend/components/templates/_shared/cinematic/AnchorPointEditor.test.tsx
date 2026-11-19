import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import AnchorPointEditor from './AnchorPointEditor';
import type { CinematicWorldLayer } from './world';

it('places the first anchor directly on the artwork and moves it on the next click', () => {
  const layer = { id: 'hand', label: 'Hand', src: '/hand.png' } as CinematicWorldLayer;
  const change = vi.fn();
  const { rerender } = render(<AnchorPointEditor layer={layer} onChange={change} />);
  // JSDOM has the dialog element but omits its native modal methods.
  const dialog = document.querySelector('dialog')!;
  Object.defineProperty(dialog, 'showModal', { value: () => dialog.setAttribute('open', '') });
  fireEvent.click(screen.getByRole('button', { name: 'Edit anchor points' }));
  expect(screen.getByRole('dialog', { name: 'Anchor points' })).toBeVisible();
  const artwork = screen.getByAltText('Hand');
  Object.defineProperties(artwork, { naturalWidth: { value: 100 }, naturalHeight: { value: 200 } });
  fireEvent.load(artwork);
  const canvas = artwork.closest('button')!;
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 100, 200));

  const area = screen.getByRole('region', { name: 'Anchor artwork canvas' });
  vi.spyOn(area, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 200));
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(screen.getByLabelText('Zoom level')).toHaveTextContent('141%');
  fireEvent.click(canvas, { detail: 1, clientX: 35, clientY: 170 });
  const points = change.mock.lastCall![0];
  expect(points).toMatchObject([{ label: 'Anchor point', x: .25, y: .75 }]);

  rerender(<AnchorPointEditor layer={{ ...layer, anchorPoints: points }} onChange={change} />);
  fireEvent.click(canvas, { detail: 1, clientX: 60, clientY: 60 });
  expect(change).toHaveBeenLastCalledWith([{ ...points[0], x: .5, y: .2 }]);
});
