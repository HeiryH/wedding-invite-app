import { fireEvent, render, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Template1 from './Template1';
import Template2 from './Template2';
import Template3 from './Template3';
import Template4 from './Template4';
import Template6 from './Template6';
import type { TemplateRenderProps } from './templateTypes';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) });
});
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

const order = ['wishes', 'rsvp', 'photobooth', 'welcome', 'itinerary', 'walimah'];
const props = (id: number): TemplateRenderProps => ({
  wedding: { templateId: id, brideName: 'Alex', groomName: 'Sam', weddingDate: '2027-02-14', venue: 'Garden', isRsvpOpen: true } as TemplateRenderProps['wedding'],
  wishes: [], photos: [], photoBoothEnabled: true, itinerary: [{ itineraryItemId: 1, label: 'Arrival', detail: '10 AM' }] as TemplateRenderProps['itinerary'],
  customConfig: { 'section.order': order.join(','), 'walimah.body': '<p>Ceremony</p>' },
  onRSVP: vi.fn().mockResolvedValue(undefined), onSubmitWish: vi.fn().mockResolvedValue(undefined),
});
const domOrder = (container: HTMLElement) => [...container.querySelectorAll('#welcome,#walimah,#rsvp,#itinerary,#wishes,#photobooth')].map((node) => node.id);

describe('resolved section order in document flow', () => {
  it.each([[1, Template1], [2, Template2], [3, Template3], [6, Template6]] as const)('T%i uses saved order and exclusions without changing settings', (id, Component) => {
    const p = props(id); const saved = { ...p.customConfig };
    const { container, rerender } = render(<Component {...p} />);
    expect(domOrder(container)).toEqual(order);
    expect(p.customConfig).toEqual(saved);
    rerender(<Component {...p} customConfig={{ ...p.customConfig, 'section.order': 'wishes,rsvp,!welcome,!photobooth,!walimah,!itinerary' }} />);
    expect(domOrder(container)).toEqual(['wishes', 'rsvp']);
    rerender(<Component {...p} photoBoothEnabled={false} itinerary={[]} customConfig={{ 'section.order': 'welcome,rsvp,wishes', 'walimah.body': '<p>Ceremony</p>' }} />);
    expect(domOrder(container)).toEqual(['welcome', 'walimah', 'rsvp', 'wishes']);
  });

  it.each([[1, Template1], [2, Template2], [3, Template3]] as const)('T%i retains entered RSVP answers when reordered', (id, Component) => {
    const p = props(id); const { container, rerender } = render(<Component {...p} />);
    const input = within(container.querySelector('#rsvp')! as HTMLElement).getByPlaceholderText(/Your name/i);
    fireEvent.change(input, { target: { value: 'Nadia' } });
    rerender(<Component {...p} customConfig={{ ...p.customConfig, 'section.order': [...order].reverse().join(',') }} />);
    expect(within(container.querySelector('#rsvp')! as HTMLElement).getByPlaceholderText(/Your name/i)).toHaveValue('Nadia');
    expect(domOrder(container)).toEqual([...order].reverse());
  });
  it.each([[1, Template1], [2, Template2], [3, Template3], [4, Template4], [6, Template6]] as const)('T%i batches a populated guestbook without losing cards', (id, Component) => {
    const p = props(id);
    p.wishes = Array.from({ length: 23 }, (_, index) => ({ wishId: index, eventId: 1, guestName: `Guest ${index}`, message: `Audit wish ${index}`, createdDate: '2026-11-08' }));
    const { container } = render(<Component {...p} />);
    const cards = () => [...container.querySelectorAll('p')].filter((node) => node.textContent?.includes('Audit wish '));
    expect(cards()).toHaveLength(10);
    const button = [...container.querySelectorAll('button')].find((node) => node.textContent?.includes('Load more (13 remaining)'))!;
    fireEvent.click(button); expect(cards()).toHaveLength(20);
  });

});
