import { resolveCinematicDirection, type CinematicEffect } from './direction';
import { resolveCinematicProjectConfig, updateCinematicProjectValue } from './project';
import type { CinematicEngine } from './registry';
import { resolveCinematicSceneSets } from './sceneSets';
import { cinematicSequenceKey, resolveCinematicSequence, serializeCinematicSequence } from './sequence';
import { resolveCinematicWorld } from './world';
import type { Breakpoint } from '../types';

export interface EffectTrackUsage {
  dependencies: string[];
  effects: Record<Breakpoint, CinematicEffect[]>;
}

function resolveEffectTracks(engine: CinematicEngine, config: Record<string, string>, programmeItems: number) {
  const { keyPrefix } = engine;
  const { config: effectiveConfig } = resolveCinematicProjectConfig(keyPrefix, config);
  const sequence = resolveCinematicSequence(keyPrefix, engine.sequence, effectiveConfig).sequence;
  const direction = resolveCinematicDirection(keyPrefix, engine.direction, config);
  const { sceneSets } = resolveCinematicSceneSets(keyPrefix, engine.sceneSets, effectiveConfig);
  const usage = new Map<string, EffectTrackUsage>();
  for (const track of sequence.tracks) {
    if (track.kind === 'effect' && track.target.type === 'effect') {
      usage.set(track.id, { dependencies: [], effects: { mobile: [], desktop: [] } });
    }
  }
  const reference = (id: string | undefined, label: string) => {
    const track = id ? usage.get(id) : undefined;
    if (track && !track.dependencies.includes(label)) track.dependencies.push(label);
  };
  for (const track of sequence.tracks) {
    if (track.timing.mode === 'linked') reference(track.timing.trackId, `Linked timing · ${track.label}`);
  }
  for (const set of sceneSets) reference(set.timingTrackId ?? set.id, `Scene set · ${set.label}`);
  for (const interaction of direction.interactions) {
    reference(interaction.availabilityTrackId, `Interaction availability · ${interaction.label}`);
    reference(interaction.resetTrackId, `Interaction reset · ${interaction.label}`);
  }
  for (const anchor of direction.navigation) {
    if (anchor.target !== 'beat') reference(anchor.targetId, `Navigation · ${anchor.label}`);
  }
  for (const breakpoint of ['mobile', 'desktop'] as const) {
    const layers = resolveCinematicWorld(keyPrefix, engine.world, breakpoint, effectiveConfig, {
      frames: direction.theme.memory.frames, programmeItems,
    });
    for (const layer of layers) reference(layer.timingTrackId, `Layer appearance · ${layer.label}`);
    for (const base of direction.effects) {
      const effect = breakpoint === 'desktop' ? { ...base, ...base.desktop } : base;
      usage.get(effect.trackId)?.effects[breakpoint].push(effect);
    }
  }
  return { sequence, usage };
}

export function effectTrackUsage(engine: CinematicEngine, config: Record<string, string>, programmeItems: number) {
  return resolveEffectTracks(engine, config, programmeItems).usage;
}

export function deleteEffectTrack(engine: CinematicEngine, config: Record<string, string>, id: string, programmeItems: number) {
  const { sequence, usage } = resolveEffectTracks(engine, config, programmeItems);
  const track = usage.get(id);
  if (!track || track.dependencies.length) return config;
  return updateCinematicProjectValue(engine.keyPrefix, config, cinematicSequenceKey(engine.keyPrefix),
    serializeCinematicSequence(engine.sequence, { ...sequence, tracks: sequence.tracks.filter((track) => track.id !== id) }));
}
