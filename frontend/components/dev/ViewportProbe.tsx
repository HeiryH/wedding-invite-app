'use client';

/**
 * Dev-only measurement overlay for closing the preview-vs-real-device gap — see
 * `docs/FIX_QUEUE.md` Issue 2. Mounted behind `?probe=1` on both the public invitation page
 * (`app/[eventType]/[slug]/page.tsx`, where it inherits the real `initial-scale: 0.9` layout
 * viewport) and the Adjust Editor's standalone preview (`app/(standalone)/organizer-admin/
 * preview/page.tsx`, driven from `PreviewPanel`'s iframe `src`). Run both, "Copy JSON" each, diff
 * — that diff is the acceptance test for every step of the preview-fidelity fix.
 *
 * Everything here is *measured*, never computed: JS has no `svh` accessor, and `innerHeight` is
 * the current *visual* viewport, not `svh`. So each unit gets a zero-content probe element sized
 * with that unit, read back via `getBoundingClientRect()` (fractional — `offsetHeight` rounds and
 * would hide sub-pixel drift that matters at this scale).
 */

import { useEffect, useState } from 'react';

interface ProbeReport {
  href: string;
  ua: string;
  win: { innerW: number; innerH: number; outerW: number; outerH: number; dpr: number };
  docEl: { clientW: number; clientH: number };
  visual: { w: number; h: number; scale: number; offsetTop: number } | null;
  screenDims: { w: number; h: number; availW: number; availH: number; orientation: string };
  units: { vw: number; vh: number; svh: number; lvh: number; dvh: number; rem: number };
  safe: { top: number; right: number; bottom: number; left: number };
  textSizeAdjust: string;
  frameVars: Record<string, string>;
  stage: {
    id: string; w: number; h: number; cqi: number; hasCanvas: boolean;
    canvasW: number | null; canvasCqi: number | null;
  } | null;
  type: Array<{ sel: string; text: string; fontSizePx: number; lineHeightPx: number; w: number; h: number }>;
}

const PROBE_TARGETS = [
  '[data-stage] h1',
  '[data-stage] h2',
  '[data-stage] p',
  '[data-stage] button',
  '[data-stage] input',
  '[data-stage] [data-kind="text"]',
];

const FRAME_VARS = ['--fvw', '--fvh', '--fsvh', '--fsat', '--fsar', '--fsab', '--fsal'];

function round(n: number, dp = 2): number {
  const m = 10 ** dp;
  return Math.round(n * m) / m;
}

// `axis` picks which axis to report — every probe sets BOTH a 1px cross-axis size (so the box has
// a nonzero, measurable footprint) and the axis under test, so "whichever is nonzero" can't tell
// them apart. An earlier version guessed by "whichever axis is nonzero" and always picked the 1px
// cross-axis instead of the intended measurement — this is why vh/svh/lvh/dvh/env() all silently
// read back as literally "1" (the 1px placeholder) instead of the real value.
function measureUnit(css: string, axis: 'width' | 'height'): number {
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;visibility:hidden;top:0;left:0;pointer-events:none;${css}`;
  document.body.appendChild(el);
  const rect = el.getBoundingClientRect();
  document.body.removeChild(el);
  return axis === 'width' ? rect.width : rect.height;
}

function measureEnv(side: 'top' | 'right' | 'bottom' | 'left'): number {
  return measureUnit(`height:env(safe-area-inset-${side}, 0px);width:1px;`, 'height');
}

function buildReport(): ProbeReport {
  const vv = window.visualViewport;
  const html = document.documentElement;

  const units = {
    vw: round(measureUnit('width:100vw;height:1px;', 'width')),
    vh: round(measureUnit('width:1px;height:100vh;', 'height')),
    svh: round(measureUnit('width:1px;height:100svh;', 'height')),
    lvh: round(measureUnit('width:1px;height:100lvh;', 'height')),
    dvh: round(measureUnit('width:1px;height:100dvh;', 'height')),
    rem: round(measureUnit('width:1rem;height:1px;', 'width')),
  };

  const safe = {
    top: round(measureEnv('top')),
    right: round(measureEnv('right')),
    bottom: round(measureEnv('bottom')),
    left: round(measureEnv('left')),
  };

  const frameVars: Record<string, string> = {};
  const rootStyle = getComputedStyle(html);
  for (const v of FRAME_VARS) frameVars[v] = rootStyle.getPropertyValue(v).trim() || '(unset)';

  // Stage + art-canvas cqi. Reads the first mounted [data-stage] — enough to catch a container-type
  // regression without instrumenting every stage.
  let stage: ProbeReport['stage'] = null;
  const stageEl = document.querySelector('[data-stage]') as HTMLElement | null;
  if (stageEl) {
    const rect = stageEl.getBoundingClientRect();
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:100cqi;height:0;pointer-events:none;';
    stageEl.appendChild(probe);
    const cqi = probe.getBoundingClientRect().width / 100;
    stageEl.removeChild(probe);

    const canvasEl = stageEl.querySelector('[data-canvas]') as HTMLElement | null;
    let canvasW: number | null = null;
    let canvasCqi: number | null = null;
    if (canvasEl) {
      canvasW = round(canvasEl.getBoundingClientRect().width);
      const cprobe = document.createElement('div');
      cprobe.style.cssText = 'position:absolute;visibility:hidden;width:100cqi;height:0;pointer-events:none;';
      canvasEl.appendChild(cprobe);
      canvasCqi = round(cprobe.getBoundingClientRect().width / 100);
      canvasEl.removeChild(cprobe);
    }

    stage = {
      id: stageEl.getAttribute('data-stage') ?? '',
      w: round(rect.width), h: round(rect.height),
      cqi: round(cqi),
      hasCanvas: Boolean(canvasEl),
      canvasW, canvasCqi,
    };
  }

  const type: ProbeReport['type'] = [];
  for (const sel of PROBE_TARGETS) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) continue;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    type.push({
      sel,
      text: (el.textContent ?? '').trim().slice(0, 40),
      fontSizePx: round(parseFloat(cs.fontSize)),
      lineHeightPx: round(parseFloat(cs.lineHeight) || 0),
      w: round(rect.width), h: round(rect.height),
    });
  }

  return {
    href: window.location.href,
    ua: navigator.userAgent,
    win: {
      innerW: window.innerWidth, innerH: window.innerHeight,
      outerW: window.outerWidth, outerH: window.outerHeight,
      dpr: window.devicePixelRatio,
    },
    docEl: { clientW: html.clientWidth, clientH: html.clientHeight },
    visual: vv ? { w: round(vv.width), h: round(vv.height), scale: round(vv.scale, 3), offsetTop: round(vv.offsetTop) } : null,
    screenDims: {
      w: window.screen.width, h: window.screen.height,
      availW: window.screen.availWidth, availH: window.screen.availHeight,
      orientation: window.screen.orientation?.type ?? '(unknown)',
    },
    units,
    safe,
    textSizeAdjust: (getComputedStyle(html) as CSSStyleDeclaration & { webkitTextSizeAdjust?: string }).webkitTextSizeAdjust
      ?? getComputedStyle(html).getPropertyValue('-webkit-text-size-adjust') ?? '(unset)',
    frameVars,
    stage,
    type,
  };
}

export default function ViewportProbe() {
  const [report, setReport] = useState<ProbeReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const refresh = () => setReport(buildReport());
    refresh();
    (window as unknown as { __viewportProbe: () => ProbeReport }).__viewportProbe = buildReport;
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    const id = window.setInterval(refresh, 1000); // catches svh settling after a toolbar animation
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
      window.clearInterval(id);
    };
  }, []);

  if (!report) return null;

  const json = JSON.stringify(report, null, 2);

  return (
    <div
      style={{
        position: 'fixed', bottom: 8, right: 8, zIndex: 999999,
        maxWidth: open ? 340 : 'auto', maxHeight: open ? '70vh' : 'auto',
        overflow: 'auto',
        background: 'rgba(20,18,16,0.94)', color: '#f2ede4',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
        fontFamily: "'SF Mono', ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.5,
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: open ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
        <button onClick={() => setOpen((o) => !o)} style={{ background: 'none', border: 'none', color: '#f2ede4', cursor: 'pointer', fontWeight: 700 }}>
          {open ? '▾' : '▸'} probe
        </button>
        {open && (
          <button
            onClick={() => { navigator.clipboard?.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            style={{ marginLeft: 'auto', background: '#3a3430', border: 'none', color: '#f2ede4', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 10 }}
          >
            {copied ? 'copied ✓' : 'copy JSON'}
          </button>
        )}
      </div>
      {open && (
        <div style={{ padding: '8px 10px' }}>
          <Row label="win" v={`${report.win.innerW}×${report.win.innerH} @${report.win.dpr}x`} />
          <Row label="docEl" v={`${report.docEl.clientW}×${report.docEl.clientH}`} />
          {report.visual && <Row label="visualVV" v={`${report.visual.w}×${report.visual.h} ×${report.visual.scale}`} />}
          <Row label="screen" v={`${report.screenDims.w}×${report.screenDims.h}`} />
          <div style={{ height: 6 }} />
          <Row label="vw" v={`${report.units.vw}px`} />
          <Row label="vh / lvh" v={`${report.units.vh} / ${report.units.lvh}px`} />
          <Row label="svh" v={`${report.units.svh}px`} bold />
          <Row label="dvh" v={`${report.units.dvh}px (info only — never in CSS)`} />
          <Row label="1rem" v={`${report.units.rem}px`} />
          <div style={{ height: 6 }} />
          <Row label="safe-area" v={`t${report.safe.top} r${report.safe.right} b${report.safe.bottom} l${report.safe.left}`} />
          <Row label="text-size-adj" v={report.textSizeAdjust} />
          {report.stage && (
            <>
              <div style={{ height: 6 }} />
              <Row label={`stage:${report.stage.id}`} v={`${report.stage.w}×${report.stage.h} cqi=${report.stage.cqi}`} bold />
              {report.stage.hasCanvas && (
                <Row label="  canvas" v={`w=${report.stage.canvasW} cqi=${report.stage.canvasCqi}`} />
              )}
            </>
          )}
          {report.type.length > 0 && (
            <>
              <div style={{ height: 6 }} />
              {report.type.map((t) => (
                <Row key={t.sel} label={t.sel.replace('[data-stage] ', '')} v={`${t.fontSizePx}px "${t.text}"`} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, v, bold }: { label: string; v: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontWeight: bold ? 700 : 400 }}>
      <span style={{ opacity: 0.6, minWidth: 78 }}>{label}</span>
      <span>{v}</span>
    </div>
  );
}
