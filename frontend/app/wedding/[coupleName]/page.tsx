'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  weddingService,
  wishService,
  photoService,
  weddingFeatureService,
  templateConfigService,
  tableService,
  itineraryService,
  Wedding,
  Wish,
  Photo,
  SeatingTable,
  ItineraryItem,
  guestService,
} from '@/lib/api';

export default function WeddingInvitationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const coupleName = params.coupleName as string;
  const previewTemplateId = searchParams.get('preview');

  const [wedding, setWedding] = useState<Wedding | null>(null);
  // ❌ REMOVED: const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coupleMedia, setCoupleMedia] = useState<Photo[]>([]);
  const [customConfig, setCustomConfig] = useState<Record<string, string>>({});
  const [photoBoothEnabled, setPhotoBoothEnabled] = useState(false);
  const [seatingEnabled, setSeatingEnabled] = useState(false);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch wedding
        const weddingData = await weddingService.getByCoupleName(coupleName);
        setWedding(weddingData);

        // Determine which template to use
        const templateIdToLoad = previewTemplateId
          ? parseInt(previewTemplateId)
          : weddingData.templateId;

        setCurrentTemplateId(templateIdToLoad);

        // ❌ REMOVED: Fetch guests
        // const guestsData = await guestService.getByWeddingId(weddingData.weddingId);
        // setGuests(guestsData);

        // Fetch wishes
        const wishesData = await wishService.getByWeddingId(weddingData.weddingId);
        setWishes(wishesData);

        // Check photo booth
        const photoEnabled = await weddingFeatureService.isFeatureEnabled(
          weddingData.weddingId,
          'PHOTO_BOOTH'
        );
        setPhotoBoothEnabled(photoEnabled);

        if (photoEnabled) {
          const photosData = await photoService.getVisibleByWeddingId(
            weddingData.weddingId
          );
          setPhotos(photosData);
        }

        const seatingOn = await weddingFeatureService.isFeatureEnabled(
          weddingData.weddingId,
          'SEATING'
        );
        setSeatingEnabled(seatingOn);
        if (seatingOn) {
          const tablesData = await tableService.getByWeddingId(weddingData.weddingId);
          setTables(tablesData);
        }

        // Fetch couple media (for templates that use portrait/extra images)
        photoService.getCoupleMediaByWeddingId(weddingData.weddingId)
          .then(setCoupleMedia)
          .catch(() => {});

        // Fetch template config (customized text)
        templateConfigService.getByWeddingId(weddingData.weddingId)
          .then(setCustomConfig)
          .catch(() => {});

        // Fetch itinerary (public endpoint)
        itineraryService.getByWeddingId(weddingData.weddingId)
          .then(setItinerary)
          .catch(() => {});
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wedding');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coupleName, previewTemplateId]);

  const handleRSVP = async (data: any) => {
    if (!wedding) return;
    await guestService.create(wedding.weddingId, {
      guestName: data.guestName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      brideOrGroomSide: data.brideOrGroomSide,
      numberOfAttendees: data.numberOfAttendees,
      songRequest: data.songRequest,
      isAttending: data.isAttending,
      tableId: data.tableId ?? null,
    });
    // ❌ REMOVED: Don't refetch all guests after RSVP
    // const updatedGuests = await guestService.getByWeddingId(wedding.weddingId);
    // setGuests(updatedGuests);
  };

  const handleSubmitWish = async (data: any) => {
    if (!wedding) return;
    await wishService.create(wedding.weddingId, {
      guestName: data.guestName,
      message: data.message,
    });
    const updatedWishes = await wishService.getByWeddingId(wedding.weddingId);
    setWishes(updatedWishes);
  };

  const handleUploadPhoto = async (data: any) => {
    if (!wedding) return;
    await photoService.upload(
      wedding.weddingId,
      data.guestName,
      data.caption,
      data.file
    );
    const updatedPhotos = await photoService.getVisibleByWeddingId(wedding.weddingId);
    setPhotos(updatedPhotos);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !wedding || currentTemplateId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error || 'Wedding not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Preview Mode Banner */}
      {previewTemplateId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 text-center font-semibold shadow-lg">
          🔍 PREVIEW MODE - Viewing Template {currentTemplateId} (Not Saved)
        </div>
      )}

      {/* Render Template */}
      <div className={previewTemplateId ? 'pt-12' : ''}>
        <TemplateRenderer
          key={currentTemplateId}
          templateId={currentTemplateId}
          wedding={wedding}
          onRSVP={handleRSVP}
          onSubmitWish={handleSubmitWish}
          onUploadPhoto={handleUploadPhoto}
          wishes={wishes}
          photos={photos}
          photoBoothEnabled={photoBoothEnabled}
          seatingEnabled={seatingEnabled}
          tables={tables}
          coupleMedia={coupleMedia}
          customConfig={customConfig}
          itinerary={itinerary}
        />
      </div>
    </>
  );
}

// Separate component for template rendering
function TemplateRenderer({
  templateId,
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  seatingEnabled,
  tables,
  coupleMedia,
  customConfig,
  itinerary,
}: {
  templateId: number;
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled: boolean;
  tables: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
}) {
  const [TemplateComponent, setTemplateComponent] = useState<any>(null);

  useEffect(() => {
    // Load template dynamically
    const loadTemplate = async () => {
      try {
        const module = await import(`@/components/templates/Template${templateId}`);
        setTemplateComponent(() => module.default);
      } catch (error) {
        console.error(`Failed to load Template${templateId}:`, error);
        // Fallback to Template1
        const fallback = await import(`@/components/templates/Template1`);
        setTemplateComponent(() => fallback.default);
      }
    };

    loadTemplate();
  }, [templateId]);

  if (!TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <TemplateComponent
      wedding={wedding}
      onRSVP={onRSVP}
      onSubmitWish={onSubmitWish}
      onUploadPhoto={onUploadPhoto}
      wishes={wishes}
      photos={photos}
      photoBoothEnabled={photoBoothEnabled}
      seatingEnabled={seatingEnabled}
      tables={tables}
      coupleMedia={coupleMedia}
      customConfig={customConfig}
      itinerary={itinerary}
    />
  );
}