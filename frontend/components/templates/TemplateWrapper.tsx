'use client';

import { Wedding, Guest, Wish, Photo, ItineraryItem } from '@/lib/api';
import Template1 from './Template1';
import Template2 from './Template2';
import Template3 from './Template3';
import Template4 from './Template4';
import Template5 from './Template5';
import Template6 from './Template6';

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
      default:
        return Template1; // Fallback to Template1
    }
  };

  const TemplateComponent = getTemplate();

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
    />
  );
}