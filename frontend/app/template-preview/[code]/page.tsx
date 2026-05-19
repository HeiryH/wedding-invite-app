'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Wedding } from '@/lib/api/types';
import Template1 from '@/components/templates/Template1';
import Template2 from '@/components/templates/Template2';
import Template3 from '@/components/templates/Template3';
import Template4 from '@/components/templates/Template4';
import Template5 from '@/components/templates/Template5';

const DUMMY: Wedding = {
  weddingId: 0,
  coupleName: 'preview',
  brideName: 'Aisha',
  groomName: 'Adam',
  weddingDate: '2025-06-15T11:00:00Z',
  venue: 'Grand Ballroom',
  venueAddress: 'Kuala Lumpur, Malaysia',
  totalGuests: 0,
  totalAttending: 0,
  daysUntilWedding: 365,
  isActive: true,
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

  // Signal to Playwright that the page is ready for screenshotting
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{ width: 390, height: 700, overflow: 'hidden', position: 'relative', margin: 0, padding: 0 }}
      {...(ready ? { 'data-preview-ready': 'true' } : {})}
    >
      {code === 'classic-rose'        && <Template1 {...PROPS} />}
      {code === 'golden-elegance'     && <Template2 {...PROPS} />}
      {code === 'garden-romance'      && <Template3 {...PROPS} />}
      {code === 'minimal-noir'        && <Template4 {...PROPS} />}
      {code === 'dreaming-floral-sky' && <Template5 {...PROPS} />}
    </div>
  );
}
