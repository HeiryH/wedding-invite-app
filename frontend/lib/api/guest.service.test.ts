import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the axios instance so no real HTTP happens — we only assert routing.
vi.mock('./client', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: { guestId: 1 } }),
    get: vi.fn(),
    put: vi.fn().mockResolvedValue({ data: { guestId: 1 } }),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';
import { guestService } from './guest.service';

const post = vi.mocked(apiClient.post);

const sampleGuest = {
  guestName: 'Ada',
  email: 'ada@example.com',
  phoneNumber: '123',
  guestSide: 'PRIMARY' as const,
  numberOfAttendees: 2,
  songRequest: '',
  isAttending: true,
};

describe('guestService endpoint routing', () => {
  it('preserves omitted admin defaults in the request body', async () => {
    const input = { guestName: 'Ada', email: '', phoneNumber: '', songRequest: '', guestSide: 'PRIMARY' as const };
    await guestService.create(42, input);
    expect(post).toHaveBeenCalledWith('/guest', { ...input, eventId: 42 });
    await guestService.update(7, input);
    expect(apiClient.put).toHaveBeenCalledWith('/guest/7', input);
  });
  beforeEach(() => post.mockClear());

  it('create() posts to the authorized admin endpoint /guest', async () => {
    await guestService.create(42, sampleGuest);
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/guest');
    expect(body).toMatchObject({ ...sampleGuest, eventId: 42 });
  });

  it('rsvp() posts to the public endpoint /guest/rsvp', async () => {
    await guestService.rsvp(42, sampleGuest);
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/guest/rsvp');
    expect(body).toMatchObject({ ...sampleGuest, eventId: 42 });
  });

  it('create() and rsvp() hit different endpoints (regression guard)', async () => {
    await guestService.create(1, sampleGuest);
    await guestService.rsvp(1, sampleGuest);
    expect(post.mock.calls[0][0]).toBe('/guest');
    expect(post.mock.calls[1][0]).toBe('/guest/rsvp');
  });
});
