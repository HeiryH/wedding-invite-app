import { applyCinematicSceneSets, type CinematicSceneSet } from './sceneSets';
import { cinematicTrackPresentation, type CinematicSequenceTrack, type CinematicTrackPresentation } from './sequence';
import type { CinematicWorldLayer } from './world';

export interface CinematicResolvedSet {
  definition: CinematicSceneSet;
  presentation: CinematicTrackPresentation;
}

export interface CinematicSceneEntry {
  layer: CinematicWorldLayer;
  sceneSet: CinematicSceneSet;
  presentation: CinematicTrackPresentation;
}

export type CinematicSetBehavior = (
  set: CinematicResolvedSet,
  sets: readonly CinematicResolvedSet[],
) => Partial<CinematicTrackPresentation>;

/** Resolve the same set contract for shipped art, custom uploads, and duplicated scene sets. */
export function resolveCinematicScene({ layers, sceneSets, tracks, progress, behaviors = {} }: {
  layers: CinematicWorldLayer[];
  sceneSets: CinematicSceneSet[];
  tracks: CinematicSequenceTrack[];
  progress: number;
  behaviors?: Record<string, CinematicSetBehavior>;
}): { sets: CinematicResolvedSet[]; entries: CinematicSceneEntry[] } {
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const groupTracks = new Map(tracks.flatMap((track) => track.target.type === 'group'
    ? [[track.target.id, track] as const] : []));
  const layerTracks = new Map(tracks.flatMap((track) => track.target.type === 'layer'
    ? [[track.target.id, track] as const] : []));
  const defaults = sceneSets.map((definition) => {
    const track = definition.timingTrackId ? tracksById.get(definition.timingTrackId) : groupTracks.get(definition.id);
    const presentation = cinematicTrackPresentation(progress, track ? {
      ...track,
      enter: definition.enter ?? track.enter,
      exit: definition.exit ?? track.exit,
    } : undefined, tracksById);
    return {
      definition,
      presentation: definition.timingTrackId && !track ? { ...presentation, opacity: 0 } : presentation,
    };
  });
  // Behaviours receive the unmodified set presentations: they can derive related scenery state
  // without depending on set ids, mutation order, or circular callbacks.
  const sets = defaults.map((set) => ({
    ...set,
    presentation: { ...set.presentation, ...behaviors[set.definition.behavior ?? '']?.(set, defaults) },
  }));
  const byId = new Map(sets.map((set) => [set.definition.id, set]));
  const entries = applyCinematicSceneSets(layers, sceneSets).flatMap((layer) => {
    const set = byId.get(layer.group);
    if (!set) return [];
    const exact = layerTracks.get(layer.id) ?? (layer.timingTrackId ? tracksById.get(layer.timingTrackId) : undefined);
    const independent = exact ? cinematicTrackPresentation(progress, exact, tracksById) : undefined;
    const shared = set.presentation;
    const sharedTrackId = set.definition.timingTrackId ?? groupTracks.get(set.definition.id)?.id;
    const composed = independent && exact?.id !== sharedTrackId && set.definition.composeTiming && !layer.parentId ? {
      opacity: independent.opacity * shared.opacity,
      xVw: independent.xVw + shared.xVw,
      yVh: independent.yVh + shared.yVh,
      scale: independent.scale * shared.scale,
    } : independent;
    return [{
      layer,
      sceneSet: set.definition,
      // Independent layer timing can override inherited timing, but never bypass a set's flags.
      presentation: layer.timingTrackId && !exact ? { ...set.presentation, opacity: 0 }
        : composed ? composed
          : layer.parentId ? { opacity: 1, xVw: 0, yVh: 0, scale: 1 } : set.presentation,
    }];
  }).sort((a, b) => a.layer.z - b.layer.z);
  return { sets, entries };
}
