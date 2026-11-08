'use client';

import { cloneElement, type ComponentProps, type CSSProperties, type ReactElement } from 'react';
import CinematicSceneLayer from './CinematicSceneLayer';
import type { CinematicSceneEntry } from './scene';
import { cinematicAncestors, isCinematicEditorLayer } from './parts';
import type { CinematicLayerDecoration } from './CinematicSceneLayers';

/** Mounts persisted children onto the compositor's actual responsive content slots. */
export default function CinematicPart({ rootId, part, element, entries, decorations, ...props }: {
  rootId: string; part: string; element: ReactElement;
  entries: CinematicSceneEntry[]; decorations: Record<string, CinematicLayerDecoration>;
} & Pick<ComponentProps<typeof CinematicSceneLayer>, 'editor' | 'slotProps' | 'boxClassName' | 'imageClassName' | 'selectedClassName' | 'resizeHandleClassName'>) {
  const layers = entries.map((item) => item.layer);
  const entry = entries.find((item) => item.layer.part === part && cinematicAncestors(item.layer, layers).some((parent) => parent.id === rootId));
  if (!entry) return element;
  const ancestors = cinematicAncestors(entry.layer, entries.map((item) => item.layer));
  // Hiding one frame or word must not reflow its siblings into the now-empty slot.
  if (entry.layer.hidden || ancestors.some((layer) => layer.hidden)) {
    const node = element as ReactElement<{ style?: CSSProperties }>;
    return cloneElement(node, { style: { ...node.props.style, visibility: 'hidden', pointerEvents: 'none' } });
  }
  const decoration = decorations[entry.layer.id];
  const ancestorOpacity = ancestors.reduce((opacity, parent) => {
    const presentation = entries.find((item) => item.layer.id === parent.id)?.presentation.opacity ?? 1;
    return opacity * parent.opacity * presentation * (decorations[parent.id]?.ambient?.opacity ?? 1);
  }, 1);
  const editable = isCinematicEditorLayer(entry.layer, ancestors.at(-1));
  const groupPart = /^(row|time|label)-\d+$/.test(part) ? 'items' : /^frame-\d+$/.test(part) ? 'frames' : undefined;
  const group = groupPart ? entries.find((item) => item.layer.part === groupPart && cinematicAncestors(item.layer, layers).some((parent) => parent.id === rootId))?.layer : undefined;
  const layer = { ...entry.layer };
  // New group edits deliberately override legacy individual styling without erasing saved records.
  for (const key of ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'borderColor', 'borderWidth'] as const) {
    if (group?.[key] !== undefined) delete layer[key];
  }
  const vars = { ...decoration?.cssVars } as CSSProperties & Record<string, string | number | undefined>;
  if (part === 'items') {
    if (layer.color) vars['--programme-item-color'] = layer.color;
    if (layer.rowGap !== undefined) vars['--programme-row-gap'] = `${layer.rowGap}em`;
    if (layer.columnGap !== undefined) vars['--programme-column-gap'] = `${layer.columnGap}em`;
    if (layer.fontWeight !== undefined) vars['--programme-item-weight'] = layer.fontWeight;
    if (layer.textAlign) vars['--programme-item-align'] = layer.textAlign;
  }
  if (part === 'frames') {
    if (layer.borderColor) vars['--frame-border-color'] = layer.borderColor;
    if (layer.borderWidth !== undefined) vars['--frame-border-width'] = `${layer.borderWidth}px`;
  }
  return <CinematicSceneLayer {...props} editor={editable ? props.editor : undefined} ambient={decoration?.ambient} cssVars={vars}
    localElement={element as NonNullable<ComponentProps<typeof CinematicSceneLayer>['localElement']>}
    layer={{ ...layer, locked: layer.locked || ancestors.some((parent) => parent.locked) }}
    visibility={entry.presentation.opacity} ancestorOpacity={ancestorOpacity} transition={entry.presentation} />;
}
