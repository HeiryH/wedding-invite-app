import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SectionOverlay from './SectionOverlay';
import type { StageDef, Layer as LayerDef } from './types';

vi.hoisted(() => { Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) }); });

const layer = (id: string, kind: LayerDef['kind'], extra: Partial<LayerDef> = {}): LayerDef => ({ id, kind, x: 50, y: 50, w: 50, h: 10, s: 1, z: 1, order: 0, chain: false, hidden: false, opacity: 1, ...extra });
const stages: Record<string, StageDef> = { welcome: { id: 'welcome', bg: '', bgFit: 'cover', label: 'Welcome', layers: [
  layer('shipped', 'img', { src: 'frame.webp' }), layer('form', 'slot', { slot: 'test' }), layer('anchor', 'anchor'), layer('removed', 'text', { text: 'Removed decoration' }),
] } };

describe('shared flow overlay', () => {
  it('preserves saved additions/tombstones and excludes art/slots already rendered by flow templates', () => {
    const config = Object.freeze({ 't99.layout.mobile.welcome': JSON.stringify({ layers: [
      { id: 'removed', deleted: true }, layer('added', 'text', { text: 'Couple decoration', x: 65 }),
    ] }) });
    const { container, rerender } = render(<SectionOverlay prefix="t99" stages={stages} stageId="welcome" breakpoint="mobile" config={config}
      engine={{ assetRoot: '', assetSizes: {}, slotRegistry: { test: () => <p>Shipped form</p> } }} className="overlay"
      excludeSlots shippedProps={{ welcome: new Set(['shipped']) }} stageAttributes={false} />);
    expect(screen.getByText('Couple decoration')).toBeInTheDocument(); expect(screen.queryByText('Removed decoration')).toBeNull(); expect(screen.queryByText('Shipped form')).toBeNull();
    expect(container.querySelector('img')).toBeNull(); expect(container.querySelector('[data-stage]')).toBeNull();
    expect(config['t99.layout.mobile.welcome']).toContain('"deleted":true');
    rerender(<SectionOverlay prefix="t99" stages={stages} stageId="welcome" breakpoint="desktop" config={config}
      engine={{ assetRoot: '', assetSizes: {}, slotRegistry: {} }} className="overlay" />);
    expect(screen.queryByText('Couple decoration')).toBeNull(); expect(screen.getByText('Removed decoration')).toBeInTheDocument();
  });
});
