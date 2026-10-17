import { describe, expect, it } from 'vitest';
import { cinematicCameraKey } from './cameraLayout';
import {
  CINEMATIC_PROJECT_CHUNK_SIZE,
  cinematicProjectChunkKey,
  cinematicProjectKey,
  migrateCinematicConfigToProject,
  readCinematicProject,
  resetCinematicProjectConfig,
  resolveCinematicProjectConfig,
  updateCinematicProjectValue,
} from './project';
import { cinematicSequenceKey } from './sequence';
import { resolveCinematicSequence } from './sequence';
import { PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import { cinematicWorldKey } from './world';

describe('cinematic project persistence', () => {
  it('migrates separate legacy keys into one logical chunked project', () => {
    const legacy = {
      [cinematicSequenceKey('t15')]: JSON.stringify({ version: 1, beats: [{ id: 'ring', at: .1 }] }),
      [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers: [{ id: 'groom', x: 60 }] }),
      [cinematicCameraKey('t15', 'desktop')]: JSON.stringify({ frames: [{ id: 'groom', x: 20 }] }),
      'invite.heading': 'Together with our families',
    };
    const migrated = migrateCinematicConfigToProject('t15', legacy);
    expect(migrated['invite.heading']).toBe(legacy['invite.heading']);
    expect(migrated[cinematicSequenceKey('t15')]).toBeUndefined();
    expect(migrated[cinematicWorldKey('t15', 'mobile')]).toBeUndefined();
    expect(migrated[cinematicProjectKey('t15')]).toBeDefined();
    const resolved = resolveCinematicProjectConfig('t15', migrated);
    expect(resolved.source).toBe('project');
    expect(resolved.config[cinematicSequenceKey('t15')]).toBe(legacy[cinematicSequenceKey('t15')]);
    expect(resolved.config[cinematicWorldKey('t15', 'mobile')]).toBe(legacy[cinematicWorldKey('t15', 'mobile')]);
    expect(resolved.config[cinematicCameraKey('t15', 'desktop')]).toBe(legacy[cinematicCameraKey('t15', 'desktop')]);
  });

  it('keeps every transport row below the config-value limit', () => {
    const layers = Array.from({ length: 80 }, (_, index) => ({
      id: `uploaded-${index}`, label: `Uploaded artwork ${index}`, group: 'custom',
      space: 'world', src: `/uploads/${'x'.repeat(80)}-${index}.webp`, x: index, y: 50, w: 20,
    }));
    const migrated = migrateCinematicConfigToProject('t15', {
      [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers }),
    });
    const projectValues = Object.entries(migrated)
      .filter(([key]) => key.startsWith(cinematicProjectKey('t15')))
      .map(([, value]) => value);
    expect(projectValues.length).toBeGreaterThan(2);
    expect(Math.max(...projectValues.map((value) => value.length))).toBeLessThanOrEqual(CINEMATIC_PROJECT_CHUNK_SIZE);
  });

  it('updates a materialized legacy field and clears old transport keys', () => {
    const migrated = migrateCinematicConfigToProject('t15', {});
    const sequence = JSON.stringify({ version: 1, beats: [{ id: 'new', label: 'New' }], tracks: [] });
    const updated = updateCinematicProjectValue('t15', migrated, cinematicSequenceKey('t15'), sequence);
    expect(resolveCinematicProjectConfig('t15', updated).config[cinematicSequenceKey('t15')]).toBe(sequence);
    expect(Object.keys(updated).some((key) => key === cinematicSequenceKey('t15'))).toBe(false);
  });

  it('restores a project section to its template starting design', () => {
    const editedSequence = JSON.stringify({
      version: 1, beats: [{ id: 'ring', at: .14 }], tracks: [],
    });
    const migrated = migrateCinematicConfigToProject('t15', {
      [cinematicSequenceKey('t15')]: editedSequence,
    });
    const reset = updateCinematicProjectValue('t15', migrated, cinematicSequenceKey('t15'), '');
    const expanded = resolveCinematicProjectConfig('t15', reset).config;
    const sequence = resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, expanded).sequence;
    expect(sequence).toEqual(PAINTED_PROMISE_SEQUENCE);
  });

  it('falls back to legacy keys when a project chunk is missing', () => {
    const legacySequence = JSON.stringify({ version: 1, beats: [], tracks: [] });
    const migrated = migrateCinematicConfigToProject('t15', {
      [cinematicSequenceKey('t15')]: legacySequence,
    });
    delete migrated[cinematicProjectChunkKey('t15', 0)];
    migrated[cinematicSequenceKey('t15')] = legacySequence;
    const read = readCinematicProject('t15', migrated);
    const resolved = resolveCinematicProjectConfig('t15', migrated);
    expect(read.project).toBeUndefined();
    expect(read.issues).toHaveLength(1);
    expect(resolved.source).toBe('legacy');
    expect(resolved.config[cinematicSequenceKey('t15')]).toBe(legacySequence);
  });

  it('removes project and legacy transport when resetting to the starting design', () => {
    const migrated = migrateCinematicConfigToProject('t15', {
      [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers: [{ id: 'groom', x: 60 }] }),
      'invite.heading': 'Keep me',
    });
    const reset = resetCinematicProjectConfig('t15', migrated);
    expect(Object.keys(reset).some((key) => key.startsWith(cinematicProjectKey('t15')))).toBe(false);
    expect(reset['invite.heading']).toBe('Keep me');
  });
});
