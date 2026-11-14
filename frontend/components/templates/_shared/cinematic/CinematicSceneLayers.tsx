'use client';

import type { ComponentProps } from 'react';
import CinematicSceneLayer from './CinematicSceneLayer';
import type { CinematicSceneEntry } from './scene';
import styles from './CinematicSceneLayers.module.css';

export type CinematicLayerDecoration = Pick<ComponentProps<typeof CinematicSceneLayer>,
  'children' | 'ambient' | 'className' | 'interactive' | 'cssVars'> & { visible?: boolean };

/** The parent selects a coordinate space; all layers use one placement/visibility/render path. */
export default function CinematicSceneLayers({ entries, space, decorations = {}, ...props }: {
  entries: CinematicSceneEntry[];
  space: 'world' | 'viewport';
  decorations?: Record<string, CinematicLayerDecoration>;
} & Pick<ComponentProps<typeof CinematicSceneLayer>,
  'editor' | 'boxClassName' | 'imageClassName' | 'selectedClassName' | 'resizeHandleClassName' | 'slotProps'>) {
  return entries.filter((entry) => !entry.layer.parentId && entry.layer.space === space).map(({ layer, presentation, sceneSet }) => {
    const { visible, ...decoration } = decorations[layer.id] ?? {};
    if (visible === false) return null;
    const className = [decoration.className, sceneSet.loop && styles[sceneSet.loop]].filter(Boolean).join(' ');
    return <CinematicSceneLayer key={layer.id} {...props} {...decoration} className={className}
      layer={layer} visibility={presentation.opacity} transition={presentation} />;
  });
}
