import type { Template, Wedding } from '@/lib/api';
import type { StudioSample } from '@/lib/api/templateStudio.service';

export function studioSample(template: Template, sample: StudioSample = {}) {
  const eventType = sample.eventType ?? template.eventTypes?.split(',')[0] ?? 'WEDDING';
  const details = sample.wedding ?? {
    brideName: eventType === 'CEREMONY' ? '' : 'Aisyah', groomName: eventType === 'WEDDING' ? 'Hariz' : '',
    eventTitle: eventType === 'PARTY' ? "Aisyah’s birthday" : eventType === 'CEREMONY' ? 'A family celebration' : '',
    weddingDate: '2027-06-15T10:00', venue: 'Grand Ballroom', venueAddress: 'Bandar Seri Begawan', maxPax: 6,
  };
  const wedding: Wedding = {
    weddingId: 0, coupleName: 'studio-sample', ...details,
    name1: details.brideName, name2: details.groomName, eventTitle: details.eventTitle,
    eventType, displayName: eventType === 'WEDDING' ? `${details.brideName} & ${details.groomName}` : details.eventTitle || details.brideName,
    totalGuests: 0, totalAttending: 0, daysUntilWedding: 180, isActive: true, isPublic: true, isRsvpOpen: true,
    totalPhotos: 0, enabledFeaturesCount: 0, templateId: template.templateId, templateName: template.templateName,
  };
  return {
    wedding, details,
    itinerary: sample.itinerary ?? [
      { itineraryItemId: 1, eventId: 0, label: 'Guest arrival', detail: '10:00 AM', sortOrder: 1 },
      { itineraryItemId: 2, eventId: 0, label: 'Celebration', detail: '11:00 AM', sortOrder: 2 },
    ],
    media: sample.media ?? [],
  };
}
