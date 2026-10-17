import type { CinematicEngine } from './registry';
import { cinematicSceneSetsKey, resolveCinematicSceneSets, serializeCinematicSceneSets, type CinematicSceneSet } from './sceneSets';
import { resolveCinematicProjectConfig, updateCinematicProjectValue } from './project';
import { cinematicWorldKey, resolveCinematicWorld, serializeCinematicWorld } from './world';
import { cinematicSequenceKey, resolveCinematicSequence, resolveCinematicTrackClip, serializeCinematicSequence, type CinematicSequenceTrack } from './sequence';
import { cinematicVisibilityKey } from './visibility';
import { resolveCinematicDirection, saveCinematicDirection } from './direction';
import { cinematicDescendantIds } from './parts';

export type SceneSetAction =
  | { type: 'create'; id: string; label: string; space: CinematicSceneSet['space'] }
  | { type: 'patch'; id: string; patch: Partial<Pick<CinematicSceneSet, 'label' | 'space' | 'locked' | 'hidden' | 'opacity'>> }
  | { type: 'duplicate'; id: string; copyId: string }
  | { type: 'reorder'; id: string; direction: -1 | 1 }
  | { type: 'delete'; id: string; moveTo?: string }
  | { type: 'move-layer'; layerId: string; setId: string }
  | { type: 'timing'; id: string; trackId?: string };

export function nextSceneSetId(label: string, ids: string[]): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'scene-set';
  let id = base;
  let suffix = 2;
  while (ids.includes(id)) id = `${base}-${suffix++}`;
  return id;
}

/** One update contains both breakpoints, membership, and timing so undo/redo never sees half an edit. */
export function editCinematicSceneSets(
  engine: CinematicEngine,
  config: Record<string, string>,
  action: SceneSetAction,
): Record<string, string> {
  const { keyPrefix: prefix } = engine;
  const expanded = resolveCinematicProjectConfig(prefix, config).config;
  let sets = resolveCinematicSceneSets(prefix, engine.sceneSets, expanded).sceneSets;
  const original = sets.find((set) => 'id' in action && set.id === action.id);
  if (action.type !== 'create' && action.type !== 'move-layer' && !original) return config;
  if (original?.locked && !(action.type === 'patch' && Object.keys(action.patch).every((key) => key === 'locked'))) return config;
  if (action.type === 'delete' && original?.system) return config;
  let direction = resolveCinematicDirection(prefix, engine.direction, config);
  const worlds = {
    mobile: resolveCinematicWorld(prefix, engine.world, 'mobile', expanded, { frames: direction.theme.memory.frames }),
    desktop: resolveCinematicWorld(prefix, engine.world, 'desktop', expanded, { frames: direction.theme.memory.frames }),
  };
  const sequence = resolveCinematicSequence(prefix, engine.sequence, expanded).sequence;
  let tracks = sequence.tracks;
  if (action.type === 'create') {
    if (sets.some((set) => set.id === action.id) || !action.label.trim()) return config;
    sets = [...sets, {
      id: action.id, label: action.label.trim(), space: action.space,
      z: Math.max(0, ...sets.map((set) => set.z)) + 10,
      hidden: false, locked: false, system: false, opacity: 1,
    }];
  } else if (action.type === 'patch') {
    sets = sets.map((set) => set.id === action.id ? { ...set, ...action.patch } : set);
    if (action.patch.space) {
      for (const bp of ['mobile', 'desktop'] as const) {
        worlds[bp] = worlds[bp].map((layer) => layer.group === action.id ? { ...layer, space: action.patch.space! } : layer);
      }
    }
  } else if (action.type === 'reorder') {
    const index = sets.findIndex((set) => set.id === action.id);
    const other = index + action.direction;
    if (other < 0 || other >= sets.length) return config;
    const ordered = [...sets];
    [ordered[index], ordered[other]] = [ordered[other], ordered[index]];
    sets = ordered.map((set, i) => ({ ...set, z: i * 10 }));
    // Keep per-layer geometry intact while regrouping drawing order within each coordinate space.
    for (const bp of ['mobile', 'desktop'] as const) {
      for (const space of ['world', 'viewport'] as const) {
        let z = 0;
        for (const set of sets) {
          const members = worlds[bp].filter((layer) => !layer.parentId && layer.group === set.id && layer.space === space)
            .sort((a, b) => a.z - b.z);
          for (const member of members) {
            worlds[bp] = worlds[bp].map((layer) => layer.id === member.id ? { ...layer, z: z++ } : layer);
          }
        }
      }
    }
  } else if (action.type === 'move-layer') {
    const destination = sets.find((set) => set.id === action.setId);
    if (!destination || destination.locked) return config;
    for (const bp of ['mobile', 'desktop'] as const) {
      const layer = worlds[bp].find((candidate) => candidate.id === action.layerId);
      if (layer?.parentId) return config;
      if (sets.find((set) => set.id === layer?.group)?.locked) return config;
      const moved = cinematicDescendantIds(action.layerId, worlds[bp]);
      worlds[bp] = worlds[bp].map((layer) => moved.has(layer.id)
        ? { ...layer, group: destination.id, space: destination.space } : layer);
    }
  } else if (action.type === 'delete') {
    const destination = action.moveTo ? sets.find((set) => set.id === action.moveTo && set.id !== action.id) : undefined;
    if (action.moveTo && (!destination || destination.locked)) return config;
    sets = sets.filter((set) => set.id !== action.id);
    const removedIds = new Set<string>();
    for (const bp of ['mobile', 'desktop'] as const) {
      worlds[bp] = worlds[bp].flatMap((layer) => {
        if (layer.group !== action.id) return [layer];
        if (destination) return [{ ...layer, group: destination.id, space: destination.space }];
        removedIds.add(layer.id);
        // Shipped art needs a tombstone-equivalent hidden override or the defaults would resurrect it.
        return engine.world.some((definition) => definition.id === layer.id) ? [{ ...layer, hidden: true }] : [];
      });
    }
    // Freeze references to the removed group track before deleting it, preserving other linked assets.
    const removedTrackIds = new Set(tracks.filter((track) =>
      (track.target.type === 'group' && track.target.id === action.id) ||
      (track.target.type === 'layer' && removedIds.has(track.target.id))).map((track) => track.id));
    const surviving = tracks.filter((track) => !removedTrackIds.has(track.id));
    tracks = surviving.map((track) => track.timing.mode === 'linked' && removedTrackIds.has(track.timing.trackId)
      ? { ...track, clip: resolveCinematicTrackClip(track, tracks), timing: { mode: 'independent' } } : track);
    direction = { ...direction,
      effects: direction.effects.filter((effect) => !removedIds.has(effect.targetId.split(':')[0])),
      interactions: direction.interactions.map((record) => ({ ...record,
        enabled: record.enabled && !removedIds.has(record.triggerLayerId),
        returnSetIds: record.returnSetIds.filter((id) => id !== action.id),
        revealSetIds: record.revealSetIds.filter((id) => id !== action.id),
      })),
    };
  } else if (action.type === 'duplicate') {
    if (sets.some((set) => set.id === action.copyId)) return config;
    const layerIds = new Set([...worlds.mobile, ...worlds.desktop].map((layer) => layer.id));
    const copiedIds = new Map<string, string>();
    for (const layer of [...worlds.mobile, ...worlds.desktop].filter((layer) => layer.group === action.id)) {
      if (!copiedIds.has(layer.id)) {
        const id = nextSceneSetId(`${action.copyId}-${layer.id}`, [...layerIds]);
        copiedIds.set(layer.id, id);
        layerIds.add(id);
      }
    }
    const groupTrack = original!.timingTrackId ? tracks.find((track) => track.id === original!.timingTrackId)
      : tracks.find((track) => track.target.type === 'group' && track.target.id === action.id);
    const trackId = groupTrack ? nextSceneSetId(`${action.copyId}-timing`, tracks.map((track) => track.id)) : undefined;
    sets = [...sets, { ...original!, id: action.copyId, label: `${original!.label} copy`,
      z: Math.max(0, ...sets.map((set) => set.z)) + 10, system: false,
      timingTrackId: trackId }];
    for (const bp of ['mobile', 'desktop'] as const) {
      worlds[bp] = [...worlds[bp], ...worlds[bp].filter((layer) => layer.group === action.id)
        .map((layer) => ({ ...layer, id: copiedIds.get(layer.id)!, group: action.copyId,
          parentId: layer.parentId ? copiedIds.get(layer.parentId) : undefined }))];
    }
    const referencedTracks = new Set(worlds.mobile.filter((layer) => layer.group === action.id).map((layer) => layer.timingTrackId));
    const copies = sequence.tracks.filter((track) => (track.target.type === 'layer' && copiedIds.has(track.target.id)) || referencedTracks.has(track.id));
    const copiedTracks = new Map<string, string>();
    if (groupTrack && trackId) copiedTracks.set(groupTrack.id, trackId);
    const allTrackIds = tracks.map((track) => track.id);
    for (const track of copies) {
      const id = nextSceneSetId(`${action.copyId}-${track.id}`, allTrackIds);
      copiedTracks.set(track.id, id); allTrackIds.push(id);
    }
    const copyTiming = (track: CinematicSequenceTrack): CinematicSequenceTrack['timing'] => track.timing.mode === 'linked'
      ? { mode: 'linked', trackId: copiedTracks.get(track.timing.trackId) ?? track.timing.trackId }
      : { mode: 'independent' };
    if (groupTrack && trackId) tracks = [...tracks, { ...groupTrack, id: trackId, timing: copyTiming(groupTrack),
      label: `${original!.label} copy`, target: { type: 'group', id: action.copyId }, ownership: { kind: 'shared' } }];
    for (const track of copies) {
      tracks = [...tracks, { ...track, id: copiedTracks.get(track.id)!, timing: copyTiming(track),
        target: track.target.type === 'layer' ? { type: 'layer', id: copiedIds.get(track.target.id)! } : { ...track.target, id: copiedTracks.get(track.id)! }, ownership: { kind: 'shared' } }];
    }
    const interactionCopies = direction.interactions.filter((record) => copiedIds.has(record.triggerLayerId)).map((record) => ({
      ...record, id: nextSceneSetId(`${action.copyId}-${record.id}`, direction.interactions.map((item) => item.id)),
      triggerLayerId: copiedIds.get(record.triggerLayerId)!,
      returnSetIds: record.returnSetIds.map((id) => id === action.id ? action.copyId : id),
      revealSetIds: record.revealSetIds.map((id) => id === action.id ? action.copyId : id),
    }));
    for (const bp of ['mobile', 'desktop'] as const) worlds[bp] = worlds[bp].map((layer) => layer.group === action.copyId ? {
      ...layer, timingTrackId: copiedTracks.get(layer.timingTrackId ?? '') ?? layer.timingTrackId,
      interactionId: interactionCopies.find((record) => record.triggerLayerId === layer.id)?.id ?? '',
    } : layer);
    const effectCopies = direction.effects.flatMap((effect) => {
      const [id, suffix] = effect.targetId.split(':');
      const target = copiedIds.get(id);
      return target ? [{ ...effect, id: nextSceneSetId(`${action.copyId}-${effect.id}`, direction.effects.map((item) => item.id)),
        targetId: `${target}${suffix ? `:${suffix}` : ''}`, desktop: effect.desktop ? { ...effect.desktop, targetId: `${target}${suffix ? `:${suffix}` : ''}` } : undefined,
        trackId: copiedTracks.get(effect.trackId) ?? effect.trackId }] : [];
    });
    direction = { ...direction, interactions: [...direction.interactions, ...interactionCopies], effects: [...direction.effects, ...effectCopies] };
  } else if (action.type === 'timing') {
    const source = action.trackId ? tracks.find((track) => track.id === action.trackId) : undefined;
    const current = tracks.find((track) => track.target.type === 'group' && track.target.id === action.id);
    if (action.trackId && !source) return config;
    if (source?.id === current?.id) return config;
    const trackId = current?.id ?? nextSceneSetId(`${action.id}-timing`, tracks.map((track) => track.id));
    // A source may not already depend on this group's track (that would create a timing cycle).
    let ancestor = source;
    const visited = new Set<string>();
    while (ancestor?.timing.mode === 'linked') {
      if (ancestor.timing.trackId === trackId || visited.has(ancestor.id)) return config;
      visited.add(ancestor.id);
      ancestor = tracks.find((track) => track.id === (ancestor!.timing as { trackId: string }).trackId);
    }
    const groupTrack: CinematicSequenceTrack = {
      id: trackId, label: original!.label, kind: 'set', target: { type: 'group', id: action.id },
      timing: source ? { mode: 'linked', trackId: source.id } : { mode: 'independent' },
      clip: source?.clip ?? { start: 0, enterEnd: 0, exitStart: 1, end: 1 },
      enter: source?.enter ?? { kind: 'cut', easing: 'linear' },
      exit: source?.exit ?? { kind: 'cut', easing: 'linear' }, ownership: { kind: 'shared' },
    };
    tracks = [...tracks.filter((track) => track.id !== trackId), groupTrack];
    sets = sets.map((set) => set.id === action.id ? { ...set, timingTrackId: source ? trackId : undefined } : set);
  }
  let next = updateCinematicProjectValue(prefix, config, cinematicSceneSetsKey(prefix), serializeCinematicSceneSets(engine.sceneSets, sets));
  for (const bp of ['mobile', 'desktop'] as const) {
    next = updateCinematicProjectValue(prefix, next, cinematicWorldKey(prefix, bp), serializeCinematicWorld(engine.world, bp, worlds[bp]));
  }
  next = updateCinematicProjectValue(prefix, next, cinematicSequenceKey(prefix), serializeCinematicSequence(engine.sequence, { ...sequence, tracks }));
  if (action.type === 'timing' || action.type === 'delete') {
    for (const bp of ['mobile', 'desktop'] as const) {
      const key = cinematicVisibilityKey(prefix, bp);
      let stored: { sets?: { id: string }[] } = {};
      try { stored = JSON.parse(expanded[key] ?? '{}') ?? {}; } catch { /* Ignore a corrupt legacy override. */ }
      const ids = new Set(sequence.tracks.filter((track) => track.target.type === 'group' && track.target.id === action.id).map((track) => track.id));
      next = updateCinematicProjectValue(prefix, next, key, JSON.stringify({ sets: (Array.isArray(stored.sets) ? stored.sets : []).filter((set) => set && !ids.has(set.id)) }));
    }
  }
  return action.type === 'duplicate' || action.type === 'delete' ? saveCinematicDirection(prefix, next, direction) : next;
}
