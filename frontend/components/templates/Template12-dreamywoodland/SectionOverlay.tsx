'use client';

import { useMemo } from 'react';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { EngineProvider, type Engine } from '@/components/templates/_shared/engine';
import Layer from '@/components/templates/_shared/Layer';
import { resolveStage } from '@/components/templates/_shared/layout';
import { SHIPPED_PROP_IDS, T12_STAGES } from './data/dreamyWoodlandStages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: '/templates/dreamy-woodland', assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay({ stageId, breakpoint, config, editor }: {
  stageId: string;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
}) {
  const def = T12_STAGES[stageId];
  const { layers } = useMemo(() => resolveStage('t12', def, breakpoint, config), [def, breakpoint, config]);
  const editing = Boolean(editor?.enabled);
  const active = editing && editor?.selectedStage === stageId;
  const shipped = SHIPPED_PROP_IDS[stageId] ?? new Set<string>();
  const visible = layers.filter((layer) => !layer.hidden && layer.kind !== 'anchor' && layer.kind !== 'slot'
    && !(layer.kind === 'img' && shipped.has(layer.id)));
  if (!visible.length) return null;

  return (
    <EngineProvider value={ENGINE}>
      <div className={styles.overlay} data-editing={editing || undefined}>
        {visible.map((layer) => <Layer key={layer.id} layer={layer} eager={stageId === 'welcome'} editing={editing}
          stageActive={active} stageId={stageId} selected={active && editor?.selectedLayer === layer.id} />)}
      </div>
    </EngineProvider>
  );
}
