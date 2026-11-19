import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import CinematicFontPicker from './CinematicFontPicker';

it('previews hovered and keyboard-highlighted fonts, and commits only a confirmed choice', () => {
  const onPreview = vi.fn(), onChange = vi.fn();
  render(<CinematicFontPicker value="cinzel" defaultLabel="Template default" onPreview={onPreview} onChange={onChange} />);
  const picker = screen.getByRole('combobox', { name: 'Font' });
  fireEvent.click(picker);
  fireEvent.pointerMove(screen.getByRole('option', { name: 'Sacramento' }), { pointerType: 'mouse' });
  expect(onPreview).toHaveBeenLastCalledWith('sacramento');
  fireEvent.keyDown(picker, { key: 'ArrowDown' });
  expect(onPreview).toHaveBeenLastCalledWith('parisienne');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.keyDown(picker, { key: 'Escape' });
  expect(onPreview).toHaveBeenLastCalledWith();
  expect(picker).toHaveTextContent('Cinzel');
  fireEvent.click(picker);
  fireEvent.click(screen.getByRole('option', { name: 'Template default' }));
  expect(onChange).toHaveBeenCalledExactlyOnceWith('');
  expect(picker).toHaveAttribute('aria-expanded', 'false');
});
