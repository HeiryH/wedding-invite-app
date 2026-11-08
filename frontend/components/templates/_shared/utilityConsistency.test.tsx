import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './hooks/useCountdown';
import { getImageUrl } from '@/lib/utils';
import { configValue } from '../configValue';
import WishBatch from './WishBatch';
import CoupleGallerySlot from './slots/CoupleGallerySlot';
import { SLOT_AVAILABLE } from './slots';
import type { SlotProps } from './types';
import type { Wish, Photo } from '@/lib/api';
import { TemplateSlots } from '@/lib/api';

afterEach(() => vi.useRealTimers());
describe('shared template utilities', () => {
  it('uses one timer for multiple countdowns and cleans it up after the last subscriber', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-08'));
    const first = renderHook(() => useCountdown('2026-11-09'));
    const second = renderHook(() => useCountdown('2026-11-10'));
    expect(first.result.current?.days).toBe(1); expect(second.result.current?.days).toBe(2); expect(vi.getTimerCount()).toBe(1);
    first.unmount(); expect(vi.getTimerCount()).toBe(1); second.unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it('preserves explicit config empty-value policies and external media URLs', () => {
    expect(configValue({ text: '' }, 'text', 'Default')).toBe('Default'); expect(configValue({ text: '' }, 'text', 'Default', 'preserve')).toBe('');
    expect(getImageUrl('/uploads/a.jpg', 'https://api.example/')).toBe('https://api.example/uploads/a.jpg');
    for (const url of ['https://cdn.example/a.jpg', 'blob:photo', 'data:image/png;base64,AA', '/templates/t7/a.webp']) expect(getImageUrl(url, 'https://api.example')).toBe(url);
  });
  it('batches guestbook DOM without losing order or access to remaining wishes', () => {
    const wishes = Array.from({ length: 23 }, (_, i) => ({ wishId: i, guestName: `Guest ${i}`, message: `Wish ${i}` })) as Wish[];
    render(<WishBatch wishes={wishes}>{(visible) => visible.map((wish) => <p key={wish.wishId}>{wish.message}</p>)}</WishBatch>);
    expect(screen.queryByText('Wish 10')).toBeNull(); fireEvent.click(screen.getByText('Load more (13 remaining)')); expect(screen.getByText('Wish 19')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Load more (3 remaining)')); expect(screen.getByText('Wish 22')).toBeInTheDocument();
  });
  it('renders authored couple media only through an explicitly selected slot', () => {
    const props = { t: (_key: string, fallback: string) => fallback, coupleMedia: [{ photoId: 1, photoUrl: 'https://cdn.example/couple.jpg', templateSlot: TemplateSlots.COUPLE_GALLERY }] as Photo[] } as SlotProps;
    expect(SLOT_AVAILABLE.coupleGallery({ ...props, coupleMedia: [] })).toBe(false);
    expect(SLOT_AVAILABLE.coupleGallery(props)).toBe(true); render(<CoupleGallerySlot {...props} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.example/couple.jpg');
  });
});
