'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T11_STAGES } from './data/roseHorizonStages';

/**
 * Template 11's anchor hook — a thin instantiation of the shared factory, same shape as every
 * other Classic template's own `useAnchors.ts` (compare Template3-gardenromance/useAnchors.ts).
 */
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  return useAnchorsFor(T11_STAGES, 't11', config, breakpoint, editor);
}
