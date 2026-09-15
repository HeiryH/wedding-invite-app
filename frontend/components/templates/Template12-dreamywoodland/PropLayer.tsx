import { useMemo } from 'react';
import type { SectionCode } from '@/lib/templateUtils';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { EngineProvider, type Engine } from '@/components/templates/_shared/engine';
import Layer from '@/components/templates/_shared/Layer';
import { resolveStage } from '@/components/templates/_shared/layout';
import { SHIPPED_PROP_IDS, T12_STAGES } from './data/dreamyWoodlandStages';
import styles from './PropLayer.module.css';

const ENGINE: Engine = { assetRoot: '/templates/dreamy-woodland', assetSizes: {}, slotRegistry: {} };

export function PropLayer({ section, breakpoint, config, editor }: {
  section: SectionCode;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
}) {
  const def = T12_STAGES[section];
  const { layers } = useMemo(() => resolveStage('t12', def, breakpoint, config), [def, breakpoint, config]);
  const shipped = SHIPPED_PROP_IDS[section] ?? new Set<string>();
  const props = layers.filter((layer) => layer.kind === 'img' && !layer.hidden && shipped.has(layer.id));
  const editing = Boolean(editor?.enabled);
  const active = editing && editor?.selectedStage === section;

  return (
    <EngineProvider value={ENGINE}>
      <div className={styles.wrap} data-editing={editing || undefined}>
        {props.map((layer) => <Layer key={layer.id} layer={layer} eager={section === 'welcome'} editing={editing}
          stageActive={active} stageId={section} selected={active && editor?.selectedLayer === layer.id} />)}
      </div>
    </EngineProvider>
  );
}
