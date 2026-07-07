import type { Metadata } from 'next';

// Server-side base URL for the .NET API (backend:5000 in Docker, localhost in dev).
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

// Per-wedding social share preview — so invite links pasted into WhatsApp/social
// render the couple's names, date, and venue instead of a blank card.
export async function generateMetadata(
  { params }: { params: Promise<{ coupleName: string }> }
): Promise<Metadata> {
  const { coupleName } = await params;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/wedding/couple/${encodeURIComponent(coupleName)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return {};
    const w = await res.json();

    const couple =
      w.brideName && w.groomName ? `${w.brideName} & ${w.groomName}` : 'Wedding Invitation';
    const date = w.weddingDate
      ? new Date(w.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const description = [date, w.venue].filter(Boolean).join(' · ') || 'You are invited!';
    const title = `${couple} — Wedding Invitation`;

    return {
      title: couple,
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

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
