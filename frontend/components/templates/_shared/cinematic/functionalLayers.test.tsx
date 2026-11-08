import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderCinematicFunction, cinematicRichHtml } from './functionalLayers';
import { PAINTED_PROMISE_DIRECTION } from '../../Template15-paintedpromise/data/direction';
import { PAINTED_PROMISE_WORLD, PAINTED_PROMISE_SCENE_SETS, PAINTED_PROMISE_SEQUENCE } from '../../Template15-paintedpromise/data/cinematic';
import { resolveCinematicScene } from './scene';
import type { SlotProps } from '../types';

const context = {
  slotProps: { wedding: { groomName: 'Danish', brideName: 'Alya', name1: 'Alya', name2: 'Danish', eventType: 'WEDDING', weddingDate: '2027-01-15T11:00:00', venue: 'Glass Hall' },
    t: (_key: string, fallback: string) => fallback, photos: [], photoBoothEnabled: true } as unknown as SlotProps,
  theme: PAINTED_PROMISE_DIRECTION.theme, styles: {}, editing: false, phase: 'ready', available: true,
  focused: false, fire: vi.fn(), apiBase: '',
};
const entryFor = (id: string) => resolveCinematicScene({ layers: PAINTED_PROMISE_WORLD, sceneSets: PAINTED_PROMISE_SCENE_SETS, tracks: PAINTED_PROMISE_SEQUENCE.tracks, progress: .5 }).entries.find((entry) => entry.layer.id === id)!;

describe('functional cinematic layers', () => {
  it('uses an honest empty schedule and shows the venue and calendar entry point', () => {
    render(renderCinematicFunction(entryFor('programme-board'), { ...context, slotProps: { ...context.slotProps, itinerary: [] } }).children);
    expect(screen.getByText('The programme will be shared here soon.')).toBeVisible();
    expect(screen.queryByText('Guest arrival')).toBeNull();
    expect(screen.queryByText('Celebration feast')).toBeNull();
    expect(screen.getByText('Glass Hall')).toBeVisible();
    expect(screen.getByText('Save to calendar · View venue')).toBeVisible();
  });
  it('renders only the saved itinerary entries', () => {
    render(renderCinematicFunction(entryFor('programme-board'), { ...context, slotProps: { ...context.slotProps,
      itinerary: [{ itineraryItemId: 99, eventId: 15, label: 'Family dinner', detail: '19:00', sortOrder: 0 }] } }).children);
    expect(screen.getByText('Family dinner')).toBeVisible();
    expect(screen.getByText('19:00')).toBeVisible();
    expect(screen.queryByText('Guest arrival')).toBeNull();
    expect(screen.queryByText('The programme will be shared here soon.')).toBeNull();
  });
  it('uses assigned functions rather than specific asset ids', () => {
    const entry = entryFor('programme-board');
    render(renderCinematicFunction({ ...entry, layer: { ...entry.layer, id: 'custom-board', title: 'Our programme' } }, context).children);
    expect(screen.getByRole('button', { name: 'View programme' })).toHaveTextContent('Our programme');
  });
  it('shows only approved, visible photos and uses the authored memory layout', () => {
    const slotProps = { ...context.slotProps, photos: [
      { photoId: 1, photoUrl: '/approved.jpg', isApproved: true, isVisible: true, caption: 'Approved memory' },
      { photoId: 2, photoUrl: '/pending.jpg', isApproved: false, isVisible: true, caption: 'Pending memory' },
      { photoId: 3, photoUrl: '/hidden.jpg', isApproved: true, isVisible: false, caption: 'Hidden memory' },
    ] } as SlotProps;
    const { container } = render(renderCinematicFunction(entryFor('memory-wall'), { ...context, slotProps, theme: { ...context.theme, memory: { ...context.theme.memory, frames: 8, columns: 4 } } }).children);
    expect(container.querySelectorAll('figure')).toHaveLength(8);
    expect(screen.getByAltText('Approved memory')).toBeInTheDocument();
    expect(screen.queryByAltText('Pending memory')).toBeNull(); expect(screen.queryByAltText('Hidden memory')).toBeNull();
    expect(renderCinematicFunction(entryFor('memory-wall'), { ...context, slotProps: { ...slotProps, photoBoothEnabled: false } }).visible).toBe(false);
  });
  it('binds person details, supports custom rich copy, and removes unsafe markup', () => {
    const entry = entryFor('groom-details');
    render(renderCinematicFunction({ ...entry, layer: { ...entry.layer, title: 'A special day', text: '<p><strong>Our family</strong></p><img src=x onerror=alert(1)><script>alert(2)</script>' } }, context).children);
    expect(screen.getByRole('heading', { name: 'A special day' })).toBeInTheDocument();
    expect(screen.getByText('Our family').tagName).toBe('STRONG');
    expect(document.querySelector('script, img[onerror]')).toBeNull();
    expect(cinematicRichHtml('<p onclick="bad()"><em>Welcome</em></p>')).toBe('<p><em>Welcome</em></p>');
    expect(renderCinematicFunction(entry, { ...context, slotProps: { ...context.slotProps, wedding: { ...context.slotProps.wedding, eventType: 'CEREMONY' } } }).visible).toBe(false);
  });
});
