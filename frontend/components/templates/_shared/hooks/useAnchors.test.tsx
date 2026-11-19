import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { T5_STAGES } from '../../Template5-dreamingfloral/data/t5Stages';
import { useAnchorsFor } from './useAnchors';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Preview({ editing = true, locked = false, action = vi.fn() }) {
  const { anchorProps } = useAnchorsFor(T5_STAGES, 't5', {
    't5.layout.mobile.welcome': JSON.stringify({ layers: [{ id: 'firstName', locked }] }),
  }, 'mobile', { enabled: editing, breakpoint: 'mobile' });
  return <>
    <div data-testid="card" {...anchorProps('welcome', 'card')}>
      <div {...anchorProps('welcome', 'firstName')}><svg><text>Aisyah</text></svg></div>
      <button {...anchorProps('welcome', 'badge')} onClick={action}>Invitation badge</button>
    </div>
    <div {...anchorProps('countdown', 'grid')}>
      <div {...anchorProps('countdown', 'blk-days')}>Days</div>
    </div>
  </>;
}

it('picks the closest built-in element, including SVG text, nested timer blocks and card backgrounds', () => {
  const post = vi.spyOn(window.parent, 'postMessage');
  render(<Preview />);
  fireEvent.click(screen.getByText('Aisyah'));
  expect(post).toHaveBeenLastCalledWith({ type: 'PREVIEW_LAYER_SELECT', stageId: 'welcome', layerId: 'firstName' }, window.location.origin);
  expect(post).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('Days'));
  expect(post).toHaveBeenLastCalledWith({ type: 'PREVIEW_LAYER_SELECT', stageId: 'countdown', layerId: 'blk-days' }, window.location.origin);
  fireEvent.click(screen.getByTestId('card'));
  expect(post).toHaveBeenLastCalledWith({ type: 'PREVIEW_LAYER_SELECT', stageId: 'welcome', layerId: 'card' }, window.location.origin);
});

it('respects locks and intercepts guest actions only while editing', () => {
  const post = vi.spyOn(window.parent, 'postMessage');
  const action = vi.fn();
  const view = render(<Preview locked action={action} />);
  fireEvent.click(screen.getByText('Aisyah'));
  expect(post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Invitation badge' }));
  expect(post).toHaveBeenCalledTimes(1);
  expect(action).not.toHaveBeenCalled();
  post.mockClear();
  view.rerender(<Preview editing={false} action={action} />);
  fireEvent.click(screen.getByRole('button', { name: 'Invitation badge' }));
  expect(action).toHaveBeenCalledTimes(1);
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByTestId('card')).not.toHaveAttribute('data-adjust-anchor');
});
