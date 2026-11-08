import { act, renderHook, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestExecutionContext, GuestFeedbackContext } from '../guest/useGuestSubmission';
import { useInvitationAudio } from './useInvitationAudio';

const instances: FakeAudio[] = [];
class FakeAudio extends EventTarget {
  paused = true; muted = false; loop = false; preload = ''; src: string;
  constructor(url: string) { super(); this.src = url; instances.push(this); }
  play = vi.fn(async () => { this.paused = false; this.dispatchEvent(new Event('play')); });
  pause = vi.fn(() => { this.paused = true; this.dispatchEvent(new Event('pause')); });
}
beforeEach(() => { instances.length = 0; vi.stubGlobal('Audio', FakeAudio); });

describe('shared invitation audio', () => {
  it('tracks real playback, updates URL/loop and disposes old audio', async () => {
    const { result, rerender, unmount } = renderHook(({ url, loop }) => useInvitationAudio(url, loop), { initialProps: { url: '/one.mp3', loop: true } });
    expect(instances[0].play).not.toHaveBeenCalled(); expect(result.current.isPlaying).toBe(false);
    await act(() => result.current.toggle()); expect(result.current.isPlaying).toBe(true);
    act(() => { instances[0].paused = true; instances[0].dispatchEvent(new Event('ended')); }); expect(result.current.isPlaying).toBe(false);
    rerender({ url: '/two.mp3', loop: false }); expect(instances[0].src).toBe(''); expect(instances[0].pause).toHaveBeenCalled(); expect(instances[1].loop).toBe(false);
    unmount(); expect(instances[1].src).toBe('');
  });
  it('does not optimistically claim playback after rejection', async () => {
    const report = vi.fn(); const { result } = renderHook(() => useInvitationAudio('/one.mp3', true), { wrapper: ({ children }) => <GuestFeedbackContext.Provider value={report}>{children}</GuestFeedbackContext.Provider> });
    instances[0].play.mockRejectedValueOnce(new Error('Blocked'));
    await act(() => result.current.toggle()); expect(result.current.isPlaying).toBe(false); expect(report).toHaveBeenCalledOnce();
  });
  it('retains autoplay gesture fallback and removes unlock listeners on disposal', async () => {
    vi.stubGlobal('Audio', class extends FakeAudio {
      constructor(url: string) { super(url); this.play.mockRejectedValueOnce(new Error('Autoplay blocked')); }
    });
    const { result, unmount } = renderHook(() => useInvitationAudio('/one.mp3', true, { autoPlay: true, unlockOnScroll: true }));
    await waitFor(() => expect(result.current.needsGesture).toBe(true));
    expect(instances[0].muted).toBe(true);
    fireEvent.click(document); expect(result.current.needsGesture).toBe(false);
    unmount(); instances[0].muted = true; fireEvent.scroll(document); expect(instances[0].muted).toBe(true);
  });
  it('creates no audio resource in any preview mode', () => {
    const { result } = renderHook(() => useInvitationAudio('/one.mp3', true, { autoPlay: true }), { wrapper: ({ children }) => <GuestExecutionContext.Provider value="preview">{children}</GuestExecutionContext.Provider> });
    expect(result.current.enabled).toBe(false); expect(instances).toHaveLength(0);
  });
});
