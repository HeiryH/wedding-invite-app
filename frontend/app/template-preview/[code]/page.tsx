'use client';

import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { Wedding } from '@/lib/api/types';
import { templateService, templateConfigService } from '@/lib/api';
import { TEMPLATE_COMPONENTS } from '@/components/templates/templateComponents';
import { templateIdForCode } from '@/components/templates/templateCatalog';
import type { TemplateRenderProps } from '@/components/templates/templateTypes';
import TemplateLoadBoundary, { TemplateLoading, TemplateReady, TemplateUnavailable } from '@/components/templates/TemplateLoadBoundary';
import { waitForPreviewAssets } from '@/components/templates/previewReadiness';

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

const DUMMY_DINO_DOODLE: Wedding = {
  ...DUMMY,
  brideName: 'Elliot',
  groomName: '',
  name1: 'Elliot',
  name2: null,
  eventTitle: 'The Roarsome Birthday',
  eventType: 'PARTY',
  displayName: 'Elliot Turns 7',
  weddingDate: '2027-10-18T15:00:00+08:00',
  venue: 'The Jungle Basecamp',
  venueAddress: 'Bandar Seri Begawan, Brunei',
};

const noOp = () => Promise.resolve();

// Minimal props required by all templates
const BASE_PROPS: TemplateRenderProps = {
  wedding: DUMMY,
  onRSVP: noOp,
  onSubmitWish: noOp,
  wishes: [],
  photos: [],
  photoBoothEnabled: false,
};

const DREAMY_WOODLAND_PROPS = {
  ...BASE_PROPS,
  photoBoothEnabled: true,
  itinerary: [
    { itineraryItemId: 1, eventId: 0, label: 'Guest arrival', detail: '10:30', sortOrder: 0 },
    { itineraryItemId: 2, eventId: 0, label: 'Wedding ceremony', detail: '11:00', sortOrder: 1 },
    { itineraryItemId: 3, eventId: 0, label: 'Celebration lunch', detail: '12:30', sortOrder: 2 },
  ],
};

const DINO_DOODLE_PROPS = {
  ...BASE_PROPS,
  wedding: DUMMY_DINO_DOODLE,
  photoBoothEnabled: true,
  onUploadPhoto: noOp,
  seatingEnabled: true,
  tables: [],
  itinerary: [
    { itineraryItemId: 1, eventId: 0, label: 'Explorer check-in', detail: '2:30 PM', sortOrder: 0 },
    { itineraryItemId: 2, eventId: 0, label: 'Dinosaur discovery', detail: '3:00 PM', sortOrder: 1 },
    { itineraryItemId: 3, eventId: 0, label: 'Basecamp feast', detail: '4:30 PM', sortOrder: 2 },
  ],
};

const PAINTED_PROMISE_PROPS = {
  ...BASE_PROPS,
  photoBoothEnabled: true,
  onUploadPhoto: noOp,
  seatingEnabled: true,
  tables: [],
  itinerary: [
    { itineraryItemId: 1, eventId: 0, label: 'Guest arrival', detail: '10:30', sortOrder: 0 },
    { itineraryItemId: 2, eventId: 0, label: 'Walimatul Urus', detail: '11:00', sortOrder: 1 },
    { itineraryItemId: 3, eventId: 0, label: 'Celebration feast', detail: '12:30', sortOrder: 2 },
  ],
};

export default function TemplatePreviewPage() {
  const { code } = useParams<{ code: string }>();
  // A new route owns new config/readiness state. An old request may not mark a new code ready.
  return <PreviewForCode key={code} code={code} />;
}

function previewPropsForCode(code: string, customConfig: Record<string, string>): TemplateRenderProps {
  const props = { ...BASE_PROPS, customConfig };
  switch (code) {
    case 'gilded-arch': return { ...props, wedding: DUMMY_PARTY };
    case 'engraved-certificate': return { ...props, wedding: DUMMY_CEREMONY };
    case 'sunny-safari': return { ...props, wedding: DUMMY_SUNNY_SAFARI };
    case 'dreamy-woodland': return { ...DREAMY_WOODLAND_PROPS, customConfig };
    case 'dino-doodle-party': return { ...DINO_DOODLE_PROPS, customConfig: {
      'walimah.body': 'Meet the expedition crew, collect your field kit, and prepare for a wild afternoon of discovery.', ...customConfig,
    } };
    case 'painted-promise': return { ...PAINTED_PROMISE_PROPS, customConfig: {
      'walimah.body': 'We request the pleasure of your company as Aisha and Adam begin their life together.', ...customConfig,
    } };
    default: return props;
  }
}

function PreviewForCode({ code }: { code: string }) {
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  // The template's captured "starting design" (empty if none set) — without this, every preview/
  // thumbnail renders the raw shipped code defaults, never a saved design (e.g. T7's stage layout).
  const [customConfig, setCustomConfig] = useState<Record<string, string>>();
  const rootRef = useRef<HTMLDivElement>(null);
  const markMounted = useCallback(() => setMounted(true), []);
  const id = templateIdForCode(code);
  const TemplateComponent = id === undefined ? undefined : TEMPLATE_COMPONENTS[id];

  // Resolve defaults first so the selected template mounts with its effective starting design.
  useEffect(() => {
    if (id === undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const template = await templateService.getByCode(code);
        const config = await templateConfigService.getTemplateDefault(template.templateId);
        if (!cancelled) setCustomConfig(config);
      } catch {
        if (!cancelled) setCustomConfig({}); // no default set (or lookup failed) — fall back to code defaults
      }
    })();
    return () => { cancelled = true; };
  }, [code, id]);

  // Signal readiness (used by the offline generate-previews Playwright script)
  useEffect(() => {
    if (!mounted || !rootRef.current) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    waitForPreviewAssets(rootRef.current, controller.signal).then(() => {
      if (!controller.signal.aborted) timer = setTimeout(() => setReady(true), 1000);
    });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [mounted]);

  return (
    <div
      ref={rootRef}
      style={{
        width: code === 'dreamy-woodland' || code === 'dino-doodle-party' || code === 'painted-promise' ? '100%' : 390,
        height: code === 'dreamy-woodland' || code === 'dino-doodle-party' || code === 'painted-promise' ? 'auto' : 700,
        minHeight: 700,
        overflow: code === 'dreamy-woodland' || code === 'dino-doodle-party' || code === 'painted-promise' ? 'visible' : 'hidden',
        position: 'relative', margin: 0, padding: 0,
      }}
      {...(ready ? { 'data-preview-ready': 'true' } : {})}
    >
      {!TemplateComponent ? <TemplateUnavailable /> : customConfig === undefined ? <TemplateLoading /> : (
        <TemplateLoadBoundary>
          <Suspense fallback={<TemplateLoading />}>
            <TemplateComponent {...previewPropsForCode(code, customConfig)} />
            <TemplateReady onReady={markMounted} />
          </Suspense>
        </TemplateLoadBoundary>
      )}
    </div>
  );
}
