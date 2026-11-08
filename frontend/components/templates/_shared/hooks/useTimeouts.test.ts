import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useTimeouts } from './useTimeouts';
afterEach(() => vi.useRealTimers());
it('runs mounted actions and cancels outstanding invite actions on unmount', () => {
  vi.useFakeTimers(); const action = vi.fn(); const { result, unmount } = renderHook(useTimeouts);
  act(() => { result.current(action, 100); }); act(() => vi.advanceTimersByTime(100)); expect(action).toHaveBeenCalledOnce();
  act(() => { result.current(action, 100); }); unmount(); act(() => vi.advanceTimersByTime(100)); expect(action).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
});
