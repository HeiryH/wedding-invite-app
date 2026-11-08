import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import EventUrlField from './EventUrlField';
import { eventService } from '@/lib/api';

vi.mock('@/lib/api', () => ({ eventService: { checkSlug: vi.fn() } }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
test('invalid input supersedes an older in-flight availability response', async () => {
  vi.useFakeTimers();
  let resolve!: (value: { available: boolean; slug: string }) => void;
  vi.mocked(eventService.checkSlug).mockImplementation(() => new Promise(done => { resolve = done; }));
  const onStatusChange = vi.fn();
  const props = { eventType: 'WEDDING', onChange: vi.fn(), inputStyle: {}, labelSlot: () => null, onStatusChange };
  const view = render(<EventUrlField {...props} value="alice-and-bob" suggestion="alice-and-bob" />);
  await act(async () => vi.advanceTimersByTime(400));
  expect(eventService.checkSlug).toHaveBeenCalledOnce();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
  view.rerender(<EventUrlField {...props} value="a" suggestion="alice-and-bob" />);
  expect(onStatusChange).toHaveBeenLastCalledWith('invalid');
  await act(async () => resolve({ available: true, slug: 'alice-and-bob' }));
  expect(onStatusChange).toHaveBeenLastCalledWith('invalid');
});
test('debounces checks and reports the current available result', async () => {
  vi.useFakeTimers(); vi.mocked(eventService.checkSlug).mockResolvedValue({ available: true, slug: 'alice-and-bob' });
  const onStatusChange = vi.fn();
  render(<EventUrlField eventType="WEDDING" value="alice-and-bob" suggestion="alice-and-bob" onChange={vi.fn()} onStatusChange={onStatusChange} inputStyle={{}} labelSlot={() => null} />);
  expect(onStatusChange).toHaveBeenLastCalledWith('checking');
  await act(async () => vi.advanceTimersByTime(399));
  expect(eventService.checkSlug).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTime(1));
  expect(onStatusChange).toHaveBeenLastCalledWith('available');
});
