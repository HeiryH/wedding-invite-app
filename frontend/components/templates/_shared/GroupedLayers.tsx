'use client';

import { Fragment, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Layer, LayerGroup } from './types';
import { idleInlineStyle } from './idle';
import styles from './Stage.module.css';

interface Props {
  layers: Layer[];
  groups?: LayerGroup[];
  selectedLayer?: string;
  stageId?: string;
  waitForEntrance?: boolean;
  sharedCanvasGroups?: ReadonlySet<string>;
  secondaryCanvas?: boolean;
  renderLayer: (layer: Layer) => ReactNode;
}

function GroupHandle({ group, stageId, members }: { group: LayerGroup; stageId?: string; members: Layer[] }) {
  const drag = useRef<{ x: number; y: number; w: number; h: number; offsetX: number; offsetY: number } | null>(null);
  const left = Math.min(...members.map((layer) => layer.x - layer.w * layer.s / 2));
  const right = Math.max(...members.map((layer) => layer.x + layer.w * layer.s / 2));
  const top = Math.min(...members.map((layer) => layer.y - layer.h * layer.s / 2));
  const bottom = Math.max(...members.map((layer) => layer.y + layer.h * layer.s / 2));
  return (
    <div className={styles.groupOutline} style={{ left: `${left}%`, top: `${top}%`, width: `${right-left}%`, height: `${bottom-top}%` }}>
      <button
        type="button"
        className={styles.groupHandle}
        aria-label={`Drag ${group.label}`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const rect = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
          if (!rect?.width || !rect.height) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, w: rect.width, h: rect.height, offsetX: group.x ?? 0, offsetY: group.y ?? 0 };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) return;
          const clamp = (n: number) => Math.max(-200, Math.min(200, n));
          const x = clamp(start.offsetX + (event.clientX - start.x) / start.w * 100);
          const y = clamp(start.offsetY + (event.clientY - start.y) / start.h * 100);
          window.parent.postMessage({ type: 'PREVIEW_LAYER_EDIT', stageId, layerId: group.id, patch: { x, y } }, window.location.origin);
        }}
        onLostPointerCapture={() => { drag.current = null; }}
      >{group.label}</button>
    </div>
  );
}

export default function GroupedLayers({ layers, groups, selectedLayer, stageId, waitForEntrance, sharedCanvasGroups, secondaryCanvas, renderLayer }: Props) {
  if (!groups?.length) return layers.map(renderLayer);

  const entries = new Map<string, { group: LayerGroup; members: Layer[] }>();
  for (const group of groups) {
    const members = layers.filter((layer) => group.memberIds.includes(layer.id));
    if (!members.length) continue;
    for (const member of members) entries.set(member.id, { group, members });
  }

  return layers.map((layer, index) => {
    const entry = entries.get(layer.id);
    if (!entry) return renderLayer(layer);
    const { group, members } = entry;
    const first = members[0] === layer;
    const firstIndex = first ? index : layers.indexOf(members[0]);
    const contiguous = members.every((member, offset) => layers[firstIndex + offset] === member);
    const sharedCanvas = sharedCanvasGroups?.has(group.id);
    const active = group.id === selectedLayer && !(sharedCanvas && secondaryCanvas);
    const idle = group.animIdle && group.animIdle !== 'none' ? group.animIdle : undefined;
    const exit = group.animOut && group.animOut !== 'none' ? group.animOut : undefined;
    const entrance = group.anim && group.anim !== 'none' ? group.anim : undefined;
    const hasMotion = contiguous && Boolean(idle || exit || entrance);

    if (hasMotion && !first) return null;
    return (
      <Fragment key={layer.id}>
        {hasMotion ? (
          <div className={styles.groupPlane} style={{ zIndex: Math.max(...members.map((member) => member.z)) }}
            data-layer={group.id} data-depth="0" data-scroll-exit={exit ? true : undefined}>
            <div className={styles.groupPlane} data-sl-anim={entrance} data-group-waiting={entrance && waitForEntrance ? true : undefined}>
              <div className={styles.groupPlane} data-sl-idle={idle} style={idle ? idleInlineStyle(idle, {}) : undefined}>
                <div className={styles.groupPlane} data-sl-out={exit} data-shared-canvas-exit={sharedCanvas || undefined}>{members.map(renderLayer)}</div>
              </div>
            </div>
          </div>
        ) : renderLayer(layer)}
        {active && first && (
          <div className={styles.groupPlane} style={{ zIndex: 9999 }}>
            <GroupHandle group={group} stageId={stageId} members={members} />
          </div>
        )}
      </Fragment>
    );
  });
}
