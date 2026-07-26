'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T6_STAGES } from './data/t6Stages';

/**
 * Template 6's anchor hook — a thin instantiation of the shared factory (see
 * `_shared/hooks/useAnchors.ts` for the actual logic, which used to be duplicated here
 * byte-for-byte across all six hybrid-overlay templates).
 */
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  return useAnchorsFor(T6_STAGES, 't6', config, breakpoint, editor);
}
