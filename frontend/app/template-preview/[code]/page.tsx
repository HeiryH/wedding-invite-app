'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Wedding } from '@/lib/api/types';
import { templateService, templateConfigService } from '@/lib/api';
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
const BASE_PROPS = {
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
  const [configLoaded, setConfigLoaded] = useState(false);
  // The template's captured "starting design" (empty if none set) — without this, every preview/
  // thumbnail renders the raw shipped code defaults, never a saved design (e.g. T7's stage layout).
  const [customConfig, setCustomConfig] = useState<Record<string, string>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  // Resolve the template's default config before anything else — readiness below waits on
  // configLoaded so the page can't signal ready before the real design is applied.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const template = await templateService.getByCode(code);
        const config = await templateConfigService.getTemplateDefault(template.templateId);
        if (!cancelled) setCustomConfig(config);
      } catch {
        if (!cancelled) setCustomConfig({}); // no default set (or lookup failed) — fall back to code defaults
      } finally {
        if (!cancelled) setConfigLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  // Signal readiness (used by the offline generate-previews Playwright script)
  useEffect(() => {
    if (!configLoaded) return;
    const t = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(t);
  }, [configLoaded]);

  const props = { ...BASE_PROPS, customConfig };

  return (
    <div
      ref={rootRef}
      style={{ width: 390, height: 700, overflow: 'hidden', position: 'relative', margin: 0, padding: 0 }}
      {...(ready ? { 'data-preview-ready': 'true' } : {})}
    >
      {code === 'classic-rose'        && <Template1 {...props} />}
      {code === 'golden-elegance'     && <Template2 {...props} />}
      {code === 'garden-romance'      && <Template3 {...props} />}
      {code === 'minimal-noir'        && <Template4 {...props} />}
      {code === 'dreaming-floral-sky' && <Template5 {...props} />}
      {code === 'fairy-garden'        && <Template6 {...props} />}
      {code === 'roman-garden'        && <Template7 {...props} />}
    </div>
  );
}
