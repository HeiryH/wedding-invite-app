import { describe, expect, it } from 'vitest';
import { resolveCinematicScene } from './scene';
import type { CinematicSceneSet } from './sceneSets';
import type { CinematicWorldLayer } from './world';
import type { CinematicSequenceTrack } from './sequence';
import { CINEMATIC_ENGINES } from './registry';
import { editCinematicSceneSets } from './sceneSetEditing';
import { resolveCinematicProjectConfig } from './project';
import { resolveCinematicSceneSets } from './sceneSets';
import { resolveCinematicWorld } from './world';
import { resolveCinematicSequence } from './sequence';

const set: CinematicSceneSet = {
  id: 'terrace', label: 'Terrace', space: 'world', z: 10, timingTrackId: 'terrace-timing',
  hidden: false, opacity: 1, locked: false, system: false,
};
const layer: CinematicWorldLayer = {
  id: 'portrait', label: 'Portrait', group: set.id, space: 'world', kind: 'img', src: '/portrait.webp',
  x: 50, y: 50, w: 30, z: 5, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
};
const track: CinematicSequenceTrack = {
  id: 'terrace-timing', label: 'Terrace timing', kind: 'set', target: { type: 'group', id: set.id },
  clip: { start: .2, enterEnd: .4, exitStart: .6, end: .8 }, timing: { mode: 'independent' },
  enter: { kind: 'fade', easing: 'linear' }, exit: { kind: 'fade', easing: 'linear' }, ownership: { kind: 'shared' },
};

describe('generic cinematic scene', () => {
  it('renders arbitrary set ids with inherited timing, flags, and geometry', () => {
    const scene = resolveCinematicScene({ layers: [layer], sceneSets: [set], tracks: [track], progress: .3 });
    expect(scene.entries).toHaveLength(1);
    expect(scene.entries[0].presentation.opacity).toBeCloseTo(.5);
    expect(scene.entries[0].layer).toEqual(layer);
  });

  it('does not depend on the set name or target group id when a timing track is assigned', () => {
    const renamed = { ...set, id: 'balcony', label: 'Evening balcony' };
    const scene = resolveCinematicScene({ layers: [{ ...layer, group: 'balcony' }], sceneSets: [renamed], tracks: [track], progress: .3 });
    expect(scene.entries[0].sceneSet.label).toBe('Evening balcony');
    expect(scene.entries[0].presentation.opacity).toBeCloseTo(.5);
  });

  it('keeps set flags authoritative over an independently timed layer without mutating saved values', () => {
    const exact = { ...track, id: 'portrait-timing', target: { type: 'layer' as const, id: layer.id },
      clip: { start: 0, enterEnd: 0, exitStart: 1, end: 1 } };
    const scene = resolveCinematicScene({ layers: [layer], sceneSets: [{ ...set, hidden: true, locked: true, opacity: .4 }], tracks: [track, exact], progress: .1 });
    expect(scene.entries[0].layer).toMatchObject({ hidden: true, locked: true, opacity: .4 });
    expect(layer).toMatchObject({ hidden: false, locked: false, opacity: 1 });
  });

  it('suppresses deleted sets and missing authored timing instead of resurrecting scenery', () => {
    expect(resolveCinematicScene({ layers: [layer], sceneSets: [], tracks: [track], progress: .5 }).entries).toEqual([]);
    const scene = resolveCinematicScene({ layers: [layer], sceneSets: [set], tracks: [], progress: .5 });
    expect(scene.entries[0].presentation.opacity).toBe(0);
  });

  it('uses behavior assignments instead of scene ids for dynamic return state', () => {
    const scene = resolveCinematicScene({ layers: [layer], sceneSets: [{ ...set, behavior: 'return-surface' }],
      tracks: [track], progress: .1, behaviors: { 'return-surface': () => ({ opacity: 1 }) } });
    expect(scene.entries[0].presentation.opacity).toBe(1);
  });

  it('applies set transition defaults and resolves linked clips', () => {
    const linked = { ...track, id: 'linked', timing: { mode: 'linked' as const, trackId: track.id } };
    const scene = resolveCinematicScene({ layers: [layer], sceneSets: [{ ...set, timingTrackId: 'linked',
      enter: { kind: 'fade-slide', easing: 'linear', direction: 'left', distance: 20 } }],
      tracks: [track, linked], progress: .3 });
    expect(scene.entries[0].presentation.xVw).toBeCloseTo(-10);
  });

  it('gives copied sets independent visibility and retains both breakpoint compositions', () => {
    const engine = CINEMATIC_ENGINES[15];
    let config = editCinematicSceneSets(engine, {}, { type: 'duplicate', id: 'table', copyId: 'second-table' });
    config = editCinematicSceneSets(engine, config, { type: 'patch', id: 'table', patch: { hidden: true } });
    const expanded = resolveCinematicProjectConfig('t15', config).config;
    const sceneSets = resolveCinematicSceneSets('t15', engine.sceneSets, expanded).sceneSets;
    const tracks = resolveCinematicSequence('t15', engine.sequence, expanded).sequence.tracks;
    for (const breakpoint of ['mobile', 'desktop'] as const) {
      const layers = resolveCinematicWorld('t15', engine.world, breakpoint, expanded);
      const scene = resolveCinematicScene({ layers, sceneSets, tracks, progress: .78 });
      const original = scene.entries.filter((entry) => entry.sceneSet.id === 'table');
      const copied = scene.entries.filter((entry) => entry.sceneSet.id === 'second-table');
      expect(original.every((entry) => entry.layer.hidden)).toBe(true);
      expect(copied).toHaveLength(original.length);
      expect(copied.every((entry) => !entry.layer.hidden && entry.presentation.opacity > 0)).toBe(true);
      expect(copied[0].presentation).toEqual(original[0].presentation);
      expect(copied[0].sceneSet.behavior).toBe('return-surface');
    }
  });
});
