import type { AnimIdleType } from './types';

/** Base loop duration (seconds) per idle type, before `animIdleSpeed` divides it. Matches the
 *  `@keyframes` cadence declared in reveal.css — keep the two in sync if either changes. */
export const IDLE_BASE_DUR: Record<Exclude<AnimIdleType, 'none'>, number> = {
  wave: 2.6,
  sway: 3.2,
  pulse: 1.8,
  jitter: 2.4,
  glitch: 3.6,
};
