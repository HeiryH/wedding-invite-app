'use client';

import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { T12_STAGES } from './data/dreamyWoodlandStages';

export function useAnchors(config: Record<string, string> | undefined, breakpoint: Breakpoint, editor?: EditorHandle) {
  return useAnchorsFor(T12_STAGES, 't12', config, breakpoint, editor);
}
