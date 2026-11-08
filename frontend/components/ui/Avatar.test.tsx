import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { Avatar } from './Avatar';

afterEach(cleanup);
test.each(['/uploads/avatar.png', 'https://photos.example.test/avatar.png', 'blob:https://example.test/photo'])('accepts existing direct image sources: %s', src => {
  render(<Avatar name="Alex" src={src} size={48} />);
  const image = screen.getByRole('img', { name: 'Alex' });
  expect(image.getAttribute('src')).toBe(src);
  expect(image.getAttribute('width')).toBe('48');
  expect(image.getAttribute('height')).toBe('48');
  expect(image.getAttribute('srcset')).toBeNull();
});
