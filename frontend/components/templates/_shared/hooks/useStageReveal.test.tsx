import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useStageReveal } from './useStageReveal';

let notify: IntersectionObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();
class Observer implements IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [0, .15, .35];
  observe = observe;
  unobserve = vi.fn();
  disconnect = disconnect;
  takeRecords = () => [];
  constructor(callback: IntersectionObserverCallback) { notify = callback; }
}
function Fixture({ ids, reduced = false }: { ids: string[]; reduced?: boolean }) {
  const { rootRef, seen } = useStageReveal(reduced, ids.join(','));
  return <div ref={rootRef}>{ids.map(id => <section key={id} data-stage={id} data-testid={id} data-seen={seen.has(id)} />)}</div>;
}
function arrive(id: string) {
  const target = screen.getByTestId(id);
  const rect = target.getBoundingClientRect();
  const entry: IntersectionObserverEntry = { target, isIntersecting: true, intersectionRatio: .5,
    boundingClientRect: rect, intersectionRect: rect, rootBounds: null, time: 0 };
  notify([entry], new Observer(notify));
}
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
test('batches preserve each arrived stage and discover newly mounted stages', () => {
  vi.useFakeTimers(); vi.stubGlobal('IntersectionObserver', Observer);
  const view = render(<Fixture ids={['a', 'b']} />);
  act(() => { arrive('a'); arrive('b'); vi.advanceTimersByTime(150); });
  expect(screen.getByTestId('a').getAttribute('data-seen')).toBe('true');
  expect(screen.getByTestId('b').getAttribute('data-seen')).toBe('true');
  view.rerender(<Fixture ids={['b', 'c', 'a']} />);
  expect(observe).toHaveBeenLastCalledWith(screen.getByTestId('c'));
  act(() => { arrive('c'); vi.advanceTimersByTime(150); });
  expect(screen.getByTestId('c').getAttribute('data-seen')).toBe('true');
  expect(screen.getByTestId('a').getAttribute('data-seen')).toBe('true');
});
test('cancels pending reveals on cleanup and reveals all stages for reduced motion', () => {
  vi.useFakeTimers(); vi.stubGlobal('IntersectionObserver', Observer);
  const view = render(<Fixture ids={['a']} />);
  act(() => arrive('a'));
  view.rerender(<Fixture ids={['a', 'b']} reduced />);
  expect(disconnect).toHaveBeenCalledOnce();
  act(() => vi.advanceTimersByTime(200));
  expect(screen.getByTestId('a').getAttribute('data-seen')).toBe('true');
  expect(screen.getByTestId('b').getAttribute('data-seen')).toBe('true');
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
