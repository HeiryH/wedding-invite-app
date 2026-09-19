import type { CSSProperties } from 'react';
import type { AnimIdleOrigin, AnimIdleType } from './types';

/** Base loop duration (seconds) per idle type, before `animIdleSpeed` divides it. Matches the
 *  `@keyframes` cadence declared in reveal.css — keep the two in sync if either changes. */
export const IDLE_BASE_DUR: Record<Exclude<AnimIdleType, 'none'>, number> = {
  // motion
  wave: 2.6,
  sway: 3.2,
  pendulum: 2.8,
  float: 3.4,
  drift: 4.2,
  bounce: 1.6,
  wobble: 2.2,
  spin: 6,
  tilt: 4,
  // scale
  pulse: 1.8,
  breathe: 3.6,
  heartbeat: 1.4,
  // twitchy
  jitter: 2.4,
  shake: 3,
  glitch: 3.6,
  // opacity / colour
  flicker: 2.2,
  blink: 1.2,
  hue: 5,
};

/** Idle types whose motion pivots — rotation or scale — so a transform-origin visibly changes the
 *  result (a sign swaying from its hook vs. its middle). Pure translation/opacity types (jitter,
 *  glitch, float, drift, shake, flicker, blink, hue, bounce) are origin-agnostic, so the Adjust
 *  panel hides the Anchor picker for them. */
export const IDLE_ANCHORED: ReadonlySet<AnimIdleType> = new Set<AnimIdleType>([
  'wave', 'sway', 'pendulum', 'wobble', 'spin', 'tilt', 'pulse', 'breathe', 'heartbeat',
]);

/** Where each anchored type pivots when the layer hasn't chosen an origin. Pendulum hangs from
 *  the top by construction; everything else spins/scales about its centre (the pre-anchor
 *  behaviour, so existing invitations render unchanged). */
export const IDLE_DEFAULT_ORIGIN: Partial<Record<AnimIdleType, AnimIdleOrigin>> = {
  pendulum: 'top',
};

const ORIGIN_CSS: Record<AnimIdleOrigin, string> = {
  'top-left': 'left top', top: 'center top', 'top-right': 'right top',
  left: 'left center', center: 'center center', right: 'right center',
  'bottom-left': 'left bottom', bottom: 'center bottom', 'bottom-right': 'right bottom',
};

/** Effective transform-origin for an idle layer, or undefined when the type doesn't pivot. */
export function idleOriginCss(type: AnimIdleType, origin?: AnimIdleOrigin): string | undefined {
  if (!IDLE_ANCHORED.has(type)) return undefined;
  return ORIGIN_CSS[origin ?? IDLE_DEFAULT_ORIGIN[type] ?? 'center'];
}

/** The inline style the idle element needs: intensity + duration vars, plus the pivot. Shared by
 *  Layer.tsx (`.layerIdle`) and useAnchors' `ax()` so both render paths stay identical. */
export function idleInlineStyle(
  type: Exclude<AnimIdleType, 'none'>,
  opts: { speed?: number; intensity?: number; origin?: AnimIdleOrigin },
): CSSProperties {
  const style: CSSProperties & Record<string, string | number> = {
    '--sl-idle-intensity': opts.intensity ?? 1,
    '--sl-idle-dur': `${IDLE_BASE_DUR[type] / (opts.speed ?? 1)}s`,
  };
  const origin = idleOriginCss(type, opts.origin);
  if (origin) style.transformOrigin = origin;
  return style;
}
