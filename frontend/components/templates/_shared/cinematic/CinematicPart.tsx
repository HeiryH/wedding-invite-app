'use client';

import { cloneElement, type ComponentProps, type CSSProperties, type ReactElement } from 'react';
import CinematicSceneLayer from './CinematicSceneLayer';
import type { CinematicSceneEntry } from './scene';
import { cinematicAncestors } from './parts';
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
  return <CinematicSceneLayer {...props} ambient={decoration?.ambient} cssVars={decoration?.cssVars}
    localElement={element as NonNullable<ComponentProps<typeof CinematicSceneLayer>['localElement']>}
    layer={{ ...entry.layer, locked: entry.layer.locked || ancestors.some((layer) => layer.locked) }}
    visibility={entry.presentation.opacity} transition={entry.presentation} />;
}
