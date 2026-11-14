'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EngineProvider, type Engine } from './engine';
import Layer from './Layer';
import GroupedLayers from './GroupedLayers';
import { classicGroupPlane } from './classicGroupPlane';
import { useParallax } from './hooks/useParallax';
import { useReducedMotion } from '@/lib/useReducedMotion';
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
  const resolved = useMemo(() => def ? resolveStage(prefix, def, breakpoint, config) : undefined, [prefix, def, breakpoint, config]);
  const layers = resolved?.layers ?? [];
  const groups = resolved?.groups.filter((group) => layers.every((layer) =>
    !group.memberIds.includes(layer.id) || classicGroupPlane(prefix, stageId, layer) === 'overlay'));
  const overlayRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const needsExitTracking = stageAttributes && Boolean(groups?.some((group) => group.animOut && group.animOut !== 'none'));
  useParallax(overlayRef, 'off', reduced || !needsExitTracking);
  const [arrived, setArrived] = useState(false);
  const observeEntrance = stageAttributes && !reduced && Boolean(groups?.some((group) => group.anim && group.anim !== 'none'));
  useEffect(() => {
    const element = overlayRef.current;
    if (!observeEntrance || arrived || !element) return;
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setArrived(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setArrived(true);
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [observeEntrance, arrived, stageId]);

  const editing = Boolean(editor?.enabled), active = editing && editor?.selectedStage === stageId;
  const visible = layers.filter((layer) => !layer.hidden && layer.kind !== 'anchor' && !(excludeSlots && layer.kind === 'slot')
    && !(layer.kind === 'img' && shippedProps?.[stageId]?.has(layer.id)));
  if (!visible.length) return null;
  return <EngineProvider value={engine}>
    <div ref={overlayRef} className={className} data-stage={stageAttributes ? stageId : undefined} data-seen={stageAttributes ? 'true' : undefined} data-editing={editing || undefined}>
      <GroupedLayers layers={visible} groups={groups} stageId={stageId}
        waitForEntrance={observeEntrance && !arrived}
        selectedLayer={active ? editor?.selectedLayer : undefined}
        renderLayer={(layer) => <Layer key={layer.id} layer={layer} eager={eager} selected={active && editor?.selectedLayer === layer.id}
          editing={editing} stageActive={active} stageId={stageId} />} />
    </div>
  </EngineProvider>;
}
