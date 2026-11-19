'use client';

import { useMemo } from 'react';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useAnchorsFor } from '@/components/templates/_shared/hooks/useAnchors';
import { t5Stages } from './data/t5Stages';

// The shared hook resolves per-breakpoint anchor styles from the Dreaming Floral Sky stages.
export function useAnchors(
  config: Record<string, string> | undefined,
  breakpoint: Breakpoint,
  editor?: EditorHandle,
) {
  const stages = useMemo(() => t5Stages(config), [config]);
  return useAnchorsFor(stages, 't5', config, breakpoint, editor);
}
