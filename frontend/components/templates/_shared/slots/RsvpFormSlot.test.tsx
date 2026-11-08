import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { SlotProps } from '../types';
import { RsvpFormSlot, RsvpSeatingSlot } from './RsvpFormSlot';
import { RsvpFlowProvider } from './rsvpFlow';
import { MasterPreviewContext } from './preview';

it.each([false, true])('drops hidden answers on submission (seating: %s)', async (seatingEnabled) => {
  const onRSVP = vi.fn().mockResolvedValue(undefined);
  const props: SlotProps = {
    wedding: { eventType: 'WEDDING' } as SlotProps['wedding'],
    t: (_key, fallback) => fallback,
    wishes: [], photos: [], tables: [], itinerary: [],
    onRSVP, onSubmitWish: vi.fn(), seatingEnabled, photoBoothEnabled: false, editing: false,
  };

  const form = (current: SlotProps) => (
    <RsvpFlowProvider>
      <RsvpFormSlot {...current} />
      {seatingEnabled && <RsvpSeatingSlot {...current} />}
    </RsvpFlowProvider>
  );

  const { rerender } = render(form(props));
  fireEvent.change(screen.getByPlaceholderText('Full name *'), { target: { value: 'Nadia' } });
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'nadia@example.test' } });
  fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '1234567' } });
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Groom' } });
  fireEvent.change(screen.getByPlaceholderText('Song request (optional)'), { target: { value: 'A song' } });

  rerender(form({ ...props, t: (key, fallback) => key.startsWith('rsvp.fields.') ? 'false' : fallback }));
  expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Phone')).not.toBeInTheDocument();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Song request (optional)')).not.toBeInTheDocument();

  if (seatingEnabled) {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onRSVP).not.toHaveBeenCalled();
  }
  fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

  await waitFor(() => expect(onRSVP).toHaveBeenCalledWith({
    guestName: 'Nadia', email: '', phoneNumber: '', brideOrGroomSide: null,
    numberOfAttendees: 1, isAttending: true, songRequest: '', tableId: null,
  }));
});

it('allows a blank RSVP through sample seating only in the master preview', () => {
  const onRSVP = vi.fn();
  const props: SlotProps = {
    wedding: { eventType: 'WEDDING' } as SlotProps['wedding'],
    t: (_key, fallback) => fallback,
    wishes: [], photos: [], tables: [], itinerary: [],
    onRSVP, onSubmitWish: vi.fn(), seatingEnabled: true, photoBoothEnabled: false, editing: false,
  };
  const form = (master: boolean) => (
    <MasterPreviewContext.Provider value={master}>
      <RsvpFlowProvider>
        <RsvpFormSlot {...props} />
        <RsvpSeatingSlot {...props} />
      </RsvpFlowProvider>
    </MasterPreviewContext.Provider>
  );

  const { rerender } = render(form(false));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByPlaceholderText('Full name *')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Send RSVP' })).not.toBeInTheDocument();

  rerender(form(true));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));
  expect(screen.getByText('Thank you. We look forward to celebrating with you.')).toBeInTheDocument();
  expect(onRSVP).not.toHaveBeenCalled();
});
