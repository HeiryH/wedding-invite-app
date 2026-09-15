import { describe, expect, it } from 'vitest';
import { slotLayerStyle } from './slotLayerStyle';
import type { Layer } from './types';

const formLayer: Layer = {
  id: 'rsvpForm', kind: 'slot', slot: 'rsvpForm', presentation: 'sheet', sheetId: 'rsvp',
  x: 50, y: 50, w: 90, h: 50, s: 1, z: 1, order: 0,
  chain: false, hidden: false, opacity: 1,
};

describe('slotLayerStyle', () => {
  it('keeps an untouched form transparent and template-themed', () => {
    expect(slotLayerStyle(formLayer)).toEqual({ '--slot-text-scale': 1 });
  });

  it('maps form text and container controls to shared slot tokens', () => {
    expect(slotLayerStyle({
      ...formLayer,
      color: '#123456', accentColor: '#abcdef', fill: '#fffaf2',
      borderWidth: 2, borderColor: '#654321', radius: 18,
      containerMinHeight: 360, containerPadding: 24, textScale: 1.2,
    })).toMatchObject({
      '--slot-text-scale': 1.2,
      '--slot-ink': '#123456',
      '--slot-ink-soft': '#123456',
      '--slot-ink-faint': '#123456',
      '--slot-accent': '#abcdef',
      '--slot-container-bg': '#fffaf2',
      '--slot-container-border': '2px solid #654321',
      '--slot-container-radius': '18px',
      '--slot-container-min-height': '360px',
      '--slot-container-padding': '24px',
    });
  });
});
