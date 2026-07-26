'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T2_STAGES } from './data/t2Stages';

/**
 * Template 2's anchor hook — a thin instantiation of the shared factory (see
 * `_shared/hooks/useAnchors.ts` for the actual logic, which used to be duplicated here
 * byte-for-byte across all six hybrid-overlay templates).
 */
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  return useAnchorsFor(T2_STAGES, 't2', config, breakpoint, editor);
}
