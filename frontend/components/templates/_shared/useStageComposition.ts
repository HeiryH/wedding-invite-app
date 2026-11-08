'use client';
import { useMemo } from 'react';
import { useStageLayout } from './layout';
import { sheetLayerGroups } from './slots';
import { useStageReveal } from './hooks/useStageReveal';
import { useParallax } from './hooks/useParallax';
import type { Breakpoint, SlotProps, StageDef } from './types';

/** Common Stage wiring; rail grouping, themed markup and custom slot registries stay local. */
export function useStageComposition(prefix: string, definitions: Record<string, StageDef>, ids: string[], breakpoint: Breakpoint,
  config: Record<string, string> | undefined, slotProps: SlotProps, reduced: boolean, parallax: string) {
  const stages = useStageLayout(prefix, definitions, ids, breakpoint, config);
  const sheetGroups = useMemo(() => sheetLayerGroups(stages, slotProps), [stages, slotProps]);
  const { rootRef, seen } = useStageReveal(reduced, ids.join(','));
  useParallax(rootRef, parallax, reduced);
  return { stages, sheetGroups, rootRef, seen };
}
