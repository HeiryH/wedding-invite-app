'use client';

import { useMemo } from 'react';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { EngineProvider, type Engine } from '@/components/templates/_shared/engine';
import Layer from '@/components/templates/_shared/Layer';
import { resolveStage } from '@/components/templates/_shared/layout';
import { T4_STAGES, T4_ASSETS } from './data/t4Stages';
import styles from './SectionOverlay.module.css';

// Decorative layers are text/shape/uploaded-img only (no shipped slot registry, no bundled art).
const ENGINE: Engine = { assetRoot: T4_ASSETS, assetSizes: {}, slotRegistry: {} };

/**
 * Renders the decorative layer overlay for one Template 4 block. Reads the couple's
 * `t4.layout.<breakpoint>.<stageId>` delta straight from customConfig (the Adjust dock in the
 * customize page writes it), so this is display-only — no local state, no patch protocol.
 */
export default function SectionOverlay({
  stageId, breakpoint, config, editor,
}: {
  stageId: string;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
}) {
  const def = T4_STAGES[stageId];
  const { layers } = useMemo(
    () => resolveStage('t4', def, breakpoint, config),
    [def, breakpoint, config],
  );

  const editing = Boolean(editor?.enabled) && editor?.selectedStage === stageId;
  // Anchor layers have no overlay visual — they nudge real DOM elements (see useAnchors).
  const visible = layers.filter((l) => !l.hidden && l.kind !== 'anchor');
  if (!visible.length) return null;

  return (
    <EngineProvider value={ENGINE}>
      <div className={styles.overlay} data-stage={stageId} data-seen="true" data-editing={editing || undefined}>
        {visible.map((l) => (
          <Layer
            key={l.id}
            layer={l}
            eager={false}
            selected={editing && editor?.selectedLayer === l.id}
            editing={editing}
          />
        ))}
      </div>
    </EngineProvider>
  );
}
