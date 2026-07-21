'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Wedding } from '@/lib/api';
import { REVEAL_VPAD } from '@/components/templates/_shared/types';

export type Device = 'mobile' | 'tablet' | 'desktop';
export type EditorMode = 'expanded' | 'collapsed' | 'hidden';

export const DEVICE_DIMS: Record<Device, { w: number; h: number }> = {
  mobile:  { w: 390,  h: 844  },
  tablet:  { w: 768,  h: 1024 },
  desktop: { w: 1440, h: 900  },
};

// Clip-box corner radius per device (cosmetic only — no bezel, no padding)
const DEVICE_RADIUS: Record<Device, number> = { mobile: 26, tablet: 16, desktop: 10 };

const DEVICE_DEFAULT_W: Record<Device, number> = { mobile: 390,  tablet: 768,  desktop: 1280 };
const DEVICE_DEFAULT_H: Record<Device, number> = { mobile: 844,  tablet: 900,  desktop: 720 };

const SECTION_ICONS: Record<string, string> = {
  welcome: 'image', walimah: 'calendar', rsvp: 'star',
  itinerary: 'clock', wishes: 'message-circle', photobooth: 'camera',
};
const SECTION_LABELS: Record<string, string> = {
  welcome: 'Cover', walimah: 'Ceremony', rsvp: 'RSVP',
  itinerary: 'Itinerary', wishes: 'Wishes', photobooth: 'Photo Booth',
};

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
  /** "Reveal off-screen" (PRO Adjust): widen the canvas so art cropped by the device edge spills
   *  into view around the (dashed-framed) device column instead of being clipped. */
  revealOverflow?: boolean;
}

/** How much wider than the device the reveal canvas is (extra room = bleed you can see). */
const REVEAL_FACTOR = 2.2;

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
  activeBlock, onSelectBlock, sectionOrder, editorMode, onShowEditor, wedding,
  revealOverflow = false,
}: PreviewPanelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [autoZoom, setAutoZoom] = useState(80);
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [customW, setCustomW] = useState(DEVICE_DEFAULT_W[device]);
  const [customH, setCustomH] = useState(DEVICE_DEFAULT_H[device]);

  const zoom = manualZoom ?? autoZoom;
  const defaultW = DEVICE_DEFAULT_W[device];
  const defaultH = DEVICE_DEFAULT_H[device];

  // Reveal mode enlarges the canvas around a pinned device-sized stage so cropped art spills into
  // the extra room on all four sides. Width uses REVEAL_FACTOR; height adds REVEAL_VPAD top+bottom
  // (kept in sync with Stage's margin-block).
  const iframeW = revealOverflow ? Math.round(DEVICE_DIMS[device].w * REVEAL_FACTOR) : customW;
  const iframeH = revealOverflow ? Math.round(DEVICE_DIMS[device].h * (1 + 2 * REVEAL_VPAD)) : customH;

  // When device preset changes, reset custom dims to device defaults
  useEffect(() => {
    setCustomW(DEVICE_DEFAULT_W[device]);
    setCustomH(DEVICE_DEFAULT_H[device]);
    setManualZoom(null);
  }, [device]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fit zoom based on custom dims
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const pad = 80;
      const fitW = (rect.width  - pad) / iframeW;
      const fitH = (rect.height - pad) / iframeH;
      const auto = Math.min(fitW, fitH, 1);
      if (auto > 0.05) setAutoZoom(Math.round(auto * 100));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [iframeW, iframeH, device, editorMode]);

  const changeZoom = (delta: number) => {
    const base = manualZoom ?? autoZoom;
    setManualZoom(Math.min(150, Math.max(10, Math.round(base / 10) * 10 + delta)));
  };

  const clampW = (v: number) => Math.max(280, Math.min(1600, v));
  const clampH = (v: number) => Math.max(400, Math.min(1200, v));
  const isDimCustom = customW !== defaultW || customH !== defaultH;

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
    <section style={{
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

      {/* Top center: device chips + zoom */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'var(--surface-card)', borderRadius: 999,
        padding: '5px 6px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        zIndex: 5, whiteSpace: 'nowrap',
      }}>
        {(['mobile', 'tablet', 'desktop'] as Device[]).map((d) => (
          <button key={d} onClick={() => { setDevice(d); setManualZoom(null); }}
            style={{
              ...chipBase,
              background: device === d ? 'var(--text-strong)' : 'transparent',
              color: device === d ? '#fff' : 'var(--text-muted)',
            }}
            onMouseEnter={e => { if (device !== d) (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { if (device !== d) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <Icon name={d === 'mobile' ? 'smartphone' : d === 'tablet' ? 'tablet' : 'monitor'} size={14} />
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />
        <button onClick={() => changeZoom(-10)} style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="minus" size={14} />
        </button>
        <div style={{ padding: '0 8px', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-strong)' }}>
          {zoom}%
        </div>
        <button onClick={() => changeZoom(10)} style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="plus" size={14} />
        </button>
        <button onClick={() => setManualZoom(null)} title="Reset zoom" style={toolbarBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="rotate-ccw" size={12} />
        </button>
      </div>

      {/* Top right: fullscreen + share */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'var(--surface-card)', borderRadius: 999,
        padding: 4, boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)', zIndex: 5,
      }}>
        {wedding && (
          <a
            href={`/wedding/${wedding.coupleName}`}
            target="_blank"
            rel="noreferrer"
            title="Open invitation"
            style={{ ...toolbarBtn, display: 'grid', placeItems: 'center', textDecoration: 'none', color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <Icon name="eye" size={14} />
          </a>
        )}
        {wedding && (
          <button title="Copy invitation link" style={toolbarBtn}
            onClick={() => { if (wedding?.coupleName) navigator.clipboard?.writeText(`${window.location.origin}/wedding/${wedding.coupleName}`); }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
            <Icon name="share" size={14} />
          </button>
        )}
      </div>

      {/* Right rail: section jump dots */}
      <div style={{
        position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'var(--surface-card)', borderRadius: 999,
        padding: '6px 4px', boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)', zIndex: 5,
      }}>
        {sectionOrder.map((code) => {
          const isActive = activeBlock === code;
          return (
            <div key={code} style={{ position: 'relative' }}>
              <button
                onClick={() => onSelectBlock(code)}
                title={SECTION_LABELS[code] ?? code}
                style={{
                  width: 22, height: 22, display: 'grid', placeItems: 'center',
                  borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: isActive ? 'var(--text-strong)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; } }}
              >
                <Icon name={SECTION_ICONS[code] ?? 'circle-dashed'} size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Device stage */}
      <div ref={stageRef} style={{
        flex: 1, display: 'grid', placeItems: 'center',
        padding: '72px 56px 80px', overflow: 'hidden', minHeight: 0, minWidth: 0,
      }}>
        {/* Clip box sized exactly to the scaled iframe — no bezel, no padding. In reveal mode it
            grows to the widened canvas; the per-stage dashed frame marks the real device bounds. */}
        <div style={{
          width: iframeW * zoom / 100,
          height: iframeH * zoom / 100,
          overflow: 'hidden',
          background: revealOverflow ? 'var(--surface-sunken)' : '#fff',
          borderRadius: revealOverflow ? 8 : DEVICE_RADIUS[device],
          boxShadow: '0 32px 80px -16px rgba(26,23,24,0.22), 0 12px 24px -8px rgba(26,23,24,0.10)',
          flexShrink: 0,
        }}>
          <iframe
            ref={iframeRef}
            src="/couple-admin/preview"
            title="Invitation Preview"
            style={{
              width: iframeW,
              height: iframeH,
              border: 'none',
              display: 'block',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>

      {/* Dimension size panel (popover above status strip) */}
      {showSizePanel && (
        <div style={{
          position: 'absolute', bottom: 66, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface-card)', borderRadius: 14,
          border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)',
          padding: '14px 18px', zIndex: 10, minWidth: 300,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
              Frame Size
            </span>
            {isDimCustom && (
              <button
                onClick={() => { setCustomW(defaultW); setCustomH(defaultH); }}
                style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                Reset to {device}
              </button>
            )}
          </div>

          {/* Width */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 14, fontFamily: 'var(--font-ui)' }}>W</span>
            <input
              type="range" min={280} max={1600} step={2} value={customW}
              onChange={e => { setCustomW(Number(e.target.value)); setManualZoom(null); }}
              style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--brand)' }}
            />
            <input
              type="number" min={280} max={1600} value={customW}
              onChange={e => { setCustomW(clampW(Number(e.target.value))); setManualZoom(null); }}
              style={numInputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>px</span>
          </div>

          {/* Height */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 14, fontFamily: 'var(--font-ui)' }}>H</span>
            <input
              type="range" min={400} max={1200} step={2} value={customH}
              onChange={e => { setCustomH(Number(e.target.value)); setManualZoom(null); }}
              style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--brand)' }}
            />
            <input
              type="number" min={400} max={1200} value={customH}
              onChange={e => { setCustomH(clampH(Number(e.target.value))); setManualZoom(null); }}
              style={numInputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>px</span>
          </div>

          {/* Common presets */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              { label: 'iPhone SE', w: 375, h: 667 },
              { label: 'iPhone 15', w: 390, h: 844 },
              { label: 'iPhone 15 Pro Max', w: 430, h: 932 },
              { label: 'Galaxy S24', w: 360, h: 780 },
              { label: 'iPad', w: 768, h: 1024 },
            ] as { label: string; w: number; h: number }[]).map(p => (
              <button
                key={p.label}
                onClick={() => { setCustomW(p.w); setCustomH(p.h); setManualZoom(null); }}
                style={{
                  fontSize: 10.5, padding: '4px 9px',
                  borderRadius: 999,
                  border: '1px solid var(--border-default)',
                  background: customW === p.w && customH === p.h ? 'var(--brand)' : 'var(--surface-sunken)',
                  color: customW === p.w && customH === p.h ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
                  transition: 'all 120ms',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom status strip */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 14px',
        background: 'var(--surface-card)', borderRadius: 999,
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)',
        fontSize: 11, color: 'var(--text-muted)',
        zIndex: 5, whiteSpace: 'nowrap',
        fontFamily: 'var(--font-ui)',
      }}>
        <Icon name="eye" size={12} />
        <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>
          {SECTION_LABELS[activeBlock] ?? activeBlock}
        </span>

        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />

        {/* Clickable W×H — opens size panel */}
        <button
          onClick={() => setShowSizePanel(p => !p)}
          title="Adjust frame dimensions"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: showSizePanel ? 'var(--brand-subtle)' : 'transparent',
            border: showSizePanel ? '1px solid var(--brand-border)' : '1px solid transparent',
            borderRadius: 999, padding: '2px 8px',
            cursor: 'pointer', transition: 'all 150ms', color: 'inherit',
          }}
          onMouseEnter={e => { if (!showSizePanel) (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => { if (!showSizePanel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <b style={{ fontWeight: 600, color: isDimCustom ? 'var(--brand)' : 'var(--text-strong)' }}>{customW}</b>
          <span style={{ color: 'var(--text-subtle)' }}>×</span>
          <b style={{ fontWeight: 600, color: isDimCustom ? 'var(--brand)' : 'var(--text-strong)' }}>{customH}</b>
          <Icon name="chevron-up" size={10} color="var(--text-subtle)" />
        </button>

        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
        <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>
          {wedding?.templateName ?? 'Template'}
        </span>
        <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
        <span style={{ color: 'var(--gold-500, #b8945a)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8, lineHeight: 1 }}>●</span> Live
        </span>
      </div>

      {/* Dismiss size panel on outside click */}
      {showSizePanel && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9 }}
          onClick={() => setShowSizePanel(false)}
        />
      )}
    </section>
  );
}
