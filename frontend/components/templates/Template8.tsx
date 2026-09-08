'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fraunces, Work_Sans, Caveat } from 'next/font/google';
import { Wedding, Wish, Photo, SeatingTable, ItineraryItem } from '@/lib/api';
import SeatingStep from './SeatingStep';
import { toHijriString, alignClass, headingStyle, headingAnimationProps, sectionBgStyle, resolveSectionOrder, type SectionCode } from '@/lib/templateUtils';

// ── Template 8 — "Gilded Arch" (PARTY / milestone-birthday banquet) ──────────
// SEA banquet-hall register, not Western kids'-party iconography: one honoree, no "sides".
// Signature elements are hand-coded inline SVG — a scalloped photobooth-style arch behind the
// hero name + a huge gold-gradient age numeral — plus a paper-bunting divider between sections.

// preload: false — T8 is a prototype (see CLAUDE.md), not worth preloading on every visitor who
// happens to land on this page; also keeps it off the invite route's font preload header (see
// lib/fonts/curated.ts's doc comment for the incident that made this the default going forward).
const fraunces = Fraunces({ subsets: ['latin'], weight: ['600', '700', '900'], style: ['normal'], display: 'swap', preload: false });
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', preload: false });
const caveat = Caveat({ subsets: ['latin'], weight: ['500', '600'], display: 'swap', preload: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#FBF3E7',
  ink: '#2B211A',
  terracotta: '#C1613D',
  gold: '#C9A227',
  blush: '#E8B4A0',
  teal: '#2F5D57',
};

// Mirrors the private SHADOW_MAP in lib/templateUtils.ts (headingStyle only wires up
// invite.heading.shadow) — needed here again for the names.honoree.shadow attachment.
const SHADOW_MAP: Record<string, string | undefined> = {
  soft: '0 1px 6px rgba(0,0,0,0.18)',
  strong: '0 2px 12px rgba(0,0,0,0.42)',
  glow: '0 0 18px rgba(255,255,255,0.7)',
  none: undefined,
};

interface Template8Props {
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

// ── Signature element 1: the scalloped arch ─────────────────────────────────
// Server (Node/V8) and client (browser V8) can round Math.sin/Math.cos's last bit differently,
// which turns into a React hydration mismatch the moment the raw float is used as a JSX prop
// (e.g. cy={76.56544582361488} on the server vs cy={76.56544582361485} on the client) — even
// though the *rendered pixels* are identical. Round every trig-derived coordinate to a fixed,
// small precision before it reaches JSX so server and client always stringify identically.
const round2 = (n: number) => Math.round(n * 100) / 100;

// A half-annulus of concentric bands behind the hero. The outer band's rim is a true scalloped
// edge: bumps are semicircles whose radius = half the chord between adjacent points on the base
// circle, which is the standard construction for a smooth, evenly-rhythmed scallop trim.
function scallopArc(cx: number, cy: number, r: number, bumps: number) {
  const step = Math.PI / bumps;
  const pts: [number, number][] = [];
  for (let i = 0; i <= bumps; i++) {
    const angle = Math.PI - i * step; // sweep from the left point (180°), over the top, to the right (0°)
    pts.push([round2(cx + r * Math.cos(angle)), round2(cy - r * Math.sin(angle))]);
  }
  const chord = 2 * r * Math.sin(step / 2);
  const rb = chord / 2;
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} `;
  for (let i = 1; i < pts.length; i++) {
    d += `A ${rb.toFixed(2)} ${rb.toFixed(2)} 0 0 1 ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)} `;
  }
  return { d: `${d.trim()} Z`, points: pts };
}

function halfDisc(cx: number, cy: number, r: number) {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`;
}

function GildedArch() {
  const cx = 280;
  const cy = 300;
  const rim = scallopArc(cx, cy, 258, 15);
  const bands = [
    { r: 258, path: rim.d, fill: C.bg, stroke: C.gold },
    { r: 228, path: halfDisc(cx, cy, 228), fill: C.terracotta },
    { r: 198, path: halfDisc(cx, cy, 198), fill: C.gold },
    { r: 168, path: halfDisc(cx, cy, 168), fill: C.blush },
    { r: 138, path: halfDisc(cx, cy, 138), fill: C.bg },
  ];
  return (
    <svg
      viewBox="0 0 560 320"
      width="100%"
      style={{ display: 'block', maxWidth: 560, margin: '0 auto', overflow: 'visible' }}
      aria-hidden
    >
      {bands.map((b, i) => (
        <path key={i} d={b.path} fill={b.fill} stroke={b.stroke} strokeWidth={b.stroke ? 2 : 0} />
      ))}
      {/* beaded trim along the scallop valleys */}
      {rim.points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.2} fill={C.gold} opacity={0.85} />
      ))}
    </svg>
  );
}

// ── Signature element 2: paper-bunting divider ──────────────────────────────
function BuntingDivider({ className }: { className?: string }) {
  const w = 480;
  const h = 34;
  const sag = h * 0.5;
  const flags = 11;
  const colors = [C.terracotta, C.gold, C.blush];
  const yAt = (t: number) => 4 * (1 - t) ** 2 + 2 * (1 - t) * t * sag + 4 * t ** 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className={className} aria-hidden style={{ display: 'block', opacity: 0.9 }}>
      <path d={`M0,4 Q${w / 2},${sag} ${w},4`} fill="none" stroke={C.gold} strokeWidth={1.25} opacity={0.5} />
      {Array.from({ length: flags }).map((_, i) => {
        const t = (i + 0.5) / flags;
        const x = t * w;
        const y = yAt(t);
        const size = 13;
        return (
          <polygon
            key={i}
            points={`${x - size / 2},${y - 1} ${x + size / 2},${y - 1} ${x},${y + size * 1.2}`}
            fill={colors[i % colors.length]}
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

export default function Template8({
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
}: Template8Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const honoree = wedding.name1 || wedding.brideName || 'Guest of Honor';
  const age = t('party.age', '1');
  const hStyle = headingStyle(customConfig);
  const hAnim = headingAnimationProps(customConfig);
  const sectionOrder = resolveSectionOrder(
    customConfig?.['section.order'],
    !!customConfig?.['walimah.body'],
    itinerary.length > 0,
    photoBoothEnabled,
  );
  const NAV_LABELS: Record<SectionCode, string> = {
    welcome: 'Party', walimah: 'Details', rsvp: 'RSVP', itinerary: 'Programme', wishes: 'Wishes', photobooth: 'Photos',
  };
  const [activeSection, setActiveSection] = useState<SectionCode>('welcome');
  const scrollTo = (code: SectionCode) => {
    setActiveSection(code);
    document.getElementById(code)?.scrollIntoView({ behavior: 'smooth' });
  };

  const weddingDate = new Date(wedding.weddingDate);
  const paxLimit = (wedding?.maxPax ?? 0) > 0 ? Math.min(10, wedding.maxPax!) : 10;
  const showIslamicDate = customConfig?.['general.showIslamicDate'] === 'true';

  // RSVP state — no bride/groom "side" question, this event type has no sides.
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

  const fontVars: React.CSSProperties = {
    ['--t8-display' as any]: fraunces.style.fontFamily,
    ['--t8-body' as any]: workSans.style.fontFamily,
    ['--t8-script' as any]: caveat.style.fontFamily,
  };

  return (
    <div style={{ ...fontVars, background: C.bg, color: C.ink, fontFamily: 'var(--t8-body)', minHeight: '100vh', containerType: 'inline-size' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(251,243,231,0.9)', backdropFilter: 'blur(6px)', borderBottom: `1px solid ${C.gold}33` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
          {sectionOrder.map((code) => (
            <button
              key={code}
              onClick={() => scrollTo(code)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--t8-body)',
                fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                color: activeSection === code ? C.terracotta : C.ink, opacity: activeSection === code ? 1 : 0.6,
                padding: '4px 2px', borderBottom: activeSection === code ? `2px solid ${C.terracotta}` : '2px solid transparent',
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
        style={{
          position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '72px 20px 56px', overflow: 'hidden',
          backgroundImage: `radial-gradient(${C.gold}22 1.5px, transparent 1.5px)`,
          backgroundSize: '26px 26px',
          ...sectionBgStyle(customConfig?.['section.welcome.bg'], API_BASE),
        }}
      >
        <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
          <motion.p
            {...hAnim}
            style={{ fontFamily: 'var(--t8-script)', fontSize: 'clamp(1.6rem, 5cqi, 2.2rem)', color: C.terracotta, marginBottom: 4, ...hStyle }}
            className={alignClass(customConfig?.['invite.heading.align'])}
          >
            {t('invite.heading', "You're invited to celebrate")}
          </motion.p>

          {/* The arch sets the container's height via its own intrinsic aspect ratio (viewBox
              560x320, no explicit height attr); the name+age overlay is positioned as a % of
              that same height so the composition holds at any screen width. */}
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <GildedArch />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '32%' }}>
              <h1
                style={{
                  fontFamily: 'var(--t8-display)', fontWeight: 900, fontSize: 'clamp(1.6rem, 6cqi, 4rem)',
                  margin: 0, letterSpacing: '-0.01em',
                  color: customConfig?.['names.honoree.color'] || C.ink,
                  textShadow: SHADOW_MAP[customConfig?.['names.honoree.shadow'] ?? 'none'],
                }}
              >
                {honoree}
              </h1>
              <div
                aria-label={`Turning ${age}`}
                style={{
                  fontFamily: 'var(--t8-display)', fontWeight: 900, lineHeight: 0.85,
                  fontSize: 'clamp(3.6rem, 17cqi, 9.5rem)', margin: '2% 0 0',
                  backgroundImage: 'linear-gradient(180deg, #F3D57A 0%, #C9A227 48%, #97740f 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                  filter: `drop-shadow(0 6px 14px ${C.terracotta}33)`,
                }}
              >
                {age}
              </div>
            </div>
          </div>
          {/* Spacer so normal document flow clears the absolutely-positioned overlay above. */}
          <div style={{ height: 'clamp(40px, 10cqi, 90px)' }} />

          <p
            className={alignClass(customConfig?.['invite.body.align'])}
            style={{ fontSize: 17, color: C.ink, opacity: 0.85, maxWidth: 440, margin: '14px auto 28px', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: t('invite.body', 'Join us for an evening of food, laughter, and celebration.') }}
          />

          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, background: '#fff', borderRadius: 20, padding: '22px 32px', boxShadow: '0 10px 30px rgba(43,33,26,0.08)', border: `1px solid ${C.gold}33` }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.terracotta, fontWeight: 600 }}>Save the date</p>
            <p style={{ margin: 0, fontSize: 21, fontWeight: 700, fontFamily: 'var(--t8-display)' }}>
              {weddingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p style={{ margin: 0, fontSize: 15, opacity: 0.75 }}>
              {weddingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} &middot; {wedding.venue}
            </p>
            {showIslamicDate && (
              <p style={{ margin: 0, fontSize: 12, color: C.gold, letterSpacing: '0.02em' }}>{toHijriString(weddingDate)}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollTo('rsvp')}
              style={{ background: C.terracotta, color: '#fff', border: 'none', borderRadius: 999, padding: '13px 30px', fontSize: 15, fontWeight: 600, fontFamily: 'var(--t8-body)', cursor: 'pointer', boxShadow: `0 8px 20px ${C.terracotta}44` }}
            >
              RSVP now
            </button>
            <button
              onClick={() => scrollTo('wishes')}
              style={{ background: '#fff', color: C.terracotta, border: `2px solid ${C.terracotta}55`, borderRadius: 999, padding: '11px 28px', fontSize: 15, fontWeight: 600, fontFamily: 'var(--t8-body)', cursor: 'pointer' }}
            >
              Leave a wish
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}><BuntingDivider /></div>

      {/* Party Details (walimah slot) */}
      {sectionOrder.includes('walimah') && (
        <section id="walimah" style={{ padding: '48px 20px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className={alignClass(customConfig?.['walimah.body.align'])}
            style={{ maxWidth: 620, margin: '0 auto', background: '#fff', borderRadius: 24, padding: '36px 32px', border: `1px solid ${C.gold}33`, boxShadow: '0 10px 30px rgba(43,33,26,0.06)' }}
          >
            <h2 style={{ fontFamily: 'var(--t8-display)', fontWeight: 700, fontSize: 28, color: C.terracotta, margin: '0 0 16px' }}>Party Details</h2>
            <div style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: customConfig?.['walimah.body'] ?? '' }} />
          </motion.div>
        </section>
      )}

      {/* Programme (itinerary slot) */}
      {sectionOrder.includes('itinerary') && (
        <section id="itinerary" style={{ padding: '48px 20px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ maxWidth: 560, margin: '0 auto', background: '#fff', borderRadius: 24, padding: '36px 32px', border: `1px solid ${C.gold}33`, boxShadow: '0 10px 30px rgba(43,33,26,0.06)' }}
          >
            <h2 style={{ fontFamily: 'var(--t8-display)', fontWeight: 700, fontSize: 28, color: C.terracotta, margin: '0 0 20px', textAlign: 'center' }}>Programme</h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {itinerary.map((item) => (
                <li key={item.itineraryItemId} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ marginTop: 6, width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{item.label}</p>
                    {item.detail && <p style={{ margin: '2px 0 0', fontSize: 14, opacity: 0.65 }}>{item.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </section>
      )}

      {/* RSVP */}
      <section
        id="rsvp"
        style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '56px 20px', ...sectionBgStyle(customConfig?.['section.ceremony.bg'], API_BASE) }}
      >
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--t8-display)', fontWeight: 800, fontSize: 34, margin: 0 }}>RSVP</h2>
            <p style={{ opacity: 0.7, marginTop: 6 }}>{t('rsvp.subtitle', "Let us know you're coming to the party!")}</p>
          </div>

          <AnimatePresence mode="wait">
            {wedding.isRsvpOpen === false ? (
              <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', border: `1px solid ${C.gold}33` }}>
                <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>RSVPs are closed</p>
                <p style={{ opacity: 0.6, marginTop: 8 }}>Thank you for your interest — we&apos;re no longer accepting responses.</p>
              </motion.div>
            ) : rsvpSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', border: `1px solid ${C.teal}44` }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
                <p style={{ fontWeight: 700, fontSize: 18, margin: 0, color: C.teal }}>RSVP Submitted!</p>
                <p style={{ opacity: 0.6, marginTop: 8 }}>Thank you — see you at the party!</p>
              </motion.div>
            ) : rsvpStep === 2 ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${C.gold}33` }}>
                <SeatingStep
                  tables={tables}
                  numberOfAttendees={rsvpData.numberOfAttendees}
                  selectedTableId={selectedTableId}
                  onSelect={setSelectedTableId}
                  onBack={() => setRsvpStep(1)}
                  onSubmit={submitRSVP}
                  submitting={rsvpSubmitting}
                  accentClass="bg-[#C1613D]"
                  accentBorderClass="border-[#C1613D] bg-[#C1613D]/10"
                />
              </div>
            ) : (
              <motion.form key="form" onSubmit={handleRSVPSubmit} style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${C.gold}33` }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Will you be attending? *</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                  <button type="button" onClick={() => setIsAttending(true)} style={{ flex: 1, borderRadius: 12, padding: '12px', textAlign: 'center', border: `2px solid ${isAttending ? C.terracotta : '#e5ded3'}`, background: isAttending ? `${C.terracotta}14` : 'transparent', cursor: 'pointer', fontWeight: 600 }}>
                    🎉 Yes, count me in!
                  </button>
                  <button type="button" onClick={() => setIsAttending(false)} style={{ flex: 1, borderRadius: 12, padding: '12px', textAlign: 'center', border: `2px solid ${!isAttending ? '#8a8a8a' : '#e5ded3'}`, background: !isAttending ? '#f2f2f2' : 'transparent', cursor: 'pointer', fontWeight: 600 }}>
                    Sorry, can&apos;t make it
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
                    <input placeholder="Song Request 🎵" value={rsvpData.songRequest} onChange={(e) => setRsvpData({ ...rsvpData, songRequest: e.target.value })} style={inputStyle} />
                  </div>
                )}

                <button type="submit" disabled={rsvpSubmitting} style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: rsvpSubmitting ? 'default' : 'pointer', background: rsvpSubmitting ? '#a8a29a' : C.terracotta }}>
                  {rsvpSubmitting ? 'Submitting...' : isAttending && seatingEnabled ? 'Continue →' : 'Submit RSVP'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}><BuntingDivider /></div>

      {/* Wishes */}
      <section id="wishes" style={{ padding: '56px 20px', ...sectionBgStyle(customConfig?.['section.celebration.bg'], API_BASE) }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--t8-display)', fontWeight: 800, fontSize: 34, margin: 0 }}>Wishes</h2>
            <p style={{ opacity: 0.7, marginTop: 6 }}>{t('wish.prompt', 'Leave a birthday message!')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${C.gold}33` }}>
              <h3 style={{ fontFamily: 'var(--t8-display)', fontSize: 20, margin: '0 0 16px' }}>Share Your Wish</h3>
              {wishSuccess && <div style={{ background: `${C.teal}14`, borderRadius: 10, padding: 12, marginBottom: 14, textAlign: 'center', color: C.teal, fontWeight: 600 }}>Wish submitted!</div>}
              <form onSubmit={handleWishSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input required placeholder="Your Name *" value={wishData.guestName} onChange={(e) => setWishData({ ...wishData, guestName: e.target.value })} style={inputStyle} />
                <textarea required rows={4} placeholder="Your wishes... *" value={wishData.message} onChange={(e) => setWishData({ ...wishData, message: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                <button type="submit" disabled={wishSubmitting} style={{ padding: '12px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', background: wishSubmitting ? '#a8a29a' : C.terracotta }}>
                  {wishSubmitting ? 'Submitting...' : 'Submit Wish'}
                </button>
              </form>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${C.gold}33`, maxHeight: 480, overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'var(--t8-display)', fontSize: 20, margin: '0 0 16px' }}>All Wishes ({wishes.length})</h3>
              {wishes.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>No wishes yet. Be the first!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {wishes.map((wish) => (
                    <div key={wish.wishId} style={{ background: `${C.blush}22`, borderLeft: `3px solid ${C.terracotta}`, borderRadius: 10, padding: 14 }}>
                      <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{wish.guestName}</p>
                      <p style={{ fontSize: 14, opacity: 0.8, fontStyle: 'italic', margin: 0 }}>&quot;{wish.message}&quot;</p>
                      <p style={{ fontSize: 11, opacity: 0.4, margin: '6px 0 0' }}>{new Date(wish.createdDate).toLocaleDateString()}</p>
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
        <section id="photobooth" style={{ padding: '56px 20px' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--t8-display)', fontWeight: 800, fontSize: 34, margin: 0 }}>Photo Booth</h2>
              <p style={{ opacity: 0.7, marginTop: 6 }}>Share your favorite moments! 📸</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${C.gold}33`, maxWidth: 560, margin: '0 auto 28px' }}>
              {photoSuccess && <div style={{ background: `${C.teal}14`, borderRadius: 10, padding: 12, marginBottom: 14, textAlign: 'center', color: C.teal, fontWeight: 600 }}>Photo uploaded!</div>}
              <form onSubmit={handlePhotoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="file" accept="image/*" onChange={handleFileSelect} style={inputStyle} />
                {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12 }} />}
                <input required placeholder="Your Name *" value={photoData.guestName} onChange={(e) => setPhotoData({ ...photoData, guestName: e.target.value })} style={inputStyle} />
                <input placeholder="Caption (optional)" value={photoData.caption} onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })} style={inputStyle} />
                <button type="submit" disabled={photoSubmitting || !selectedFile} style={{ padding: '13px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', background: photoSubmitting || !selectedFile ? '#a8a29a' : C.terracotta }}>
                  {photoSubmitting ? 'Uploading...' : 'Upload Photo'}
                </button>
              </form>
            </div>
            {photos.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.5 }}>No photos yet. Be the first to share!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                {photos.map((photo) => (
                  <div key={photo.photoId} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.gold}22` }}>
                    <img src={`${API_BASE}${photo.photoUrl}`} alt={photo.caption} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                    <div style={{ padding: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{photo.guestName}</p>
                      {photo.caption && <p style={{ fontSize: 11, opacity: 0.6, fontStyle: 'italic', margin: '2px 0 0' }}>&quot;{photo.caption}&quot;</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      )}

      <div style={{ maxWidth: 400, margin: '0 auto', padding: '32px 20px 0' }}><BuntingDivider /></div>
      <footer style={{ textAlign: 'center', padding: '20px', fontSize: 12, opacity: 0.5 }}>
        {t('footer.tagline', 'Made with love — see you at the party')}
      </footer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e5ded3',
  fontFamily: 'var(--t8-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff',
};
