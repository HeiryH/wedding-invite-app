'use client';
import { useCountdown } from './useCountdown';

/** Keep T4/T5's legacy zero-at-expiry presentation. */
export function useCountdownToDate(target: Date) {
  return useCountdown(target, { expired: 'zero' })!;
}
