import type { Breakpoint } from '../types';
import type { CinematicInteraction, CinematicScrollStop } from './direction';
import { cinematicAncestors } from './parts';
import { applyCinematicSceneSets, type CinematicSceneSet } from './sceneSets';
import { cinematicTrackPresentation, resolveCinematicTrackClip, type CinematicSequenceTrack } from './sequence';
import type { CinematicWorldLayer } from './world';

export const CINEMATIC_INTERACTION_OPACITY = .7;

export interface ResolvedCinematicScrollStop {
  stop: CinematicScrollStop;
  at: number;
  active: boolean;
}

/** Follow the trigger's fully arrived pose within its availability window. */
export function resolveCinematicScrollStops(
  stops: CinematicScrollStop[] | undefined,
  interactions: CinematicInteraction[],
  tracks: CinematicSequenceTrack[],
  layers: CinematicWorldLayer[],
  sets: CinematicSceneSet[],
  breakpoint: Breakpoint,
): ResolvedCinematicScrollStop[] {
  if (!stops?.length) return [];
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const visibleLayers = applyCinematicSceneSets(layers, sets, breakpoint);
  const findSetTrack = (set: CinematicSceneSet | undefined) => set?.timingTrackId
    ? byId.get(set.timingTrackId)
    : tracks.find(({ target }) => target.type === 'group' && target.id === set?.id);
  return stops.map((stop) => {
    if (!stop.interactionId) return { stop, at: stop.at, active: true };
    const inactive = { stop, at: stop.at, active: false };
    const interaction = interactions.find(({ id, enabled }) => id === stop.interactionId && enabled);
    if (!interaction) return inactive;
    const layer = visibleLayers.find(({ id }) => id === interaction.triggerLayerId);
    if (!layer || [layer, ...cinematicAncestors(layer, visibleLayers)].some(({ hidden, opacity }) => hidden || opacity <= 0)) return inactive;

    const availability = byId.get(interaction.availabilityTrackId);
    if (interaction.availabilityTrackId && !availability) return inactive;
    const set = sets.find(({ id }) => id === layer.group);
    const appearance = findSetTrack(set);
    if (set?.timingTrackId && !appearance) return inactive;

    const available = availability && resolveCinematicTrackClip(availability, byId);
    const arrived = appearance && resolveCinematicTrackClip(appearance, byId);
    const start = Math.max(available?.start ?? 0, arrived?.enterEnd ?? 0);
    const end = Math.min(available?.end ?? 1, arrived?.exitStart ?? 1);
    if (start > end) return inactive;

    // A docked reception prop inherits the table's opacity, including its exit fade.
    const visibilityLayer = stop.visibilityLayerId
      ? visibleLayers.find(({ id }) => id === stop.visibilityLayerId) : undefined;
    const visibilitySet = visibilityLayer && sets.find(({ id }) => id === visibilityLayer.group);
    const visibilityTrack = findSetTrack(visibilitySet);
    if (!visibilityLayer || visibilityLayer.hidden || !visibilityTrack) {
      return { stop, at: (start + end) / 2, active: true };
    }
    const presentationTrack = {
      ...visibilityTrack, enter: visibilitySet?.enter ?? visibilityTrack.enter, exit: visibilitySet?.exit ?? visibilityTrack.exit,
    };
    const visibilityClip = resolveCinematicTrackClip(visibilityTrack, byId);
    const peak = Math.min(end, Math.max(start, visibilityClip.enterEnd));
    const tappable = (at: number) => cinematicTrackPresentation(at, presentationTrack, byId).opacity
      * visibilityLayer.opacity > CINEMATIC_INTERACTION_OPACITY;
    if (!tappable(peak)) return inactive;

    const insideBoundary = (outside: number) => {
      if (tappable(outside)) return outside;
      let inside = peak;
      for (let step = 0; step < 24; step++) {
        const midpoint = (inside + outside) / 2;
        if (tappable(midpoint)) inside = midpoint;
        else outside = midpoint;
      }
      return inside;
    };
    return { stop, at: (insideBoundary(start) + insideBoundary(end)) / 2, active: true };
  });
}
