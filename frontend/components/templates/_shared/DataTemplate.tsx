'use client';

import { EngineProvider } from './engine';
import { useStageReveal } from './hooks/useStageReveal';
import { useParallax } from './hooks/useParallax';
import { useStageLayout } from './layout';
import Stage from './Stage';
import type { StageDef, SlotProps, Breakpoint, EditorHandle } from './types';

/**
 * Proof-of-concept: a template defined entirely as data (a `Record<StageId, StageDef>`), rendered
 * through the exact same shared engine every hand-coded template already uses — no per-template
 * React component. Mirrors Template7-romangarden/index.tsx's core render loop (EngineProvider +
 * useStageLayout + one <Stage> per resolved stage), stripped of T7-specific concerns it doesn't
 * need yet (section-code resolution, the ceremony horizontal rail, nav bar). Anchor and slot
 * layers are out of scope for this proof — an authored template is art/text/shape only for now.
 */
export interface DataTemplateProps {
  /** The whole composition — what an authoring UI would eventually persist to the DB. */
  stages: Record<string, StageDef>;
  /** Render order. */
  stageIds: string[];
  /** Config-key namespace for this template's layouts, same convention as every built-in template
   *  ('t1'..'t7') — an authored template gets its own, e.g. 'ta12'. */
  keyPrefix: string;
  assetRoot: string;
  assetSizes?: Record<string, [number, number]>;
  breakpoint: Breakpoint;
  customConfig?: Record<string, string>;
  slotProps: SlotProps;
  editor?: EditorHandle;
}

export default function DataTemplate({
  stages, stageIds, keyPrefix, assetRoot, assetSizes = {},
  breakpoint, customConfig, slotProps, editor,
}: DataTemplateProps) {
  const editing = Boolean(editor?.enabled);
  const resolved = useStageLayout(keyPrefix, stages, stageIds, breakpoint, customConfig);
  const { rootRef, seen } = useStageReveal(false);
  useParallax(rootRef, 'on', false);

  return (
    <EngineProvider value={{ assetRoot, assetSizes, slotRegistry: {} }}>
      <div ref={rootRef}>
        {resolved.map((r, i) => (
          <Stage
            key={r.def.id}
            def={r.def}
            layers={r.layers.filter((l) => l.kind !== 'anchor')}
            bgFit={r.bgFit}
            bgPosition={r.bgPosition}
            bgScale={r.bgScale}
            bgSrc={r.bgSrc}
            seen={seen.has(r.def.id)}
            slotProps={slotProps}
            eager={i === 0}
            editing={editing && editor?.selectedStage === r.def.id}
            selectedLayer={editor?.selectedLayer}
          />
        ))}
      </div>
    </EngineProvider>
  );
}
