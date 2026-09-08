'use client';

import { useState, useEffect } from 'react';
import TemplateWrapper from '@/components/templates/TemplateWrapper';
import { Wedding, Wish, Photo, ItineraryItem, SeatingTable } from '@/lib/api';
import type { FrameViewport } from '@/components/templates/_shared/types';
import FrameViewportVars from '@/components/templates/_shared/FrameViewportVars';
import ViewportProbe from '@/components/dev/ViewportProbe';
import { animateScrollTo } from '@/components/templates/_shared/animateScrollTo';

interface PreviewPayload {
  wedding: Wedding;
  coupleMedia: Photo[];
  wishes: Wish[];
  photoBoothEnabled: boolean;
  customConfig: Record<string, string>;
  itinerary: ItineraryItem[];
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  /**
   * When editing, the template outlines the selected layer. The Adjust panel itself lives in the
   * parent customize page now, so there's no callback here — config arrives through customConfig.
   */
  editor?: {
    enabled: boolean;
    breakpoint: 'mobile' | 'desktop';
    selectedStage?: string;
    selectedLayer?: string;
    revealOverflow?: boolean;
    /** @deprecated superseded by `frame`. Kept so a `preview_draft_v2` written by an older build
     *  still pins the reveal frame instead of silently falling back to the template's own 390×844
     *  constants — see the derivation below. */
    frameW?: number;
    frameH?: number;
    frame?: FrameViewport;
  };
}

// Bumped from 'preview_draft' so a stale draft written before `editor.frame` existed can't
// resurrect the old shape on mount, ahead of the parent's PREVIEW_UPDATE replay.
const STORAGE_KEY = 'preview_draft_v2';

export default function PreviewPage() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  // Read directly off the location rather than `useSearchParams()` — this static (no dynamic
  // segment) route would otherwise need a <Suspense> boundary purely for a dev-only flag, and the
  // page is client-only anyway (see the localStorage-in-an-effect note below).
  const [probe, setProbe] = useState(false);
  useEffect(() => {
    setProbe(new URLSearchParams(window.location.search).get('probe') === '1');
  }, []);

  // Hydrate from the last draft on mount. localStorage is client-only, so reading it during render
  // (a lazy useState initializer) makes the server render "Loading…" while the client renders the
  // template — a hydration mismatch. Reading it in an effect keeps SSR and the first client render
  // in agreement; the parent also replays the latest state right after PREVIEW_READY.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPayload(JSON.parse(stored) as PreviewPayload);
    } catch { /* ignore a malformed draft */ }
  }, []);

  useEffect(() => {
    // Tell parent we're ready — parent will replay latest state via postMessage
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'PREVIEW_UPDATE') {
        const p = event.data.payload as PreviewPayload;
        setPayload(p);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
      }

      if (event.data?.type === 'PREVIEW_SCROLL') {
        // A section id is exact; the fraction is the legacy fallback and lands only roughly,
        // which matters now that Template 7's ceremony spans several full-height stages.
        const sectionId = event.data.sectionId as string | undefined;
        const el = sectionId ? document.getElementById(sectionId) : null;
        const targetTop = el ? el.getBoundingClientRect().top + window.scrollY
          : document.body.scrollHeight * (event.data.fraction as number);
        // A hand-rolled, fixed-duration scroll rather than `behavior: 'smooth'` — native smooth
        // scroll duration/easing is implementation-defined and varies noticeably by browser
        // (Safari's is markedly slower/more pronounced than Chromium's). Every stage's top ~20-25%
        // is plain sky before any art begins, so a slower scroll lingers on "mostly blank sky" far
        // more visibly in one browser than another for the exact same click — jumping stage to
        // stage should look and feel identical everywhere.
        animateScrollTo(targetTop);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading preview…</p>
      </div>
    );
  }

  // Back-compat: a payload from an older build (or a stale localStorage draft) may only carry the
  // flat frameW/frameH. Derive a FrameViewport from them so downstream consumers (Stage's reveal
  // pin, --f* vars) never have to know about the old shape.
  const frame: FrameViewport | undefined = payload.editor?.frame
    ?? (payload.editor?.frameW && payload.editor?.frameH
      ? {
          w: payload.editor.frameW, h: payload.editor.frameH, svh: payload.editor.frameH,
          safe: { top: 0, right: 0, bottom: 0, left: 0 },
        }
      : undefined);

  return (
    <>
      {/* Pins --fvw/--fvh/--fsvh/--fsa* to the previewed device frame (docs/FIX_QUEUE.md Issue 2)
          so Reveal-mode content (sheets, the rail, anything still on raw vw/vh/svh) sizes against
          the pinned stage instead of the widened iframe. No-op when `frame` is absent. */}
      <FrameViewportVars frame={frame} />
      {probe && <ViewportProbe />}
      <TemplateWrapper
        wedding={payload.wedding}
        wishes={payload.wishes}
        photos={[]}
        guests={[]}
        photoBoothEnabled={payload.photoBoothEnabled}
        coupleMedia={payload.coupleMedia}
        customConfig={payload.customConfig}
        itinerary={payload.itinerary}
        seatingEnabled={payload.seatingEnabled}
        tables={payload.tables}
        editor={
          payload.editor?.enabled
            ? {
                enabled: true,
                breakpoint: payload.editor.breakpoint,
                selectedStage: payload.editor.selectedStage,
                selectedLayer: payload.editor.selectedLayer,
                revealOverflow: payload.editor.revealOverflow,
                frameW: payload.editor.frameW,
                frameH: payload.editor.frameH,
                frame,
              }
            : undefined
        }
        onRSVP={async () => {}}
        onSubmitWish={async () => {}}
      />
    </>
  );
}
