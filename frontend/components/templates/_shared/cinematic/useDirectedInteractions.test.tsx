import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SheetsProvider } from '../slots/sheets';
import { useDirectedInteractions } from './useDirectedInteractions';
import { PAINTED_PROMISE_DIRECTION as defaults } from '../../Template15-paintedpromise/data/direction';
import { PAINTED_PROMISE_SEQUENCE as sequence, PAINTED_PROMISE_WORLD as world } from '../../Template15-paintedpromise/data/cinematic';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe('directed interactions', () => {
  it('opens, closes on its configured duration and resets only after rewinding', () => {
    vi.useFakeTimers(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const record = { ...defaults.interactions.find((record) => record.id === 'rsvp')!, closeMs: 100 };
    const args = { definitions: [record], tracks: sequence.tracks, beats: sequence.beats, progress: .825, seek: vi.fn(), editing: false };
    const { result, rerender } = renderHook((props) => useDirectedInteractions(props), { initialProps: args, wrapper: SheetsProvider });
    act(() => result.current.trigger(record)); expect(result.current.isOpen).toBe(true); expect(document.body.style.position).toBe('fixed');
    act(() => result.current.close()); expect(result.current.phase('rsvp')).toBe('closing');
    // Scrolling/re-rendering must not restart the closing timer.
    act(() => vi.advanceTimersByTime(60)); rerender({ ...args, progress: .826 });
    act(() => vi.advanceTimersByTime(45)); expect(result.current.phase('rsvp')).toBe('dismissed');
    expect(document.body.style.position).toBe('');
    rerender({ ...args, progress: .1 }); act(() => vi.advanceTimersByTime(1));
    expect(result.current.phase('rsvp')).toBe('ready');
  });
  it('retargets actions without leaving the original prop clickable', () => {
    const record = { ...defaults.interactions[1], triggerLayerId: 'groom' };
    const { result } = renderHook(() => useDirectedInteractions({ definitions: [record], tracks: sequence.tracks, beats: sequence.beats, progress: .825, seek: vi.fn(), editing: false }), { wrapper: SheetsProvider });
    expect(result.current.recordFor(world.find((layer) => layer.id === 'rsvp-letter')!)).toBeUndefined();
    expect(result.current.recordFor(world.find((layer) => layer.id === 'groom')!)?.id).toBe('rsvp');
  });
  it('focuses a saved beat and returns to the original playhead on a second click', () => {
    const record = { ...defaults.interactions[0], availabilityTrackId: '' };
    const seek = vi.fn();
    const args = { definitions: [record], tracks: sequence.tracks, beats: sequence.beats, progress: .6, seek, editing: false };
    const { result, rerender } = renderHook((props) => useDirectedInteractions(props), { initialProps: args, wrapper: SheetsProvider });
    act(() => result.current.trigger(record)); expect(seek).toHaveBeenLastCalledWith(sequence.beats.find((beat) => beat.id === record.targetBeatId)!.at);
    rerender({ ...args, progress: .7 }); act(() => result.current.trigger(record)); expect(seek).toHaveBeenLastCalledWith(.6);
  });
  it('does not run actions in editing mode or outside availability', () => {
    const record = defaults.interactions[1];
    const { result } = renderHook(() => useDirectedInteractions({ definitions: [record], tracks: sequence.tracks, beats: sequence.beats, progress: .1, seek: vi.fn(), editing: true }), { wrapper: SheetsProvider });
    act(() => result.current.trigger(record)); expect(result.current.isOpen).toBe(false);
  });
});
