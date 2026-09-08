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
import Template8 from '@/components/templates/Template8';
import Template9 from '@/components/templates/Template9';
import Template10 from '@/components/templates/Template10';

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

// PARTY (Template8) sample — one honoree, no second name.
const DUMMY_PARTY: Wedding = {
  ...DUMMY,
  brideName: 'Maya',
  groomName: '',
  name1: 'Maya',
  name2: null,
  eventType: 'PARTY',
  displayName: 'Maya',
  venue: 'The Grand Pavilion',
  venueAddress: 'Bandar Seri Begawan, Brunei',
};

// CEREMONY (Template9) sample — no individual names, just a title.
const DUMMY_CEREMONY: Wedding = {
  ...DUMMY,
  brideName: '',
  groomName: '',
  name1: null,
  name2: null,
  eventTitle: "Ali's Aqiqah",
  eventType: 'CEREMONY',
  displayName: "Ali's Aqiqah",
  venue: 'Dewan Seri Warisan',
  venueAddress: 'Bandar Seri Begawan, Brunei',
};

// PARTY (Template10) sample — the welcome hero reads both eventTitle (the big headline) and
// name1/name2 (the line beneath), matching the delivered "Zara's Sunny Safari" reference art.
const DUMMY_SUNNY_SAFARI: Wedding = {
  ...DUMMY,
  brideName: 'Zara',
  groomName: '',
  name1: 'James',
  name2: 'Zara',
  eventTitle: "Zara's Sunny Safari",
  eventType: 'PARTY',
  displayName: "Zara's Sunny Safari",
  venue: 'The Treehouse Garden, Nairobi',
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
  const partyProps = { ...props, wedding: DUMMY_PARTY };
  const ceremonyProps = { ...props, wedding: DUMMY_CEREMONY };
  const sunnySafariProps = { ...props, wedding: DUMMY_SUNNY_SAFARI };

  return (
    <div
      ref={rootRef}
      style={{ width: 390, height: 700, overflow: 'hidden', position: 'relative', margin: 0, padding: 0 }}
      {...(ready ? { 'data-preview-ready': 'true' } : {})}
    >
      {code === 'classic-rose'          && <Template1 {...props} />}
      {code === 'golden-elegance'       && <Template2 {...props} />}
      {code === 'garden-romance'        && <Template3 {...props} />}
      {code === 'minimal-noir'          && <Template4 {...props} />}
      {code === 'dreaming-floral-sky'   && <Template5 {...props} />}
      {code === 'fairy-garden'          && <Template6 {...props} />}
      {code === 'roman-garden'          && <Template7 {...props} />}
      {code === 'gilded-arch'           && <Template8 {...partyProps} />}
      {code === 'engraved-certificate'  && <Template9 {...ceremonyProps} />}
      {code === 'sunny-safari'          && <Template10 {...sunnySafariProps} />}
    </div>
  );
}
