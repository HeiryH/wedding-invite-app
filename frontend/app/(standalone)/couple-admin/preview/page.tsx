'use client';

import { useState, useEffect } from 'react';
import TemplateWrapper from '@/components/templates/TemplateWrapper';
import { Wedding, Wish, Photo, ItineraryItem } from '@/lib/api';

interface PreviewPayload {
  wedding: Wedding;
  coupleMedia: Photo[];
  wishes: Wish[];
  photoBoothEnabled: boolean;
  customConfig: Record<string, string>;
  itinerary: ItineraryItem[];
}

const STORAGE_KEY = 'preview_draft';

export default function PreviewPage() {
  // Lazy initializer reads from localStorage so we render immediately on refresh
  const [payload, setPayload] = useState<PreviewPayload | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PreviewPayload) : null;
    } catch { return null; }
  });

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
        const fraction = event.data.fraction as number;
        window.scrollTo({ top: document.body.scrollHeight * fraction, behavior: 'smooth' });
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
      onRSVP={async () => {}}
      onSubmitWish={async () => {}}
    />
  );
}
