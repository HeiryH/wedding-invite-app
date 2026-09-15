import { describe, expect, it } from 'vitest';
import { resolveStage, serializeStage } from './layout';
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
