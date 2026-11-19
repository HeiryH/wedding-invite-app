import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import TemplateNav from './TemplateNav';

afterEach(cleanup);

it('supports a template theme and emoji icons alongside the navigation editor settings', () => {
  const onNav = vi.fn();
  render(<TemplateNav className="floral-navigation" active="welcome" onNav={onNav}
    items={[{ id: 'welcome', label: 'Welcome', icon: '💍' }, { id: 'wishes', label: 'Wishes', icon: '✨', badge: true }]}
    config={{ 'nav.content': 'icons', 'nav.position': 'right', 'nav.label.wishes': 'Blessings', 'nav.gap': '8' }} />);
  const nav = screen.getByRole('navigation', { name: 'Sections' });
  expect(nav).toHaveClass('floral-navigation');
  expect(nav).toHaveAttribute('data-nav-position', 'right');
  expect(nav).toHaveAttribute('data-nav-style', 'pill');
  expect(screen.getByRole('button', { name: 'Welcome' })).toHaveTextContent('💍');
  expect(screen.getByRole('button', { name: 'Blessings' })).toHaveAttribute('data-badge', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Blessings' }));
  expect(onNav).toHaveBeenCalledWith('wishes');
});

it('keeps shared default icons and honors uploaded icons and menu order', () => {
  const props = { active: 'welcome', onNav: vi.fn(), items: [{ id: 'welcome', label: 'Cover' }, { id: 'wishes', label: 'Wishes' }] };
  const view = render(<TemplateNav {...props} config={{ 'nav.content': 'icons' }} />);
  expect(screen.getByRole('button', { name: 'Cover' })).toHaveTextContent('⌂');
  view.rerender(<TemplateNav {...props} config={{ 'nav.content': 'icons', 'nav.items': 'wishes', 'nav.icon.wishes': '/uploads/custom.svg' }} />);
  expect(screen.queryByRole('button', { name: 'Cover' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Wishes' }).querySelector('img')).toHaveAttribute('src', expect.stringContaining('/uploads/custom.svg'));
});
