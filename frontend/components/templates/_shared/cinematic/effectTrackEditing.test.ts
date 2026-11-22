import { expect, it } from 'vitest';
import { saveCinematicDirection } from './direction';
import { deleteEffectTrack, effectTrackUsage } from './effectTrackEditing';
import { resolveCinematicProjectConfig, updateCinematicProjectValue } from './project';
import { CINEMATIC_ENGINES } from './registry';
import { cinematicSequenceKey, resolveCinematicSequence, serializeCinematicSequence } from './sequence';
import { cinematicWorldKey, resolveCinematicWorld, serializeCinematicWorld } from './world';

const engine = CINEMATIC_ENGINES[15];
const { keyPrefix } = engine;
const trackId = 'groom-hand-motion';
const disabledEffects = engine.direction.effects.map((effect) =>
  effect.trackId === trackId ? { ...effect, enabled: false } : effect);
const inactive = saveCinematicDirection(keyPrefix, {}, { ...engine.direction, effects: disabledEffects });

it('deletes a disabled shipped clip without changing effects, layers, or other tracks', () => {
  const edited = deleteEffectTrack(engine, inactive, trackId, 5);
  const { config, project } = resolveCinematicProjectConfig(keyPrefix, edited);
  const before = resolveCinematicProjectConfig(keyPrefix, inactive).project;

  const sequence = resolveCinematicSequence(keyPrefix, engine.sequence, config).sequence;
  expect(sequence.tracks).toEqual(engine.sequence.tracks.filter(({ id }) => id !== trackId));
  expect(project).toEqual({ ...before, sequence: project.sequence });
  expect(deleteEffectTrack(engine, edited, trackId, 5)).toBe(edited);
});

it('reports desktop effects and protects form reset windows, navigation, and linked timing', () => {
  const activeOnDesktop = saveCinematicDirection(keyPrefix, {}, { ...engine.direction,
    effects: disabledEffects.map((effect) => effect.trackId === trackId ? {
      ...effect, desktop: { enabled: true },
    } : effect),
  });
  const desktopUsage = effectTrackUsage(engine, activeOnDesktop, 5).get(trackId);
  expect(desktopUsage?.effects.mobile[0].enabled).toBe(false);
  expect(desktopUsage?.effects.desktop[0].enabled).toBe(true);
  const edited = deleteEffectTrack(engine, activeOnDesktop, trackId, 5);
  expect(effectTrackUsage(engine, edited, 5).has(trackId)).toBe(false);
  expect(resolveCinematicProjectConfig(keyPrefix, edited).project.effects)
    .toEqual(resolveCinematicProjectConfig(keyPrefix, activeOnDesktop).project.effects);

  const desktopLayers = resolveCinematicWorld(keyPrefix, engine.world, 'desktop', inactive).map((layer) =>
    layer.id === 'welcome-ring' ? { ...layer, timingTrackId: trackId } : layer);
  const desktopReference = updateCinematicProjectValue(keyPrefix, inactive, cinematicWorldKey(keyPrefix, 'desktop'),
    serializeCinematicWorld(engine.world, 'desktop', desktopLayers));
  expect(deleteEffectTrack(engine, desktopReference, trackId, 5)).toBe(desktopReference);

  const linked = updateCinematicProjectValue(keyPrefix, inactive, cinematicSequenceKey(keyPrefix),
    serializeCinematicSequence(engine.sequence, { ...engine.sequence, tracks: engine.sequence.tracks.map((track) =>
      track.id === 'welcome-ring' ? { ...track, timing: { mode: 'linked', trackId } } : track) }));
  expect(deleteEffectTrack(engine, linked, trackId, 5)).toBe(linked);

  const withNavigation = saveCinematicDirection(keyPrefix, inactive, { ...engine.direction,
    effects: disabledEffects.filter((effect) => effect.trackId !== 'memory-background-blur') });
  const usage = effectTrackUsage(engine, withNavigation, 5);
  expect(usage.get('rsvp-reset-window')?.dependencies).toEqual(['Interaction reset · RSVP form']);
  expect(usage.get('scroll-cue')?.dependencies).toEqual(['Layer appearance · Opening scroll cue']);
  expect(usage.get('memory-background-blur')?.dependencies).toEqual(['Navigation · Memories']);
  expect(deleteEffectTrack(engine, withNavigation, 'memory-background-blur', 5)).toBe(withNavigation);
  expect(usage.get(trackId)?.dependencies).toEqual([]);
});
