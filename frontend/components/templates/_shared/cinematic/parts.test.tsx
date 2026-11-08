import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resolveCinematicWorld, serializeCinematicWorld, cinematicWorldKey } from './world';
import { cinematicAncestors, cinematicDescendantIds, cinematicLayerTree, cinematicEditorLayers } from './parts';
import { CINEMATIC_ENGINES } from './registry';
import { editCinematicSceneSets } from './sceneSetEditing';
import { resolveCinematicProjectConfig } from './project';
import { resolveCinematicLayerTiming, unlinkCinematicLayerTiming } from './sequence';
import { resolveCinematicScene } from './scene';
import { assetAnimationWindow } from './assetAnimations';
import { renderCinematicFunction } from './functionalLayers';
import CinematicPart from './CinematicPart';
import type { SlotProps, EditorHandle } from '../types';

const engine = CINEMATIC_ENGINES[15];
const world = () => resolveCinematicWorld('t15', engine.world, 'mobile', undefined);
const props = { boxClassName: 'box', imageClassName: 'image', selectedClassName: 'selected', resizeHandleClassName: 'resize' };
const slots = { wedding: { groomName: 'Danish', brideName: 'Alya', weddingDate: '2027-01-15', venue: 'Glass Hall' },
  t: (_: string, fallback: string) => fallback, photos: [], photoBoothEnabled: true } as unknown as SlotProps;
const editor = { enabled: true, selectedLayer: 'memory-wall--frame-0', cinematic: { mode: 'scene' } } as EditorHandle;
const scene = (layers = world(), tracks = engine.sequence.tracks, progress = .99) => resolveCinematicScene({ layers, tracks, progress, sceneSets: engine.sceneSets });

describe('persisted cinematic children', () => {
  it('persists a real text width independently of scale and keeps legacy natural sizing', () => {
    const layers = world().map((layer) => layer.id === 'programme-board--title' ? { ...layer, textWidth: 42 } : layer);
    const config = { [cinematicWorldKey('t15', 'mobile')]: serializeCinematicWorld(engine.world, 'mobile', layers) };
    const restored = resolveCinematicWorld('t15', engine.world, 'mobile', config);
    expect(restored.find((layer) => layer.id === 'programme-board--title')).toMatchObject({ textWidth: 42, w: 100 });
    expect(resolveCinematicWorld('t15', engine.world, 'desktop', config).find((layer) => layer.id === 'programme-board--title')?.textWidth).toBeUndefined();
    const view = render(<CinematicPart {...props} rootId="programme-board" part="title" element={<strong>Long programme heading</strong>}
      entries={scene(restored, engine.sequence.tracks, .62).entries} decorations={{}} />);
    expect(screen.getByText('Long programme heading')).toHaveStyle({ width: '42%', display: 'block', scale: '1 1', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
    view.rerender(<CinematicPart {...props} rootId="programme-board" part="title" element={<strong>Long programme heading</strong>}
      entries={scene(world(), engine.sequence.tracks, .62).entries} decorations={{}} />);
    expect(screen.getByText('Long programme heading').style.width).toBe('');
  });
  it('does not let invisible memory children intercept programme clicks', () => {
    const entries = scene(world(), engine.sequence.tracks, .62).entries;
    expect(entries.find((entry) => entry.layer.id === 'memory-wall')?.presentation.opacity).toBe(0);
    const post = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    try {
      render(<CinematicPart {...props} rootId="memory-wall" part="artwork" element={<img alt="Photo arch" />}
        entries={entries} decorations={{}} editor={editor} />);
      const arch = screen.getByAltText('Photo arch');
      expect(arch).toHaveStyle({ pointerEvents: 'none', opacity: '1' });
      expect(arch).not.toHaveAttribute('tabindex', '0');
      fireEvent.click(arch);
      expect(post).not.toHaveBeenCalled();
    } finally { post.mockRestore(); }
  });
  it('exposes all composite parts without changing existing placements or serializing no-op defaults', () => {
    const layers = world();
    expect(layers.find((layer) => layer.id === 'programme-board')).toEqual(engine.world.find((layer) => layer.id === 'programme-board'));
    expect(layers.find((layer) => layer.id === 'programme-board--time-0')?.parentId).toBe('programme-board--row-0');
    expect(layers.filter((layer) => layer.part?.startsWith('frame-'))).toHaveLength(6);
    expect(layers.find((layer) => layer.id === 'rsvp-letter--title')?.parentId).toBe('rsvp-letter--paper');
    expect(serializeCinematicWorld(engine.world, 'mobile', layers)).toBe('');
    expect(resolveCinematicWorld('t15', engine.world, 'mobile', {}, { frames: 8, programmeItems: 7 }).filter((layer) => layer.part?.startsWith('time-'))).toHaveLength(7);
  });

  it('round-trips per-device child deltas, including slots beyond the default count', () => {
    const layers = resolveCinematicWorld('t15', engine.world, 'mobile', undefined, { frames: 8 });
    const changed = layers.map((layer) => layer.id === 'memory-wall--frame-7' ? { ...layer, x: 95, rotation: 12 } : layer.id === 'rsvp-letter--title' ? { ...layer, text: 'Join {{groom}}', fontSize: 6, hidden: true } : layer);
    const config = { [cinematicWorldKey('t15', 'mobile')]: serializeCinematicWorld(engine.world, 'mobile', changed) };
    const loaded = resolveCinematicWorld('t15', engine.world, 'mobile', config, { frames: 8 });
    expect(loaded.find((layer) => layer.id === 'memory-wall--frame-7')).toMatchObject({ x: 95, rotation: 12, parentId: 'memory-wall--frames' });
    expect(loaded.find((layer) => layer.id === 'rsvp-letter--title')).toMatchObject({ text: 'Join {{groom}}', fontSize: 6, hidden: true });
    expect(resolveCinematicWorld('t15', engine.world, 'desktop', config).find((layer) => layer.id === 'rsvp-letter--title')?.hidden).toBe(false);
  });

  it('duplicates a complete tree on both devices without generating duplicate children', () => {
    const config = editCinematicSceneSets(engine, {}, { type: 'duplicate', id: 'memory', copyId: 'second-memory' });
    const expanded = resolveCinematicProjectConfig('t15', config).config;
    for (const bp of ['mobile', 'desktop'] as const) {
      const layers = resolveCinematicWorld('t15', engine.world, bp, expanded);
      const copy = layers.filter((layer) => layer.group === 'second-memory');
      const root = copy.find((layer) => !layer.parentId)!;
      expect(copy).toHaveLength(world().filter((layer) => layer.group === 'memory').length);
      expect(copy.filter((layer) => layer.part === 'artwork')).toHaveLength(1);
      expect(copy.filter((layer) => layer.part === 'frame-0')).toHaveLength(1);
      expect(copy.filter((layer) => layer.parentId).every((layer) => cinematicAncestors(layer, copy).some((parent) => parent.id === root.id))).toBe(true);
    }
  });

  it('moves the entire subtree and refuses to move just a bound child into another set', () => {
    const config = editCinematicSceneSets(engine, {}, { type: 'move-layer', layerId: 'programme-board', setId: 'dais' });
    const layers = resolveCinematicWorld('t15', engine.world, 'mobile', resolveCinematicProjectConfig('t15', config).config);
    const ids = cinematicDescendantIds('programme-board', layers);
    expect(layers.filter((layer) => ids.has(layer.id)).every((layer) => layer.group === 'dais')).toBe(true);
    expect(editCinematicSceneSets(engine, config, { type: 'move-layer', layerId: 'programme-board--title', setId: 'venue' })).toEqual(config);
    expect(cinematicLayerTree(layers).find((entry) => entry.layer.id === 'programme-board--time-0')?.depth).toBe(3);
  });

  it('inherits the closest parent timing and does not multiply the parent fade a second time', () => {
    const layers = world(); const parent = layers.find((layer) => layer.id === 'programme-board')!;
    const child = layers.find((layer) => layer.id === 'programme-board--title')!;
    const tracks = unlinkCinematicLayerTiming(engine.sequence.tracks, parent);
    const exact = tracks.find((track) => track.target.type === 'layer' && track.target.id === parent.id)!;
    exact.clip = { start: .2, enterEnd: .3, exitStart: .8, end: .9 };
    expect(resolveCinematicLayerTiming(child.id, child.group, tracks, undefined, layers).inherited?.id).toBe(exact.id);
    expect(assetAnimationWindow(child, tracks, layers)).toMatchObject({ start: .3, end: .8 });
    expect(scene(layers, tracks, .25).entries.find((entry) => entry.layer.id === child.id)?.presentation).toEqual({ opacity: 1, xVw: 0, yVh: 0, scale: 1 });
    const independent = unlinkCinematicLayerTiming(tracks, child, layers);
    expect(independent.find((track) => track.target.type === 'layer' && track.target.id === child.id)?.clip).toEqual(exact.clip);
  });

  it('edits the frames as one unit and stops arrow nudges from reaching the parent', () => {
    const post = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    const parentKey = vi.fn();
    render(<div onKeyDown={parentKey}><CinematicPart {...props} rootId="memory-wall" part="frames" element={<div>Photos</div>}
      entries={scene().entries} decorations={{}} editor={{ ...editor, selectedLayer: 'memory-wall--frames' }} slotProps={slots} /></div>);
    const frame = screen.getByRole('button', { name: 'Edit Photo frames' });
    expect(frame.tagName).toBe('DIV');
    fireEvent.keyDown(frame, { key: 'ArrowRight' });
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'PREVIEW_CINEMATIC_LAYER_EDIT', layerId: 'memory-wall--frames', patch: { x: 50.5 } }), window.location.origin);
    expect(parentKey).not.toHaveBeenCalled();
    fireEvent.click(frame);
    expect(post).toHaveBeenCalledTimes(1); // Clicking the selected child does not deselect it or close its inspector.
    post.mockRestore();
  });

  it('keeps live content bindings, custom text, approved photo filtering and the original DOM structure', () => {
    const layers = world().map((layer) => layer.id === 'memory-wall--title' ? { ...layer, text: 'Our favourite people', fontSize: 3.5 } : layer);
    const entries = scene(layers).entries;
    const root = entries.find((entry) => entry.layer.id === 'memory-wall')!;
    const fire = vi.fn();
    const { container } = render(renderCinematicFunction(root, { slotProps: { ...slots, photos: [
      { photoId: 1, photoUrl: '/approved.jpg', caption: 'Approved photo', isApproved: true },
      { photoId: 2, photoUrl: '/pending.jpg', caption: 'Pending photo', isApproved: false },
    ] } as SlotProps, theme: engine.direction.theme, styles: {}, editing: false, available: true, phase: 'ready', focused: false, apiBase: '', fire,
      renderPart: (part, element) => <CinematicPart {...props} rootId={root.layer.id} part={part} element={element} entries={entries} decorations={{}} slotProps={slots} />,
    }).children);
    expect(container.querySelectorAll('figure')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Our favourite people' })).toHaveStyle({ fontSize: '3.5cqi' });
    expect(screen.getByAltText('Approved photo')).toBeInTheDocument();
    expect(screen.queryByAltText('Pending photo')).toBeNull();
    expect(container.querySelector('figure')?.parentElement?.tagName).toBe('DIV');
  });

  it('hides a frame without removing its grid slot and inherits parent locks', () => {
    const layers = world().map((layer) => layer.id === 'memory-wall--frame-0' ? { ...layer, hidden: true } : layer.id === 'memory-wall--frames' ? { ...layer, locked: true } : layer);
    const entries = scene(layers).entries;
    const { container } = render(<><CinematicPart {...props} rootId="memory-wall" part="frame-0" element={<figure>Hidden frame</figure>} entries={entries} decorations={{}} editor={editor} />
      <CinematicPart {...props} rootId="memory-wall" part="frame-1" element={<figure>Locked frame</figure>} entries={entries} decorations={{}} editor={editor} /></>);
    expect(container.querySelectorAll('figure')).toHaveLength(2);
    expect(screen.getByText('Hidden frame')).toHaveStyle({ visibility: 'hidden' });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps the visible editing tree constant with ten programme items and many photos', () => {
    const layers = resolveCinematicWorld('t15', engine.world, 'mobile', {}, { frames: 20, programmeItems: 10 });
    const visible = cinematicEditorLayers(layers);
    expect(visible.filter((layer) => cinematicAncestors(layer, visible).at(-1)?.behavior === 'programme-board').map((layer) => layer.part).sort()).toEqual(['action', 'calendar', 'items', 'title', 'venue']);
    expect(visible.filter((layer) => layer.part?.startsWith('frame-'))).toHaveLength(0);
    expect(visible.find((layer) => layer.id === 'programme-board--items')?.parentId).toBe('programme-board');
    expect(layers.filter((layer) => layer.part?.startsWith('frame-'))).toHaveLength(20);
  });

  it('does not create sample entry layers for an empty saved itinerary', () => {
    const layers = resolveCinematicWorld('t15', engine.world, 'mobile', {}, { programmeItems: 0 });
    expect(layers.filter((layer) => /^(row|time|label)-\d+$/.test(layer.part ?? ''))).toHaveLength(0);
  });

  it('preserves legacy geometry while group typography overrides individual styles non-destructively', () => {
    const layers = world().map((layer) => layer.id === 'programme-board--time-0'
      ? { ...layer, x: 72, fontSize: 5, color: '#ff0000' }
      : layer.id === 'programme-board--items' ? { ...layer, fontSize: 2, color: '#123456', rowGap: .8, columnGap: .6 } : layer);
    const entries = scene(layers).entries;
    const { container } = render(<CinematicPart {...props} rootId="programme-board" part="items" element={<span>Schedule</span>} entries={entries} decorations={{}} />);
    expect(screen.getByText('Schedule')).toHaveStyle({ fontSize: '2cqi', color: '#123456', '--programme-row-gap': '0.8em' });
    const leaf = render(<CinematicPart {...props} rootId="programme-board" part="time-0" element={<b>10:30</b>} entries={entries} decorations={{}} editor={editor} />);
    expect(screen.getByText('10:30').style.fontSize).toBe('');
    expect(screen.getByText('10:30').style.translate).toContain('22%');
    expect(leaf.container.querySelector('[role="button"]')).toBeNull();
    const loaded = resolveCinematicWorld('t15', engine.world, 'mobile', { [cinematicWorldKey('t15', 'mobile')]: serializeCinematicWorld(engine.world, 'mobile', layers) });
    expect(loaded.find((layer) => layer.id === 'programme-board--time-0')).toMatchObject({ x: 72, fontSize: 5, color: '#ff0000' });
    expect(loaded.find((layer) => layer.part === 'items')).toMatchObject({ rowGap: .8, columnGap: .6 });
    expect(container.querySelector('span')).toBeTruthy();
  });
});
