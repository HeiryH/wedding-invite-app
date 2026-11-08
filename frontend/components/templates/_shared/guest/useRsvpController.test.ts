import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useRsvpController } from './useRsvpController';
it('retains form answers across steps and invalidates a table when party size changes', () => {
  const { result } = renderHook(() => useRsvpController({ guestName: '', numberOfAttendees: 1 }));
  act(() => { result.current.setForm({ guestName: 'Nadia', numberOfAttendees: 1 }); result.current.setSelectedTableId(4); result.current.setScreen('seating'); });
  expect(result.current.step).toBe(2); expect(result.current.form.guestName).toBe('Nadia');
  act(() => result.current.setScreen('form')); expect(result.current.form.guestName).toBe('Nadia');
  act(() => { result.current.setForm((form) => ({ ...form, numberOfAttendees: 3 })); });
  expect(result.current.selectedTableId).toBeNull();
  act(() => { result.current.setForm((form) => ({ ...form, numberOfAttendees: form.numberOfAttendees + 1 })); result.current.setForm((form) => ({ ...form, numberOfAttendees: form.numberOfAttendees + 1 })); });
  expect(result.current.form.numberOfAttendees).toBe(5);
});
