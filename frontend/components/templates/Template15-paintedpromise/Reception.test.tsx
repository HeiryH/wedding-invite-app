import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Wedding } from '@/lib/api';
import Template15 from './index';
import { PAINTED_PROMISE_SEQUENCE } from './data/cinematic';
import { PAINTED_PROMISE_DIRECTION } from './data/direction';
import { cinematicSequenceKey } from '../_shared/cinematic/sequence';
import { cinematicSceneSetsKey } from '../_shared/cinematic/sceneSets';
import { cinematicWorldKey } from '../_shared/cinematic/world';
import { cinematicPacingNodes, mapCinematicProgress } from '../_shared/cinematic/direction';

const viewport = vi.hoisted(() => ({ progress: 0, breakpoint: 'mobile' as 'mobile' | 'desktop' }));
vi.mock('../_shared/cinematic/useCinematicScroll', async (importOriginal) => ({
  ...await importOriginal<typeof import('../_shared/cinematic/useCinematicScroll')>(),
  useCinematicScroll: () => ({ progress: viewport.progress, seek: vi.fn(), rootRef: null }),
}));
vi.mock('../_shared/hooks/useBreakpoint', () => ({ useBreakpoint: () => viewport.breakpoint }));
vi.mock('@/lib/useReducedMotion', () => ({ useReducedMotion: () => false }));
afterEach(() => vi.restoreAllMocks());

it.each(['mobile', 'desktop'] as const)('plays the table props and opens their original forms on %s', (breakpoint) => {
  viewport.breakpoint = breakpoint;
  viewport.progress = 0;
  const pacing = cinematicPacingNodes(PAINTED_PROMISE_SEQUENCE.beats, PAINTED_PROMISE_DIRECTION.pacing,
    breakpoint, PAINTED_PROMISE_SEQUENCE.beats.length);
  const wedding = {
    weddingId: 15, brideName: 'Alya', groomName: 'Danish', weddingDate: '2027-01-15',
    isRsvpOpen: true,
  } as Wedding;
  const props = { wedding, wishes: [], photos: [], photoBoothEnabled: false, onRSVP: vi.fn(), onSubmitWish: vi.fn() };
  const view = render(<Template15 {...props} />);
  const jump = (progress: number) => {
    viewport.progress = mapCinematicProgress(progress, pacing.points, true) + 0.000000001;
    view.rerender(<Template15 {...props} />);
  };
  const table = () => view.container.querySelector<HTMLElement>('[data-cinematic-layer="reception-table"]')!;
  const frames = () => Array.from(view.container.querySelectorAll<HTMLElement>('[data-reception-frame]'),
    (element) => Number(element.dataset.receptionFrame));
  jump(.77);
  expect(frames()).toEqual([0, 0]);
  expect(table().style.opacity).toBe('1');
  expect(screen.queryByRole('button', { name: 'Open RSVP form' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Write your best wishes' })).toBeNull();

  jump(.785);
  expect(frames()).toEqual([6, 0]);

  jump(.79);
  expect(frames()).toEqual([11, 0]);
  const rsvpArtwork = view.container.querySelector<HTMLElement>('[data-cinematic-layer="rsvp-letter"] [data-reception-frame]');
  expect(rsvpArtwork?.style.backgroundImage).toContain('rsvp-guest-book.webp');
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  fireEvent.click(screen.getByRole('button', { name: 'Open RSVP form' }));
  expect(document.body.style.position).toBe('');
  expect(document.body.style.overflow).toBe('');
  expect(document.documentElement.style.overflow).toBe('hidden');
  const sheet = screen.getByRole('dialog', { name: 'Invitation form' });
  expect(sheet).toHaveTextContent(/RSVP/i);
  fireEvent.click(within(sheet).getByRole('button', { name: 'Close' }));

  jump(.81);
  expect(frames()).toEqual([0, 0]);
  jump(.83);
  expect(frames()).toEqual([0, 5]);
  const wishesArtwork = view.container.querySelector<HTMLElement>('[data-cinematic-layer="wishes-book"] [data-reception-frame]');
  expect(wishesArtwork?.style.backgroundImage).toContain('wishes-envelope.webp');
  fireEvent.click(screen.getByRole('button', { name: 'Write your best wishes' }));
  expect(screen.getByRole('dialog', { name: 'Invitation form' })).toHaveTextContent(/wish/i);
  expect(document.body.style.position).toBe('');
  expect(document.body.style.overflow).toBe('');
  expect(document.documentElement.style.overflow).toBe('hidden');
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Invitation form' })).getByRole('button', { name: 'Close' }));

  jump(.85);
  expect(frames()).toEqual([0, 0]);
  expect(screen.queryByRole('button', { name: 'Write your best wishes' })).toBeNull();
  jump(.88);
  expect(Number(table().style.opacity)).toBeLessThan(1);
  expect(Number(table().style.opacity)).toBeGreaterThan(0);
  expect(table().style.transform).toMatch(/\* -0\.\d+/);
  jump(.891);
  expect(table().style.opacity).toBe('0');
  scrollTo.mockRestore();
});

it.each(['mobile', 'desktop'] as const)('uses the edited widths throughout the reception timeline on %s', (breakpoint) => {
  viewport.breakpoint = breakpoint;
  viewport.progress = 0;
  const layers = [{ id: 'rsvp-letter', w: 36 }, { id: 'wishes-book', w: 43 }];
  const customConfig = {
    [cinematicWorldKey('t15', breakpoint)]: JSON.stringify({ layers }),
    [cinematicSequenceKey('t15')]: JSON.stringify({
      version: PAINTED_PROMISE_SEQUENCE.version,
      tracks: ['rsvp', 'wishes'].map((id) => ({
        id, enter: { kind: 'scale', scale: .5, easing: 'ease-out' },
        exit: { kind: 'scale', scale: .55, easing: 'ease-in' },
      })),
    }),
  };
  const props = {
    wedding: { weddingId: 15, weddingDate: '2027-01-15' } as Wedding,
    wishes: [], photos: [], photoBoothEnabled: false, onRSVP: vi.fn(), onSubmitWish: vi.fn(), customConfig,
  };
  const pacing = cinematicPacingNodes(PAINTED_PROMISE_SEQUENCE.beats, PAINTED_PROMISE_DIRECTION.pacing,
    breakpoint, PAINTED_PROMISE_SEQUENCE.beats.length);
  const view = render(<Template15 {...props} />);

  for (const progress of [.77, .78, .79, .807, .82, .83, .847, .86]) {
    viewport.progress = mapCinematicProgress(progress, pacing.points, true);
    view.rerender(<Template15 {...props} />);
    for (const { id, w } of layers) {
      const element = view.container.querySelector<HTMLElement>(`[data-cinematic-layer="${id}"]`)!;
      expect(element.style.width).toBe(`${w}%`);
      expect(element.style.transform).toContain('scale(1)');
    }
  }
});

it.each(['mobile', 'desktop'] as const)('renders saved transform and artwork keyframes on the guest invitation on %s', (breakpoint) => {
  viewport.breakpoint = breakpoint;
  const pacing = cinematicPacingNodes(PAINTED_PROMISE_SEQUENCE.beats, PAINTED_PROMISE_DIRECTION.pacing,
    breakpoint, PAINTED_PROMISE_SEQUENCE.beats.length);
  const { start, end } = PAINTED_PROMISE_SEQUENCE.tracks.find((track) => track.id === 'rsvp')!.clip;
  const customConfig = {
    [cinematicWorldKey('t15', breakpoint)]: JSON.stringify({ layers: [{ id: 'rsvp-letter', keyframes: [
      { id: 'closed', at: 0, easing: 'hold', pose: { x: 0, y: 0, scale: 1, rotate: 0, frame: 0, paper: 0, anchor: 'table' } },
      { id: 'open', at: .6, easing: 'linear', pose: { x: 10, y: -12, scale: 1.4, rotate: 8, frame: 1, paper: 1, opacity: .7, blur: 3 } },
    ] }, { id: 'rsvp-letter--paper', keyframes: [
      { id: 'paper', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: .8, rotate: 11 } },
    ] }, { id: 'wishes-book', keyframes: [
      { id: 'book', at: 0, easing: 'linear', pose: { x: 2, y: 4, scale: .9, rotate: -7, frame: .5 } },
    ] }, { id: 'reception-table', keyframes: [
      { id: 'table', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 1.1, rotate: 0 } },
    ] }] }),
  };
  const props = {
    wedding: { weddingId: 15, weddingDate: '2027-01-15', isRsvpOpen: true } as Wedding,
    wishes: [], photos: [], photoBoothEnabled: false, onRSVP: vi.fn(), onSubmitWish: vi.fn(), customConfig,
  };
  const view = render(<Template15 {...props} />);
  const seek = (at: number) => {
    viewport.progress = mapCinematicProgress(start + (end - start) * at, pacing.points, true);
    view.rerender(<Template15 {...props} />);
  };
  const rsvpBook = view.container.querySelector<HTMLElement>('[data-cinematic-layer="rsvp-letter"]')!;
  seek(.6);
  expect(rsvpBook.style.transform).toContain('scale(1.4) rotate(8deg)');
  expect(rsvpBook).toHaveStyle({ opacity: '.7', filter: 'blur(3px)' });
  expect(rsvpBook.querySelector('[data-reception-frame]')).toHaveAttribute('data-reception-frame', '11');
  expect(screen.getByRole('button', { name: 'Open RSVP form' })).toBeVisible();
  expect(rsvpBook.querySelector('[data-cinematic-layer="rsvp-letter--paper"]')).toBeNull();
  expect(view.container.querySelector<HTMLElement>('[data-cinematic-layer="reception-table"]')?.style.transform).toContain('scale(1.1)');
  seek(.2);
  expect(rsvpBook.style.transform).toContain('scale(1) rotate(0deg)');
  expect(rsvpBook.querySelector('[data-reception-frame]')).toHaveAttribute('data-reception-frame', '0');
  expect(view.container.querySelector('[data-cinematic-layer="wishes-book"] [data-reception-frame]'))
    .toHaveAttribute('data-reception-frame', '3');

  const wishesEnvelope = view.container.querySelector<HTMLElement>('[data-cinematic-layer="wishes-book"]')!;
  const table = view.container.querySelector<HTMLElement>('[data-cinematic-layer="reception-table"]')!;
  const horizontalOffset = (element: HTMLElement) =>
    Number(element.style.transform.match(/calc\(var\(--fvw, 100vw\) \* ([^)]+)\)/)?.[1]);
  viewport.progress = mapCinematicProgress(.88, pacing.points, true);
  view.rerender(<Template15 {...props} />);
  const sliding = [table, rsvpBook, wishesEnvelope].map(horizontalOffset);
  expect(table.parentElement?.style.transform).toContain('translate(calc(');
  expect(rsvpBook.style.transform).toContain('scale(1.4) rotate(8deg)');
  expect(wishesEnvelope.style.transform).toContain('scale(0.9) rotate(-7deg)');

  // Compare at the same camera position with the table's fade-only exit.
  view.rerender(<Template15 {...props} customConfig={{ ...customConfig,
    [cinematicSequenceKey('t15')]: JSON.stringify({
      version: PAINTED_PROMISE_SEQUENCE.version,
      tracks: [{ id: 'table', exit: { kind: 'fade', easing: 'ease-in' } }],
    }),
  }} />);
  expect(table.parentElement?.style.transform).toBe('none');
  const offsets = [table, rsvpBook, wishesEnvelope].map((element, i) => sliding[i] - horizontalOffset(element));
  expect(offsets[0]).toBeLessThan(0);
  expect(offsets[1]).toBeLessThan(0);
  expect(offsets[2]).toBeCloseTo(offsets[1], 8);
});

it('keeps the selected keyframe anchor near its rounded time and excludes circular anchors', () => {
  viewport.breakpoint = 'mobile';
  const shape = { kind: 'shape', x: 50, y: 56, w: 10, h: 10, z: 30,
    rotation: 0, flipX: false, hidden: false, opacity: 1 };
  const config = (atX: number) => ({
    [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers: [
      { ...shape, id: 'anchor-chair', label: 'Anchor chair', group: 'venue', space: 'world',
        keyframes: [{ id: 'chair', at: 0, easing: 'linear', pose: { x: atX, y: 0, scale: 1, rotate: 0 } }] },
      { ...shape, id: 'follower', label: 'Follower', group: 'custom', space: 'viewport',
        keyframes: [
          { id: 'before', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 1, rotate: 0 } },
          { id: 'attached', at: .5, easing: 'linear', pose: { x: 4, y: -2, scale: 1, rotate: 0, anchor: 'layer:anchor-chair' } },
          { id: 'after', at: 1, easing: 'linear', pose: { x: 0, y: 0, scale: 1, rotate: 0 } },
        ] },
      { ...shape, id: 'dependent', label: 'Dependent', group: 'custom', space: 'viewport',
        keyframes: [{ id: 'dependent', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 1, rotate: 0, anchor: 'layer:follower' } }] },
    ] }),
  });
  const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
  const props = {
    wedding: { weddingId: 15, weddingDate: '2027-01-15' } as Wedding, wishes: [], photos: [],
    photoBoothEnabled: false, onRSVP: vi.fn(), onSubmitWish: vi.fn(),
    editor: { enabled: true, breakpoint: 'mobile' as const, selectedLayer: 'follower', cinematic: {
      mode: 'scene' as const, progress: .49998, cameraOverride: { x: 5, y: 0, scale: 2, rotate: 0 },
      assetPoseEdit: { session: 'anchor-edit', layerId: 'follower' },
    } },
  };
  const { container, rerender } = render(<Template15 {...props} customConfig={config(10)} />);
  const follower = container.querySelector<HTMLElement>('[data-cinematic-layer="follower"]')!;
  expect(follower.style.transform).toContain('var(--fvw, 100vw) * 0.29');
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
    type: 'PREVIEW_ASSET_POSE_SAMPLE',
    pose: expect.objectContaining({ anchor: 'layer:anchor-chair', x: 4, y: -2 }),
    anchors: expect.arrayContaining([{ id: 'layer:anchor-chair', label: 'Anchor chair', x: 25, y: 0 }]),
  }), window.location.origin);
  const sample = postMessage.mock.calls.find(([message]) => message.type === 'PREVIEW_ASSET_POSE_SAMPLE')?.[0];
  const anchorIds = sample.anchors.map((anchor: { id: string }) => anchor.id);
  expect(anchorIds).not.toContain('layer:follower');
  expect(anchorIds).not.toContain('layer:dependent');
  rerender(<Template15 {...props} customConfig={config(20)}
    editor={{ ...props.editor, cinematic: { ...props.editor.cinematic, progress: .50002 } }} />);
  expect(follower.style.transform).toContain('var(--fvw, 100vw) * 0.49');
});

it('fits a scene set uniformly and resolves a named anchor through the target rotation and scale', () => {
  viewport.breakpoint = 'mobile';
  const shape = { x: 50, y: 50, w: 20, z: 30, group: 'custom', space: 'viewport',
    rotation: 0, flipX: false, hidden: false, opacity: 1 };
  const customConfig = {
    [cinematicSceneSetsKey('t15')]: JSON.stringify({ sets: [{ id: 'custom', referenceFrames: { mobile: { width: 400, height: 800 } } }] }),
    [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers: [
      { ...shape, id: 'hand', label: 'Hand', src: '/hand.png', kind: 'img',
        anchorPoints: [{ id: 'finger', label: 'Fingertip', x: 1, y: .5, aspectRatio: 1 }],
        keyframes: [{ id: 'rotate', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 2, rotate: 90 } }] },
      { ...shape, id: 'ring', label: 'Ring', kind: 'shape',
        keyframes: [{ id: 'fit', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 1, rotate: 0, anchor: 'point:hand:finger' } }] },
    ] }),
  };
  const props = { wedding: { weddingId: 15, weddingDate: '2027-01-15' } as Wedding, wishes: [], photos: [],
    photoBoothEnabled: false, onRSVP: vi.fn(), onSubmitWish: vi.fn(), customConfig };
  const editor = { enabled: true, breakpoint: 'mobile' as const, cinematic: { mode: 'scene' as const, progress: .5 },
    frame: { w: 600, h: 800, svh: 800, safe: { top: 0, left: 0, right: 0, bottom: 0 } } };
  const { container, rerender } = render(<Template15 {...props} editor={editor} />);
  const ring = container.querySelector<HTMLElement>('[data-cinematic-layer="ring"]')!;
  const composition = ring.closest<HTMLElement>('[data-cinematic-composition]');
  expect(composition).toHaveStyle({ width: '400px', height: '800px' });
  expect(ring.style.transform).toContain('var(--fvh, 100vh) * 0.1');
  rerender(<Template15 {...props} editor={{ ...editor, frame: { ...editor.frame, w: 360, h: 900, svh: 900 } }} />);
  expect(composition).toHaveStyle({ width: '360px', height: '720px' });
  expect(ring.style.transform).toContain('var(--fvh, 100vh) * 0.1');
});

it('plays group keyframes on each member and previews a pending group pose without replacing member animation', () => {
  viewport.breakpoint = 'mobile';
  const track = 'layer-group:welcome:ring-action';
  const pose = { x: 14, y: -8, scale: 1.2, rotate: 15 };
  const customConfig = {
    [cinematicSceneSetsKey('t15')]: JSON.stringify({ sets: [{
      id: 'welcome', layerGroups: { mobile: [{
        id: 'ring-action', label: 'Ring action', memberIds: ['welcome-groom-hand', 'welcome-ring'],
        keyframes: [{ id: 'pose', at: 0, easing: 'linear', pose }],
      }] },
    }] }),
    [cinematicWorldKey('t15', 'mobile')]: JSON.stringify({ layers: [{ id: 'welcome-ring',
      keyframes: [{ id: 'local', at: 0, easing: 'linear', pose: { x: 0, y: 0, scale: 1, rotate: 9 } }],
    }] }),
  };
  const props = { wedding: { weddingId: 15, weddingDate: '2027-01-15' } as Wedding, wishes: [], photos: [],
    photoBoothEnabled: false, onRSVP: vi.fn(), onSubmitWish: vi.fn(), customConfig };
  const { container, rerender } = render(<Template15 {...props} />);
  const member = (id: string) => container.querySelector<HTMLElement>(`[data-cinematic-layer="${id}"]`)!;
  for (const id of ['welcome-groom-hand', 'welcome-ring']) {
    expect(member(id).parentElement?.style.transform).toContain('rotate(15deg) scale(1.2)');
  }
  expect(member('welcome-ring').style.transform).toContain('rotate(9deg)');
  const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
  const pending = { ...pose, rotate: 25 };
  rerender(<Template15 {...props} editor={{ enabled: true, breakpoint: 'mobile',
    cinematic: { mode: 'scene', progress: .1, assetPoseEdit: { layerId: track, session: 'group', pending } } }} />);
  expect(member('welcome-ring').parentElement?.style.transform).toContain('rotate(25deg) scale(1.2)');
  expect(member('welcome-ring').style.transform).toContain('rotate(9deg)');
  expect(member(track)).toBeVisible();
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
    type: 'PREVIEW_ASSET_POSE_SAMPLE', layerId: track, pose: expect.objectContaining(pending),
  }), window.location.origin);
});
