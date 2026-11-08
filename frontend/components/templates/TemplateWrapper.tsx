'use client';

import { Suspense, useMemo } from 'react';
import { TEMPLATE_COMPONENTS } from './templateComponents';
import TemplateLoadBoundary, { TemplateLoading, TemplateReady } from './TemplateLoadBoundary';
import type { TemplateRenderProps } from './templateTypes';
import DataTemplate from './_shared/DataTemplate';
import { useBreakpoint } from './_shared/hooks/useBreakpoint';
import type { StageDef, SlotProps } from './_shared/types';

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
  previewOnly,
  onTemplateReady,
}: TemplateRenderProps & { onTemplateReady?: () => void }) {
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
      coupleMedia,
      previewOnly,
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
      <>
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
        <TemplateReady key={wedding.templateId} onReady={onTemplateReady} />
      </>
    );
  }

  const TemplateComponent = TEMPLATE_COMPONENTS[wedding.templateId as keyof typeof TEMPLATE_COMPONENTS] ?? TEMPLATE_COMPONENTS[1];

  return (
    <TemplateLoadBoundary key={wedding.templateId}>
      <Suspense fallback={<TemplateLoading />}>
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
          previewOnly={previewOnly}
        />
        <TemplateReady onReady={onTemplateReady} />
      </Suspense>
    </TemplateLoadBoundary>
  );
}
