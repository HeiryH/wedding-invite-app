import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountdownToDate } from './useCountdownToDate';

afterEach(() => vi.useRealTimers());

describe('legacy countdown used by T4 and T5', () => {
  it('updates a changed target without remounting, ticks and retains zero at expiry', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-08T00:00:00Z'));
    const { result, rerender, unmount } = renderHook(({ target }) => useCountdownToDate(target), {
      initialProps: { target: new Date('2026-11-09T00:00:00Z') },
    });
    expect(result.current.days).toBe(1);
    rerender({ target: new Date('2026-11-10T00:00:00Z') });
    expect(result.current.days).toBe(2);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toEqual({ days: 1, hours: 23, minutes: 59, seconds: 59 });
    rerender({ target: new Date('2026-11-07T00:00:00Z') });
    expect(result.current).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});
