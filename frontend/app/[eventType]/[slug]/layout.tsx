import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventTypeFromUrlSegment } from '@/lib/eventTypes';

// Server-side base URL for the .NET API (backend:5000 in Docker, localhost in dev).
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

// Per-event social share preview — so invite links pasted into WhatsApp/social
// render the event's display name, date, and venue instead of a blank card.
// (`displayName` is server-computed and already type-aware: "X & Y" for WEDDING,
// "X" for PARTY, the literal event title for CEREMONY — no branching needed here.)
export async function generateMetadata(
  { params }: { params: Promise<{ eventType: string; slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/event/slug/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return {};
    const w = await res.json();

    const name = w.displayName || "You're Invited";
    const date = w.eventDate
      ? new Date(w.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const description = [date, w.venue].filter(Boolean).join(' · ') || 'You are invited!';
    const title = `${name} — Invitation`;

    return {
      title: name,
      description,
      // Private previews (self-serve free tier) should not be indexed.
      robots: w.isPublic === false ? { index: false, follow: false } : undefined,
      openGraph: { type: 'website', title, description, siteName: 'ODDSTUDIO' },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return {};
  }
}

// Gate on the URL's [eventType] segment itself (independent of whether the slug resolves to a
// real event — a bogus segment like /foo/some-slug should 404 regardless). The event/slug-vs-
// type-prefix mismatch check (real event, wrong prefix -> redirect, not 404) happens per-page,
// where the event data is already being fetched.
export default async function EventTypeLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ eventType: string; slug: string }> }
) {
  const { eventType } = await params;
  if (!eventTypeFromUrlSegment(eventType)) notFound();
  return children;
}
