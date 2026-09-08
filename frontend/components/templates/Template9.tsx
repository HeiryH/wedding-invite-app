'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Source_Serif_4 } from 'next/font/google';
import { Wedding, Wish, Photo, SeatingTable, ItineraryItem } from '@/lib/api';
import SeatingStep from './SeatingStep';
import { toHijriString, alignClass, headingStyle, headingAnimationProps, sectionBgStyle, resolveSectionOrder, type SectionCode } from '@/lib/templateUtils';

// ── Template 9 — "Engraved Certificate" (CEREMONY: aqiqah, naming day, etc.) ─────────────────
// Formal, typographic, culture-neutral: no individual honoree, no "sides" — the event title
// carries the whole hero. Signature elements: a circular wax-seal emblem and hairline corner
// flourishes around the title block. Restraint is the design here — thin strokes, generous
// whitespace, one accent colour (gold) with burgundy reserved for the seal's ribbon only.
// Display type reuses the Cormorant Garamond / JetBrains Mono already loaded globally
// (app/layout.tsx: --font-cormorant, --font-jetbrains); Source Serif 4 is added here for body
// legibility, which matters more on this itinerary/programme-forward template.

// preload: false — T9 is a prototype (see CLAUDE.md), not worth preloading on every visitor; also
// keeps it off the invite route's font preload header (see lib/fonts/curated.ts's doc comment).
const sourceSerif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], display: 'swap', preload: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const C = {
  bg: '#F6F1E4',
  ink: '#1C1B19',
  gold: '#B08D3E',
  burgundy: '#5C2A2A',
};

// Mirrors the private SHADOW_MAP in lib/templateUtils.ts.
const SHADOW_MAP: Record<string, string | undefined> = {
  soft: '0 1px 6px rgba(0,0,0,0.18)',
  strong: '0 2px 12px rgba(0,0,0,0.42)',
  glow: '0 0 18px rgba(255,255,255,0.7)',
  none: undefined,
};

interface Template9Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
}

// Server (Node/V8) and client (browser V8) can round Math.sin/Math.cos's last bit differently,
// which turns into a React hydration mismatch the moment the raw float lands in a JSX prop —
// even though the rendered pixels are identical. Round every trig-derived coordinate to a fixed,
// small precision before it reaches JSX so server and client always stringify identically.
const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Signature element 1: circular wax-seal emblem ───────────────────────────
function WaxSeal({ size = 168, year }: { size?: number; year: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.47;
  const rInner = size * 0.37;
  const ticks = 32;
  return (
    <svg width={size} height={size * 1.22} viewBox={`0 0 ${size} ${size * 1.22}`} aria-hidden style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke={C.gold} strokeWidth={1.4} />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke={C.gold} strokeWidth={0.9} />
      {Array.from({ length: ticks }).map((_, i) => {
        const a = (i / ticks) * Math.PI * 2;
        const r1 = rInner + 2;
        const r2 = rInner + 6;
        return (
          <line
            key={i}
            x1={round2(cx + r1 * Math.cos(a))} y1={round2(cy + r1 * Math.sin(a))}
            x2={round2(cx + r2 * Math.cos(a))} y2={round2(cy + r2 * Math.sin(a))}
            stroke={C.gold} strokeWidth={0.75} opacity={0.55}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={rInner - 12} fill="none" stroke={C.gold} strokeWidth={0.6} opacity={0.45} />
      <text x={cx} y={cy + size * 0.05} textAnchor="middle" fontFamily="var(--font-cormorant), serif" fontWeight={600} fontSize={size * 0.15} fill={C.gold} letterSpacing="2">
        {year}
      </text>
      {/* two-tone ribbon, the one place burgundy appears */}
      <g transform={`translate(${cx}, ${cy + rOuter - 3})`}>
        <path d="M-13,0 L13,0 L18,32 L6,23 L0,32 L-6,23 L-18,32 Z" fill={C.burgundy} />
        <path d="M-7,0 L7,0 L9.5,24 L0,18 L-9.5,24 Z" fill={C.gold} opacity={0.55} />
      </g>
    </svg>
  );
}

// ── Signature element 2: hairline corner flourish ───────────────────────────
function CornerFlourish({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden style={{ position: 'absolute', ...style }}>
      <path d="M2,30 L2,10 Q2,2 10,2 L30,2" fill="none" stroke={C.gold} strokeWidth={1} opacity={0.5} />
      <circle cx={2} cy={30} r={1.4} fill={C.gold} opacity={0.6} />
    </svg>
  );
}

function CornerFlourishes() {
  return (
    <>
      <CornerFlourish style={{ top: -8, left: -8, transform: 'rotate(90deg)' }} />
      <CornerFlourish style={{ top: -8, right: -8, transform: 'rotate(180deg)' }} />
      <CornerFlourish style={{ bottom: -8, left: -8 }} />
      <CornerFlourish style={{ bottom: -8, right: -8, transform: 'rotate(-90deg)' }} />
    </>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.32em',
  textTransform: 'uppercase', color: C.gold, fontWeight: 500,
};

export default function Template9({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  seatingEnabled = false,
  tables = [],
  customConfig,
  itinerary = [],
}: Template9Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const title = wedding.eventTitle || wedding.displayName || 'A Celebration';
  const hStyle = headingStyle(customConfig);
  const hAnim = headingAnimationProps(customConfig);
  const sectionOrder = resolveSectionOrder(
    customConfig?.['section.order'],
    !!customConfig?.['walimah.body'],
    itinerary.length > 0,
    photoBoothEnabled,
  );
  const NAV_LABELS: Record<SectionCode, string> = {
    welcome: 'Invitation', walimah: 'Details', rsvp: 'RSVP', itinerary: 'Programme', wishes: 'Wishes', photobooth: 'Photos',
  };
  const [activeSection, setActiveSection] = useState<SectionCode>('welcome');
  const scrollTo = (code: SectionCode) => {
    setActiveSection(code);
    document.getElementById(code)?.scrollIntoView({ behavior: 'smooth' });
  };

  const eventDate = new Date(wedding.weddingDate);
  const paxLimit = (wedding?.maxPax ?? 0) > 0 ? Math.min(10, wedding.maxPax!) : 10;
  const showIslamicDate = customConfig?.['general.showIslamicDate'] === 'true';

  const [rsvpStep, setRsvpStep] = useState<1 | 2>(1);
  const [isAttending, setIsAttending] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [rsvpData, setRsvpData] = useState({ guestName: '', email: '', phoneNumber: '', numberOfAttendees: 1, songRequest: '' });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const [wishData, setWishData] = useState({ guestName: '', message: '' });
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  const [photoData, setPhotoData] = useState({ guestName: '', caption: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const submitRSVP = async () => {
    setRsvpSubmitting(true);
    try {
      await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId, brideOrGroomSide: null });
      setRsvpSuccess(true);
      setRsvpStep(1);
      setSelectedTableId(null);
      setRsvpData({ guestName: '', email: '', phoneNumber: '', numberOfAttendees: 1, songRequest: '' });
      setTimeout(() => { setRsvpSuccess(false); scrollTo('wishes'); }, 2000);
    } catch { alert('Failed to submit RSVP'); }
    finally { setRsvpSubmitting(false); }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending && seatingEnabled && rsvpStep === 1) { setRsvpStep(2); return; }
    await submitRSVP();
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishSubmitting(true);
    try {
      await onSubmitWish(wishData);
      setWishSuccess(true);
      setWishData({ guestName: '', message: '' });
      setTimeout(() => setWishSuccess(false), 3000);
    } catch { alert('Failed to submit wish'); }
    finally { setWishSubmitting(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !onUploadPhoto) return;
    setPhotoSubmitting(true);
    try {
      await onUploadPhoto({ ...photoData, file: selectedFile });
      setPhotoSuccess(true);
      setPhotoData({ guestName: '', caption: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setPhotoSuccess(false), 3000);
    } catch { alert('Failed to upload photo'); }
    finally { setPhotoSubmitting(false); }
  };

  const bodyFont: React.CSSProperties = { ['--t9-body' as any]: sourceSerif.style.fontFamily };

  return (
    <div style={{ ...bodyFont, background: C.bg, color: C.ink, fontFamily: 'var(--t9-body)', minHeight: '100vh', containerType: 'inline-size' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: `${C.bg}e8`, backdropFilter: 'blur(6px)', borderBottom: `1px solid ${C.gold}40` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 28 }}>
          {sectionOrder.map((code) => (
            <button
              key={code}
              onClick={() => scrollTo(code)}
              style={{
                ...eyebrowStyle, background: 'none', border: 'none', cursor: 'pointer',
                color: activeSection === code ? C.ink : `${C.ink}88`,
                borderBottom: activeSection === code ? `1px solid ${C.gold}` : '1px solid transparent',
                paddingBottom: 3,
              }}
            >
              {NAV_LABELS[code]}
            </button>
          ))}
        </div>
      </nav>

      {/* Welcome / Hero */}
      <section
        id="welcome"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 24px 64px', ...sectionBgStyle(customConfig?.['section.welcome.bg'], API_BASE) }}
      >
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <WaxSeal year={String(eventDate.getFullYear())} />

          <motion.p {...hAnim} style={{ ...eyebrowStyle, marginTop: 28, ...hStyle }} className={alignClass(customConfig?.['invite.heading.align'])}>
            {t('invite.heading', 'You are cordially invited to')}
          </motion.p>

          <div style={{ position: 'relative', display: 'inline-block', marginTop: 14, padding: '18px 34px' }}>
            <CornerFlourishes />
            <h1
              style={{
                fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontStyle: 'normal',
                fontSize: 'clamp(2.1rem, 6.5cqi, 3.6rem)', letterSpacing: '0.035em', margin: 0,
                color: customConfig?.['title.color'] || C.ink,
                textShadow: SHADOW_MAP[customConfig?.['title.shadow'] ?? 'none'],
              }}
            >
              {title}
            </h1>
          </div>

          <p
            className={alignClass(customConfig?.['invite.body.align'])}
            style={{ fontSize: 17, lineHeight: 1.75, opacity: 0.82, maxWidth: 440, margin: '20px auto 0' }}
            dangerouslySetInnerHTML={{ __html: t('invite.body', 'Please join us as we mark this occasion with family and friends.') }}
          />

          <div style={{ width: 46, height: 1, background: C.gold, opacity: 0.6, margin: '30px auto' }} />

          <p style={{ ...eyebrowStyle, marginBottom: 10 }}>Save the Date</p>
          <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 24, fontWeight: 600, margin: 0 }}>
            {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={{ fontSize: 15, opacity: 0.7, margin: '6px 0 0' }}>
            {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} &middot; {wedding.venue}
          </p>
          {showIslamicDate && (
            <p style={{ fontSize: 12.5, opacity: 0.6, margin: '4px 0 0', color: C.gold }}>{toHijriString(eventDate)}</p>
          )}

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('rsvp')} style={{ background: C.ink, color: C.bg, border: 'none', borderRadius: 2, padding: '13px 32px', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace' }}>
              RSVP
            </button>
            <button onClick={() => scrollTo('wishes')} style={{ background: 'transparent', color: C.ink, border: `1px solid ${C.gold}`, borderRadius: 2, padding: '12px 28px', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace' }}>
              Wishes
            </button>
          </div>
        </div>
      </section>

      {/* Ceremony Details */}
      {sectionOrder.includes('walimah') && (
        <section id="walimah" style={{ padding: '56px 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className={alignClass(customConfig?.['walimah.body.align'])}
            style={{ maxWidth: 560, margin: '0 auto', borderTop: `1px solid ${C.gold}55`, borderBottom: `1px solid ${C.gold}55`, padding: '32px 8px' }}
          >
            <p style={{ ...eyebrowStyle, marginBottom: 14, textAlign: 'center' }}>Ceremony Details</p>
            <div style={{ fontSize: 16.5, lineHeight: 1.85, opacity: 0.85, textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: customConfig?.['walimah.body'] ?? '' }} />
          </motion.div>
        </section>
      )}

      {/* Programme — the itinerary-forward section, given real visual weight */}
      {sectionOrder.includes('itinerary') && (
        <section id="itinerary" style={{ padding: '64px 24px' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 520, margin: '0 auto' }}>
            <p style={{ ...eyebrowStyle, textAlign: 'center', marginBottom: 36 }}>Programme</p>
            <div style={{ position: 'relative', paddingLeft: 30 }}>
              <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, background: `linear-gradient(${C.gold}00, ${C.gold}99 15%, ${C.gold}99 85%, ${C.gold}00)` }} />
              {itinerary.map((item, i) => (
                <div key={item.itineraryItemId} style={{ position: 'relative', marginBottom: i === itinerary.length - 1 ? 0 : 30 }}>
                  <span style={{ position: 'absolute', left: -30, top: 2, color: C.gold, fontSize: 11 }}>◆</span>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 17 }}>{item.label}</p>
                  {item.detail && <p style={{ margin: '3px 0 0', fontSize: 14.5, opacity: 0.65 }}>{item.detail}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* RSVP */}
      <section id="rsvp" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', padding: '64px 24px', ...sectionBgStyle(customConfig?.['section.ceremony.bg'], API_BASE) }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 460, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ ...eyebrowStyle, marginBottom: 10 }}>RSVP</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontSize: 30, margin: 0 }}>Kindly Reply</h2>
            <p style={{ opacity: 0.65, marginTop: 8, fontSize: 15 }}>{t('rsvp.subtitle', 'We would be honoured by your presence')}</p>
          </div>

          <AnimatePresence mode="wait">
            {wedding.isRsvpOpen === false ? (
              <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ border: `1px solid ${C.gold}55`, padding: 40, textAlign: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: 17, margin: 0 }}>RSVPs are closed</p>
                <p style={{ opacity: 0.6, marginTop: 8, fontSize: 14 }}>Thank you for your interest — we&apos;re no longer accepting responses.</p>
              </motion.div>
            ) : rsvpSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ border: `1px solid ${C.gold}`, padding: 40, textAlign: 'center' }}>
                <p style={{ ...eyebrowStyle, marginBottom: 8 }}>Confirmed</p>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 22, margin: 0 }}>Thank you for your reply</p>
              </motion.div>
            ) : rsvpStep === 2 ? (
              <div style={{ border: `1px solid ${C.gold}55`, padding: 26 }}>
                <SeatingStep
                  tables={tables}
                  numberOfAttendees={rsvpData.numberOfAttendees}
                  selectedTableId={selectedTableId}
                  onSelect={setSelectedTableId}
                  onBack={() => setRsvpStep(1)}
                  onSubmit={submitRSVP}
                  submitting={rsvpSubmitting}
                  accentClass="bg-[#1C1B19]"
                  accentBorderClass="border-[#B08D3E] bg-[#B08D3E]/10"
                />
              </div>
            ) : (
              <motion.form key="form" onSubmit={handleRSVPSubmit} style={{ border: `1px solid ${C.gold}55`, padding: 26 }}>
                <label style={{ ...eyebrowStyle, display: 'block', marginBottom: 12 }}>Will you attend? *</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button type="button" onClick={() => setIsAttending(true)} style={{ flex: 1, padding: '12px', textAlign: 'center', border: `1px solid ${isAttending ? C.ink : '#d8cfba'}`, background: isAttending ? `${C.ink}0d` : 'transparent', cursor: 'pointer', fontFamily: 'var(--t9-body)' }}>
                    Joyfully accept
                  </button>
                  <button type="button" onClick={() => setIsAttending(false)} style={{ flex: 1, padding: '12px', textAlign: 'center', border: `1px solid ${!isAttending ? '#8a8a8a' : '#d8cfba'}`, background: !isAttending ? '#eee8da' : 'transparent', cursor: 'pointer', fontFamily: 'var(--t9-body)' }}>
                    Regretfully decline
                  </button>
                </div>

                {isAttending && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input required placeholder="Your Name *" value={rsvpData.guestName} onChange={(e) => setRsvpData({ ...rsvpData, guestName: e.target.value })} style={inputStyle} />
                    <input type="email" placeholder="Email" value={rsvpData.email} onChange={(e) => setRsvpData({ ...rsvpData, email: e.target.value })} style={inputStyle} />
                    <input type="tel" placeholder="Phone Number" value={rsvpData.phoneNumber} onChange={(e) => setRsvpData({ ...rsvpData, phoneNumber: e.target.value })} style={inputStyle} />
                    <input
                      type="number" required min={1} max={paxLimit} placeholder="Number of Guests (incl. you) *"
                      value={rsvpData.numberOfAttendees}
                      onChange={(e) => { const raw = parseInt(e.target.value) || 1; setRsvpData({ ...rsvpData, numberOfAttendees: Math.max(1, Math.min(raw, paxLimit)) }); }}
                      style={inputStyle}
                    />
                  </div>
                )}

                <button type="submit" disabled={rsvpSubmitting} style={{ width: '100%', marginTop: 22, padding: '13px', border: 'none', color: C.bg, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains), monospace', cursor: rsvpSubmitting ? 'default' : 'pointer', background: rsvpSubmitting ? '#9a9384' : C.ink }}>
                  {rsvpSubmitting ? 'Submitting…' : isAttending && seatingEnabled ? 'Continue' : 'Submit RSVP'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Wishes — kept quiet, not competing with the hero */}
      <section id="wishes" style={{ padding: '64px 24px', ...sectionBgStyle(customConfig?.['section.celebration.bg'], API_BASE) }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ ...eyebrowStyle, textAlign: 'center', marginBottom: 32 }}>Wishes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div style={{ border: `1px solid ${C.gold}40`, padding: 26 }}>
              <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 19, fontWeight: 600, margin: '0 0 16px' }}>Leave a Message</p>
              {wishSuccess && <div style={{ border: `1px solid ${C.gold}`, padding: 10, marginBottom: 14, textAlign: 'center', fontSize: 13 }}>Message received, thank you.</div>}
              <form onSubmit={handleWishSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input required placeholder="Your Name *" value={wishData.guestName} onChange={(e) => setWishData({ ...wishData, guestName: e.target.value })} style={inputStyle} />
                <textarea required rows={4} placeholder={t('wish.prompt', 'Your message *')} value={wishData.message} onChange={(e) => setWishData({ ...wishData, message: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                <button type="submit" disabled={wishSubmitting} style={{ padding: '12px', border: 'none', color: C.bg, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains), monospace', cursor: 'pointer', background: wishSubmitting ? '#9a9384' : C.ink }}>
                  {wishSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </form>
            </div>
            <div style={{ border: `1px solid ${C.gold}40`, padding: 26, maxHeight: 440, overflowY: 'auto' }}>
              <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 19, fontWeight: 600, margin: '0 0 16px' }}>Messages ({wishes.length})</p>
              {wishes.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: '20px 0', fontSize: 14 }}>No messages yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {wishes.map((wish) => (
                    <div key={wish.wishId} style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 14 }}>
                      <p style={{ fontWeight: 600, margin: '0 0 3px', fontSize: 14.5 }}>{wish.guestName}</p>
                      <p style={{ fontSize: 14, opacity: 0.75, fontStyle: 'italic', margin: 0 }}>&quot;{wish.message}&quot;</p>
                      <p style={{ fontSize: 11, opacity: 0.4, margin: '5px 0 0' }}>{new Date(wish.createdDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Photo Booth */}
      {photoBoothEnabled && sectionOrder.includes('photobooth') && (
        <section id="photobooth" style={{ padding: '64px 24px' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 860, margin: '0 auto' }}>
            <p style={{ ...eyebrowStyle, textAlign: 'center', marginBottom: 32 }}>Photos</p>
            <div style={{ border: `1px solid ${C.gold}40`, padding: 26, maxWidth: 500, margin: '0 auto 28px' }}>
              {photoSuccess && <div style={{ border: `1px solid ${C.gold}`, padding: 10, marginBottom: 14, textAlign: 'center', fontSize: 13 }}>Photo uploaded.</div>}
              <form onSubmit={handlePhotoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="file" accept="image/*" onChange={handleFileSelect} style={inputStyle} />
                {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
                <input required placeholder="Your Name *" value={photoData.guestName} onChange={(e) => setPhotoData({ ...photoData, guestName: e.target.value })} style={inputStyle} />
                <input placeholder="Caption (optional)" value={photoData.caption} onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })} style={inputStyle} />
                <button type="submit" disabled={photoSubmitting || !selectedFile} style={{ padding: '12px', border: 'none', color: C.bg, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains), monospace', cursor: 'pointer', background: photoSubmitting || !selectedFile ? '#9a9384' : C.ink }}>
                  {photoSubmitting ? 'Uploading…' : 'Upload'}
                </button>
              </form>
            </div>
            {photos.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.5, fontSize: 14 }}>No photos yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {photos.map((photo) => (
                  <div key={photo.photoId} style={{ border: `1px solid ${C.gold}30` }}>
                    <img src={`${API_BASE}${photo.photoUrl}`} alt={photo.caption} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    <div style={{ padding: 8 }}>
                      <p style={{ fontSize: 11.5, fontWeight: 600, margin: 0 }}>{photo.guestName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <footer style={{ textAlign: 'center', padding: '28px 20px', borderTop: `1px solid ${C.gold}30`, marginTop: 40 }}>
        <p style={{ ...eyebrowStyle, opacity: 0.6, margin: 0 }}>{t('footer.tagline', 'With gratitude for your presence')}</p>
      </footer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 0, border: '1px solid #d8cfba',
  fontFamily: 'var(--t9-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff',
};
