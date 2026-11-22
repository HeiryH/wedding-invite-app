'use client';

import { useEffect, useRef, useState } from 'react';
import { animateScrollTo } from '../animateScrollTo';
import { effectEase, type CinematicScrollStop } from './direction';
import type { CinematicCameraTransition } from './sequence';

export interface CameraState {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface CameraKeyframe extends Omit<CameraState, 'rotate'> {
  at: number;
  rotate?: number;
  transitionIn?: CinematicCameraTransition;
  /** Optional shipped desktop framing; mobile remains the primary camera direction. */
  desktop?: Partial<CameraState>;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number, transition: CinematicCameraTransition = 'ease-out') => {
  const amount = clamp(value);
  if (transition === 'cut') return amount >= 1 ? 1 : 0;
  if (transition === 'linear') return amount;
  if (transition === 'ease-in') return amount * amount * amount;
  if (transition === 'ease-in-out') {
    return amount < .5 ? 4 * amount * amount * amount : 1 - Math.pow(-2 * amount + 2, 3) / 2;
  }
  if (transition === 'hold') {
    if (amount < .6) return 0;
    const moving = (amount - .6) / .4;
    return 1 - Math.pow(1 - moving, 3);
  }
  return 1 - Math.pow(1 - amount, 3);
};
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** Samples a scroll camera without tying the shared primitive to one template's scene graph. */
export function sampleCamera(progress: number, frames: CameraKeyframe[]): CameraState {
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (!first || !last) return { x: 0, y: 0, scale: 1, rotate: 0 };
  if (progress <= first.at) return { ...first, rotate: first.rotate ?? 0 };
  if (progress >= last.at) return { ...last, rotate: last.rotate ?? 0 };

  const rightIndex = frames.findIndex((frame) => frame.at >= progress);
  const left = frames[Math.max(0, rightIndex - 1)];
  const right = frames[rightIndex];
  const amount = ease(
    (progress - left.at) / Math.max(right.at - left.at, 0.0001),
    right.transitionIn,
  );
  return {
    x: mix(left.x, right.x, amount),
    y: mix(left.y, right.y, amount),
    scale: mix(left.scale, right.scale, amount),
    rotate: mix(left.rotate ?? 0, right.rotate ?? 0, amount),
  };
}

type ScrollStop = Pick<CinematicScrollStop, 'at' | 'easing' | 'durationMs'>;

const NO_STOPS: ScrollStop[] = [];
const GESTURE_QUIET_MS = 180;
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);

/** Drive the sticky scene from native scroll and catch the first stop crossed in a forward gesture. */
export function useCinematicScroll<T extends HTMLElement>(reducedMotion = false, stops = NO_STOPS) {
  const rootRef = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const navigation = useRef<{ at: number; until: number } | null>(null);

  useEffect(() => {
    const markers = [...stops].sort((left, right) => left.at - right.at);
    let previous: number | undefined;
    let restingAt: number | undefined;
    let raf = 0;
    let touching = false;
    let lastWheel = -Infinity;
    const keys = new Set<string>();
    let latch: { stop: ScrollStop; from: number; start: number; lastInput: number } | undefined;

    const update = (now: number) => {
      raf = 0;
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
      const raw = clamp(-rect.top / travel);
      const pixel = 1 / travel;
      const explicitNavigation = navigation.current;
      if (explicitNavigation) {
        latch = undefined;
        restingAt = undefined;
        if (Math.abs(raw - explicitNavigation.at) <= pixel || now >= explicitNavigation.until) navigation.current = null;
      }
      if (latch && raw < latch.stop.at - 2 * pixel) {
        // Use the stop as the baseline when a guest reverses direction at it.
        latch = undefined;
        restingAt = undefined;
      }
      if (restingAt !== undefined && Math.abs(raw - restingAt) > pixel) restingAt = undefined;
      if (!latch && !explicitNavigation && previous !== undefined && raw > previous) {
        const baseline = previous;
        const stop = markers.find(({ at }) => at > baseline && at <= raw + pixel / 2);
        if (stop) latch = { stop, from: previous, start: now, lastInput: now };
      }
      if (latch) {
        const { stop, from, start } = latch;
        const drift = -rect.top - stop.at * travel;
        if (Math.abs(drift) > 1) {
          latch.lastInput = now;
          window.scrollTo({ top: window.scrollY - drift, behavior: 'instant' });
        }
        const amount = reducedMotion || !stop.durationMs ? 1 : clamp((now - start) / stop.durationMs);
        previous = stop.at;
        restingAt = stop.at;
        setProgress(amount === 1 ? stop.at : mix(from, stop.at, effectEase(amount, stop.easing)));
        const quiet = now - latch.lastInput >= GESTURE_QUIET_MS;
        if (amount === 1 && quiet && !touching && keys.size === 0) latch = undefined;
        else if (amount < 1 || !quiet) queue();
        return;
      }

      previous = restingAt ?? raw;
      const next = reducedMotion && !markers.length ? Math.round(previous * 10) / 10 : previous;
      setProgress(next);
    };
    function queue() { if (!raf) raf = window.requestAnimationFrame(update); }
    const releaseSettledStop = (now: number) => {
      if (latch && (reducedMotion || now - latch.start >= latch.stop.durationMs)) latch = undefined;
    };
    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0) return;
      const now = performance.now();
      if (now - lastWheel >= GESTURE_QUIET_MS && !touching && keys.size === 0) releaseSettledStop(now);
      lastWheel = now;
      if (latch) {
        latch.lastInput = now;
        queue();
      }
    };
    const onTouchStart = () => {
      if (!touching) releaseSettledStop(performance.now());
      touching = true;
    };
    const onTouchEnd = (event: TouchEvent) => { touching = event.touches.length > 0; queue(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !SCROLL_KEYS.has(event.key)) return;
      if (!event.repeat && keys.size === 0 && !touching) releaseSettledStop(performance.now());
      keys.add(event.key);
    };
    const onKeyUp = (event: KeyboardEvent) => { if (keys.delete(event.key)) queue(); };
    const onBlur = () => { touching = false; keys.clear(); queue(); };
    const onHashChange = () => { previous = undefined; latch = undefined; restingAt = undefined; queue(); };

    queue();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    if (markers.length) {
      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('touchcancel', onTouchEnd, { passive: true });
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
      window.addEventListener('hashchange', onHashChange);
    }
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('hashchange', onHashChange);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion, stops]);

  const seek = (target: number, duration?: number) => {
    const root = rootRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
    const at = clamp(target);
    navigation.current = { at, until: performance.now() + 2000 };
    const position = top + at * travel;
    if (duration !== undefined && !reducedMotion) animateScrollTo(position, duration);
    else window.scrollTo({ top: position, behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  return { rootRef, progress, seek };
}

export function range(progress: number, start: number, end: number): number {
  return clamp((progress - start) / Math.max(end - start, 0.0001));
}

export function windowed(progress: number, enter: number, hold: number, exit: number): number {
  if (progress <= enter || progress >= exit) return 0;
  if (progress < hold) return range(progress, enter, hold);
  return 1 - range(progress, hold, exit);
}
