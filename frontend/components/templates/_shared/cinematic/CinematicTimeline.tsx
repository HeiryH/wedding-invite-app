'use client';

import { useRef } from 'react';
import type { CinematicResolvedBeat, CinematicSequenceClip, CinematicSequenceTrack } from './sequence';
import styles from './CinematicTimeline.module.css';

export interface CinematicTimelineAsset {
  id: string;
  label: string;
  trackId?: string;
  editableTrackId?: string;
  timingStatus?: 'independent' | 'linked' | 'always' | 'hardcoded';
}

interface Props {
  progress: number;
  beats: CinematicResolvedBeat[];
  tracks: CinematicSequenceTrack[];
  selectedAsset?: CinematicTimelineAsset;
  selectedBeat?: string;
  editableBeats?: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChange: (progress: number) => void;
  onBeatMove?: (id: string, progress: number) => void;
  onTrackClipChange?: (id: string, clip: CinematicSequenceClip) => void;
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
}

const ALWAYS: CinematicSequenceClip = { start: 0, enterEnd: 0, exitStart: 1, end: 1 };

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

function displayRows(
  tracks: CinematicSequenceTrack[],
  selectedAsset: CinematicTimelineAsset | undefined,
  progress: number,
  expanded: boolean,
): DisplayTrack[] {
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const selectedSource = selectedAsset?.trackId ? byId.get(selectedAsset.trackId) : undefined;
  const assetRow: DisplayTrack | undefined = selectedAsset ? {
    id: `selected-${selectedAsset.id}`,
    label: selectedAsset.label,
    meta: selectedSource
      ? selectedAsset.timingStatus === 'independent'
        ? 'Independent timing'
        : `Follows ${selectedSource.label}`
      : selectedAsset.timingStatus === 'hardcoded' ? 'Timing not migrated yet' : 'Always present',
    kind: 'selected-asset',
    clip: selectedSource ? effectiveClip(selectedSource, byId) : ALWAYS,
    selected: true,
    placeholder: !selectedSource && selectedAsset.timingStatus === 'hardcoded'
      ? 'Hardcoded timing'
      : undefined,
    sourceTrackId: selectedSource?.id,
    editable: selectedSource?.id === selectedAsset.editableTrackId,
  } : undefined;

  if (expanded) {
    const rows = tracks.map((track): DisplayTrack => ({
      id: track.id,
      label: track.label,
      meta: trackKindLabel(track.kind),
      kind: track.kind,
      clip: effectiveClip(track, byId),
    }));
    return assetRow ? [assetRow, ...rows.filter((row) => row.id !== selectedSource?.id)] : rows;
  }

  if (assetRow) {
    if (!selectedSource) return [assetRow];
    return [assetRow, {
      id: selectedSource.id,
      label: selectedSource.label,
      meta: trackKindLabel(selectedSource.kind),
      kind: selectedSource.kind,
      clip: effectiveClip(selectedSource, byId),
    }];
  }

  const active = tracks.find((track) => {
    const clip = effectiveClip(track, byId);
    return progress >= clip.start && progress <= clip.end;
  }) ?? tracks.reduce<CinematicSequenceTrack | undefined>((closest, track) => {
    if (!closest) return track;
    return Math.abs(track.clip.start - progress) < Math.abs(closest.clip.start - progress) ? track : closest;
  }, undefined);
  return active ? [{
    id: active.id,
    label: active.label,
    meta: trackKindLabel(active.kind),
    kind: active.kind,
    clip: effectiveClip(active, byId),
  }] : [];
}

function Clip({ row, onClipChange }: {
  row: DisplayTrack;
  onClipChange?: (id: string, clip: CinematicSequenceClip) => void;
}) {
  const { clip } = row;
  const drag = useRef<{ field: keyof CinematicSequenceClip; rail: DOMRect } | null>(null);
  const span = Math.max(clip.end - clip.start, .0001);
  const enterWidth = ((clip.enterEnd - clip.start) / span) * 100;
  const exitWidth = ((clip.end - clip.exitStart) / span) * 100;
  return (
    <div
      className={`${styles.clip} ${styles[`clip_${row.kind}`] ?? ''} ${row.selected ? styles.clipSelected : ''} ${row.placeholder ? styles.clipPlaceholder : ''}`}
      style={{ left: `${clip.start * 100}%`, width: `${span * 100}%` }}
      title={`${row.label}: ${Math.round(clip.start * 100)}%–${Math.round(clip.end * 100)}%`}
      data-testid={`timeline-clip-${row.id}`}
    >
      {enterWidth > 0 && <span className={styles.enter} style={{ width: `${enterWidth}%` }} />}
      {exitWidth > 0 && <span className={styles.exit} style={{ width: `${exitWidth}%` }} />}
      <span className={styles.clipText}>{row.placeholder ?? row.label}</span>
      {row.editable && row.sourceTrackId && onClipChange && (
        <>
          {(['start', 'enterEnd', 'exitStart', 'end'] as const).map((field) => (
            <button
              type="button"
              key={field}
              className={`${styles.clipHandle} ${styles[`handle_${field}`]}`}
              style={field === 'enterEnd'
                ? { left: `${enterWidth}%` }
                : field === 'exitStart' ? { right: `${exitWidth}%` } : undefined}
              aria-label={`Move ${field === 'start' ? 'start' : field === 'enterEnd' ? 'fully visible' : field === 'exitStart' ? 'fade out' : 'end'} of ${row.label}`}
              onPointerDown={(event) => {
                event.stopPropagation();
                const rail = event.currentTarget.closest<HTMLElement>('[data-timeline-rail]')?.getBoundingClientRect();
                if (!rail) return;
                drag.current = { field, rail };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!drag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const value = Math.min(1, Math.max(0,
                  (event.clientX - drag.current.rail.left) / drag.current.rail.width));
                const next = { ...clip };
                if (field === 'start') next.start = Math.min(value, next.enterEnd);
                else if (field === 'enterEnd') next.enterEnd = Math.max(next.start, Math.min(value, next.exitStart));
                else if (field === 'exitStart') next.exitStart = Math.max(next.enterEnd, Math.min(value, next.end));
                else next.end = Math.max(next.exitStart, value);
                onClipChange(row.sourceTrackId!, next);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                drag.current = null;
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const amount = event.shiftKey ? .02 : .005;
                const value = clip[field] + (event.key === 'ArrowRight' ? amount : -amount);
                const next = { ...clip };
                if (field === 'start') next.start = Math.max(0, Math.min(value, next.enterEnd));
                else if (field === 'enterEnd') next.enterEnd = Math.max(next.start, Math.min(value, next.exitStart));
                else if (field === 'exitStart') next.exitStart = Math.max(next.enterEnd, Math.min(value, next.end));
                else next.end = Math.max(next.exitStart, Math.min(1, value));
                onClipChange(row.sourceTrackId!, next);
              }}
            />
          ))}
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
  const moved = useRef(false);
  const railRect = useRef<DOMRect | null>(null);
  return (
    <button
      type="button"
      className={`${styles.beat} ${selected ? styles.beatSelected : ''} ${editable ? styles.beatEditable : ''}`}
      style={{ left: `${beat.progress * 100}%` }}
      title={`${beat.label} · ${Math.round(beat.progress * 100)}%${editable ? ' · drag to move' : ''}`}
      aria-label={`${editable ? 'Move or go to' : 'Go to'} ${beat.label}`}
      onPointerDown={(event) => {
        if (!editable || !onMove) return;
        moved.current = false;
        railRect.current = event.currentTarget.parentElement?.getBoundingClientRect() ?? null;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!editable || !onMove || !event.currentTarget.hasPointerCapture(event.pointerId) || !railRect.current) return;
        const progress = Math.min(1, Math.max(0, (event.clientX - railRect.current.left) / railRect.current.width));
        if (Math.abs(progress - beat.progress) > .002) moved.current = true;
        onMove(beat.id, progress);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        railRect.current = null;
      }}
      onClick={() => {
        if (!moved.current) onChange(beat.progress);
        moved.current = false;
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
  expanded, onExpandedChange, onChange, onBeatMove, onTrackClipChange,
}: Props) {
  const rows = displayRows(tracks, selectedAsset, progress, expanded);
  const storyLabel = activeBeatLabel(progress, beats);

  return (
    <section className={styles.timeline} aria-label="Cinematic timeline">
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span className={styles.title}>Story timeline</span>
          <span className={styles.storyPosition}>{storyLabel}</span>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.progress}>{Math.round(progress * 100)}%</span>
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

      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.rowLabel}>
            <strong>Camera</strong>
            <span>Beat framing</span>
          </div>
          <div className={`${styles.rail} ${styles.cameraRail}`}>
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

        <div className={styles.trackRows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.id}>
              <div className={styles.rowLabel} title={row.label}>
                <strong>{row.label}</strong>
                <span>{row.meta}</span>
              </div>
              <div className={styles.rail} data-timeline-rail><Clip row={row} onClipChange={onTrackClipChange} /></div>
            </div>
          ))}
        </div>

        <div className={styles.playheadRail} aria-hidden="true">
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
    </section>
  );
}
