'use client';

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
  editor?: unknown;
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