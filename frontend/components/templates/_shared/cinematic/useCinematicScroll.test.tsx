import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCinematicScroll } from './useCinematicScroll';

const stops = [
  { at: .8255, easing: 'linear' as const, durationMs: 320 },
  { at: .9, easing: 'ease-out' as const, durationMs: 240 },
];
let offset: number;

function Scene({ reduced = false }: { reduced?: boolean }) {
  const { rootRef, progress, seek } = useCinematicScroll<HTMLDivElement>(reduced, stops);
  return <>
    <div ref={rootRef} />
    <output>{progress}</output>
    <button onClick={() => seek(.96)}>Navigate</button>
  </>;
}

function tick(frames = 1) {
  for (let i = 0; i < frames; i++) act(() => vi.advanceTimersToNextFrame());
}

function scrollTo(top: number) {
  offset = top;
  window.dispatchEvent(new Event('scroll'));
  tick();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  offset = 700;
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => offset);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => window.innerHeight + 1000);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top: -offset }) as DOMRect);
  vi.spyOn(window, 'scrollTo').mockImplementation((options: number | ScrollToOptions, y?: number) => {
    const top = typeof options === 'number' ? y : options.top;
    offset = Math.round(top ?? offset);
    window.dispatchEvent(new Event('scroll'));
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('catches the first crossed stop, eases to it and consumes the rest of the gesture', () => {
  render(<Scene />);
  tick();
  expect(screen.getByRole('status')).toHaveTextContent('0.7');
  scrollTo(960);
  expect(offset).toBe(826);
  expect(screen.getByRole('status')).toHaveTextContent('0.7');

  tick(10);
  expect(Number(screen.getByRole('status').textContent)).toBeCloseTo(.76275, 5);
  scrollTo(975); // Momentum crosses both markers again.
  expect(offset).toBe(826);
  tick(22);
  expect(screen.getByRole('status').textContent).toBe('0.8255');

  scrollTo(960);
  expect(offset).toBe(900);
  tick(20);
  expect(screen.getByRole('status').textContent).toBe('0.9');
  scrollTo(770);
  expect(offset).toBe(770);
  expect(screen.getByRole('status').textContent).toBe('0.77');
});

it('lands immediately with reduced motion and lets explicit navigation bypass stops', () => {
  render(<Scene reduced />);
  tick();
  scrollTo(960);
  expect(screen.getByRole('status').textContent).toBe('0.8255');

  act(() => screen.getByRole('button', { name: 'Navigate' }).click());
  tick();
  expect(offset).toBe(960);
  expect(screen.getByRole('status').textContent).toBe('0.96');
});
