'use client';
import { useMemo } from 'react';
import { EngineProvider, type Engine } from './engine';
import Layer from './Layer';
import { resolveStage } from './layout';
import type { Breakpoint, EditorHandle, StageDef } from './types';

export interface SectionOverlayProps {
  stageId: string;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
}
/** Decorations share layout mechanics; each template retains its asset root and exclusions. */
export default function SectionOverlay({ stageId, breakpoint, config, editor, prefix, stages, engine, className,
  stageAttributes = true, shippedProps, excludeSlots = false, eager = false }: SectionOverlayProps & {
  prefix: string; stages: Record<string, StageDef>; engine: Engine; className: string;
  stageAttributes?: boolean; shippedProps?: Record<string, Set<string>>; excludeSlots?: boolean; eager?: boolean;
}) {
  const def = stages[stageId];
  const layers = useMemo(() => def ? resolveStage(prefix, def, breakpoint, config).layers : [], [prefix, def, breakpoint, config]);
  const editing = Boolean(editor?.enabled), active = editing && editor?.selectedStage === stageId;
  const visible = layers.filter((layer) => !layer.hidden && layer.kind !== 'anchor' && !(excludeSlots && layer.kind === 'slot')
    && !(layer.kind === 'img' && shippedProps?.[stageId]?.has(layer.id)));
  if (!visible.length) return null;
  return <EngineProvider value={engine}>
    <div className={className} data-stage={stageAttributes ? stageId : undefined} data-seen={stageAttributes ? 'true' : undefined} data-editing={editing || undefined}>
      {visible.map((layer) => <Layer key={layer.id} layer={layer} eager={eager} selected={active && editor?.selectedLayer === layer.id}
        editing={editing} stageActive={active} stageId={stageId} />)}
    </div>
  </EngineProvider>;
}
