'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Makes every framer-motion animation honor the visitor's OS "reduce motion"
 * preference. `reducedMotion="user"` disables transform/layout animations for
 * those users while keeping opacity fades, so the UI stays legible without motion.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
