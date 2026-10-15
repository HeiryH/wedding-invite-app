import { describe, expect, it } from 'vitest';
import { PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';
import { cinematicWorldKey, resolveCinematicWorld, serializeCinematicWorld } from './world';

describe('cinematic world layout', () => {
  it('resolves breakpoint defaults before saved deltas', () => {
    const key = cinematicWorldKey('t15', 'desktop');
    const resolved = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'desktop', {
      [key]: JSON.stringify({ layers: [{ id: 'groom', x: 61, flipX: true }] }),
    });
    const groom = resolved.find((layer) => layer.id === 'groom');
    expect(groom).toMatchObject({ x: 61, y: 51, w: 5.6, flipX: true });
  });

  it('stores only fields that differ from shipped defaults', () => {
    const layers = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined);
    const changed = layers.map((layer) => layer.id === 'walkway' ? { ...layer, y: 70 } : layer);
    const saved = serializeCinematicWorld(PAINTED_PROMISE_WORLD, 'mobile', changed);
    expect(JSON.parse(saved)).toEqual({ layers: [{ id: 'walkway', y: 70 }] });
  });

  it('returns an empty value after a scene is reset to defaults', () => {
    const layers = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined);
    expect(serializeCinematicWorld(PAINTED_PROMISE_WORLD, 'mobile', layers)).toBe('');
  });

  it('round-trips a complete user-added layer alongside shipped layer deltas', () => {
    const layers = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', undefined);
    const custom = {
      id: 'custom-cinematic-1', label: 'Welcome name', group: 'custom' as const,
      space: 'viewport' as const, kind: 'text' as const, text: '{{brideName}} & {{groomName}}',
      color: '#4a3a32', fontSize: 5, fontWeight: 600, textAlign: 'center' as const,
      x: 50, y: 30, w: 55, h: 12, z: 50, rotation: 0, flipX: false,
      hidden: false, locked: false, opacity: 1, fit: 'contain' as const,
    };
    const saved = serializeCinematicWorld(PAINTED_PROMISE_WORLD, 'mobile', [...layers, custom]);
    const resolved = resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, 'mobile', {
      [cinematicWorldKey('t15', 'mobile')]: saved,
    });
    expect(resolved.find((layer) => layer.id === custom.id)).toEqual(custom);
  });
});
