import type { Template } from './api';

// Mirrors backend/WeddingInvite.Models/EventTypes.cs — the fixed vocabulary a
// Template.EventTypes CSV can hold.
export const EVENT_TYPES = [
  { key: 'CEREMONY', label: 'Ceremony' },
  { key: 'WEDDING', label: 'Wedding' },
  { key: 'PARTY', label: 'Party' },
] as const;

export type EventTypeKey = (typeof EVENT_TYPES)[number]['key'];

export function parseEventTypes(csv?: string): string[] {
  const kept = (csv ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => EVENT_TYPES.some((e) => e.key === s));
  return kept.length > 0 ? kept : ['WEDDING'];
}

export function matchesEvent(t: Pick<Template, 'eventTypes'>, key: string): boolean {
  return parseEventTypes(t.eventTypes).includes(key);
}

// ── Public URL prefix mapping ───────────────────────────────────────────────
// A WEDDING event's public invite lives at /wedding/[slug], PARTY at /party/[slug],
// CEREMONY at /ceremony/[slug] — one dynamic `[eventType]` route segment
// (frontend/app/[eventType]/[slug]/) serves all three. This is the single canonical
// mapping between the URL's lowercase segment and the uppercase EventType the API uses;
// don't hand-roll another string join/parse of this pairing elsewhere.
export const PUBLIC_EVENT_TYPE_SLUGS: Record<EventTypeKey, string> = {
  WEDDING: 'wedding',
  PARTY: 'party',
  CEREMONY: 'ceremony',
};

// Reverse of PUBLIC_EVENT_TYPE_SLUGS, derived (not hand-duplicated) so the two can't drift.
const SEGMENT_TO_EVENT_TYPE: Record<string, EventTypeKey> = Object.fromEntries(
  (Object.entries(PUBLIC_EVENT_TYPE_SLUGS) as [EventTypeKey, string][]).map(
    ([key, segment]) => [segment, key]
  )
) as Record<string, EventTypeKey>;

// URL segment (lowercase, e.g. "party") -> EventType (uppercase, e.g. "PARTY"), or null if the
// segment isn't one of the 3 known values — the caller should notFound() in that case.
export function eventTypeFromUrlSegment(segment: string): EventTypeKey | null {
  return SEGMENT_TO_EVENT_TYPE[segment] ?? null;
}

// EventType (uppercase, from the API, e.g. an Event/Wedding's `.eventType`) -> the URL segment
// it should be linked with. Falls back to 'wedding' for an unrecognised value so a stale/partial
// object never produces an empty or malformed link.
export function urlSegmentForEventType(eventType: string | null | undefined): string {
  return PUBLIC_EVENT_TYPE_SLUGS[eventType as EventTypeKey] ?? PUBLIC_EVENT_TYPE_SLUGS.WEDDING;
}
