'use client';

import { useEffect, useRef, useState } from 'react';
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

/**
 * Converts one tall scroll track into a stable 0..1 playhead. The scene itself stays sticky, so
 * every camera beat is driven by the guest's scroll position and reverses naturally when they
 * scroll back. Only one passive listener and one rAF run for the whole cinematic invitation.
 */
export function useCinematicScroll<T extends HTMLElement>(reducedMotion = false) {
  const rootRef = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
      const raw = clamp(-rect.top / travel);
      // Reduced motion preserves the narrative and all interactions, but changes between a small
      // number of still compositions instead of continuously travelling through virtual space.
      const next = reducedMotion ? Math.round(raw * 10) / 10 : raw;
      setProgress((current) => Math.abs(current - next) > 0.0005 ? next : current);
    };
    const queue = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    queue();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const seek = (target: number) => {
    const root = rootRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: top + clamp(target) * travel, behavior: reducedMotion ? 'auto' : 'smooth' });
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
