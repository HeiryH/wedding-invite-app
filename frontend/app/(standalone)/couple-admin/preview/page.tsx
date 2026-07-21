'use client';

import { useState, useEffect } from 'react';
import TemplateWrapper from '@/components/templates/TemplateWrapper';
import { Wedding, Wish, Photo, ItineraryItem, SeatingTable } from '@/lib/api';

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
  };
}

const STORAGE_KEY = 'preview_draft';

export default function PreviewPage() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

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
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          const fraction = event.data.fraction as number;
          window.scrollTo({ top: document.body.scrollHeight * fraction, behavior: 'smooth' });
        }
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

  return (
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
            }
          : undefined
      }
      onRSVP={async () => {}}
      onSubmitWish={async () => {}}
    />
  );
}
