'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  eventService,
  guestService,
  wishService,
  photoService,
  eventFeatureService,
  Event,
  Wedding,
  Guest,
  Wish,
  Photo,
} from '@/lib/api';
import { urlSegmentForEventType } from '@/lib/eventTypes';
import Template2 from '@/components/templates/Template2';

export default function Template2Page() {
  const params = useParams();
  const router = useRouter();
  const urlEventType = params.eventType as string;
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBoothEnabled, setPhotoBoothEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Template2 (out of scope for this migration) still expects the legacy `Wedding` shape.
  const wedding: Wedding | null = useMemo(() => {
    if (!event) return null;
    return {
      weddingId: event.eventId,
      coupleName: event.slug,
      brideName: event.name1 ?? '',
      groomName: event.name2 ?? '',
      weddingDate: event.eventDate,
      venue: event.venue,
      venueAddress: event.venueAddress,
      totalGuests: event.totalGuests,
      totalAttending: event.totalAttending,
      daysUntilWedding: event.daysUntilEvent,
      isActive: event.isActive,
      isPublic: event.isPublic,
      totalPhotos: event.totalPhotos,
      enabledFeaturesCount: event.enabledFeaturesCount,
      templateId: event.templateId,
      templateName: event.templateName ?? '',
      maxPax: event.maxPax,
      maxCapacity: event.maxCapacity,
      showCapacityWarning: event.showCapacityWarning,
      isRsvpOpen: event.isRsvpOpen,
      createdByUserId: event.createdByUserId,
      createdByEmail: event.createdByEmail,
      domain: event.domain,
    };
  }, [event]);

  useEffect(() => {
    let redirected = false;
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch wedding
        const eventData = await eventService.getBySlug(slug);

        // Wrong type prefix for a real event -> redirect to the canonical one.
        const correctSegment = urlSegmentForEventType(eventData.eventType);
        if (correctSegment !== urlEventType) {
          redirected = true;
          router.replace(`/${correctSegment}/${slug}/template`);
          return;
        }

        setEvent(eventData);

        // Fetch guests
        const guestsData = await guestService.getByWeddingId(eventData.eventId);
        setGuests(guestsData);

        // Fetch wishes
        const wishesData = await wishService.getByWeddingId(eventData.eventId);
        setWishes(wishesData);

        // Check photo booth
        const photoEnabled = await eventFeatureService.isFeatureEnabled(
          eventData.eventId,
          'PHOTO_BOOTH'
        );
        setPhotoBoothEnabled(photoEnabled);

        if (photoEnabled) {
          const photosData = await photoService.getVisibleByWeddingId(eventData.eventId);
          setPhotos(photosData);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wedding');
      } finally {
        if (!redirected) setLoading(false);
      }
    };

    fetchData();
  }, [urlEventType, slug, router]);

  const handleRSVP = async (data: any) => {
    if (!event) return;

    await guestService.rsvp(event.eventId, {
      guestName: data.guestName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      guestSide:
        data.brideOrGroomSide === 'Bride'
          ? 'PRIMARY'
          : data.brideOrGroomSide === 'Groom'
          ? 'SECONDARY'
          : null,
      numberOfAttendees: data.numberOfAttendees,
      songRequest: data.songRequest,
      isAttending: data.isAttending,
    });

    // Refresh guests
    const updatedGuests = await guestService.getByWeddingId(event.eventId);
    setGuests(updatedGuests);
  };

  const handleSubmitWish = async (data: any) => {
    if (!event) return;

    await wishService.create(event.eventId, {
      guestName: data.guestName,
      message: data.message,
    });

    // Refresh wishes
    const updatedWishes = await wishService.getByWeddingId(event.eventId);
    setWishes(updatedWishes);
  };

  const handleUploadPhoto = async (data: any) => {
    if (!event) return;

    await photoService.upload(
      event.eventId,
      data.guestName,
      data.caption,
      data.file
    );

    // Refresh photos
    const updatedPhotos = await photoService.getVisibleByWeddingId(event.eventId);
    setPhotos(updatedPhotos);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error || 'Wedding not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <Template2
      wedding={wedding}
      onRSVP={handleRSVP}
      onSubmitWish={handleSubmitWish}
      onUploadPhoto={handleUploadPhoto}
      guests={guests}
      wishes={wishes}
      photos={photos}
      photoBoothEnabled={photoBoothEnabled}
    />
  );
}
