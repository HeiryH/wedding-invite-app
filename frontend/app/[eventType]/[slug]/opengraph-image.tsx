import { ImageResponse } from 'next/og';

// Dynamic social share card for an invite link (WhatsApp/social preview image).
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Invitation';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

export default async function Image({ params }: { params: Promise<{ eventType: string; slug: string }> }) {
  const { slug } = await params;

  let couple = 'You are invited';
  let detail = '';
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/event/slug/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const w = await res.json();
      if (w.displayName) couple = w.displayName;
      const date = w.eventDate
        ? new Date(w.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      detail = [date, w.venue].filter(Boolean).join('  ·  ');
    }
  } catch {
    // fall through to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f6ede4 0%, #e9d5c4 55%, #d9b9a3 100%)',
          fontFamily: 'serif',
          color: '#4a3427',
          padding: 80,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 8, textTransform: 'uppercase', color: '#9c7a5f' }}>
          You&apos;re Invited
        </div>
        <div style={{ display: 'flex', width: 90, height: 2, background: '#b8967a', margin: '28px 0' }} />
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 600, lineHeight: 1.1, maxWidth: 1000 }}>
          {couple}
        </div>
        {detail ? (
          <div style={{ display: 'flex', marginTop: 30, fontSize: 34, color: '#6f5342' }}>{detail}</div>
        ) : null}
        <div style={{ display: 'flex', position: 'absolute', bottom: 46, fontSize: 22, letterSpacing: 4, color: '#9c7a5f' }}>
          ODDSTUDIO
        </div>
      </div>
    ),
    { ...size }
  );
}
