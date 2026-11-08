'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T5_STAGES } from './data/t5Stages';

// The shared hook resolves per-breakpoint anchor styles from the Dreaming Floral Sky stages.
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  return useAnchorsFor(T5_STAGES, 't5', config, breakpoint, editor);
}
