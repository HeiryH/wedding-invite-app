import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GuestFeedbackContext, useGuestSubmission } from './useGuestSubmission';
import { normalizeRsvp, tableCanFit, validateGuestPhoto, MAX_PHOTO_BYTES } from './rules';
import RSVPSection from '../../Template6-fairygarden/components/RSVPSection';
import { SeatingPreviewContext } from '../slots/preview';
import type { Wedding, SeatingTable } from '@/lib/api';

vi.hoisted(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} }); Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) }); });
const form = { guestName: 'Nadia', email: '', phoneNumber: '', numberOfAttendees: 3, isAttending: true, songRequest: '', brideOrGroomSide: 'Bride' as const, tableId: 1 };
const tables = [{ tableId: 1, capacity: 4, guestCount: 2, tableName: 'Garden' }] as SeatingTable[];

describe('shared guest behavior', () => {
  it('normalizes event-specific fields, capacity and declined seats without mutating answers', () => {
    expect(tableCanFit(tables[0], 3)).toBe(false);
    expect(normalizeRsvp(form, { eventType: 'PARTY', maxPax: 2 }, tables)).toMatchObject({ brideOrGroomSide: null, numberOfAttendees: 2, tableId: 1 });
    expect(normalizeRsvp(form, { eventType: 'WEDDING' }, tables)).toMatchObject({ tableId: null, brideOrGroomSide: 'Bride' });
    expect(normalizeRsvp({ ...form, isAttending: false }, undefined, tables).tableId).toBeNull();
    expect(form.tableId).toBe(1);
  });
  it('validates the same client constraints as the backend before upload', () => {
    expect(() => validateGuestPhoto(new File(['image'], 'ok.webp', { type: 'image/webp' }))).not.toThrow();
    for (const file of [new File([], 'empty.png', { type: 'image/png' }), new File(['x'], 'image.svg', { type: 'image/svg+xml' }), { size: MAX_PHOTO_BYTES + 1, name: 'huge.jpg', type: 'image/jpeg' } as File]) expect(() => validateGuestPhoto(file)).toThrow();
  });
  it('locks synchronously, reports failure once and permits retry', async () => {
    const report = vi.fn(); let reject!: (error: Error) => void;
    const pending = new Promise<void>((_, fail) => { reject = fail; }); const action = vi.fn(() => pending);
    const { result } = renderHook(useGuestSubmission, { wrapper: ({ children }) => <GuestFeedbackContext.Provider value={report}>{children}</GuestFeedbackContext.Provider> });
    let first!: Promise<boolean>;
    act(() => { first = result.current.submit(action, 'Try again'); });
    await act(async () => { expect(await result.current.submit(action, 'Try again')).toBe(false); });
    expect(action).toHaveBeenCalledOnce();
    await act(async () => { reject(new Error('Offline')); expect(await first).toBe(false); });
    expect(report).toHaveBeenCalledWith('Offline');
    await act(async () => { expect(await result.current.submit(async () => {}, 'Try again')).toBe(true); });
  });
  it('T6 advances to seating, retains answers on Back and submits the selected table', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<RSVPSection onRSVP={submit} wedding={{ isRsvpOpen: true } as Wedding} seatingEnabled tables={tables} overlayProps={{ breakpoint: 'mobile' }} a={() => ({})} />);
    fireEvent.click(screen.getByRole('button', { name: /Confirm Attendance/ }));
    fireEvent.change(screen.getByPlaceholderText('Full Name *'), { target: { value: 'Nadia' } });
    fireEvent.submit(screen.getByPlaceholderText('Full Name *').closest('form')!);
    expect(screen.queryByPlaceholderText('Full Name *')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByPlaceholderText('Full Name *')).toHaveValue('Nadia');
    fireEvent.submit(screen.getByPlaceholderText('Full Name *').closest('form')!);
    fireEvent.click(screen.getByRole('button', { name: /Garden/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP 💌' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ guestName: 'Nadia', tableId: 1 })));
  });
  it('T6 forced seating preview cannot submit', () => {
    const submit = vi.fn();
    render(<SeatingPreviewContext.Provider value={{ dismiss() {} }}><RSVPSection onRSVP={submit} seatingEnabled tables={tables} overlayProps={{ breakpoint: 'mobile' }} a={() => ({})} /></SeatingPreviewContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP 💌' }));
    expect(submit).not.toHaveBeenCalled();
  });
});
