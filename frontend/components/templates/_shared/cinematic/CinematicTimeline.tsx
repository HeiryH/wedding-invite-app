'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { SCROLL_STOP_EASINGS, type CinematicScrollStop } from './direction';
import type { ResolvedCinematicScrollStop } from './scrollStops';
import { useWorkspacePreference, DEFAULT_TIMELINE_CONTROLS, decodeTimelineControls } from './workspacePreferences';
import {
  cinematicClipBeatSpan,
  constrainCinematicClip,
  describeCinematicStoryPosition,
  moveCinematicClip,
  snapCinematicStoryValue,
  type CinematicResolvedBeat,
  type CinematicSequenceClip,
  type CinematicSequenceTrack,
} from './sequence';
import styles from './CinematicTimeline.module.css';
import { Icon } from '@/components/ui/Icon';

export interface CinematicTimelineAsset {
  id: string;
  label: string;
  trackId?: string;
  sourceTrackId?: string;
  editableTrackId?: string;
  /** Effects owned by this layer also appear in its focused timeline. */
  effectTrackIds?: string[];
  timingStatus?: 'independent' | 'linked' | 'always' | 'hardcoded';
}

interface Props {
  progress: number;
  beats: CinematicResolvedBeat[];
  tracks: CinematicSequenceTrack[];
  scrollStops?: ResolvedCinematicScrollStop[];
  onScrollStopsChange?: (stops: CinematicScrollStop[]) => void;
  selectedAsset?: CinematicTimelineAsset;
  selectedBeat?: string;
  editableBeats?: boolean;
  dirty?: boolean;
  expanded: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onExpandedChange: (expanded: boolean) => void;
  onChange: (progress: number) => void;
  onBeatMove?: (id: string, progress: number) => void;
  onTrackClipChange?: (id: string, clip: CinematicSequenceClip) => void;
  onTrackSelect?: (id: string) => void;
  onClearSelection?: () => void;
  onResetTrack?: (id: string) => void;
  onFocusHeightChange?: (height: number) => void;
}

interface DisplayTrack {
  id: string;
  label: string;
  meta: string;
  kind: CinematicSequenceTrack['kind'] | 'selected-asset';
  clip: CinematicSequenceClip;
  selected?: boolean;
  placeholder?: string;
  sourceTrackId?: string;
  editable?: boolean;
  interactionIcon?: string;
}

type TrackFilter = 'all' | CinematicSequenceTrack['kind'];

interface TrackMenu {
  id: string;
  x: number;
  y: number;
}

interface SnapGuide {
  value: number;
  label: string;
}

interface ClipHistoryEntry {
  id: string;
  before: CinematicSequenceClip;
  after: CinematicSequenceClip;
}

const ALWAYS: CinematicSequenceClip = { start: 0, enterEnd: 0, exitStart: 1, end: 1 };

// Keep the dense editor controls usable even when a host page has broad button
// rules. The module classes own theme states; these base metrics protect the
// timeline from inheriting oversized admin-shell typography and spacing.
const timelineToolStyle: CSSProperties = {
  padding: '5px 10px',
  border: '1px solid var(--border-subtle)',
  borderRadius: 6,
  background: 'var(--surface-card)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 9,
  fontWeight: 600,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

const rowToolStyle: CSSProperties = {
  width: 18,
  height: 18,
  padding: 0,
  border: '1px solid var(--border-subtle)',
  borderRadius: 3,
  background: 'var(--surface-card)',
  color: 'var(--text-subtle)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 9,
  lineHeight: 1,
};

function activeBeatLabel(progress: number, beats: CinematicResolvedBeat[]) {
  if (!beats.length) return 'Opening';
  const left = [...beats].reverse().find((beat) => beat.progress <= progress);
  const right = beats.find((beat) => beat.progress > progress);
  if (!left) return `Opening to ${right?.label ?? beats[0].label}`;
  if (!right || Math.abs(progress - left.progress) < .001) return left.label;
  const amount = Math.round(((progress - left.progress) / Math.max(right.progress - left.progress, .0001)) * 100);
  return `${left.label} to ${right.label} · ${amount}%`;
}

function effectiveClip(
  track: CinematicSequenceTrack,
  byId: Map<string, CinematicSequenceTrack>,
  visited = new Set<string>(),
): CinematicSequenceClip {
  if (track.timing.mode !== 'linked' || visited.has(track.id)) return track.clip;
  const parent = byId.get(track.timing.trackId);
  if (!parent) return track.clip;
  visited.add(track.id);
  return effectiveClip(parent, byId, visited);
}

function trackKindLabel(kind: CinematicSequenceTrack['kind']) {
  switch (kind) {
    case 'interaction': return 'Interaction availability';
    case 'set': return 'Scene set';
    case 'asset': return 'Asset timing';
    case 'text': return 'Text timing';
    case 'effect': return 'Effect timing';
  }
}

function interactionIcon(track: CinematicSequenceTrack) {
  const id = track.target.type === 'interaction' ? track.target.id : track.id;
  if (id === 'programme-focus') return '⌕';
  if (id === 'rsvp') return '✉';
  if (id === 'wish' || id === 'wishes') return '♡';
  return '◆';
}

function displayRows(
  tracks: CinematicSequenceTrack[],
  selectedAsset: CinematicTimelineAsset | undefined,
  progress: number,
  expanded: boolean,
): DisplayTrack[] {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const selectedTrack = selectedAsset?.trackId ? byId.get(selectedAsset.trackId) : undefined;
  const selectedSource = selectedAsset?.sourceTrackId
    ? byId.get(selectedAsset.sourceTrackId)
    : selectedTrack;
  const effectRows: DisplayTrack[] = !expanded ? tracks.filter((track) =>
    track.id !== selectedTrack?.id && track.id !== selectedSource?.id && selectedAsset?.effectTrackIds?.includes(track.id),
  ).map((track) => ({
    id: track.id, label: track.label, meta: 'Layer effect', kind: track.kind,
    clip: effectiveClip(track, byId), editable: true, sourceTrackId: track.id,
  })) : [];
  const assetRow: DisplayTrack | undefined = selectedAsset ? {
    id: `selected-${selectedAsset.id}`,
    label: selectedAsset.label,
    meta: selectedTrack
      ? selectedAsset.timingStatus === 'independent'
        ? 'Independent timing'
        : `Follows ${selectedSource?.label ?? selectedTrack.label}`
      : selectedAsset.timingStatus === 'hardcoded' ? 'Timing not migrated yet' : 'Always present',
    kind: 'selected-asset',
    clip: selectedTrack ? effectiveClip(selectedTrack, byId) : ALWAYS,
    selected: true,
    placeholder: !selectedSource && selectedAsset.timingStatus === 'hardcoded'
      ? 'Hardcoded timing'
      : undefined,
    sourceTrackId: selectedTrack?.id,
    editable: selectedTrack?.id === selectedAsset.editableTrackId,
    interactionIcon: selectedTrack?.kind === 'interaction'
      ? interactionIcon(selectedTrack) : undefined,
  } : undefined;

  if (expanded) {
    const rows = tracks.map((track): DisplayTrack => ({
      id: track.id,
      label: track.label,
      meta: trackKindLabel(track.kind),
      kind: track.kind,
      clip: effectiveClip(track, byId),
      selected: track.id === selectedTrack?.id || track.id === selectedSource?.id,
      editable: track.id === selectedAsset?.editableTrackId,
      sourceTrackId: track.id,
      interactionIcon: track.kind === 'interaction' ? interactionIcon(track) : undefined,
    }));
    // Selection must not reorder or remount a track under a scrolled playhead.
    // Only assets without a timing track need a separate diagnostic row.
    return assetRow && !selectedTrack ? [...rows, assetRow] : rows;
  }

  if (assetRow) {
    if (!selectedTrack || !selectedSource) return [assetRow, ...effectRows];
    if (selectedSource.id === selectedTrack.id) return [assetRow, ...effectRows];
    return [assetRow, {
      id: selectedSource.id,
      label: selectedSource.label,
      meta: trackKindLabel(selectedSource.kind),
      kind: selectedSource.kind,
      clip: effectiveClip(selectedSource, byId),
      selected: true,
      sourceTrackId: selectedSource.id,
      interactionIcon: selectedSource.kind === 'interaction'
        ? interactionIcon(selectedSource) : undefined,
    }, ...effectRows];
  }

  return [];
}

function sameClip(left: CinematicSequenceClip, right: CinematicSequenceClip) {
  return (Object.keys(left) as (keyof CinematicSequenceClip)[])
    .every((key) => Math.abs(left[key] - right[key]) < .00001);
}

function Clip({ row, beats, onSelect, onClipChange, onEditStart, onEditCommit, onSnapGuide }: {
  row: DisplayTrack;
  beats: CinematicResolvedBeat[];
  onSelect?: (id: string) => void;
  onClipChange?: (id: string, clip: CinematicSequenceClip) => void;
  onEditStart: (id: string, clip: CinematicSequenceClip) => void;
  onEditCommit: (id: string, clip: CinematicSequenceClip) => void;
  onSnapGuide: (guide?: SnapGuide) => void;
}) {
  const { clip } = row;
  const drag = useRef<{
    kind: 'move' | 'field';
    field?: keyof CinematicSequenceClip;
    rail: DOMRect;
    pointerX: number;
    original: CinematicSequenceClip;
    latest: CinematicSequenceClip;
  } | null>(null);
  const [dragLabel, setDragLabel] = useState<string>();
  const span = Math.max(clip.end - clip.start, .0001);
  const isAvailability = Boolean(row.interactionIcon);
  const enterWidth = ((clip.enterEnd - clip.start) / span) * 100;
  const exitWidth = ((clip.end - clip.exitStart) / span) * 100;
  const announce = (field: keyof CinematicSequenceClip | 'move', next: CinematicSequenceClip) => {
    if (field === 'move') {
      setDragLabel(`${describeCinematicStoryPosition(next.start, beats)} → ${describeCinematicStoryPosition(next.end, beats)}`);
      return;
    }
    const names: Record<keyof CinematicSequenceClip, string> = {
      start: 'Start', enterEnd: 'Entrance ends', exitStart: 'Exit starts', end: 'End',
    };
    setDragLabel(`${names[field]} · ${describeCinematicStoryPosition(next[field], beats)}`);
  };

  const snappedValue = (raw: number, bypass: boolean) => {
    if (bypass) return { value: Math.min(1, Math.max(0, raw)) };
    return snapCinematicStoryValue(raw, beats);
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const current = drag.current;
    if (current && row.sourceTrackId) onEditCommit(row.sourceTrackId, current.latest);
    drag.current = null;
    setDragLabel(undefined);
    onSnapGuide(undefined);
  };

  const keyboardChange = (
    event: KeyboardEvent<HTMLButtonElement>,
    field: keyof CinematicSequenceClip | 'move',
  ) => {
    if (!row.sourceTrackId || !onClipChange ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const amount = event.altKey ? .001 : event.shiftKey ? .02 : .005;
    const delta = event.key === 'ArrowRight' ? amount : -amount;
    let next: CinematicSequenceClip;
    let guide: SnapGuide | undefined;
    if (field === 'move') {
      next = moveCinematicClip(clip, delta);
      if (!event.altKey) {
        const candidates = [
          { edge: next.start, snap: snapCinematicStoryValue(next.start, beats) },
          { edge: next.end, snap: snapCinematicStoryValue(next.end, beats) },
        ].filter((candidate) => candidate.snap.beat)
          .sort((left, right) =>
            Math.abs(left.snap.value - left.edge) - Math.abs(right.snap.value - right.edge));
        const chosen = candidates[0];
        if (chosen?.snap.beat) {
          next = moveCinematicClip(next, chosen.snap.value - chosen.edge);
          guide = { value: chosen.snap.value, label: chosen.snap.beat.label };
        }
      }
    } else {
      const snapped = snappedValue(clip[field] + delta, event.altKey);
      next = { ...clip };
      if (field === 'start' && isAvailability) {
        next.start = Math.min(snapped.value, next.end);
        next.enterEnd = next.start;
      } else if (field === 'end' && isAvailability) {
        next.end = Math.max(next.start, snapped.value);
        next.exitStart = next.end;
      } else if (field === 'start') next.start = Math.min(snapped.value, next.enterEnd);
      else if (field === 'enterEnd') next.enterEnd = Math.max(next.start, Math.min(snapped.value, next.exitStart));
      else if (field === 'exitStart') next.exitStart = Math.max(next.enterEnd, Math.min(snapped.value, next.end));
      else next.end = Math.max(next.exitStart, snapped.value);
      next = constrainCinematicClip(next);
      guide = snapped.beat ? { value: snapped.value, label: snapped.beat.label } : undefined;
    }
    next = constrainCinematicClip(next);
    onSnapGuide(guide);
    onEditStart(row.sourceTrackId, clip);
    onClipChange(row.sourceTrackId, next);
    onEditCommit(row.sourceTrackId, next);
    announce(field, next);
    window.setTimeout(() => {
      setDragLabel(undefined);
      onSnapGuide(undefined);
    }, 700);
  };

  return (
    <div
      className={`${styles.clip} ${styles[`clip_${row.kind}`] ?? ''} ${row.selected ? styles.clipSelected : ''} ${row.placeholder ? styles.clipPlaceholder : ''} ${onSelect && row.sourceTrackId ? styles.clipSelectable : ''} ${row.editable ? styles.clipEditable : ''}`}
      style={{ left: `${clip.start * 100}%`, width: `${span * 100}%` }}
      title={`${row.label}: ${Math.round(clip.start * 100)}%–${Math.round(clip.end * 100)}%${onSelect && row.sourceTrackId ? ' · Double-click to edit timing' : ''}`}
      data-testid={`timeline-clip-${row.id}`}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (row.sourceTrackId) onSelect?.(row.sourceTrackId);
      }}
    >
      {!isAvailability && enterWidth > 0 && <span className={styles.enter} style={{ width: `${enterWidth}%` }} />}
      {!isAvailability && exitWidth > 0 && <span className={styles.exit} style={{ width: `${exitWidth}%` }} />}
      {row.interactionIcon && <span className={styles.interactionMarker} aria-hidden="true">{row.interactionIcon}</span>}
      <span className={styles.clipText}>{row.placeholder ?? (isAvailability ? 'Available' : row.label)}</span>
      {row.editable && row.sourceTrackId && onClipChange && (
        <>
          <button
            type="button"
            className={styles.clipMoveSurface}
            aria-label={`Move timing clip for ${row.label}`}
            title="Double-click to edit timing · Drag to move · Arrow keys nudge · Alt disables snapping"
            onPointerDown={(event) => {
              event.stopPropagation();
              const rail = event.currentTarget.closest<HTMLElement>('[data-timeline-rail]')?.getBoundingClientRect();
              if (!rail) return;
              drag.current = {
                kind: 'move', rail, pointerX: event.clientX,
                original: clip, latest: clip,
              };
              onEditStart(row.sourceTrackId!, clip);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const current = drag.current;
              if (!current || current.kind !== 'move' ||
                !event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const rawDelta = (event.clientX - current.pointerX) / current.rail.width;
              let next = moveCinematicClip(current.original, rawDelta);
              let guide: SnapGuide | undefined;
              if (!event.altKey) {
                const startSnap = snapCinematicStoryValue(next.start, beats);
                const endSnap = snapCinematicStoryValue(next.end, beats);
                const startDistance = startSnap.beat ? Math.abs(startSnap.value - next.start) : Infinity;
                const endDistance = endSnap.beat ? Math.abs(endSnap.value - next.end) : Infinity;
                const chosen = startDistance <= endDistance ? startSnap : endSnap;
                const edge = startDistance <= endDistance ? next.start : next.end;
                if (chosen.beat) {
                  next = moveCinematicClip(next, chosen.value - edge);
                  guide = { value: chosen.value, label: chosen.beat.label };
                }
              }
              next = constrainCinematicClip(next);
              current.latest = next;
              onSnapGuide(guide);
              announce('move', next);
              onClipChange(row.sourceTrackId!, next);
            }}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && onSelect && row.sourceTrackId) {
                event.preventDefault(); onSelect(row.sourceTrackId);
              } else keyboardChange(event, 'move');
            }}
          />
          {(isAvailability
            ? (['start', 'end'] as const)
            : (['start', 'enterEnd', 'exitStart', 'end'] as const)).map((field) => (
            <button
              type="button"
              key={field}
              className={`${styles.clipHandle} ${styles[`handle_${field}`]}`}
              style={field === 'enterEnd'
                ? { left: `${enterWidth}%` }
                : field === 'exitStart' ? { right: `${exitWidth}%` } : undefined}
              aria-label={`Move ${field === 'start' ? 'start' : field === 'enterEnd' ? 'fully visible' : field === 'exitStart' ? 'fade out' : 'end'} of ${row.label}`}
              title="Drag to adjust · Arrow keys nudge · Alt disables snapping"
              onPointerDown={(event) => {
                event.stopPropagation();
                const rail = event.currentTarget.closest<HTMLElement>('[data-timeline-rail]')?.getBoundingClientRect();
                if (!rail) return;
                drag.current = {
                  kind: 'field', field, rail, pointerX: event.clientX,
                  original: clip, latest: clip,
                };
                onEditStart(row.sourceTrackId!, clip);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const current = drag.current;
                if (!current || current.kind !== 'field' ||
                  !event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const raw = (event.clientX - current.rail.left) / current.rail.width;
                const snapped = snappedValue(raw, event.altKey);
                const next = { ...current.original };
                if (field === 'start' && isAvailability) {
                  next.start = Math.min(snapped.value, next.end);
                  next.enterEnd = next.start;
                } else if (field === 'end' && isAvailability) {
                  next.end = Math.max(next.start, snapped.value);
                  next.exitStart = next.end;
                } else if (field === 'start') next.start = Math.min(snapped.value, next.enterEnd);
                else if (field === 'enterEnd') next.enterEnd = Math.max(next.start, Math.min(snapped.value, next.exitStart));
                else if (field === 'exitStart') next.exitStart = Math.max(next.enterEnd, Math.min(snapped.value, next.end));
                else next.end = Math.max(next.exitStart, snapped.value);
                current.latest = constrainCinematicClip(next);
                onSnapGuide(snapped.beat ? { value: snapped.value, label: snapped.beat.label } : undefined);
                announce(field, current.latest);
                onClipChange(row.sourceTrackId!, current.latest);
              }}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onKeyDown={(event) => keyboardChange(event, field)}
            />
          ))}
          {dragLabel && <span className={styles.dragTooltip} role="status">{dragLabel}</span>}
        </>
      )}
    </div>
  );
}

function BeatMarker({ beat, selected, editable, onChange, onMove }: {
  beat: CinematicResolvedBeat;
  selected: boolean;
  editable: boolean;
  onChange: (progress: number) => void;
  onMove?: (id: string, progress: number) => void;
}) {
  const suppressClick = useRef(false);
  const drag = useRef<{ pointerId: number; startX: number; offset: number; latest?: number } | null>(null);
  const [dragProgress, setDragProgress] = useState<number>();
  const shownProgress = dragProgress ?? beat.progress;
  const canShiftDrag = selected && Boolean(onMove);
  const cancelDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragProgress(undefined);
  };
  return (
    <button
      type="button"
      className={`${styles.beat} ${selected ? styles.beatSelected : ''} ${(editable && onMove) || dragProgress !== undefined ? styles.beatEditable : ''}`}
      style={{ left: `${shownProgress * 100}%` }}
      title={`${beat.label} · ${Math.round(shownProgress * 100)}%${editable && onMove ? ' · drag to move' : canShiftDrag ? ' · Shift-drag to move' : ''}`}
      aria-label={`${editable ? 'Move or go to' : 'Go to'} ${beat.label}`}
      onPointerDown={(event) => {
        if (event.button !== 0 || drag.current) return;
        suppressClick.current = false;
        if (!onMove || (!editable && !(canShiftDrag && event.shiftKey))) return;
        const rail = event.currentTarget.parentElement?.getBoundingClientRect();
        if (!rail?.width) return;
        drag.current = { pointerId: event.pointerId, startX: event.clientX,
          offset: event.clientX - (rail.left + beat.progress * rail.width) };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId || !onMove) return;
        if (current.latest === undefined && Math.abs(event.clientX - current.startX) < 2) return;
        const rail = event.currentTarget.parentElement?.getBoundingClientRect();
        if (!rail?.width) return;
        const next = Math.min(1, Math.max(0, (event.clientX - rail.left - current.offset) / rail.width));
        if (current.latest === next) return;
        current.latest = next;
        suppressClick.current = true;
        if (editable) onMove(beat.id, next);
        else setDragProgress(next);
      }}
      onPointerUp={(event) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        cancelDrag(event);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        if (!editable && current.latest !== undefined && current.latest !== beat.progress) onMove?.(beat.id, current.latest);
      }}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={cancelDrag}
      onClick={() => {
        if (!suppressClick.current) onChange(beat.progress);
        suppressClick.current = false;
      }}
      onKeyDown={(event) => {
        if (!editable || !onMove || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        const amount = event.shiftKey ? .02 : .005;
        const next = Number(Math.min(1, Math.max(0,
          beat.progress + (event.key === 'ArrowRight' ? amount : -amount))).toFixed(3));
        onMove(beat.id, next);
      }}
    >
      <span className={styles.beatPin} />
      <span className={styles.beatName}>{beat.label}</span>
    </button>
  );
}

export default function CinematicTimeline({
  progress, beats, tracks, selectedAsset, selectedBeat, editableBeats = false,
  dirty = false, expanded, collapsed = false, onCollapsedChange, onExpandedChange, onChange, onBeatMove, onTrackClipChange, onFocusHeightChange,
  onTrackSelect, onClearSelection, onResetTrack, scrollStops = [], onScrollStopsChange,
}: Props) {
  const [selectedStopId, setSelectedStopId] = useState<string>();
  const selectedStop = scrollStops.find(({ stop }) => stop.id === selectedStopId);
  const updateStop = (patch: Partial<CinematicScrollStop>) => onScrollStopsChange?.(
    scrollStops.map(({ stop }) => stop.id === selectedStopId ? { ...stop, ...patch } : stop),
  );
  const addStop = () => {
    const id = crypto.randomUUID();
    onScrollStopsChange?.([...scrollStops.map(({ stop }) => stop), {
      id, at: progress, label: 'Scroll stop', easing: 'ease-out', durationMs: 280,
    }]);
    setSelectedStopId(id);
  };
  const allRows = displayRows(tracks, selectedAsset, progress, expanded);
  const storyLabel = activeBeatLabel(progress, beats);
  const [preferences, setPreferences, preferencesReady] = useWorkspacePreference('einvite.cinematic.timeline-controls.v1', DEFAULT_TIMELINE_CONTROLS, decodeTimelineControls);
  const { zoom, filter } = preferences;
  const collapsedKinds = useMemo(() => new Set(preferences.collapsedKinds), [preferences.collapsedKinds]);
  const setZoom = (update: number | ((value: number) => number)) => setPreferences((current) => ({ ...current, zoom: typeof update === 'function' ? update(current.zoom) : update }));
  const setFilter = (filter: TrackFilter) => setPreferences((current) => ({ ...current, filter }));
  const setCollapsedKinds = (update: (value: Set<Exclude<TrackFilter, 'all'>>) => Set<Exclude<TrackFilter, 'all'>>) =>
    setPreferences((current) => ({ ...current, collapsedKinds: [...update(new Set(current.collapsedKinds))] }));
  const hiddenTracks = useMemo(() => new Set(preferences.hiddenTracks), [preferences.hiddenTracks]);
  const lockedTracks = useMemo(() => new Set(preferences.lockedTracks), [preferences.lockedTracks]);
  const updateTrackPreference = (key: 'hiddenTracks' | 'lockedTracks', update: Set<string> | ((value: Set<string>) => Set<string>)) =>
    setPreferences((current) => ({ ...current, [key]: [...(typeof update === 'function' ? update(new Set(current[key])) : update)] }));
  const setHiddenTracks = (update: Set<string> | ((value: Set<string>) => Set<string>)) => updateTrackPreference('hiddenTracks', update);
  const setLockedTracks = (update: Set<string> | ((value: Set<string>) => Set<string>)) => updateTrackPreference('lockedTracks', update);
  const [trackMenu, setTrackMenu] = useState<TrackMenu>();
  const timelineRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (preferencesReady && scrollerRef.current) {
      scrollerRef.current.scrollTop = preferences.scrollTop;
      scrollerRef.current.scrollLeft = preferences.scrollLeft;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Initial restore only; the user owns scroll position afterward.
  }, [preferencesReady]);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || collapsed || scroller.scrollWidth <= scroller.clientWidth) return;
    const labels = 132;
    const x = labels + (scroller.scrollWidth - labels) * progress;
    if (x < scroller.scrollLeft + labels + 12 || x > scroller.scrollLeft + scroller.clientWidth - 12) {
      scroller.scrollLeft = Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, x - scroller.clientWidth / 2));
    }
  }, [progress, zoom, collapsed, preferencesReady]);
  const rows = useMemo(() => allRows.filter((row) => {
    if (hiddenTracks.has(row.id)) return false;
    if (!expanded) return true;
    if (row.kind === 'selected-asset') return true;
    if (filter !== 'all' && row.kind !== filter) return false;
    return !collapsedKinds.has(row.kind);
  }), [allRows, hiddenTracks, filter, collapsedKinds, expanded]);
  const editableRow = rows.find((row) => row.selected && row.editable && row.sourceTrackId && !lockedTracks.has(row.sourceTrackId));
  const hasEditableRow = Boolean(editableRow);
  useLayoutEffect(() => {
    if (expanded || collapsed || !onFocusHeightChange || !timelineRef.current) return;
    // Measure intrinsic rows rather than the flex scroller, which fills the assigned dock height.
    const elements = [...timelineRef.current.querySelectorAll<HTMLElement>('[data-focus-size]')];
    const measure = () => {
      const height = elements.reduce((sum, element) => sum + element.getBoundingClientRect().height, 0);
      const scroller = scrollerRef.current;
      if (height > 0) onFocusHeightChange(Math.ceil(height + 2 + (scroller && scroller.scrollWidth > scroller.clientWidth ? 10 : 0)));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [expanded, collapsed, selectedAsset?.id, rows.length, hasEditableRow, onFocusHeightChange]);
  const [snapGuide, setSnapGuide] = useState<SnapGuide>();
  const [clipHistory, setClipHistory] = useState<ClipHistoryEntry[]>([]);
  const activeEdit = useRef<ClipHistoryEntry | null>(null);

  const focusProgress = (value: number, nextZoom = zoom) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    scroller.scrollTo({ left: Math.min(max, Math.max(0, value * scroller.scrollWidth - scroller.clientWidth / 2)), behavior: 'smooth' });
    if (nextZoom !== zoom) setZoom(nextZoom);
  };

  const fitStory = () => {
    setZoom(1);
    requestAnimationFrame(() => scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' }));
  };

  const focusSelection = () => {
    const selected = allRows.find((row) => row.selected);
    const centre = selectedStop?.at ?? (selected ? (selected.clip.start + selected.clip.end) / 2 : progress);
    setZoom((current) => Math.max(2, current));
    requestAnimationFrame(() => focusProgress(centre, Math.max(2, zoom)));
  };

  useEffect(() => {
    const closeMenu = (event: globalThis.PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest(`.${styles.contextMenu}`)) return;
      setTrackMenu(undefined);
    };
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, []);

  const handleTimelineKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).matches('input, select, textarea')) return;
    if (event.key === 'Escape') {
      if (selectedStop) { setSelectedStopId(undefined); return; }
      setTrackMenu(undefined);
      onClearSelection?.();
      return;
    }
    if (event.key === '0') { event.preventDefault(); fitStory(); return; }
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); focusSelection(); return; }
    if (event.key === '=' || event.key === '+') {
      event.preventDefault();
      setZoom((current) => Math.min(4, Number((current + .5).toFixed(1))));
      return;
    }
    if (event.key === '-') {
      event.preventDefault();
      setZoom((current) => Math.max(1, Number((current - .5).toFixed(1))));
    }
  };

  const startClipEdit = (id: string, clip: CinematicSequenceClip) => {
    if (!activeEdit.current) activeEdit.current = { id, before: clip, after: clip };
  };

  const changeClip = (id: string, clip: CinematicSequenceClip) => {
    if (activeEdit.current?.id === id) activeEdit.current.after = clip;
    onTrackClipChange?.(id, constrainCinematicClip(clip));
  };

  const commitClipEdit = (id: string, clip: CinematicSequenceClip) => {
    const edit = activeEdit.current?.id === id
      ? { ...activeEdit.current, after: constrainCinematicClip(clip) }
      : null;
    activeEdit.current = null;
    if (!edit || sameClip(edit.before, edit.after)) return;
    setClipHistory((current) => [...current, edit].slice(-50));
  };

  const applyOneStepEdit = (id: string, before: CinematicSequenceClip, after: CinematicSequenceClip) => {
    const next = constrainCinematicClip(after);
    if (sameClip(before, next)) return;
    onTrackClipChange?.(id, next);
    setClipHistory((current) => [...current, { id, before, after: next }].slice(-50));
  };

  const undoClipEdit = () => {
    const edit = clipHistory[clipHistory.length - 1];
    if (!edit) return;
    onTrackClipChange?.(edit.id, edit.before);
    setClipHistory((current) => current.slice(0, -1));
  };

  const setBoundaryAtPlayhead = (boundary: 'start' | 'end') => {
    if (!editableRow?.sourceTrackId) return;
    const before = editableRow.clip;
    const snapped = snapCinematicStoryValue(progress, beats);
    const value = snapped.value;
    const next = boundary === 'start'
      ? {
          ...before,
          start: value,
          enterEnd: Math.max(value, before.enterEnd),
          exitStart: Math.max(value, before.exitStart),
          end: Math.max(value, before.end),
        }
      : {
          ...before,
          start: Math.min(before.start, value),
          enterEnd: Math.min(before.enterEnd, value),
          exitStart: Math.min(before.exitStart, value),
          end: value,
        };
    applyOneStepEdit(editableRow.sourceTrackId, before, next);
    if (snapped.beat) {
      setSnapGuide({ value: snapped.value, label: snapped.beat.label });
      window.setTimeout(() => setSnapGuide(undefined), 700);
    }
  };

  const spanLabel = editableRow
    ? cinematicClipBeatSpan(editableRow.clip, beats).toFixed(1)
    : undefined;

  return (
    <section ref={timelineRef} className={styles.timeline} data-collapsed={collapsed} aria-label="Cinematic timeline"
      tabIndex={0} onKeyDown={handleTimelineKeyDown}
      onDoubleClick={(event) => event.preventDefault()}>
      <header className={styles.header} data-focus-size>
        <div className={styles.heading}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span className={styles.title}>Story timeline</span>
          <span className={styles.storyPosition}>{storyLabel}</span>
        </div>
        <div className={styles.headerActions}>
          {onCollapsedChange && <button type="button" className={`${styles.iconAction} ${styles.collapseToggle}`}
            aria-label={collapsed ? 'Expand timeline' : 'Collapse timeline'} aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}><Icon name={collapsed ? 'chevron-up' : 'chevron-down'} size={20} /></button>}
          <span className={styles.progress}>{Math.round(progress * 100)}%</span>
          <span className={`${styles.saveState} ${dirty ? styles.saveStateDirty : ''}`} role="status">
            {dirty ? 'Unsaved' : 'Saved'}
          </span>
          {(selectedAsset || selectedBeat) && onClearSelection && (
            <button type="button" className={styles.iconAction} onClick={onClearSelection}
              aria-label="Clear timeline selection" title="Clear selection (Esc)">×</button>
          )}
          {selectedAsset && !collapsed && <button type="button" className={styles.viewToggle} onClick={() => {
            const selected = allRows.find((row) => row.selected);
            if (selected) onChange((selected.clip.enterEnd + selected.clip.exitStart) / 2);
          }}>Go to appearance</button>}
          <button
            type="button"
            className={styles.viewToggle}
            aria-pressed={expanded}
            onClick={() => onExpandedChange(!expanded)}
          >
            {expanded ? 'Focus' : `All tracks · ${tracks.length}`}
          </button>
        </div>
      </header>
      {collapsed && <div className={styles.miniTimeline} aria-label="Mini timeline">
        <div className={styles.miniBeats} aria-hidden="true">
          {beats.filter((beat) => beat.progress >= 0 && beat.progress <= 1).map((beat) =>
            <span key={beat.id} style={{ left: `${beat.progress * 100}%` }} />)}
        </div>
        <input className={styles.miniScrubber} type="range" min={0} max={100} step={0.1}
          aria-label="Scrub story" aria-valuetext={`${(Math.max(0, Math.min(1, progress)) * 100).toFixed(1)}% · ${storyLabel}`}
          value={Math.max(0, Math.min(1, progress)) * 100}
          style={{ '--scrub-progress': `${Math.max(0, Math.min(1, progress)) * 100}%` } as CSSProperties}
          onChange={(event) => onChange(Number(event.target.value) / 100)} />
      </div>}
      <div className={styles.content} hidden={collapsed}>
      {expanded && (
        <div className={styles.navigationBar} aria-label="Timeline navigation and filters"
          style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={styles.zoomControls}>
            <button type="button" className={styles.toolButton} style={timelineToolStyle} onClick={() => setZoom((value) => Math.max(1, value - .5))}
              disabled={zoom <= 1} aria-label="Zoom timeline out">−</button>
            <span>{zoom.toFixed(1)}×</span>
            <button type="button" className={styles.toolButton} style={timelineToolStyle} onClick={() => setZoom((value) => Math.min(4, value + .5))}
              disabled={zoom >= 4} aria-label="Zoom timeline in">+</button>
            <button type="button" className={styles.toolButton} style={timelineToolStyle} onClick={fitStory} title="Shortcut: 0">Fit story</button>
            <button type="button" className={styles.toolButton} style={timelineToolStyle} onClick={focusSelection} title="Shortcut: F">Focus selection</button>
          </div>
          <div className={styles.trackFilters}>
            {(['all', 'set', 'asset', 'text', 'effect', 'interaction'] as TrackFilter[]).map((kind) => (
              <button type="button" className={styles.toolButton} style={timelineToolStyle} key={kind} aria-pressed={filter === kind}
                onClick={() => setFilter(kind)}>{kind === 'all' ? 'All' : trackKindLabel(kind)}</button>
            ))}
          </div>
          {hiddenTracks.size > 0 && (
            <button type="button" className={`${styles.toolButton} ${styles.restoreHidden}`} style={timelineToolStyle}
              onClick={() => setHiddenTracks(new Set())}>Show {hiddenTracks.size} hidden</button>
          )}
        </div>
      )}

      {selectedStop && onScrollStopsChange && (
        <div key={selectedStopId} data-focus-size className={styles.scrollStopEditor} aria-label="Scroll stop settings">
          <label>Name <input value={selectedStop.stop.label} onChange={(event) => updateStop({ label: event.target.value })} /></label>
          <label>Story %
            <input key={selectedStop.at} type="number" min="0" max="100" step="any"
              defaultValue={Number((selectedStop.at * 100).toFixed(3))}
              onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              onBlur={(event) => {
                const { valueAsNumber, defaultValue } = event.currentTarget;
                if (!Number.isFinite(valueAsNumber)) { event.currentTarget.value = defaultValue; return; }
                if (valueAsNumber === Number(defaultValue)) return;
                const at = Math.min(100, Math.max(0, valueAsNumber)) / 100;
                updateStop({ at, interactionId: undefined, visibilityLayerId: undefined });
                onChange(at);
              }} />
          </label>
          <label>Easing <select value={selectedStop.stop.easing}
            onChange={(event) => updateStop({ easing: event.target.value as CinematicScrollStop['easing'] })}>
            {SCROLL_STOP_EASINGS.map((easing) => <option key={easing} value={easing}>{easing}</option>)}
          </select></label>
          <label>Settle (ms)
            <input key={selectedStop.stop.durationMs} type="number" min="0" max="1000" step="10"
              defaultValue={selectedStop.stop.durationMs}
              onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              onBlur={(event) => {
                const durationMs = event.currentTarget.valueAsNumber;
                if (Number.isFinite(durationMs)) updateStop({ durationMs: Math.round(Math.min(1000, Math.max(0, durationMs))) });
                else event.currentTarget.value = event.currentTarget.defaultValue;
              }} />
          </label>
          <button type="button" className={styles.toolButton} onClick={() => updateStop({ at: progress, interactionId: undefined, visibilityLayerId: undefined })}>Move to playhead</button>
          <button type="button" className={styles.toolButton} onClick={() => {
            onScrollStopsChange(scrollStops.flatMap(({ stop }) => stop.id === selectedStopId ? [] : [stop]));
            setSelectedStopId(undefined);
          }}>Remove</button>
          <button type="button" className={styles.toolButton} onClick={() => setSelectedStopId(undefined)}>Done</button>
          {selectedStop.stop.interactionId && <span className={styles.scrollStopStatus}>{selectedStop.active
            ? 'Follows interaction timing until moved manually'
            : 'Inactive · no tappable window'}</span>}
        </div>
      )}

      {editableRow && !selectedStop && (
        <div data-focus-size className={`${styles.clipToolbar} ${expanded ? styles.clipToolbarExpanded : ''}`} aria-label={`Timeline controls for ${editableRow.label}`}>
          <div className={styles.clipSummary}>
            <strong>{editableRow.label}</strong>
            <span>{editableRow.interactionIcon ? 'Available from' : 'Start'}: {describeCinematicStoryPosition(editableRow.clip.start, beats)}</span>
            <span>{editableRow.interactionIcon ? 'Available until' : 'End'}: {describeCinematicStoryPosition(editableRow.clip.end, beats)}</span>
            <span>{editableRow.interactionIcon ? 'Availability' : 'Visible'} span: {spanLabel} beats</span>
          </div>
          <div className={styles.clipActions}>
            <button type="button" onClick={() => setBoundaryAtPlayhead('start')}>Set start at playhead</button>
            <button type="button" onClick={() => setBoundaryAtPlayhead('end')}>Set end at playhead</button>
            <button type="button" onClick={undoClipEdit} disabled={!clipHistory.length}
              title="Undo the most recent timeline timing edit">Undo timing</button>
          </div>
        </div>
      )}

      <div ref={scrollerRef} className={styles.bodyScroller} data-testid="timeline-scroll-area"
        role="region" aria-label="Timeline tracks" tabIndex={0}
        onScroll={(event) => {
          if (!preferencesReady) return;
          const { scrollTop, scrollLeft } = event.currentTarget;
          setPreferences((current) => current.scrollTop === Math.round(scrollTop) && current.scrollLeft === Math.round(scrollLeft) ? current
            : { ...current, scrollTop: Math.round(scrollTop), scrollLeft: Math.round(scrollLeft) });
        }}
        onWheel={(event) => {
          // The transparent scrub range spans the rails and Safari otherwise consumes vertical
          // wheel input before the overflow container sees it. Preserve horizontal trackpad
          // navigation, but always route vertical motion through the list.
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.currentTarget.scrollTop += event.deltaY;
          event.preventDefault();
        }}>
      <div data-focus-size className={styles.body} style={{ width: `${zoom * 100}%` }}>
        <div className={`${styles.row} ${styles.cameraRow}`} data-testid="timeline-camera-row">
          <div className={styles.rowLabel}>
            <strong>Camera</strong>
            <span>Beat framing</span>
          </div>
          <div className={`${styles.rail} ${styles.cameraRail}`}>
            <input type="range" className={styles.cameraScrubber} min={0} max={1} step={.001}
              value={progress} onChange={(event) => onChange(Number(event.target.value))}
              aria-label="Scrub camera timeline" />
            <span className={styles.cameraLine} />
            {beats.map((beat) => (
              <BeatMarker
                key={beat.id}
                beat={beat}
                selected={beat.id === selectedBeat}
                editable={editableBeats}
                onChange={onChange}
                onMove={onBeatMove}
              />
            ))}
          </div>
        </div>

        {onScrollStopsChange && <div className={styles.row} aria-label="Scroll stops">
          <div className={styles.rowLabel}>
            <strong>Scroll stops</strong>
            <button type="button" className={`${styles.toolButton} ${styles.addScrollStop}`} onClick={addStop} aria-label="Add scroll stop at playhead">+ Add stop</button>
          </div>
          <div className={styles.rail}>
            {scrollStops.map(({ stop, at, active }) => (
              <button key={stop.id} type="button" style={{ left: `${at * 100}%` }} className={styles.scrollStopMarker}
                aria-label={`Edit ${stop.label} scroll stop at ${(at * 100).toFixed(1)}%${active ? '' : ' (inactive)'}`}
                title={`${stop.label} · ${(at * 100).toFixed(1)}%${active ? '' : ' · inactive'}`}
                aria-pressed={selectedStopId === stop.id} data-inactive={!active || undefined} onClick={() => {
                  setSelectedStopId(stop.id);
                  onChange(at);
                }} />
            ))}
          </div>
        </div>}

        <div className={styles.trackRows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.id}>
              <div className={`${styles.rowLabel} ${onTrackSelect && row.sourceTrackId !== undefined ? styles.rowLabelSelectable : ''}`} title={row.label}
                onContextMenu={(event) => {
                  if (!expanded || !row.sourceTrackId) return;
                  event.preventDefault();
                  setTrackMenu({ id: row.sourceTrackId, x: event.clientX, y: event.clientY });
                }}>
                {onTrackSelect && row.sourceTrackId !== undefined ? (
                  <button type="button" onClick={() => { setSelectedStopId(undefined); onTrackSelect(row.sourceTrackId!); }}
                    aria-label={`Edit ${row.label} timing`}>
                    {row.interactionIcon && <span aria-hidden="true">{row.interactionIcon}</span>}
                    <strong>{row.label}</strong>
                  </button>
                ) : (
                  <strong>{row.interactionIcon && <span aria-hidden="true">{row.interactionIcon} </span>}{row.label}</strong>
                )}
                <span>{row.meta}</span>
                {expanded && row.sourceTrackId && (
                  <span className={styles.rowTools}>
                    <button type="button" className={styles.rowToolButton} style={rowToolStyle} onClick={() => setLockedTracks((current) => {
                      const next = new Set(current);
                      if (next.has(row.sourceTrackId!)) next.delete(row.sourceTrackId!);
                      else next.add(row.sourceTrackId!);
                      return next;
                    })} aria-label={`${lockedTracks.has(row.sourceTrackId) ? 'Unlock' : 'Lock'} ${row.label} track`}
                      title={lockedTracks.has(row.sourceTrackId) ? 'Unlock track' : 'Lock track'}>
                      {lockedTracks.has(row.sourceTrackId) ? '▣' : '□'}
                    </button>
                    <button type="button" className={styles.rowToolButton} style={rowToolStyle} onClick={() => setHiddenTracks((current) => new Set(current).add(row.id))}
                      aria-label={`Hide ${row.label} track in editor`} title="Hide in editor">○</button>
                  </span>
                )}
              </div>
              <div className={styles.rail} data-timeline-rail>
                <Clip
                  row={{ ...row, editable: row.editable && !lockedTracks.has(row.sourceTrackId ?? '') }}
                  beats={beats}
                  onSelect={onTrackSelect ? (id) => { setSelectedStopId(undefined); onTrackSelect(id); } : undefined}
                  onClipChange={onTrackClipChange ? changeClip : undefined}
                  onEditStart={startClipEdit}
                  onEditCommit={commitClipEdit}
                  onSnapGuide={setSnapGuide}
                />
              </div>
            </div>
          ))}
          {expanded && rows.length === 0 && (
            <div className={styles.emptyTracks} role="status">
              No tracks match this filter. Choose All or show hidden tracks.
            </div>
          )}
        </div>

        {snapGuide && (
          <div className={styles.snapGuideRail} aria-hidden="true">
            <span className={styles.snapGuide} style={{ left: `${snapGuide.value * 100}%` }}>
              <em>{snapGuide.label}</em>
            </span>
          </div>
        )}

        <div className={styles.playheadRail} data-testid="timeline-playhead-rail" aria-hidden="true"
          style={preferences.scrollLeft > 0 ? { clipPath: `inset(-8px 0 0 ${preferences.scrollLeft}px)` } : undefined}>
          <div className={styles.playhead} style={{ left: `${progress * 100}%` }}>
            <span />
          </div>
        </div>
        <input
          className={styles.scrubber}
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Scrub cinematic story"
        />
      </div>
      </div>
      {expanded && (
        <div className={styles.kindCollapseBar} aria-label="Collapse track groups"
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', flexShrink: 0 }}>
          {(['set', 'asset', 'text', 'effect', 'interaction'] as Exclude<TrackFilter, 'all'>[]).map((kind) => (
            <button type="button" className={styles.collapseButton} style={{ ...timelineToolStyle, padding: '7px 12px', fontSize: 10, minHeight: 32, flexShrink: 0 }} key={kind} aria-pressed={collapsedKinds.has(kind)} onClick={() => {
              setCollapsedKinds((current) => {
                const next = new Set(current);
                if (next.has(kind)) next.delete(kind);
                else next.add(kind);
                return next;
              });
            }}>{collapsedKinds.has(kind) ? 'Show' : 'Collapse'} {trackKindLabel(kind)}</button>
          ))}
        </div>
      )}
      {!expanded && !selectedAsset && <p data-focus-size className={styles.selectionHint}>Select an object to see its timing, or open All tracks.</p>}
      {trackMenu && (() => {
        const row = allRows.find((candidate) => candidate.sourceTrackId === trackMenu.id);
        if (!row) return null;
        return (
          <div className={styles.contextMenu} role="menu"
            style={{ left: Math.min(trackMenu.x, window.innerWidth - 190), top: Math.min(trackMenu.y, window.innerHeight - 180) }}>
            <strong>{row.label}</strong>
            <button type="button" role="menuitem" onClick={() => { onTrackSelect?.(trackMenu.id); focusSelection(); }}>Edit and focus</button>
            <button type="button" role="menuitem" onClick={() => setLockedTracks((current) => {
              const next = new Set(current);
              if (next.has(trackMenu.id)) next.delete(trackMenu.id);
              else next.add(trackMenu.id);
              return next;
            })}>{lockedTracks.has(trackMenu.id) ? 'Unlock track' : 'Lock track'}</button>
            <button type="button" role="menuitem" onClick={() => setHiddenTracks((current) => new Set(current).add(row.id))}>Hide in editor</button>
            {onResetTrack && <button type="button" role="menuitem" onClick={() => onResetTrack(trackMenu.id)}>Reset track</button>}
          </div>
        );
      })()}
      </div>
    </section>
  );
}
