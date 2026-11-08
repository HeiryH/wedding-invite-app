import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TemplateRenderProps } from '../templateTypes';
import Template16 from './index';
import { TEMPLATE_ENGINES } from '../_shared/registry';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({
    matches: false, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })) });
});

const props = (): TemplateRenderProps => ({
  wedding: { templateId: 16, eventType: 'WEDDING', brideName: 'Alya', groomName: 'Idris', weddingDate: '2027-02-14T12:00:00+08:00', venue: 'The Glasshouse', isRsvpOpen: true } as TemplateRenderProps['wedding'],
  wishes: [], photos: [], itinerary: [], tables: [], photoBoothEnabled: false, seatingEnabled: false,
  onRSVP: vi.fn().mockResolvedValue(undefined), onSubmitWish: vi.fn().mockResolvedValue(undefined),
});

describe('Inkbound Revelry flow', () => {
  it('applies Adjust layouts to content, artwork and added text at the selected breakpoint', () => {
    const p = props();
    p.editor = { enabled: true, breakpoint: 'mobile', selectedStage: 'welcome', selectedLayer: 'firstName' };
    p.customConfig = {
      't16.layout.mobile.welcome': JSON.stringify({ layers: [
        { id: 'firstName', x: 60, y: 55, s: 1.2, color: '#123456' },
        { id: 'ribbon', hidden: true },
        { id: 'added-text', kind: 'text', text: 'See you there', x: 50, y: 20, w: 60, h: 10, s: 1, z: 5, opacity: 1, hidden: false },
      ] }),
    };
    const { container, rerender } = render(<Template16 {...p} />);
    const firstName = screen.getByRole('heading', { level: 1 }).querySelector('span')!;
    expect(firstName).toHaveStyle({ transform: 'translate(10%, 5%) scale(1.2)', color: '#123456' });
    expect(container.querySelector('#welcome > div')!).toHaveAttribute('data-stage', 'welcome');
    expect(container.querySelector('#welcome > div:nth-child(2)')).toHaveStyle({ display: 'none' });
    expect(screen.getByText('See you there')).toBeInTheDocument();
    expect(TEMPLATE_ENGINES[16].keyPrefix).toBe('t16');
    expect(TEMPLATE_ENGINES[16].stageIds({ codes: ['welcome', 'rsvp'], photoBoothEnabled: false, draftConfig: {} })).toEqual(['welcome', 'rsvp']);

    rerender(<Template16 {...p} editor={{ ...p.editor, breakpoint: 'desktop' }} />);
    expect(firstName.style.transform).toBe('');
    expect(screen.queryByText('See you there')).not.toBeInTheDocument();
    expect(container.querySelector('#welcome > div')).not.toHaveStyle({ display: 'none' });
  });
  it.each([undefined, '', '<p>Join our celebration.</p>'])('keeps ceremony facts and actions with body %s', (body) => {
    const p = props();
    p.wedding.venueAddress = '17 Garden Road, Kuala Lumpur';
    p.customConfig = { 'general.showVenueMap': 'true', 'general.showAddToCalendar': 'true', ...(body === undefined ? {} : { 'walimah.body': body }) };
    const { container } = render(<Template16 {...p} />);
    const ceremony = container.querySelector('#walimah')!;
    expect(ceremony).toHaveTextContent('14 February 2027');
    expect(ceremony).toHaveTextContent('The Glasshouse');
    expect(ceremony).toHaveTextContent('17 Garden Road, Kuala Lumpur');
    expect(Boolean(ceremony.querySelector('svg'))).toBe(Boolean(body));
    expect(ceremony.querySelector('h2')?.textContent ?? '').toBe(body ? 'Walimatul Urus' : '');
    expect(screen.getByRole('link', { name: 'View Map' })).toHaveAttribute('href', `https://maps.google.com/?q=${encodeURIComponent(p.wedding.venueAddress)}`);
    fireEvent.click(screen.getByRole('button', { name: 'Add to Calendar' }));
    expect(screen.getByRole('link', { name: 'Google Calendar' })).toHaveAttribute('href', expect.stringContaining('calendar.google.com'));
    expect(screen.getByRole('link', { name: 'Apple Calendar' })).toHaveAttribute('download', 'wedding.ics');
    expect(screen.getByRole('link', { name: 'Outlook' })).toHaveAttribute('href', expect.stringContaining('outlook.live.com'));
  });
  it('renders the six ordered flow sections without granting gated media or seating', () => {
    const { container } = render(<Template16 {...props()} />);
    expect([...container.querySelectorAll('section[data-section]')].map((el) => el.getAttribute('data-section')))
      .toEqual(['welcome', 'walimah', 'rsvp', 'itinerary', 'wishes', 'photobooth']);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alya');
    expect(screen.queryByRole('button', { name: 'Upload a Photo' })).not.toBeInTheDocument();
    expect(screen.queryByText('Choose your table')).not.toBeInTheDocument();
  });
  it('awaits the real RSVP callback and preserves the API payload', async () => {
    const p = props(); render(<Template16 {...p} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Nadia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));
    await waitFor(() => expect(p.onRSVP).toHaveBeenCalledWith(expect.objectContaining({ guestName: 'Nadia', isAttending: true, numberOfAttendees: 1, tableId: null })));
    expect(await screen.findByText('Thank you. We look forward to celebrating with you.')).toBeInTheDocument();
  });
  it('routes an attending guest through capacity-aware seating without borrowed raster artwork', async () => {
    const p = props(); p.seatingEnabled = true;
    p.tables = [{ tableId: 3, tableName: 'Table 03', capacity: 6, guestCount: 0 }, { tableId: 4, tableName: 'Table 04', capacity: 1, guestCount: 1 }] as TemplateRenderProps['tables'];
    const { container } = render(<Template16 {...p} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Nadia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(p.onRSVP).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Table 04/ })).toBeDisabled();
    expect(container.querySelector('img[src*="t7"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Table 03/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));
    await waitFor(() => expect(p.onRSVP).toHaveBeenCalledWith(expect.objectContaining({ tableId: 3 })));
  });
  it('uploads a real file payload and keeps gallery controls functional', async () => {
    const p = props(); p.photoBoothEnabled = true; p.onUploadPhoto = vi.fn().mockResolvedValue(undefined);
    p.photos = [1, 2].map((id) => ({ photoId: id, photoUrl: `/uploads/native-${id}.jpg`, caption: `Memory ${id}` })) as TemplateRenderProps['photos'];
    render(<Template16 {...p} />);
    expect(screen.getByRole('img', { name: 'Memory 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('img', { name: 'Memory 2' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(screen.getAllByRole('img')).toHaveLength(2);
    const file = new File(['native photo fixture'], 'memory.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Upload a Photo'), { target: { files: [file] } });
    await waitFor(() => expect(p.onUploadPhoto).toHaveBeenCalledWith({ guestName: 'Guest', caption: '', file }));
    expect(await screen.findByText('Your photo was uploaded.')).toBeInTheDocument();
  });
  it('does not post mutations in edit mode', async () => {
    const p = props(); p.editor = { enabled: true, breakpoint: 'mobile' };
    render(<Template16 {...p} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Nadia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Preview only');
    expect(p.onRSVP).not.toHaveBeenCalled();
  });
  it('suppresses mutations in a normal preview even when Adjust is not active', async () => {
    const p = { ...props(), previewOnly: true };
    render(<Template16 {...p} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Nadia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Preview only');
    expect(p.onRSVP).not.toHaveBeenCalled();
  });
  it('limits wishes to the backend 1000-character contract', () => {
    render(<Template16 {...props()} />);
    expect(screen.getByLabelText('Leave a Wish')).toHaveAttribute('maxlength', '1000');
  });
  it('posts wishes through the real callback and does not advance to an unmounted photo step', async () => {
    const p = props(); p.photoBoothEnabled = true;
    render(<Template16 {...p} />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Nadia' } });
    fireEvent.change(screen.getByLabelText('Leave a Wish'), { target: { value: 'Much love' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Wish' }));
    await waitFor(() => expect(p.onSubmitWish).toHaveBeenCalledWith({ guestName: 'Nadia', message: 'Much love' }));
    expect(await screen.findByText('Thank you — your wish was sent.')).toBeInTheDocument();
    expect(screen.getByLabelText('Leave a Wish')).toHaveValue('');
  });
  it('keeps a failed wish editable and never reports false success', async () => {
    const p = props(); p.onSubmitWish = vi.fn().mockRejectedValue(new Error('offline'));
    render(<Template16 {...p} />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Nadia' } });
    fireEvent.change(screen.getByLabelText('Leave a Wish'), { target: { value: 'Much love' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Wish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not');
    expect(screen.getByLabelText('Leave a Wish')).toHaveValue('Much love');
    expect(screen.queryByText('Thank you — your wish was sent.')).not.toBeInTheDocument();
  });
});
