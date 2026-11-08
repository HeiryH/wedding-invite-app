import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeTimelineControls, decodeTimelineView, decodeSidebar, decodeDirectorTab, DEFAULT_SIDEBAR, DEFAULT_TIMELINE_CONTROLS, DEFAULT_TIMELINE_VIEW, useWorkspacePreference } from './workspacePreferences';

describe('local cinematic workspace preferences', () => {
  beforeEach(() => localStorage.clear());
  it('validates stored values without accepting content or invalid controls', () => {
    expect(decodeTimelineControls({ zoom: 99, filter: 'bad', collapsedKinds: ['text', 'bad', 'text', 'all'] })).toMatchObject({ zoom: 4, filter: 'all', collapsedKinds: ['text'], hiddenTracks: [], lockedTracks: [], scrollTop: 0 });
    expect(decodeSidebar({ inspectorTab: 'style', collapsedLayers: ['a', 3, 'a'], scroll: { scene: -4, camera: 234, unexpected: 22 } })).toMatchObject({ inspectorTab: 'style', collapsedLayers: ['a'], scroll: { scene: 0, camera: 234 } });
    expect(decodeSidebar({ scroll: { unexpected: 22 } })?.scroll).not.toHaveProperty('unexpected');
    expect(decodeTimelineView({ expanded: true, collapsed: 'yes', allHeight: -4, focusHeight: Infinity })).toEqual({ expanded: true, collapsed: false, allHeight: 148, focusHeight: 220 });
    expect(decodeTimelineView(null)).toBeUndefined();
  });
  it('restores and persists chrome across remounts without touching invitation storage', () => {
    localStorage.setItem('prefs', JSON.stringify({ expanded: true, allHeight: 500 }));
    const first = renderHook(() => useWorkspacePreference('prefs', DEFAULT_TIMELINE_VIEW, decodeTimelineView));
    expect(first.result.current[0]).toMatchObject({ expanded: true, allHeight: 500 });
    act(() => first.result.current[1]((current) => ({ ...current, collapsed: true })));
    first.unmount();
    const next = renderHook(() => useWorkspacePreference('prefs', DEFAULT_TIMELINE_VIEW, decodeTimelineView));
    expect(next.result.current[0]).toMatchObject({ collapsed: true });
    expect(localStorage.length).toBe(1);
  });
  it('survives malformed or blocked storage', () => {
    localStorage.setItem('prefs', '{');
    const first = renderHook(() => useWorkspacePreference('prefs', DEFAULT_TIMELINE_VIEW, decodeTimelineView));
    expect(first.result.current[0]).toEqual(DEFAULT_TIMELINE_VIEW);
    first.unmount();
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const second = renderHook(() => useWorkspacePreference('prefs', DEFAULT_TIMELINE_VIEW, decodeTimelineView));
    act(() => second.result.current[1]((current) => ({ ...current, collapsed: true })));
    expect(second.result.current[0].collapsed).toBe(true);
    get.mockRestore(); set.mockRestore();
  });
  it('keeps sidebar, advanced tabs and timeline visibility/locks as local chrome', () => {
    const sidebar = renderHook(() => useWorkspacePreference('sidebar', DEFAULT_SIDEBAR, decodeSidebar));
    act(() => sidebar.result.current[1]({ inspectorTab: 'animation', collapsedLayers: ['dais'], scroll: { scene: 360 }, lastCameraMode: 'camera-beat' }));
    sidebar.unmount();
    const restored = renderHook(() => useWorkspacePreference('sidebar', DEFAULT_SIDEBAR, decodeSidebar));
    expect(restored.result.current[0]).toMatchObject({ inspectorTab: 'animation', collapsedLayers: ['dais'], scroll: { scene: 360 }, lastCameraMode: 'camera-beat' });
    const timeline = renderHook(() => useWorkspacePreference('timeline', DEFAULT_TIMELINE_CONTROLS, decodeTimelineControls));
    act(() => timeline.result.current[1]((current) => ({ ...current, hiddenTracks: ['cloud'], lockedTracks: ['dais'], scrollTop: 212 })));
    timeline.unmount();
    const next = renderHook(() => useWorkspacePreference('timeline', DEFAULT_TIMELINE_CONTROLS, decodeTimelineControls));
    expect(next.result.current[0]).toMatchObject({ hiddenTracks: ['cloud'], lockedTracks: ['dais'], scrollTop: 212 });
    expect(decodeDirectorTab('pacing')).toBe('pacing');
    expect(decodeDirectorTab('unknown')).toBeUndefined();
  });
});
