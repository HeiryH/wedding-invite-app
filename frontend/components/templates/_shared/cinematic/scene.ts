import { NEUTRAL_ASSET_MOTION, sampleAssetAnimations, type AssetMotion } from './assetAnimations';
import { assetClipPosition, assetPoseClip, keyframeTime, sampleAssetKeyframes, type AssetPose, type AssetPoseEdit } from './assetKeyframes';
import type { CinematicMotion } from './direction';
import type { Breakpoint } from '../types';
import { applyCinematicSceneSets, cinematicGroupAnimationTarget, cinematicGroupCenter, cinematicGroupTargetId, type CinematicSceneSet } from './sceneSets';
import { cinematicTrackPresentation, type CinematicSequenceTrack, type CinematicTrackPresentation } from './sequence';
import type { CinematicWorldLayer } from './world';

export interface CinematicResolvedSet {
  definition: CinematicSceneSet;
  presentation: CinematicTrackPresentation;
}

export interface CinematicSceneEntry {
  layer: CinematicWorldLayer;
  sceneSet: CinematicSceneSet;
  groupTransform?: AssetMotion & { centerX: number; centerY: number; opacity: number; slideX: number; slideY: number; frameX?: number; frameY?: number; blur?: number; editingPose?: AssetPose };
  presentation: CinematicTrackPresentation;
}

export type CinematicSetBehavior = (
  set: CinematicResolvedSet,
  sets: readonly CinematicResolvedSet[],
) => Partial<CinematicTrackPresentation>;

/** Resolve the same set contract for shipped art, custom uploads, and duplicated scene sets. */
export function resolveCinematicScene({ layers, sceneSets, tracks, progress, breakpoint = 'mobile', reducedMotion = false, groupEffects, assetPoseEdit, behaviors = {} }: {
  layers: CinematicWorldLayer[];
  sceneSets: CinematicSceneSet[];
  tracks: CinematicSequenceTrack[];
  progress: number;
  breakpoint?: Breakpoint;
  reducedMotion?: boolean;
  assetPoseEdit?: AssetPoseEdit;
  groupEffects?: ReadonlyMap<string, CinematicMotion>;
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
  const transformByLayer = new Map<string, CinematicSceneEntry['groupTransform']>();
  const motionByLayer = new Map<string, CinematicTrackPresentation>();
  const layersById = new Map(layers.map((layer) => [layer.id, layer]));
  const still = { kind: 'cut', easing: 'linear' } as const;
  for (const set of sceneSets) {
    const source = set.timingTrackId ? tracksById.get(set.timingTrackId) : groupTracks.get(set.id);
    for (const group of set.layerGroups?.[breakpoint] ?? []) {
      const members = group.memberIds.flatMap((id) => {
        const layer = layersById.get(id);
        return layer && !layer.parentId && layer.group === set.id && layer.space === set.space ? [layer] : [];
      });
      if (members.length < 2) continue;
      const transition = !reducedMotion && source && (group.enter || group.exit)
        ? cinematicTrackPresentation(progress, {
          ...source, enter: group.enter ?? still, exit: group.exit ?? still,
        }, tracksById) : undefined;
      if (transition) for (const layer of members) motionByLayer.set(layer.id, transition);
      const animated = !reducedMotion && Boolean(group.animations?.some((animation) => animation.enabled));
      const changesOpacityOrScale = [group.enter?.kind, group.exit?.kind].some((kind) =>
        kind === 'fade' || kind === 'fade-slide' || kind === 'scale');
      const id = cinematicGroupTargetId(set.id, group.id);
      const effect = groupEffects?.get(id);
      const editing = assetPoseEdit?.layerId === id;
      const target = cinematicGroupAnimationTarget(set, group, members[0]);
      const clipPosition = group.keyframes?.length ? assetClipPosition(progress, assetPoseClip(target, tracks, layers)) : 0;
      const pose = (editing ? assetPoseEdit?.pending : undefined) ??
        sampleAssetKeyframes(group.keyframes, editing ? keyframeTime(clipPosition) : clipPosition, undefined, effect);
      if (!pose && !editing && !effect && !animated && !group.scale && !group.rotation && !(transition && changesOpacityOrScale)) continue;
      const legacy = animated ? sampleAssetAnimations(target, tracks, progress) : NEUTRAL_ASSET_MOTION;
      const motion = pose ?? {
        x: legacy.x + (effect?.xVw ?? 0), y: legacy.y + (effect?.yVh ?? 0),
        scale: legacy.scale * (effect?.scale ?? 1), rotate: legacy.rotate + (effect?.rotate ?? 0),
      };
      const center = cinematicGroupCenter(members);
      const frameX = pose ? undefined : effect?.x;
      const frameY = pose ? undefined : effect?.y;
      const transform = { ...motion, centerX: center.x, centerY: center.y,
        opacity: (changesOpacityOrScale ? transition?.opacity ?? 1 : 1) * (pose?.opacity ?? effect?.opacity ?? 1),
        frameX, frameY, blur: pose?.blur ?? effect?.blur,
        slideX: transition?.xVw ?? 0, slideY: transition?.yVh ?? 0,
        scale: motion.scale * (group.scale ?? 1) * (transition?.scale ?? 1),
        rotate: motion.rotate + (group.rotation ?? 0),
        editingPose: editing ? { ...motion, x: motion.x + (frameX ?? 0), y: motion.y + (frameY ?? 0) } : undefined };
      for (const layer of members) transformByLayer.set(layer.id, transform);
    }
  }
  const entries = applyCinematicSceneSets(layers, sceneSets, breakpoint).flatMap((layer) => {
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
    // Independent layer timing can override inherited timing, but never bypass a set's flags.
    const presentation = layer.timingTrackId && !exact ? { ...set.presentation, opacity: 0 }
      : composed ? composed
        : layer.parentId ? { opacity: 1, xVw: 0, yVh: 0, scale: 1 } : set.presentation;
    const groupMotion = motionByLayer.get(layer.id);
    return [{
      layer,
      sceneSet: set.definition,
      groupTransform: transformByLayer.get(layer.id),
      presentation: groupMotion ? {
        ...presentation,
        xVw: presentation.xVw + groupMotion.xVw,
        yVh: presentation.yVh + groupMotion.yVh,
      } : presentation,
    }];
  }).sort((a, b) => a.layer.z - b.layer.z);
  return { sets, entries };
}
