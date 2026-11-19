'use client';

import type { ComponentProps, CSSProperties, ReactElement } from 'react';
import CinematicSceneLayer from './CinematicSceneLayer';
import type { CinematicCompositionFrame } from './sceneSets';
import type { CinematicSceneEntry } from './scene';
import styles from './CinematicSceneLayers.module.css';

export type CinematicLayerDecoration = Pick<ComponentProps<typeof CinematicSceneLayer>,
  'children' | 'ambient' | 'className' | 'interactive' | 'cssVars' | 'poseSample' | 'textMotion' | 'surface'> & { visible?: boolean; suppressTransition?: boolean; frameTransform?: string };

/** The parent selects a coordinate space; all layers use one placement/visibility/render path. */
export default function CinematicSceneLayers({ entries, space, decorations = {}, compositions, ...props }: {
  entries: CinematicSceneEntry[];
  space: 'world' | 'viewport';
  decorations?: Record<string, CinematicLayerDecoration>;
  compositions?: ReadonlyMap<string, CinematicCompositionFrame>;
} & Pick<ComponentProps<typeof CinematicSceneLayer>,
  'editor' | 'boxClassName' | 'imageClassName' | 'selectedClassName' | 'resizeHandleClassName' | 'slotProps'>) {
  return entries.filter((entry) => !entry.layer.parentId && entry.layer.space === space).map(({ layer, presentation, sceneSet, groupTransform }) => {
    const { visible, suppressTransition, frameTransform, ...decoration } = decorations[layer.id] ?? {};
    if (visible === false) return null;
    const className = [decoration.className, sceneSet.loop && styles[sceneSet.loop]].filter(Boolean).join(' ');
    const transition = groupTransform ? { ...presentation,
      xVw: presentation.xVw - groupTransform.slideX,
      yVh: presentation.yVh - groupTransform.slideY,
    } : presentation;
    const composition = compositions?.get(sceneSet.id);
    const element = <CinematicSceneLayer key={layer.id} {...props} {...decoration} className={className}
      layer={layer} composition={composition} visibility={presentation.opacity * (groupTransform?.opacity ?? 1)} transition={suppressTransition ? undefined : transition} />;
    const frame = (child: ReactElement) => {
      const composed = composition ? <div key={layer.id} data-cinematic-composition style={{
        position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%', zIndex: layer.z,
        width: composition.width, height: composition.height, pointerEvents: 'none', containerType: 'inline-size',
        '--fvw': `${composition.width}px`, '--fvh': `${composition.height}px`, '--fsvh': `${composition.height}px`,
      } as CSSProperties}>{child}</div> : child;
      return frameTransform ? <div key={layer.id} style={{
        position: 'absolute', inset: 0, zIndex: layer.z, pointerEvents: 'none',
        transformOrigin: '50% 56%', transform: frameTransform,
      }}>{composed}</div> : composed;
    };
    if (!groupTransform) return frame(element);
    const { centerX, centerY, x, y, scale, rotate, slideX, slideY, frameX = 0, frameY = 0, blur } = groupTransform;
    // Each member uses the same frame and pivot while keeping its place in the scene's depth order.
    return frame(<div key={layer.id} data-cinematic-group-transform style={{
      position: 'absolute', inset: 0, zIndex: layer.z, pointerEvents: 'none',
      filter: blur ? `blur(${blur}px)` : undefined,
      transformOrigin: `${centerX}% ${centerY}%`,
      transform: `translate(calc(${frameX}% + var(--fvw, 100vw) * ${(x + slideX) / 100}), calc(${frameY}% + var(--fvh, 100vh) * ${(y + slideY) / 100})) rotate(${rotate}deg) scale(${scale})`,
    }}>{element}</div>);
  });
}
