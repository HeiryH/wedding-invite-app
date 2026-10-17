import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_SCENE_SETS } from '../../Template15-paintedpromise/data/cinematic';
import {
  CINEMATIC_SCENE_SETS_VERSION,
  cinematicSceneSetsKey,
  resolveCinematicSceneSets,
  serializeCinematicSceneSets,
  type CinematicSceneSet,
} from './sceneSets';

describe('cinematic scene sets', () => {
  it('resolves the template starting sets without saved config', () => {
    const result = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, undefined);
    expect(result.issues).toEqual([]);
    expect(result.sceneSets.map((set) => set.id)).toEqual(
      PAINTED_PROMISE_SCENE_SETS.map((set) => set.id),
    );
  });

  it('persists renamed defaults and free-form custom scene-set ids', () => {
    const custom: CinematicSceneSet = {
      id: 'moonlit-terrace', label: 'Moonlit terrace', space: 'world', z: 45,
      hidden: false, opacity: .8, locked: false, system: false,
      timingTrackId: 'moonlit-terrace-timing', behavior: 'ambient-scene',
    };
    const edited = PAINTED_PROMISE_SCENE_SETS
      .map((set) => set.id === 'dais' ? { ...set, label: 'Main portrait set' } : set)
      .concat(custom);
    const saved = serializeCinematicSceneSets(PAINTED_PROMISE_SCENE_SETS, edited);
    const resolved = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, {
      [cinematicSceneSetsKey('t15')]: saved,
    });
    expect(resolved.issues).toEqual([]);
    expect(resolved.sceneSets.find((set) => set.id === 'dais')?.label).toBe('Main portrait set');
    expect(resolved.sceneSets.find((set) => set.id === custom.id)).toEqual(custom);
  });

  it('stores deletions as tombstones and resets cleanly to defaults', () => {
    const withoutWelcome = PAINTED_PROMISE_SCENE_SETS.filter((set) => set.id !== 'welcome');
    const saved = serializeCinematicSceneSets(PAINTED_PROMISE_SCENE_SETS, withoutWelcome);
    expect(JSON.parse(saved)).toEqual({
      version: CINEMATIC_SCENE_SETS_VERSION,
      sets: [{ id: 'welcome', deleted: true }],
    });
    const resolved = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, {
      [cinematicSceneSetsKey('t15')]: saved,
    });
    expect(resolved.sceneSets.some((set) => set.id === 'welcome')).toBe(false);
    expect(serializeCinematicSceneSets(PAINTED_PROMISE_SCENE_SETS, PAINTED_PROMISE_SCENE_SETS)).toBe('');
  });

  it('can explicitly clear an optional property inherited from a starting set', () => {
    const edited = PAINTED_PROMISE_SCENE_SETS.map((set) =>
      set.id === 'programme' ? { ...set, timingTrackId: undefined, behavior: undefined } : set);
    const saved = serializeCinematicSceneSets(PAINTED_PROMISE_SCENE_SETS, edited);
    expect(JSON.parse(saved).sets).toEqual([
      { id: 'programme', timingTrackId: null, behavior: null },
    ]);
    const resolved = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, {
      [cinematicSceneSetsKey('t15')]: saved,
    });
    expect(resolved.sceneSets.find((set) => set.id === 'programme')).not.toHaveProperty('timingTrackId');
    expect(resolved.sceneSets.find((set) => set.id === 'programme')).not.toHaveProperty('behavior');
  });

  it('ignores malformed records without discarding valid custom sets', () => {
    const key = cinematicSceneSetsKey('t15');
    const result = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, {
      [key]: JSON.stringify({
        version: CINEMATIC_SCENE_SETS_VERSION,
        sets: [
          { id: '../bad', label: 'Bad', space: 'world' },
          { id: 'missing-space', label: 'Missing space' },
          { id: 'garden-afterparty', label: 'Garden afterparty', space: 'world', z: 120,
            opacity: 4, hidden: false, locked: false, system: false },
        ],
      }),
    });
    expect(result.sceneSets.some((set) => set.id === '../bad')).toBe(false);
    expect(result.sceneSets.some((set) => set.id === 'missing-space')).toBe(false);
    expect(result.sceneSets.find((set) => set.id === 'garden-afterparty')?.opacity).toBe(1);
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
  });

  it('falls back to starting sets for corrupt or future-version config', () => {
    const key = cinematicSceneSetsKey('t15');
    const corrupt = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, { [key]: '{' });
    const future = resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, {
      [key]: JSON.stringify({ version: 999, sets: [] }),
    });
    expect(corrupt.sceneSets).toHaveLength(PAINTED_PROMISE_SCENE_SETS.length);
    expect(future.sceneSets).toHaveLength(PAINTED_PROMISE_SCENE_SETS.length);
    expect(corrupt.issues).toHaveLength(1);
    expect(future.issues).toHaveLength(1);
  });
});
