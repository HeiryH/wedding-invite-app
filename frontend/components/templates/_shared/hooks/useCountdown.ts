'use client';
import { useSyncExternalStore } from 'react';

export interface Countdown { days: number; hours: number; minutes: number; seconds: number }
const zero: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
const clocks = new Map<number, { now: number; listeners: Set<() => void>; timer?: ReturnType<typeof setInterval>; subscribe: (listener: () => void) => () => void }>();
function clockFor(cadence: number) {
  let clock = clocks.get(cadence);
  if (!clock) {
    const value = { now: 0, listeners: new Set<() => void>(), timer: undefined as ReturnType<typeof setInterval> | undefined,
      subscribe(listener: () => void) {
        value.listeners.add(listener);
        if (!value.timer) {
          value.now = Date.now();
          value.timer = setInterval(() => { value.now = Date.now(); value.listeners.forEach((notify) => notify()); }, cadence);
        }
        return () => { value.listeners.delete(listener); if (!value.listeners.size) { clearInterval(value.timer); value.timer = undefined; } };
      },
    };
    clock = value; clocks.set(cadence, clock);
  }
  return clock;
}

/** One timer per cadence, with a deterministic server snapshot and explicit expiry behavior. */
export function useCountdown(target: string | Date, { cadence = 1000, expired = 'hide' }: { cadence?: number; expired?: 'hide' | 'zero' } = {}): Countdown | null {
  const clock = clockFor(cadence);
  const now = useSyncExternalStore(clock.subscribe, () => clock.now, () => 0);
  if (!now) return expired === 'zero' ? zero : null;
  const remaining = new Date(target).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return expired === 'zero' ? zero : null;
  return { days: Math.floor(remaining / 86400000), hours: Math.floor((remaining / 3600000) % 24), minutes: Math.floor((remaining / 60000) % 60), seconds: Math.floor((remaining / 1000) % 60) };
}
