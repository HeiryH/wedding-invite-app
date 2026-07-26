'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T1_STAGES } from './data/t1Stages';

/**
 * Template 1's anchor hook — a thin instantiation of the shared factory (see
 * `_shared/hooks/useAnchors.ts` for the actual logic, which used to be duplicated here
 * byte-for-byte across all six hybrid-overlay templates).
 */
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  return useAnchorsFor(T1_STAGES, 't1', config, breakpoint, editor);
}
