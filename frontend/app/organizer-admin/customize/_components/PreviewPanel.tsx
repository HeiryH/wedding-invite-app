'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Wedding } from '@/lib/api';
import CinematicTimeline, { type CinematicTimelineAsset } from '@/components/templates/_shared/cinematic/CinematicTimeline';
import CinematicReferenceRail, { type CinematicReferenceControls } from './CinematicReferenceRail';
import styles from './PreviewPanel.module.css';
import { useWorkspacePreference, DEFAULT_TIMELINE_VIEW, decodeTimelineView } from '@/components/templates/_shared/cinematic/workspacePreferences';
import type { CinematicResolvedBeat, CinematicSequenceClip, CinematicSequenceTrack } from '@/components/templates/_shared/cinematic/sequence';
import {
  DEVICE_PRESETS, defaultPresetFor, type Device, type DevicePreset, type SafeAreaInsets,
} from '@/lib/devicePresets';

export type { Device };
export type EditorMode = 'expanded' | 'collapsed' | 'hidden';

/**
 * The previewed device box. `w`/`svh` are what actually size the iframe (svh is what a `.stage`
 * is — see docs/FIX_QUEUE.md Issue 2); `screenH`/`lvh`/`safe` ride along for a future "draw the
 * browser chrome" pass and for `--f*` safe-area emulation, but draw nothing today.
 */
export interface PreviewFrame {
  w: number;
  screenH: number;
  lvh: number;
  svh: number;
  safe: SafeAreaInsets;
  /** This device's `INVITE_REQUESTED_SCALE` → actual-render ratio — see `DevicePreset.scale`.
   *  Carried on the frame (not re-looked-up per use) so a custom-sized frame (`presetId: null`)
   *  still has a scale to divide by, inherited from whichever preset was active before a slider
   *  was touched. */
  scale: number;
  /** Which preset this came from, if any — cleared the moment a slider is touched. */
  presetId: string | null;
}

export function frameFromPreset(preset: DevicePreset): PreviewFrame {
  return {
    w: preset.w, screenH: preset.screenH, lvh: preset.lvh, svh: preset.svh, safe: preset.safe,
    scale: preset.scale, presetId: preset.id,
  };
}

// Clip-box corner radius per device (cosmetic only — no bezel, no padding)
const DEVICE_RADIUS: Record<Device, number> = { mobile: 26, tablet: 16, desktop: 10 };

interface PreviewPanelProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  device: Device;
  setDevice: (d: Device) => void;
  manualZoom: number | null;
  setManualZoom: (z: number | null) => void;
  activeBlock: string;
  onSelectBlock: (block: string) => void;
  sectionOrder: string[];
  editorMode: EditorMode;
  onShowEditor: () => void;
  wedding: Wedding | null;
  /** Previewed device box. Lifted to the customize page because the template needs it too (the
   *  frame-scoped `--f*` units the standalone preview derives from it). */
  frame: PreviewFrame;
  setFrame: (f: PreviewFrame) => void;
  cinematicReference?: CinematicReferenceControls;
  cinematicTimeline?: {
    progress: number;
    beats: CinematicResolvedBeat[];
    tracks: CinematicSequenceTrack[];
    selectedAsset?: CinematicTimelineAsset;
    selectedBeat?: string;
    editableBeats?: boolean;
    dirty?: boolean;
    onChange: (progress: number) => void;
    onBeatMove?: (id: string, progress: number) => void;
    onTrackClipChange?: (id: string, clip: CinematicSequenceClip) => void;
    onTrackSelect?: (id: string) => void;
    onClearSelection?: () => void;
    onResetTrack?: (id: string) => void;
  };
}

const numInputStyle: React.CSSProperties = {
  width: 54, padding: '3px 6px',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12, fontFamily: "'SF Mono', ui-monospace, monospace",
  fontWeight: 500, color: 'var(--text-strong)',
  background: 'var(--surface-sunken)',
  textAlign: 'center', outline: 'none',
  transition: 'border-color 150ms',
};

export function PreviewPanel({
  iframeRef, device, setDevice, manualZoom, setManualZoom,
  editorMode, onShowEditor, wedding,
  frame, setFrame, cinematicTimeline, cinematicReference,
}: PreviewPanelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [autoZoom, setAutoZoom] = useState(80);
  const [panMode, setPanMode] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [showPreviewInfo, setShowPreviewInfo] = useState(false);
  const [activeTools, setActiveTools] = useState<'device' | 'zoom' | null>(null);
  const leftToolsRef = useRef<HTMLDivElement>(null);
  const deviceTriggerRef = useRef<HTMLButtonElement>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const previewInfoRef = useRef<HTMLDivElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const dimensionsButtonRef = useRef<HTMLButtonElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(48);
  useEffect(() => {
    const pointer = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow || event.data?.type !== 'PREVIEW_POINTER_DOWN') return;
      setActiveTools(null);
      setShowPreviewInfo(false);
    };
    window.addEventListener('message', pointer);
    return () => window.removeEventListener('message', pointer);
  }, [iframeRef]);
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const measure = () => setToolbarHeight(Math.ceil(toolbar.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!showPreviewInfo) return;
    const outside = (event: PointerEvent) => { if (!previewInfoRef.current?.contains(event.target as Node)) setShowPreviewInfo(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowPreviewInfo(false); infoButtonRef.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [showPreviewInfo]);
  useEffect(() => {
    if (!activeTools) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (activeTools === 'device' && showSizePanel) { setShowSizePanel(false); dimensionsButtonRef.current?.focus(); }
      else { setActiveTools(null); (activeTools === 'device' ? deviceTriggerRef : zoomTriggerRef).current?.focus(); }
    };
    const outside = (event: PointerEvent) => { if (!leftToolsRef.current?.contains(event.target as Node)) setActiveTools(null); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); };
  }, [activeTools, showSizePanel]);
  const [maxTimelineHeight, setMaxTimelineHeight] = useState(600);
  const [focusContentHeight, setFocusContentHeight] = useState(120);
  const [timelineView, setTimelineView] = useWorkspacePreference('einvite.cinematic.timeline-view.v1', DEFAULT_TIMELINE_VIEW, decodeTimelineView);
  const timelineExpanded = timelineView.expanded;
  const setTimelineExpanded = (expanded: boolean) => setTimelineView((current) => ({ ...current, expanded, collapsed: false }));
  const resizeRef = useRef<{ y: number; height: number } | null>(null);
  const hasCinematicTimeline = Boolean(cinematicTimeline);
  const hasCinematicReference = Boolean(cinematicReference);
  // All tracks retains its user-sized dock; Focus hugs its rows instead of filling empty space.
  const openTimelineHeight = Math.min(maxTimelineHeight, timelineExpanded ? timelineView.allHeight : focusContentHeight);
  const timelineHeight = timelineView.collapsed ? 72 : openTimelineHeight;
  const resizeTimeline = (height: number) => setTimelineView((current) => ({ ...current,
    [current.expanded ? 'allHeight' : 'focusHeight']: Math.max(148, Math.min(maxTimelineHeight, height)) }));

  const zoom = manualZoom ?? autoZoom;
  const defaultPreset = defaultPresetFor(device);

  // The VISIBLE guest box. Height is `svh` — what Safari's chrome leaves visible, and what
  // `.stage { height: 100svh }` actually is — not the whole screen, which every preset used to
  // report and which is why the preview rendered ~25% taller/roomier than any guest ever sees
  // (docs/FIX_QUEUE.md Issue 2). No chrome bars are drawn; this is a height-fidelity-only fix.
  const visibleW = frame.w;
  const visibleH = frame.svh;

  // The *visual* device box: what the clip box and auto-fit math size themselves to, and what
  // should appear on screen at 100% zoom.
  const iframeW = visibleW;
  const iframeH = visibleH;

  // The real invitation *requests* `initial-scale: 0.9`, but a real-device measurement showed an
  // iPhone actually renders at `frame.scale` (0.765, not 0.9 — see the long comment in
  // lib/inviteViewport.ts for why these differ). This is **not** a universal constant — a real iPad
  // measured scale 1 (see `DevicePreset.scale` in lib/devicePresets.ts) — so it rides on the frame
  // itself, per device, rather than one global `INVITE_EFFECTIVE_SCALE` applied everywhere. Viewport
  // meta is ignored inside an iframe, so there is no way to get this widened layout viewport for
  // free; it has to be reproduced explicitly, or every `cqi`/`%`-based size (which is most of T7's
  // typography) renders at the wrong size here relative to a guest. The iframe's own CSS size
  // becomes this wider "layout" box; painting it back down by the same factor (folded into the
  // existing zoom transform below) keeps it occupying exactly `iframeW × iframeH` on screen.
  const layoutW = Math.round(iframeW / frame.scale);
  const layoutH = Math.round(iframeH / frame.scale);

  // When device preset changes, reset the frame to that device's default preset
  useEffect(() => {
    setFrame(frameFromPreset(defaultPresetFor(device)));
    setManualZoom(null);
  }, [device]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fit zoom based on the visible box
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      setMaxTimelineHeight(Math.max(148, Math.min(600, rect.height - 200)));
      const fitW = (rect.width - (hasCinematicReference ? 140 : 80)) / iframeW;
      // Reserve the visible Story Timeline beneath the preview. All Tracks deliberately makes the
      // device smaller rather than letting editor chrome cover the invitation being directed.
      const fitH = (rect.height - toolbarHeight - 32 - (hasCinematicTimeline ? timelineHeight + 40 : 24)) / iframeH;
      const auto = Math.min(fitW, fitH, 1);
      if (auto > 0.05) setAutoZoom(Math.round(auto * 100));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [iframeW, iframeH, device, editorMode, hasCinematicTimeline, timelineHeight, hasCinematicReference, toolbarHeight]);

  const changeZoom = (delta: number) => {
    const base = manualZoom ?? autoZoom;
    setManualZoom(Math.min(150, Math.max(10, Math.round(base / 10) * 10 + delta)));
  };

  const clampW = (v: number) => Math.max(280, Math.min(1600, v));
  const clampH = (v: number) => Math.max(400, Math.min(1200, v));
  const isDimCustom = frame.w !== defaultPreset.w || frame.svh !== defaultPreset.svh;

  // Editing W keeps whatever chrome numbers the current frame has (a preset's, or none). Editing
  // H means "how tall is the visible box" — the honest answer for a hand-typed size is a bare
  // frame with no chrome, rather than inventing screen/safe-area numbers nobody asked for.
  const setW = (w: number) => setFrame({ ...frame, w, presetId: null });
  const setSvh = (svh: number) =>
    setFrame({ w: frame.w, screenH: svh, lvh: svh, svh, safe: { top: 0, right: 0, bottom: 0, left: 0 }, scale: frame.scale, presetId: null });

  const toolbarBtn: React.CSSProperties = {
    width: 28, height: 28, display: 'grid', placeItems: 'center',
    borderRadius: 999, border: 'none', cursor: 'pointer',
    background: 'transparent', color: 'var(--text-muted)',
    transition: 'background 150ms',
  };

  const chipBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 999,
    fontSize: 12.5, fontWeight: 500,
    border: 'none', cursor: 'pointer',
    transition: 'all 150ms',
    fontFamily: 'var(--font-ui)',
  };

  return (
    <section className={styles.preview} style={{
      flex: 1, position: 'relative', minWidth: 0,
      background: 'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--text-subtle) 22%, transparent) 1px, transparent 0) 0 0 / 22px 22px, var(--surface-app)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Reopen tab when editor is hidden */}
      {editorMode === 'hidden' && (
        <button
          onClick={onShowEditor}
          title="Show editor"
          style={{
            position: 'absolute', top: '50%', left: 0,
            transform: 'translateY(-50%)',
            background: 'var(--text-strong)', color: '#fff',
            padding: '10px 6px 10px 4px',
            borderRadius: '0 10px 10px 0',
            boxShadow: 'var(--shadow-md)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            zIndex: 6, transition: 'padding 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingRight = '14px'; (e.currentTarget as HTMLElement).style.paddingLeft = '8px'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingRight = '6px'; (e.currentTarget as HTMLElement).style.paddingLeft = '4px'; }}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      )}

      <div ref={toolbarRef} className={styles.toolbar}>
      <div ref={leftToolsRef} className={styles.leftTools} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActiveTools(null);
      }}>
        <div className={styles.toolMenu} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActiveTools('device'); }}
          onPointerLeave={(event) => { if (event.pointerType === 'mouse') setActiveTools(null); }}>
          <button ref={deviceTriggerRef} type="button" className={styles.toolTrigger} aria-label="Device view settings"
            title={`Device view: ${device}`} aria-expanded={activeTools === 'device'}
            onClick={() => setActiveTools('device')}>
            <Icon name={device === 'mobile' ? 'smartphone' : device === 'tablet' ? 'tablet' : 'monitor'} size={16} />
          </button>
          {activeTools === 'device' && <div className={styles.toolFlyout}>
      <div className={styles.deviceToolbar} role="group" aria-label="Device view">
        {(['mobile', 'tablet', 'desktop'] as Device[]).map((d) => (
          <button key={d} aria-label={d.charAt(0).toUpperCase() + d.slice(1)} onClick={() => { setDevice(d); setManualZoom(null); }}
            style={{
              ...chipBase,
              background: device === d ? 'var(--text-strong)' : 'transparent',
              color: device === d ? '#fff' : 'var(--text-muted)',
            }}
            onMouseEnter={e => { if (device !== d) (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { if (device !== d) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <Icon name={d === 'mobile' ? 'smartphone' : d === 'tablet' ? 'tablet' : 'monitor'} size={14} />
            <span className={styles.deviceLabel}>{d.charAt(0).toUpperCase() + d.slice(1)}</span>
          </button>
        ))}
        {/* Clickable W×H — opens size panel. Shows the *visible* box; a preset's whole-screen size
            trails as a hint so the ~20% chrome difference stays legible instead of silent. */}
        <button
          ref={dimensionsButtonRef}
          onClick={() => { setShowPreviewInfo(false); setShowSizePanel(p => !p); }}
          aria-label="Adjust frame dimensions" aria-expanded={showSizePanel}
          title="Adjust frame dimensions"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: showSizePanel ? 'var(--brand-subtle)' : 'transparent',
            border: showSizePanel ? '1px solid var(--brand-border)' : '1px solid transparent',
            borderRadius: 999, padding: '6px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.4, whiteSpace: 'nowrap',
            cursor: 'pointer', transition: 'all 150ms', color: 'inherit',
          }}
          onMouseEnter={e => { if (!showSizePanel) (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { if (!showSizePanel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <b style={{ fontSize: 11, fontWeight: 500, color: isDimCustom ? 'var(--brand)' : 'var(--text-strong)' }}>{frame.w}</b>
          <span style={{ color: 'var(--text-subtle)' }}>×</span>
          <b style={{ fontSize: 11, fontWeight: 500, color: isDimCustom ? 'var(--brand)' : 'var(--text-strong)' }}>{frame.svh}</b>
          {frame.presetId && frame.screenH !== frame.svh && (
            <span className={styles.screenHint} style={{ color: 'var(--text-subtle)', fontSize: 10 }}>· {frame.screenH} screen</span>
          )}
          <Icon name="chevron-down" size={10} color="var(--text-subtle)" />
        </button>
        <button
          onClick={() => { iframeRef.current?.contentWindow?.location.reload(); }}
          title="Reload preview — replays entrance animations without leaving this page"
          style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <Icon name="refresh-cw" size={13} />
        </button>
      {/* Dimension size panel opened from the device toolbar. */}
      {showSizePanel && (
        <div role="region" aria-label="Frame size" className={styles.sizePanel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
              Frame Size
            </span>
            {isDimCustom && (
              <button
                onClick={() => setFrame(frameFromPreset(defaultPreset))}
                style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                Reset to {device}
              </button>
            )}
          </div>

          {/* Width */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 14, fontFamily: 'var(--font-ui)' }}>W</span>
            <input
              type="range" min={280} max={1600} step={2} value={frame.w}
              onChange={e => { setW(Number(e.target.value)); setManualZoom(null); }}
              style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--brand)' }}
            />
            <input
              type="number" min={280} max={1600} value={frame.w}
              onChange={e => { setW(clampW(Number(e.target.value))); setManualZoom(null); }}
              style={numInputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>px</span>
          </div>

          {/* Height — the visible (svh) box; see setSvh's doc comment above. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 14, fontFamily: 'var(--font-ui)' }}>H</span>
            <input
              type="range" min={400} max={1200} step={2} value={frame.svh}
              onChange={e => { setSvh(Number(e.target.value)); setManualZoom(null); }}
              style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--brand)' }}
            />
            <input
              type="number" min={400} max={1200} value={frame.svh}
              onChange={e => { setSvh(clampH(Number(e.target.value))); setManualZoom(null); }}
              style={numInputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>px</span>
          </div>

          {/* Device presets — svh, the Safari-visible height, not the whole screen. */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DEVICE_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => { setFrame(frameFromPreset(p)); setManualZoom(null); }}
                title={`${p.w}×${p.svh} visible (${p.screenH} screen)`}
                style={{
                  fontSize: 10.5, padding: '4px 9px',
                  borderRadius: 999,
                  border: '1px solid var(--border-default)',
                  background: frame.presetId === p.id ? 'var(--brand)' : 'var(--surface-sunken)',
                  color: frame.presetId === p.id ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
                  transition: 'all 120ms',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      </div>


          </div>}
        </div>
        <div className={styles.toolMenu} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActiveTools('zoom'); }}
          onPointerLeave={(event) => { if (event.pointerType === 'mouse') setActiveTools(null); }}>
          <button ref={zoomTriggerRef} type="button" className={styles.toolTrigger} aria-label="Preview zoom"
            title={`Preview zoom: ${zoom}%`} aria-expanded={activeTools === 'zoom'}
            onClick={() => setActiveTools('zoom')}>
            <Icon name="search" size={16} />
          </button>
          {activeTools === 'zoom' && <div className={styles.toolFlyout}>
            <div className={styles.zoomPanel} role="group" aria-label="Zoom controls">
        <button aria-label="Zoom preview out" onClick={() => changeZoom(-10)} style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="minus" size={14} />
        </button>
        <div style={{ padding: '0 8px', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-strong)' }}>
          {zoom}%
        </div>
        <button aria-label="Zoom preview in" onClick={() => changeZoom(10)} style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="plus" size={14} />
        </button>
        <button onClick={() => setViewOffset({ x: 0, y: 0 })} title="Center preview" aria-label="Center preview" style={toolbarBtn}><Icon name="crosshair" size={14} /></button>
        <button onClick={() => setManualZoom(null)} title="Reset zoom" style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="rotate-ccw" size={12} />
        </button>

            </div>
          </div>}
        </div>
        <button type="button" className={styles.toolTrigger} aria-label="Pan preview" aria-pressed={panMode}
          title="Pan preview — drag the background, or enable to drag over the invitation. Arrow keys pan; Home centers."
          onClick={() => setPanMode(value => !value)} onKeyDown={(event) => {
            const steps: Record<string, [number, number]> = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
            if (event.key === 'Home') { event.preventDefault(); setViewOffset({ x: 0, y: 0 }); }
            else if (steps[event.key]) { event.preventDefault(); const [x, y] = steps[event.key]; setViewOffset(offset => ({ x: offset.x + x, y: offset.y + y })); }
          }}>
          <Icon name="hand" size={16} />
        </button>
      </div>

      <div className={styles.actionsToolbar} ref={previewInfoRef} role="group" aria-label="Preview actions">
        <button ref={infoButtonRef} type="button" title="Preview information" aria-label="Preview information"
          aria-expanded={showPreviewInfo} onClick={() => { setShowSizePanel(false); setShowPreviewInfo(value => !value); }} style={toolbarBtn}>
          <Icon name="info" size={15} />
        </button>
        {showPreviewInfo && <div className={styles.infoPopover} role="region" aria-label="Preview information">
          <strong>{wedding?.templateName ?? 'Template'}</strong>
          <span className={styles.liveStatus}><span aria-hidden="true">●</span> Live preview</span>
          <p>Reflects your current edits. Save changes to keep them.</p>
        </div>}
      </div>
      </div>

      {/* Device stage */}
      <div ref={stageRef} data-testid="preview-workspace" className={styles.workspace} style={{
        flex: 1, display: 'grid', placeItems: 'center',
        padding: `${toolbarHeight + 32}px 56px ${cinematicTimeline ? timelineHeight + 40 : 24}px`,
        overflow: 'hidden', minHeight: 0, minWidth: 0, cursor: panning ? 'grabbing' : 'grab', touchAction: panMode ? 'none' : 'auto',
      }}
        onPointerDown={(event) => {
          if (event.button !== 0 || (!panMode && event.target !== event.currentTarget)) return;
          if ((event.target as HTMLElement).closest('button, input, select, textarea, a')) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: viewOffset.x, offsetY: viewOffset.y };
          setPanning(true);
        }}
        onPointerMove={(event) => {
          const pan = panRef.current;
          if (!pan || pan.pointerId !== event.pointerId) return;
          setViewOffset({ x: pan.offsetX + event.clientX - pan.x, y: pan.offsetY + event.clientY - pan.y });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          panRef.current = null; setPanning(false);
        }}
        onPointerCancel={() => { panRef.current = null; setPanning(false); }}
        onDoubleClick={(event) => { if (event.target === event.currentTarget || panMode) setViewOffset({ x: 0, y: 0 }); }}>
        {panMode && <div className={styles.panSurface} data-testid="preview-pan-surface" style={{ cursor: panning ? 'grabbing' : 'grab' }} />}

        {/* Clip box sized exactly to the scaled iframe — no bezel, no padding. */}
        <div data-testid="preview-device-frame" style={{ position: 'relative', width: iframeW * zoom / 100, height: iframeH * zoom / 100, transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}>
        <div style={{
          width: iframeW * zoom / 100,
          height: iframeH * zoom / 100,
          overflow: 'hidden',
          background: '#fff',
          borderRadius: DEVICE_RADIUS[device],
          boxShadow: '0 32px 80px -16px rgba(26,23,24,0.22), 0 12px 24px -8px rgba(26,23,24,0.10)',
          flexShrink: 0,
        }}>
          <iframe
            ref={iframeRef}
            src="/organizer-admin/preview"
            title="Invitation Preview"
            style={{
              // Laid out at the wider `layoutW/H` (see above) so every relative unit inside — cqi,
              // %, the invitation's own vw/svh — resolves exactly as it will for a guest, then
              // scaled back down by this device's own `frame.scale` (folded into the zoom
              // transform) so the visible size on screen is unchanged: layoutW * frame.scale ===
              // iframeW * zoom/100, which is what the clip box below is sized to.
              width: layoutW,
              height: layoutH,
              border: 'none',
              display: 'block',
              transform: `scale(${(zoom / 100) * frame.scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
        {cinematicReference && <CinematicReferenceRail key={cinematicReference.beat.id} {...cinematicReference} />}
        </div>
      </div>

      {/* Cinematic timeline belongs to the canvas, not the property dock: it controls the view
          being directed and stays reachable while a floating layer card is open. */}
      {cinematicTimeline && (
        <div style={{
          position: 'absolute', bottom: 16,
          left: 'clamp(16px, 2vw, 28px)', right: 'clamp(16px, 2vw, 28px)',
          height: timelineHeight,
          zIndex: 6,
        }}>
          {!timelineView.collapsed && timelineExpanded && <div role="separator" aria-orientation="horizontal" aria-label="Resize timeline" tabIndex={0}
            aria-valuemin={148} aria-valuemax={Math.round(maxTimelineHeight)} aria-valuenow={Math.round(openTimelineHeight)} title="Drag to resize, or use the Up and Down arrow keys"
            className={styles.timelineResizeGrip}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); resizeRef.current = { y: event.clientY, height: openTimelineHeight }; }}
            onPointerMove={(event) => { if (resizeRef.current) resizeTimeline(resizeRef.current.height + resizeRef.current.y - event.clientY); }}
            onPointerUp={() => { resizeRef.current = null; }} onPointerCancel={() => { resizeRef.current = null; }}
            onKeyDown={(event) => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); resizeTimeline(openTimelineHeight + (event.key === 'ArrowUp' ? 20 : -20)); } }} />}
          <CinematicTimeline
            progress={cinematicTimeline.progress}
            beats={cinematicTimeline.beats}
            tracks={cinematicTimeline.tracks}
            selectedAsset={cinematicTimeline.selectedAsset}
            selectedBeat={cinematicTimeline.selectedBeat}
            editableBeats={cinematicTimeline.editableBeats}
            dirty={cinematicTimeline.dirty}
            expanded={timelineExpanded}
            onFocusHeightChange={setFocusContentHeight}
            collapsed={timelineView.collapsed}
            onCollapsedChange={(collapsed) => setTimelineView((current) => ({ ...current, collapsed }))}
            onExpandedChange={setTimelineExpanded}
            onChange={cinematicTimeline.onChange}
            onBeatMove={cinematicTimeline.onBeatMove}
            onTrackClipChange={cinematicTimeline.onTrackClipChange}
            onTrackSelect={cinematicTimeline.onTrackSelect}
            onClearSelection={cinematicTimeline.onClearSelection}
            onResetTrack={cinematicTimeline.onResetTrack}
          />
        </div>
      )}


    </section>
  );
}
