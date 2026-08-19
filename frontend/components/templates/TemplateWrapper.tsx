'use client';

import { useMemo } from 'react';
import { Wedding, Guest, Wish, Photo, ItineraryItem, SeatingTable } from '@/lib/api';
import Template1 from './Template1';
import Template2 from './Template2';
import Template3 from './Template3';
import Template4 from './Template4';
import Template5 from './Template5';
import Template6 from './Template6';
import Template7 from './Template7';
import Template8 from './Template8';
import Template9 from './Template9';
import DataTemplate from './_shared/DataTemplate';
import { useBreakpoint } from './_shared/hooks/useBreakpoint';
import type { StageDef, SlotProps, EditorHandle } from './_shared/types';

interface TemplateWrapperProps {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  guests?: Guest[];
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  // Template 7 needs these to render its seating step and its Adjust panel. They were never
  // forwarded, which is why the preview iframe showed a seating-less RSVP.
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  editor?: EditorHandle;
}

export default function TemplateWrapper({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  guests,
  wishes,
  photos,
  photoBoothEnabled,
  coupleMedia,
  customConfig,
  itinerary,
  seatingEnabled,
  tables,
  editor,
}: TemplateWrapperProps) {
  // Pinned by the Adjust panel while editing (matches every hand-coded template's own convention).
  const breakpoint = useBreakpoint(editor?.enabled ? editor.breakpoint : undefined);

  // Authored templates (Template.StagesJson, set via the super-admin API — see
  // _shared/DataTemplate.tsx) render through the shared engine directly, bypassing the
  // per-templateId component switch below entirely. `kind:'slot'` layers render real functional
  // blocks (RSVP, countdown, itinerary, wishes, photo booth) via the shared catalog in
  // _shared/slots/ — the same one Template 7 uses.
  const authoredStages = useMemo(() => {
    if (!wedding.templateStagesJson) return null;
    try {
      return JSON.parse(wedding.templateStagesJson) as Record<string, StageDef>;
    } catch {
      return null;
    }
  }, [wedding.templateStagesJson]);

  if (authoredStages) {
    const slotProps: SlotProps = {
      wedding,
      t: (key: string, fallback: string) => customConfig?.[key] || fallback,
      wishes,
      photos,
      tables: tables ?? [],
      itinerary: itinerary ?? [],
      seatingEnabled: Boolean(seatingEnabled),
      photoBoothEnabled,
      onRSVP,
      onSubmitWish,
      onUploadPhoto,
      editing: Boolean(editor?.enabled),
      config: customConfig,
      breakpoint,
      editor,
    };
    return (
      <DataTemplate
        stages={authoredStages}
        stageIds={Object.keys(authoredStages)}
        keyPrefix={`ta${wedding.templateId}`}
        assetRoot=""
        breakpoint={breakpoint}
        customConfig={customConfig}
        slotProps={slotProps}
        editor={editor}
      />
    );
  }

  // Map templateId to component
  const getTemplate = () => {
    switch (wedding.templateId) {
      case 1:
        return Template1;
      case 2:
        return Template2;
      case 3:
        return Template3;
      case 4:
        return Template4;
      case 5:
        return Template5;
      case 6:
        return Template6;
      case 7:
        return Template7;
      case 8:
        return Template8;
      case 9:
        return Template9;
      default:
        return Template1; // Fallback to Template1
    }
  };

  // The seven templates take overlapping but not identical prop sets, so the union isn't
  // directly callable. Each ignores the props it doesn't declare.
  const TemplateComponent = getTemplate() as unknown as React.ComponentType<TemplateWrapperProps>;

  return (
    <TemplateComponent
      wedding={wedding}
      onRSVP={onRSVP}
      onSubmitWish={onSubmitWish}
      onUploadPhoto={onUploadPhoto}
      guests={guests}
      wishes={wishes}
      photos={photos}
      photoBoothEnabled={photoBoothEnabled}
      coupleMedia={coupleMedia}
      customConfig={customConfig}
      itinerary={itinerary}
      seatingEnabled={seatingEnabled}
      tables={tables}
      editor={editor}
    />
  );
}