'use client';

import { useMemo } from 'react';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { EngineProvider, type Engine } from '@/components/templates/_shared/engine';
import Layer from '@/components/templates/_shared/Layer';
import { resolveStage } from '@/components/templates/_shared/layout';
import { T11_STAGES, SHIPPED_PROP_IDS } from './data/roseHorizonStages';
import styles from './SectionOverlay.module.css';

// Decorative layers are text/shape/uploaded-img only (no shipped slot registry, no bundled art) —
// same shape as every other Classic template's SectionOverlay (compare Template3's).
const ENGINE: Engine = { assetRoot: '/templates/rose-horizon', assetSizes: {}, slotRegistry: {} };

/**
 * Renders the decorative layer overlay for one Rose Horizon section — couple-added "+Text/+Shape/
 * +Image" extras. The template's own shipped `PropLayer` art is deliberately excluded (see
 * `SHIPPED_PROP_IDS`'s doc comment) — it's owned by PropLayer.tsx instead, which applies
 * reserved-zone collision avoidance on top of it; rendering it here too would double it up.
 * Reads the couple's `t11.layout.<breakpoint>.<stageId>` delta straight from customConfig (the
 * Adjust dock in the customize page writes it), so this is display-only — no local state, no
 * patch protocol.
 */
export default function SectionOverlay({
  stageId, breakpoint, config, editor,
}: {
  stageId: string;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
}) {
  const def = T11_STAGES[stageId];
  const { layers } = useMemo(
    () => resolveStage('t11', def, breakpoint, config),
    [def, breakpoint, config],
  );

  const dockOpen = Boolean(editor?.enabled);
  const stageActive = dockOpen && editor?.selectedStage === stageId;
  // Anchor layers have no overlay visual — they nudge real DOM elements (see useAnchors).
  // A shipped prop (`kind:'img'` with an id PropLayer.tsx already owns) is excluded so it isn't
  // rendered twice; a couple-added image (any other `img` id) still comes through here.
  // `kind:'slot'` is excluded too — RSVP/Wishes/Schedule/Photos ship real slot layers now (see
  // Template11.tsx's `flowSlotsFor`), which already render through their own document-flow path;
  // without this exclusion they'd ALSO render here as a second, absolutely-positioned copy sitting
  // centred on top of the real one (this component only ever owns couple-added "+Text/+Shape/
  // +Image" extras, never shipped functional content).
  const shippedIds = SHIPPED_PROP_IDS[stageId] ?? new Set<string>();
  const visible = layers.filter(
    (l) => !l.hidden && l.kind !== 'anchor' && l.kind !== 'slot'
      && !(l.kind === 'img' && shippedIds.has(l.id)),
  );
  if (!visible.length) return null;

  return (
    <EngineProvider value={ENGINE}>
      <div className={styles.overlay} data-stage={stageId} data-seen="true" data-editing={dockOpen || undefined}>
        {visible.map((l) => (
          <Layer
            key={l.id}
            layer={l}
            eager={false}
            selected={stageActive && editor?.selectedLayer === l.id}
            editing={dockOpen}
            stageActive={stageActive}
            stageId={stageId}
          />
        ))}
      </div>
    </EngineProvider>
  );
}
