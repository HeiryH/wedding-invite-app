'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Wedding } from '@/lib/api/types';
import Template1 from '@/components/templates/Template1';
import Template2 from '@/components/templates/Template2';
import Template3 from '@/components/templates/Template3';
import Template4 from '@/components/templates/Template4';
import Template5 from '@/components/templates/Template5';
import Template6 from '@/components/templates/Template6';
import Template7 from '@/components/templates/Template7';

const DUMMY: Wedding = {
  weddingId: 0,
  coupleName: 'preview',
  brideName: 'Aisha',
  groomName: 'Adam',
  // Must stay in the future, or every thumbnail renders with its countdown already expired.
  weddingDate: '2027-06-15T11:00:00Z',
  venue: 'Grand Ballroom',
  venueAddress: 'Kuala Lumpur, Malaysia',
  totalGuests: 0,
  totalAttending: 0,
  daysUntilWedding: 365,
  isActive: true,
  isPublic: true,
  totalPhotos: 0,
  enabledFeaturesCount: 0,
  templateId: 0,
  templateName: '',
};

const noOp = () => Promise.resolve();

// Minimal props required by all templates
const PROPS = {
  wedding: DUMMY,
  onRSVP: noOp,
  onSubmitWish: noOp,
  wishes: [] as any[],
  photos: [] as any[],
  photoBoothEnabled: false,
};

export default function TemplatePreviewPage() {
  const { code } = useParams<{ code: string }>();
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Signal readiness (used by the offline generate-previews Playwright script)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // Client-side capture: when embedded with ?capture=1 (by the super-admin screenshot tool),
  // rasterize this dummy-data render to a PNG in-browser and post it back to the opener. No
  // server-side headless browser involved.
  useEffect(() => {
    if (!ready) return;
    if (new URLSearchParams(window.location.search).get('capture') !== '1') return;
    if (!window.parent || window.parent === window) return;

    let cancelled = false;
    (async () => {
      try {
        // Fonts must be loaded before rasterizing, then a settle for webp/image decode and for
        // IntersectionObserver-driven reveals (e.g. T7's staggered stage layers) to finish —
        // matches the ~2.5s the offline generate-previews script waits.
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 2500));
        if (cancelled || !rootRef.current) return;

        const { toPng } = await import('html-to-image');
        const dataUrl = await toPng(rootRef.current, {
          width: 390,
          height: 700,
          pixelRatio: 2,
          cacheBust: true,
        });
        if (cancelled) return;
        window.parent.postMessage({ type: 'THUMB_CAPTURE', code, dataUrl }, window.location.origin);
      } catch (err) {
        if (!cancelled) {
          window.parent.postMessage(
            { type: 'THUMB_CAPTURE_ERROR', code, message: err instanceof Error ? err.message : String(err) },
            window.location.origin,
          );
        }
      }
    })();

    return () => { cancelled = true; };
  }, [ready, code]);

  return (
    <div
      ref={rootRef}
      style={{ width: 390, height: 700, overflow: 'hidden', position: 'relative', margin: 0, padding: 0 }}
      {...(ready ? { 'data-preview-ready': 'true' } : {})}
    >
      {code === 'classic-rose'        && <Template1 {...PROPS} />}
      {code === 'golden-elegance'     && <Template2 {...PROPS} />}
      {code === 'garden-romance'      && <Template3 {...PROPS} />}
      {code === 'minimal-noir'        && <Template4 {...PROPS} />}
      {code === 'dreaming-floral-sky' && <Template5 {...PROPS} />}
      {code === 'fairy-garden'        && <Template6 {...PROPS} />}
      {code === 'roman-garden'        && <Template7 {...PROPS} />}
    </div>
  );
}
