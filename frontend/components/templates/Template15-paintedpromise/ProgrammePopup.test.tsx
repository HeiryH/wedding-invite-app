import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SheetsProvider, useSheets } from '../_shared/slots/sheets';
import type { SlotProps } from '../_shared/types';
import ProgrammePopup from './ProgrammePopup';

const props = {
  wedding: { brideName: 'Alya', groomName: 'Danish', weddingDate: '2027-01-15T11:00:00+08:00', venue: 'Glass Hall', venueAddress: 'Jalan Test, Brunei' },
  itinerary: [{ itineraryItemId: 1, detail: '10:30', label: 'Guest arrival' }, { itineraryItemId: 2, detail: '11:00', label: 'Ceremony' }],
  t: (_key: string, fallback: string) => fallback,
} as SlotProps;
function Demo({ data = props }: { data?: SlotProps }) {
  const sheets = useSheets();
  return <><button onClick={() => sheets.open('programme')}>Open programme</button><ProgrammePopup slotProps={data} artwork="/board.png" /></>;
}
describe('programme popup', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open'); } });
  });
  afterEach(() => { cleanup(); Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal'); Reflect.deleteProperty(HTMLDialogElement.prototype, 'close'); vi.restoreAllMocks(); });
  it('shows itinerary, calendar and lazy venue map, then closes and reopens', () => {
    render(<SheetsProvider><Demo /></SheetsProvider>);
    fireEvent.click(screen.getByText('Open programme'));
    const dialog = screen.getByRole('dialog', { name: 'Programme' });
    expect(dialog).toHaveTextContent('Guest arrival');
    expect(dialog).toHaveTextContent('11:00');
    expect(screen.getByRole('region', { name: 'Programme board content' })).toContainElement(screen.getByRole('region', { name: 'Calendar and venue' }));
    expect(screen.queryByTitle('Programme venue map')).toBeNull();
    fireEvent.click(screen.getByText('Save to calendar'));
    expect(screen.getByText('Google Calendar')).toHaveAttribute('href', expect.stringContaining('calendar.google.com'));
    expect(screen.getByText('Apple Calendar / iCal')).toHaveAttribute('download', 'programme.ics');
    fireEvent.click(screen.getByRole('button', { name: 'View venue map' }));
    expect(screen.getByTitle('Programme venue map')).toHaveAttribute('src', expect.stringContaining('Jalan%20Test'));
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Open programme'));
    fireEvent.click(screen.getByRole('button', { name: 'Close programme' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('handles an empty itinerary, missing venue and invalid event date', () => {
    render(<SheetsProvider><Demo data={{ ...props, itinerary: [], wedding: { ...props.wedding, weddingDate: '', venue: '', venueAddress: '' } }} /></SheetsProvider>);
    fireEvent.click(screen.getByText('Open programme'));
    expect(screen.getByRole('dialog')).toHaveTextContent('The programme will be shared here soon.');
    expect(screen.queryByText('Save to calendar')).toBeNull();
    expect(screen.queryByRole('button', { name: 'View venue map' })).toBeNull();
  });
  it('keeps a single sheet state and closes from the surrounding area', () => {
    render(<SheetsProvider><Demo /></SheetsProvider>);
    fireEvent.click(screen.getByText('Open programme'));
    const sheet = screen.getByTestId('programme-sheet');
    expect(sheet).not.toHaveAttribute('data-expanded');
    expect(screen.queryByRole('button', { name: 'Expand programme board' })).toBeNull();
    fireEvent.wheel(sheet, { deltaY: 80 });
    expect(sheet).not.toHaveAttribute('data-expanded');
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Open programme'));
    expect(screen.getByTestId('programme-sheet')).not.toHaveAttribute('data-expanded');
  });
});
