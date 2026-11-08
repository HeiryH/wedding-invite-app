'use client';
import { useEffect, useState } from 'react';

/** Local editor chrome only, never invitation content or design values. */
export function useWorkspacePreference<T>(key: string, initial: T, decode: (value: unknown) => T | undefined) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const saved = raw ? decode(JSON.parse(raw)) : undefined;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-only chrome after the matching server/client first render.
      if (saved !== undefined) setValue(saved);
    } catch { /* Storage failure must not prevent editing. */ }
    setReady(true);
  }, [key, decode]);
  useEffect(() => {
    if (ready) try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Quota/private browsing. */ }
  }, [key, ready, value]);
  return [value, setValue, ready] as const;
}
export type TimelineFilter = 'all' | 'motion' | 'set' | 'asset' | 'text' | 'effect' | 'interaction';
const filters: TimelineFilter[] = ['all', 'motion', 'set', 'asset', 'text', 'effect', 'interaction'];
export interface TimelineControlsPreference { zoom: number; filter: TimelineFilter; collapsedKinds: Exclude<TimelineFilter, 'all'>[]; hiddenTracks: string[]; lockedTracks: string[]; scrollLeft: number; scrollTop: number }
export const DEFAULT_TIMELINE_CONTROLS: TimelineControlsPreference = { zoom: 1, filter: 'all', collapsedKinds: [], hiddenTracks: [], lockedTracks: [], scrollLeft: 0, scrollTop: 0 };
const ids = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length <= 240))].slice(0, 500) : [];
const scroll = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100000, Math.round(value))) : 0;
export function decodeTimelineControls(value: unknown): TimelineControlsPreference | undefined {
  if (!value || typeof value !== 'object') return;
  const saved = value as Partial<TimelineControlsPreference>;
  return { zoom: typeof saved.zoom === 'number' && Number.isFinite(saved.zoom) ? Math.max(1, Math.min(4, saved.zoom)) : 1,
    filter: filters.includes(saved.filter!) ? saved.filter! : 'all',
    collapsedKinds: Array.isArray(saved.collapsedKinds) ? [...new Set(saved.collapsedKinds.filter((kind) => kind !== ('all' as string) && filters.includes(kind)))] : [],
    hiddenTracks: ids(saved.hiddenTracks), lockedTracks: ids(saved.lockedTracks), scrollLeft: scroll(saved.scrollLeft), scrollTop: scroll(saved.scrollTop) };
}
export interface TimelineViewPreference { expanded: boolean; collapsed: boolean; focusHeight: number; allHeight: number }
export const DEFAULT_TIMELINE_VIEW: TimelineViewPreference = { expanded: false, collapsed: false, focusHeight: 220, allHeight: 420 };
export function decodeTimelineView(value: unknown): TimelineViewPreference | undefined {
  if (!value || typeof value !== 'object') return;
  const saved = value as Partial<TimelineViewPreference>;
  const height = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(148, Math.min(600, value)) : fallback;
  return { expanded: saved.expanded === true, collapsed: saved.collapsed === true,
    focusHeight: height(saved.focusHeight, 220), allHeight: height(saved.allHeight, 420) };
}

export interface SidebarPreference {
  inspectorTab: 'layout' | 'style' | 'animation';
  collapsedLayers: string[];
  scroll: Record<string, number>;
  lastCameraMode: 'camera-compose' | 'camera-beat';
}
export const DEFAULT_SIDEBAR: SidebarPreference = { inspectorTab: 'layout', collapsedLayers: [], scroll: {}, lastCameraMode: 'camera-compose' };
export function decodeSidebar(value: unknown): SidebarPreference | undefined {
  if (!value || typeof value !== 'object') return;
  const saved = value as Partial<SidebarPreference>;
  const positions: Record<string, number> = {};
  for (const key of ['scene', 'camera', 'advanced', 'timing-inspector', 'inspector-layout', 'inspector-style', 'inspector-animation']) {
    positions[key] = scroll(saved.scroll?.[key]);
  }
  return { inspectorTab: ['layout', 'style', 'animation'].includes(saved.inspectorTab!) ? saved.inspectorTab! : 'layout',
    collapsedLayers: ids(saved.collapsedLayers), scroll: positions, lastCameraMode: saved.lastCameraMode === 'camera-beat' ? 'camera-beat' : 'camera-compose' };
}
export function decodeDirectorTab(value: unknown): string | undefined {
  return typeof value === 'string' && ['effects', 'interactions', 'pacing', 'navigation', 'memories', 'theme'].includes(value) ? value : undefined;
}
export function decodeLayerFilter(value: unknown): 'all' | 'visible' | 'hidden' | undefined {
  return value === 'all' || value === 'visible' || value === 'hidden' ? value : undefined;
}
