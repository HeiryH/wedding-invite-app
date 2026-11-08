'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  eventService,
  wishService,
  photoService,
  eventFeatureService,
  templateConfigService,
  templateService,
  tableService,
  itineraryService,
  Event,
  Wedding,
  Wish,
  Photo,
  SeatingTable,
  ItineraryItem,
  guestService,
} from '@/lib/api';
import { urlSegmentForEventType } from '@/lib/eventTypes';
import TemplateWrapper from '@/components/templates/TemplateWrapper';
import { TEMPLATE_CAPABILITIES } from '@/components/templates/templateCapabilities';
import type { TemplateRsvpSubmission, TemplateWishSubmission, PhotoUploadSubmission } from '@/components/templates/guestContracts';
import ViewportProbe from '@/components/dev/ViewportProbe';

export default function WeddingInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEventType = params.eventType as string;
  const slug = params.slug as string;
  const previewTemplateId = searchParams.get('preview');
  // Dev-only measurement overlay (docs/FIX_QUEUE.md Issue 2) — never renders without the query
  // param, and ViewportProbe itself has no effect on layout (fixed-position, zero-content probes).
  const probe = searchParams.get('probe') === '1';

  const [event, setEvent] = useState<Event | null>(null);
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
  const [authoredStagesJson, setAuthoredStagesJson] = useState<string | null>(null);

  // The 7 template components (and their shared preview machinery) are out of scope for the
  // Event migration and still expect the legacy `Wedding` shape — adapt at this boundary only.
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
      // Native Event fields, for Template8/9 — see the Wedding interface's comment.
      name1: event.name1,
      name2: event.name2,
      eventTitle: event.eventTitle,
      eventType: event.eventType,
      displayName: event.displayName,
    };
  }, [event]);

  useEffect(() => {
    let redirected = false;
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch event
        const eventData = await eventService.getBySlug(slug);

        // A real event exists, but the URL's type prefix doesn't match it (e.g. a PARTY event
        // hit via /wedding/[slug]) — redirect to the canonical prefix rather than 404 or
        // rendering under the wrong type. Keep the spinner up (skip setLoading(false) below)
        // while the navigation completes.
        const correctSegment = urlSegmentForEventType(eventData.eventType);
        if (correctSegment !== urlEventType) {
          redirected = true;
          router.replace(`/${correctSegment}/${slug}${previewTemplateId ? `?preview=${previewTemplateId}` : ''}`);
          return;
        }

        setEvent(eventData);

        // Determine which template to use
        const templateIdToLoad = previewTemplateId
          ? parseInt(previewTemplateId)
          : eventData.templateId;

        setCurrentTemplateId(templateIdToLoad);
        // Custom authored IDs have no numbered module. Resolve their composition through the
        // existing public template service; unknown IDs retain the wrapper's T1 fallback.
        setAuthoredStagesJson(null);
        if (!TEMPLATE_CAPABILITIES[templateIdToLoad]) {
          const template = await templateService.getById(templateIdToLoad).catch(() => null);
          setAuthoredStagesJson(template?.isAuthored ? template.stagesJson ?? null : null);
        }

        // ❌ REMOVED: Fetch guests
        // const guestsData = await guestService.getByWeddingId(eventData.eventId);
        // setGuests(guestsData);

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
          const photosData = await photoService.getVisibleByWeddingId(
            eventData.eventId
          );
          setPhotos(photosData);
        }

        const seatingOn = await eventFeatureService.isFeatureEnabled(
          eventData.eventId,
          'SEATING'
        );
        setSeatingEnabled(seatingOn);
        if (seatingOn) {
          const tablesData = await tableService.getByWeddingId(eventData.eventId);
          setTables(tablesData);
        }

        // Fetch couple media (for templates that use portrait/extra images)
        photoService.getCoupleMediaByWeddingId(eventData.eventId)
          .then(setCoupleMedia)
          .catch(() => {});

        // Fetch template config (customized text)
        const config = await templateConfigService.getByWeddingId(eventData.eventId).catch(() => ({}));
        setCustomConfig(config);

        // Fetch itinerary (public endpoint)
        itineraryService.getByWeddingId(eventData.eventId)
          .then(setItinerary)
          .catch(() => {});
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wedding');
      } finally {
        if (!redirected) setLoading(false);
      }
    };

    fetchData();
  }, [urlEventType, slug, previewTemplateId, router]);

  const handleRSVP = async (data: TemplateRsvpSubmission) => {
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
      tableId: data.tableId ?? null,
    });
    // ❌ REMOVED: Don't refetch all guests after RSVP
    // const updatedGuests = await guestService.getByWeddingId(event.eventId);
    // setGuests(updatedGuests);
  };

  const handleSubmitWish = async (data: TemplateWishSubmission) => {
    if (!event) return;
    await wishService.create(event.eventId, {
      guestName: data.guestName,
      message: data.message,
    });
    const updatedWishes = await wishService.getByWeddingId(event.eventId);
    setWishes(updatedWishes);
  };

  const handleUploadPhoto = async (data: PhotoUploadSubmission) => {
    if (!event) return;
    await photoService.upload(
      event.eventId,
      data.guestName,
      data.caption,
      data.file
    );
    const updatedPhotos = await photoService.getVisibleByWeddingId(event.eventId);
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

  if (error || !event || !wedding || currentTemplateId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error || 'Wedding not found'}</p>
        </div>
      </div>
    );
  }

  // Gate: private wedding (free tier / self-registered) — only the owner can view
  if (!event.isPublic) {
    const viewer = typeof window !== 'undefined'
      ? (() => { try { return JSON.parse(localStorage.getItem('user') ?? 'null'); } catch { return null; } })()
      : null;
    // A super admin can always view a wedding, even one that isn't public yet —
    // mirrors CanAccessEventAsync on the backend, which already special-cases this role.
    const isOwner = viewer?.weddingId === event.eventId || viewer?.role === 'SUPER_ADMIN';

    if (!isOwner) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', padding: 32 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center', border: '1px solid #e7f5ee' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
              🔒
            </div>
            <h1 style={{ margin: '0 0 10px', fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#1c1815' }}>
              Private Invitation
            </h1>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: '#645a4d', lineHeight: 1.6 }}>
              This invitation is not yet shared publicly. The couple is still setting things up.
            </p>
            <a
              href="/"
              style={{ display: 'inline-block', background: '#059669', color: '#fff', padding: '13px 28px', borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Create your own invitation
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {probe && <ViewportProbe />}
      {/* Preview Mode Banner */}
      {previewTemplateId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 text-center font-semibold shadow-lg">
          🔍 PREVIEW MODE - Viewing Template {currentTemplateId} (Not Saved)
        </div>
      )}

      {/* Private preview banner (owner viewing their own private wedding) */}
      {!event.isPublic && !previewTemplateId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#059669', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>
          <span>🔒 Private preview — only you can see this</span>
          <a href="/organizer-admin" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', fontSize: 12 }}>
            Back to dashboard
          </a>
        </div>
      )}

      {/* Render Template */}
      <div className={previewTemplateId ? 'pt-12' : ''}>
        <TemplateWrapper
          previewOnly={Boolean(previewTemplateId)}
          key={currentTemplateId}
          wedding={{ ...wedding, templateId: currentTemplateId, templateStagesJson: authoredStagesJson }}
          onRSVP={handleRSVP}
          onSubmitWish={handleSubmitWish}
          onUploadPhoto={handleUploadPhoto}
          wishes={wishes}
          photos={photos}
          photoBoothEnabled={photoBoothEnabled}
          seatingEnabled={seatingEnabled && customConfig['seating.mode'] !== 'organizer'}
          tables={tables}
          coupleMedia={coupleMedia}
          customConfig={customConfig}
          itinerary={itinerary}
        />
      </div>
    </>
  );
}
