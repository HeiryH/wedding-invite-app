import { describe, expect, it } from 'vitest';
import { CINEMATIC_ENGINES } from './registry';
import { editCinematicSceneSets } from './sceneSetEditing';
import { applyCinematicSceneSets, resolveCinematicSceneSets } from './sceneSets';
import { resolveCinematicProjectConfig, readCinematicProject } from './project';
import { resolveCinematicWorld } from './world';
import { resolveCinematicSequence } from './sequence';

const engine = CINEMATIC_ENGINES[15];
function resolve(config: Record<string, string>) {
  const expanded = resolveCinematicProjectConfig('t15', config).config;
  return {
    sets: resolveCinematicSceneSets('t15', engine.sceneSets, expanded).sceneSets,
    mobile: resolveCinematicWorld('t15', engine.world, 'mobile', expanded),
    desktop: resolveCinematicWorld('t15', engine.world, 'desktop', expanded),
    tracks: resolveCinematicSequence('t15', engine.sequence, expanded).sequence.tracks,
  };
}

describe('scene-set transactions', () => {
  it('creates a set, moves a shipped layer on both devices, and changes coordinate space without losing geometry', () => {
    let config = editCinematicSceneSets(engine, {}, { type: 'create', id: 'terrace', label: 'Terrace', space: 'world' });
    config = editCinematicSceneSets(engine, config, { type: 'move-layer', layerId: 'groom', setId: 'terrace' });
    config = editCinematicSceneSets(engine, config, { type: 'patch', id: 'terrace', patch: { space: 'viewport', label: 'Terrace portraits' } });
    const result = resolve(config);
    expect(result.sets.find((set) => set.id === 'terrace')).toMatchObject({ label: 'Terrace portraits', space: 'viewport' });
    expect(result.mobile.find((layer) => layer.id === 'groom')).toMatchObject({ group: 'terrace', space: 'viewport', x: 35, w: 18 });
    expect(result.desktop.find((layer) => layer.id === 'groom')).toMatchObject({ group: 'terrace', space: 'viewport', x: 45.5, w: 5.6 });
    expect(readCinematicProject('t15', config).issues).toEqual([]);
  });

  it('duplicates artwork with the same layer ids on both devices while preserving distinct framing', () => {
    const config = editCinematicSceneSets(engine, {}, { type: 'duplicate', id: 'dais', copyId: 'second-dais' });
    const result = resolve(config);
    const mobile = result.mobile.filter((layer) => layer.group === 'second-dais');
    const desktop = result.desktop.filter((layer) => layer.group === 'second-dais');
    expect(mobile.length).toBeGreaterThan(2);
    expect(mobile.map((layer) => layer.id).sort()).toEqual(desktop.map((layer) => layer.id).sort());
    expect(mobile.find((layer) => layer.id.endsWith('-groom'))?.x).toBe(35);
    expect(desktop.find((layer) => layer.id.endsWith('-groom'))?.x).toBe(45.5);
    expect(result.tracks.some((track) => track.target.type === 'group' && track.target.id === 'second-dais')).toBe(true);
  });

  it('deletes a set with shipped art without resurrecting it after reload', () => {
    const config = editCinematicSceneSets(engine, {}, { type: 'delete', id: 'dais' });
    const result = resolve(config);
    expect(result.sets.some((set) => set.id === 'dais')).toBe(false);
    for (const layers of [result.mobile, result.desktop]) {
      expect(layers.filter((layer) => layer.group === 'dais').every((layer) => layer.hidden)).toBe(true);
      expect(applyCinematicSceneSets(layers, result.sets).find((layer) => layer.id === 'groom')?.hidden).toBe(true);
    }
    expect(result.tracks.some((track) => track.target.type === 'group' && track.target.id === 'dais')).toBe(false);
  });

  it('moves layers on deletion instead of deleting them, and retains personal hidden flags', () => {
    const config = editCinematicSceneSets(engine, {}, { type: 'delete', id: 'dais', moveTo: 'venue' });
    const result = resolve(config);
    expect(result.mobile.find((layer) => layer.id === 'groom')).toMatchObject({ group: 'venue', hidden: false });
    expect(result.desktop.find((layer) => layer.id === 'groom')).toMatchObject({ group: 'venue', hidden: false });
    expect(result.mobile.find((layer) => layer.id === 'centre-floral')?.hidden).toBe(true);
  });

  it('locks the whole set without modifying per-layer lock values and supports undo by config snapshot', () => {
    const before = {};
    const locked = editCinematicSceneSets(engine, before, { type: 'patch', id: 'dais', patch: { locked: true, hidden: true } });
    const ignored = editCinematicSceneSets(engine, locked, { type: 'delete', id: 'dais' });
    expect(ignored).toBe(locked);
    const result = resolve(locked);
    expect(result.mobile.find((layer) => layer.id === 'groom')?.locked).toBe(false);
    expect(applyCinematicSceneSets(result.mobile, result.sets).find((layer) => layer.id === 'groom')).toMatchObject({ locked: true, hidden: true });
    expect(resolve(before).sets.find((set) => set.id === 'dais')).toMatchObject({ locked: false, hidden: false });
  });

  it('links and unlinks set timing without affecting another set', () => {
    const linked = editCinematicSceneSets(engine, {}, { type: 'timing', id: 'dais', trackId: 'programme' });
    expect(resolve(linked).tracks.find((track) => track.id === 'dais')?.timing).toEqual({ mode: 'linked', trackId: 'programme' });
    const unlinked = editCinematicSceneSets(engine, linked, { type: 'timing', id: 'dais' });
    const result = resolve(unlinked);
    expect(result.tracks.find((track) => track.id === 'dais')).toMatchObject({ timing: { mode: 'independent' }, clip: { start: 0, end: 1 } });
    expect(result.sets.find((set) => set.id === 'dais')?.timingTrackId).toBeUndefined();
    expect(result.tracks.find((track) => track.id === 'programme')?.timing).toEqual({ mode: 'independent' });
  });

  it('reorders without changing layer positions or breakpoint-specific widths', () => {
    const config = editCinematicSceneSets(engine, {}, { type: 'reorder', id: 'dais', direction: 1 });
    const result = resolve(config);
    expect(result.sets.findIndex((set) => set.id === 'dais')).toBeGreaterThan(result.sets.findIndex((set) => set.id === 'programme'));
    expect(result.mobile.find((layer) => layer.id === 'groom')).toMatchObject({ x: 35, w: 18 });
    expect(result.desktop.find((layer) => layer.id === 'groom')).toMatchObject({ x: 45.5, w: 5.6 });
    expect(result.mobile.find((layer) => layer.id === 'groom')!.z).toBeGreaterThan(result.mobile.find((layer) => layer.id === 'programme-board')!.z);
  });
});
