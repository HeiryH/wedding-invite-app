'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T5_STAGES } from './data/t5Stages';

/**
 * Template 5's anchor hook — a thin instantiation of the shared factory (see
 * `_shared/hooks/useAnchors.ts` for the actual logic, which used to be duplicated here
 * byte-for-byte across all six hybrid-overlay templates). T5 has no connector anchor (its
 * welcome section renders names as SVG arc-text, which a transform nudge can't target), but this
 * extraction is applied for consistency regardless.
 */
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  return useAnchorsFor(T5_STAGES, 't5', config, breakpoint, editor);
}
