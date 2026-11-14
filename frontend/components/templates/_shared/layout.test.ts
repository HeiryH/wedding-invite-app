import { describe, expect, it } from 'vitest';
import { patchStageLayer, resolveStage, serializeStage, stageArtScale } from './layout';
import { flattenStage } from './authoring/flatten';
import type { Layer, StageDef } from './types';
import { T11_STAGES } from '../Template11-rosehorizon/data/roseHorizonStages';
import { T12_STAGES } from '../Template12-dreamywoodland/data/dreamyWoodlandStages';

const baseLayer: Layer = {
  id: 'art', kind: 'img', src: 'art.webp',
  x: 50, y: 50, w: 50, h: 50, s: 1, z: 1, order: 0,
  chain: false, hidden: false, opacity: 1,
  anim: 'fade', animDur: 0.8, animOut: 'fade-out',
};

const stage: StageDef = {
  id: 'welcome', label: 'Welcome', bg: '', bgFit: 'cover', layers: [baseLayer],
};

describe('stage layout animation timing', () => {
  it('persists an independent scroll-out duration', () => {
    const changed = [{ ...baseLayer, animOutDur: 1.7 }];
    const saved = serializeStage(stage, 'mobile', changed, { bgFit: 'cover' });
    expect(saved).toContain('"animOutDur":1.7');

    const resolved = resolveStage('t12', stage, 'mobile', {
      't12.layout.mobile.welcome': saved,
    });
    expect(resolved.layers[0].animDur).toBe(0.8);
    expect(resolved.layers[0].animOutDur).toBe(1.7);
  });

  it('stores no exit override when scroll-out is linked to enter', () => {
    const saved = serializeStage(stage, 'mobile', [{ ...baseLayer }], { bgFit: 'cover' });
    expect(saved).toBe('');
  });
});

describe('stage layout form styling', () => {
  it('persists sheet text and container controls', () => {
    const form = {
      ...baseLayer,
      kind: 'slot' as const,
      slot: 'rsvpForm',
      presentation: 'sheet' as const,
      fill: '#fffaf2',
      color: '#123456',
      accentColor: '#abcdef',
      containerMinHeight: 360,
      containerPadding: 24,
    };
    const formStage = { ...stage, layers: [form] };
    const saved = serializeStage(formStage, 'mobile', [{ ...form, containerMinHeight: 420 }], { bgFit: 'cover' });
    expect(saved).toContain('"containerMinHeight":420');

    const resolved = resolveStage('t12', formStage, 'mobile', {
      't12.layout.mobile.welcome': saved,
    });
    expect(resolved.layers[0]).toMatchObject({
      fill: '#fffaf2', color: '#123456', accentColor: '#abcdef',
      containerMinHeight: 420, containerPadding: 24,
    });
  });
});

const EXPECTED_GROUPS: Record<string, string[]> = {
  hero: ['themeLabel', 'nameFirst', 'nameSecond', 'date', 'timer', 'hijri', 'venue'],
  ceremonyContent: ['title', 'body'],
  rsvpContent: ['rsvpTitle', 'rsvpPrompt', 'rsvpForm', 'rsvpSeating', 'rsvpTrigger'],
  itineraryContent: ['itineraryTitle', 'itineraryList'],
  wishesContent: ['wishTitle', 'wishPrompt', 'wishForm', 'wishPhoto', 'wishTrigger', 'wishList'],
  photoboothContent: ['photoBooth'],
};

describe.each([
  ['Template 11', T11_STAGES],
  ['Template 12', T12_STAGES],
])('%s editable content groups', (_, stages) => {
  for (const [parent, expectedChildren] of Object.entries(EXPECTED_GROUPS)) {
    it(`${parent} owns its editable child layers`, () => {
      const allLayers = Object.values(stages).flatMap((definition) => definition.layers);
      const group = allLayers.find((layer) => layer.id === parent);
      expect(group?.kind).toBe('anchor');
      expect(allLayers.filter((layer) => layer.parent === parent).map((layer) => layer.id))
        .toEqual(expectedChildren);
    });
  }
});


describe('saved layer tombstones', () => {
  it('applies serialized deletion to shipped layers without changing other geometry', () => {
    const definition: StageDef = { id: 'scene', label: 'Scene', bg: '', bgFit: 'cover', layers: [
      { id: 'art', kind: 'img', src: 'art.webp', x: 50, y: 50, w: 30, h: 40, s: 1, z: 1, order: 0, chain: false, hidden: false, opacity: 1 },
    ] };
    const saved = serializeStage(definition, 'mobile', [], { bgFit: 'cover' });
    const bag = { 't7.layout.mobile.scene': saved };
    expect(resolveStage('t7', definition, 'mobile', bag).layers).toEqual([]);
    expect(resolveStage('t7', definition, 'desktop', bag).layers[0]).toMatchObject({ id: 'art', x: 50, y: 50 });
    expect(resolveStage('t7', definition, 'mobile', {}).layers[0].id).toBe('art');
    expect(bag['t7.layout.mobile.scene']).toContain('"deleted":true');
  });
});

describe('stage layer groups', () => {
  const secondLayer = { ...baseLayer, id: 'frame', z: 2 };
  const builtInPiece = { ...baseLayer, id: 'caption', kind: 'anchor' as const, parent: 'frame' };
  const groupedStage = { ...stage, layers: [baseLayer, secondLayer, builtInPiece] };
  const group = { id: 'decor', label: 'Decor', memberIds: ['art', 'frame'] };

  it('round-trips group membership independently of layer geometry and the built-in tree', () => {
    const key = 't7.layout.mobile.welcome';
    const saved = serializeStage(groupedStage, 'mobile', groupedStage.layers, { bgFit: 'cover' }, [group]);
    const resolved = resolveStage('t7', groupedStage, 'mobile', { [key]: saved });

    expect(JSON.parse(saved)).toEqual({ groups: [group] });
    expect(resolved.groups).toEqual([group]);
    expect(resolved.layers.find((layer) => layer.id === 'caption')).toEqual(builtInPiece);
    expect(resolveStage('t7', groupedStage, 'desktop', { [key]: saved }).groups).toEqual([]);
    const copied = serializeStage(groupedStage, 'desktop', resolved.layers, resolved, resolved.groups);
    expect(resolveStage('t7', groupedStage, 'desktop', {
      't7.layout.desktop.welcome': copied,
    }).groups).toEqual([group]);
  });

  it('ignores missing, duplicate and structural members without dropping visible layers', () => {
    const saved = JSON.stringify({
      groups: [
        { ...group, memberIds: ['art', 'art', 'missing', 'caption'] },
        { id: 'second', label: 'Second', memberIds: ['art', 'frame', 'decor'] },
        { id: 'frame', label: 'Colliding ID', memberIds: ['frame'] },
      ],
    });
    const resolved = resolveStage('t7', groupedStage, 'mobile', { 't7.layout.mobile.welcome': saved });

    expect(resolved.groups).toEqual([
      { ...group, memberIds: ['art'] },
      { id: 'second', label: 'Second', memberIds: ['frame'] },
    ]);
    expect(resolved.layers).toHaveLength(3);
  });
});

describe('authored stage groups', () => {
  it('bakes independently editable breakpoint groups into published stage data', () => {
    const frame = { ...baseLayer, id: 'frame', x: 40 };
    const authored = { ...stage, layers: [baseLayer, frame], flow: true };
    const group = { id: 'decor', label: 'Decor', memberIds: ['art', 'frame'], anim: 'fade' as const };
    const moved = patchStageLayer(authored.layers, [group], 'decor', { x: 10 });
    const key = 'author.layout.mobile.welcome';
    const config = { [key]: serializeStage(authored, 'mobile', moved.layers, { bgFit: 'cover' }, moved.groups) };
    const published = JSON.parse(JSON.stringify(flattenStage('author', authored, config))) as StageDef;

    const mobile = resolveStage('ta20', published, 'mobile', {});
    const desktop = resolveStage('ta20', published, 'desktop', {});
    expect(mobile.groups).toEqual([{ ...group, x: 10 }]);
    expect(mobile.layers.map((layer) => layer.x)).toEqual([60, 50]);
    expect(desktop.groups).toEqual([]);
    expect(desktop.layers.map((layer) => layer.x)).toEqual([50, 40]);
    expect(published.flow).toBe(true);
    expect(serializeStage(published, 'mobile', mobile.layers, mobile, mobile.groups)).toBe('');

    const removed = serializeStage(published, 'mobile', mobile.layers, mobile, []);
    expect(JSON.parse(removed)).toEqual({ groups: [] });
    expect(resolveStage('ta20', published, 'mobile', { 'ta20.layout.mobile.welcome': removed }).groups).toEqual([]);
    expect(flattenStage('author', published, { [key]: removed }).groups).toBeUndefined();
  });
});

it('moves mixed art and content groups by the same visible distance on a cropped canvas', () => {
  const content = { ...baseLayer, id: 'prompt', kind: 'slot' as const };
  const def = { ...stage, canvas: { mobile: { w: 400, h: 800 } } };
  const group = { id: 'wishes', label: 'Wishes', memberIds: ['art', 'prompt'] };
  const scale = stageArtScale(def, 'mobile', { w: 400, h: 1000 });
  expect(scale).toEqual({ x: 1.25, y: 1 });
  const result = patchStageLayer([baseLayer, content], [group], group.id, { x: 10, y: 5 }, scale);
  expect(result.layers.map(({ x, y }) => [x, y])).toEqual([[58, 55], [60, 55]]);
  const reset = patchStageLayer(result.layers, result.groups, group.id, { x: 0, y: 0 }, scale);
  expect(reset.layers).toEqual([baseLayer, content]);
});
