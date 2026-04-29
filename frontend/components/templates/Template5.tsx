'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wedding, Wish, Photo, SeatingTable } from '@/lib/api';
import SeatingStep from './SeatingStep';

gsap.registerPlugin(ScrollTrigger);

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

interface Template5Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  guests?: any[];
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
}

// ── RSVP Modal ────────────────────────────────────────────────────────────────

interface RSVPModalProps {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onClose: () => void;
  seatingEnabled: boolean;
  tables: SeatingTable[];
  t: (key: string, fallback: string) => string;
}

function RSVPModal({ wedding, onRSVP, onClose, seatingEnabled, tables, t }: RSVPModalProps) {
  const [rsvpStep, setRsvpStep] = useState<1 | 2>(1);
  const [isAttending, setIsAttending] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [rsvpData, setRsvpData] = useState({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    songRequest: '',
  });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const submitRSVP = async () => {
    setRsvpSubmitting(true);
    try {
      await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId });
      setRsvpSuccess(true);
      setTimeout(() => { setRsvpSuccess(false); onClose(); }, 2000);
    } catch {
      alert('Failed to submit RSVP');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending && seatingEnabled && rsvpStep === 1) { setRsvpStep(2); return; }
    await submitRSVP();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Frosted floral backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/templates/t5/flowerbg.png)', backgroundAttachment: 'fixed' }}
        />
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md" />

        <div className="relative z-10 p-6">
          <div className="w-10 h-1 bg-rose-200 rounded-full mx-auto mb-5 sm:hidden" />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'PlayfairDisplay, serif' }}>
                RSVP
              </h2>
              <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: 'PlayfairDisplay, serif' }}>
                {t('rsvp.subtitle', "We'd love to celebrate with you")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 text-lg transition-colors"
            >
              ×
            </button>
          </div>

          <AnimatePresence mode="wait">
            {rsvpSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="text-5xl mb-4">💌</div>
                <h3 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'PlayfairDisplay, serif' }}>
                  RSVP Received!
                </h3>
                <p className="text-gray-500 mt-1 text-sm">Thank you — see you on the big day.</p>
              </motion.div>
            ) : rsvpStep === 2 ? (
              <SeatingStep
                key="step2"
                tables={tables}
                numberOfAttendees={rsvpData.numberOfAttendees}
                selectedTableId={selectedTableId}
                onSelect={setSelectedTableId}
                onBack={() => setRsvpStep(1)}
                onSubmit={submitRSVP}
                submitting={rsvpSubmitting}
              />
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRSVPSubmit}
                className="space-y-3"
              >
                <div className="flex gap-3">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setIsAttending(val)}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${isAttending === val
                        ? 'border-rose-400 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                      {val ? '✅ Attending' : "😢 Can't make it"}
                    </button>
                  ))}
                </div>

                {isAttending && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <input type="text" placeholder="Your Name *" required
                      value={rsvpData.guestName}
                      onChange={(e) => setRsvpData({ ...rsvpData, guestName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-300 focus:outline-none bg-white/80 text-sm"
                    />
                    <input type="email" placeholder="Email"
                      value={rsvpData.email}
                      onChange={(e) => setRsvpData({ ...rsvpData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-300 focus:outline-none bg-white/80 text-sm"
                    />
                    <input type="tel" placeholder="Phone Number"
                      value={rsvpData.phoneNumber}
                      onChange={(e) => setRsvpData({ ...rsvpData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-300 focus:outline-none bg-white/80 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {(['Bride', 'Groom'] as const).map((side) => (
                        <label key={side} className="cursor-pointer">
                          <input type="radio" name="side" value={side} className="sr-only peer"
                            checked={rsvpData.brideOrGroomSide === side}
                            onChange={() => setRsvpData({ ...rsvpData, brideOrGroomSide: side })}
                          />
                          <div className="rounded-xl border-2 border-gray-200 p-3 text-center text-sm peer-checked:border-rose-400 peer-checked:bg-rose-50 transition-all">
                            <span className="block text-lg mb-0.5">{side === 'Bride' ? '👰' : '🤵'}</span>
                            <span className="font-medium text-gray-700">{side}'s Side</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <input type="number" placeholder="Number of Guests *" required min="1" max="10"
                      value={rsvpData.numberOfAttendees}
                      onChange={(e) => setRsvpData({ ...rsvpData, numberOfAttendees: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-300 focus:outline-none bg-white/80 text-sm"
                    />
                    <input type="text" placeholder="Song Request 🎵"
                      value={rsvpData.songRequest}
                      onChange={(e) => setRsvpData({ ...rsvpData, songRequest: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-300 focus:outline-none bg-white/80 text-sm"
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all mt-2 ${rsvpSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-rose-400 to-pink-400 hover:shadow-lg active:scale-95'
                    }`}
                  style={{ fontFamily: 'PlayfairDisplay, serif' }}
                >
                  {rsvpSubmitting ? 'Submitting...' : isAttending && seatingEnabled ? 'Continue →' : 'Submit RSVP 💌'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Template ─────────────────────────────────────────────────────────────

export default function Template5({
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
}: Template5Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;

  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState<string>('invitation');

  // Wish state
  const [wishData, setWishData] = useState({ guestName: '', message: '' });
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  // Photo state
  const [photoData, setPhotoData] = useState({ guestName: '', caption: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  // Refs
  const envelopeSectionRef = useRef<HTMLDivElement>(null);
  const envelopeWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const invitationRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLDivElement>(null);
  const wishesRef = useRef<HTMLElement>(null);
  const photosRef = useRef<HTMLElement>(null);

  const weddingDate = new Date(wedding.weddingDate);

  // ── Navigation items ──────────────────────────────────────────────────────
  const navItems = [
    { id: 'invitation', label: t('nav.invite', 'Invitation'), ref: invitationRef },
    { id: 'rsvp', label: t('nav.rsvp', 'RSVP'), ref: rsvpRef },
    { id: 'wishes', label: t('nav.wishes', 'Wishes'), ref: wishesRef },
    ...(photoBoothEnabled
      ? [{ id: 'photos', label: t('nav.photos', 'Photos'), ref: photosRef }]
      : []),
  ];

  const scrollToSection = (ref: React.RefObject<HTMLElement | HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Track active nav section via IntersectionObserver ─────────────────────
  useEffect(() => {
    const refs = [
      { id: 'invitation', ref: invitationRef },
      { id: 'rsvp', ref: rsvpRef },
      { id: 'wishes', ref: wishesRef },
      ...(photoBoothEnabled ? [{ id: 'photos', ref: photosRef }] : []),
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matched = refs.find((r) => r.ref.current === entry.target);
            if (matched) setActiveNavSection(matched.id);
          }
        });
      },
      { threshold: 0.4 }
    );

    refs.forEach(({ ref }) => { if (ref.current) observer.observe(ref.current); });
    return () => observer.disconnect();
  }, [photoBoothEnabled]);

  // ── Canvas 2D + GSAP scroll scrub ────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const section = envelopeSectionRef.current;
    const wrapper = envelopeWrapperRef.current;
    if (!video || !canvas || !section || !wrapper) return;

    const draw = () => {
      // readyState < 2 means no decoded frame yet — keep retrying every rAF
      // until the browser has pixel data available (HAVE_CURRENT_DATA or better)
      if (!video.videoWidth || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      if (!ctxRef.current) {
        ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
      }
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const THRESHOLD = 30;
      const FADE = 20;
      for (let i = 0; i < d.length; i += 4) {
        const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        if (lum < THRESHOLD) {
          d[i + 3] = 0;
        } else if (lum < THRESHOLD + FADE) {
          d[i + 3] = Math.round(((lum - THRESHOLD) / FADE) * 255);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const scheduleDraw = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    // Kick off the retry loop immediately on mount — draw() will keep
    // re-queuing itself until readyState >= 2, then paint frame 0.
    // This means the closed envelope is visible as soon as the video
    // decodes its first frame, regardless of scroll position.
    scheduleDraw();

    const onSeeked = () => scheduleDraw();
    video.addEventListener('seeked', onSeeked);

    const setupScrollTrigger = () => {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Compute where "fully open" falls within the scroll range.
      //
      // Scroll range:
      //   start → wrapper CENTER at viewport BOTTOM  ('center bottom')
      //   end   → wrapper TOP    at viewport TOP     ('top top')
      //
      // "Fully open" = wrapper CENTER at viewport CENTER.
      //
      // PIVOT = (vh/2) / (vh - wh/2)
      //       = vh / (2*vh - wh)
      //
      // where vh = viewport height, wh = wrapper rendered height.
      const vh = window.innerHeight;
      const wh = wrapper.offsetHeight || vh * 0.68; // fallback to 68vh if not painted yet
      const PIVOT = Math.min(0.92, vh / (2 * vh - wh));
      const HOLD = 0.04; // hold fully open for ±4% around pivot

      const st = ScrollTrigger.create({
        trigger: wrapper,
        // Animation begins only when envelope center hits viewport bottom —
        // so the envelope is already half-visible before anything moves.
        start: 'center bottom',
        // Animation ends when envelope top reaches viewport top —
        // envelope is fully closed by the time it's about to exit.
        end: 'top top',
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          const lo = PIVOT - HOLD;
          const hi = PIVOT + HOLD;
          const tri =
            p < lo ? p / lo :           // opening phase
            p < hi ? 1 :                // hold at fully open
            (1 - p) / (1 - hi);         // closing phase
          video.currentTime = 0.5 + tri * (video.duration - 0.5);
          setEnvelopeOpen(tri > 0.85);
          scheduleDraw();
        },
        onLeave: () => {
          // Envelope top has scrolled past viewport top — fully closed
          video.currentTime = 0.2;
          setEnvelopeOpen(false);
          scheduleDraw();
        },
        onLeaveBack: () => {
          // Scrolled back so envelope center is below viewport bottom — closed
          video.currentTime = 0.2;
          setEnvelopeOpen(false);
          scheduleDraw();
        },
      });
      return () => st.kill();
    };

    let cleanup: (() => void) | undefined;
    if (video.readyState >= 1) {
      cleanup = setupScrollTrigger();
    } else {
      video.addEventListener('loadedmetadata', () => { cleanup = setupScrollTrigger(); }, { once: true });
    }

    return () => {
      cleanup?.();
      video.removeEventListener('seeked', onSeeked);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  // ── Wish submit ───────────────────────────────────────────────────────────
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

  // ── Photo submit ──────────────────────────────────────────────────────────
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

  return (
    <>
      {/* ── Single shared fixed background ────────────────────────────────── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/templates/t5/flowerbg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* ── Sticky Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-center">
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
            className="mt-3 mx-4 px-2 py-1.5 rounded-2xl flex gap-1"
            style={{
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 24px rgba(180,120,100,0.15)',
            }}
          >
            {navItems.map((item) => {
              const isActive = activeNavSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.ref)}
                  className={`relative px-4 py-2 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 ${isActive
                    ? 'text-rose-800'
                    : 'text-white/80 hover:text-white'
                    }`}
                  style={{ fontFamily: 'PlayfairDisplay, serif', fontWeight: isActive ? 700 : 400 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 rounded-xl bg-white/60"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </nav>

      {/* ── Section 1: Hero / Invitation ──────────────────────────────────── */}
      <section
        ref={invitationRef}
        id="invitation"
        className="relative min-h-screen justify-center px-6 content-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center flex flex-col items-center"
          style={{ gap: 20 }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.25em' }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-white uppercase mb-3 drop-shadow-md"
            style={{ fontFamily: 'PlayfairDisplay, serif' }}
          >
            Invitation
          </motion.p>

          {/* <p
            className="text-white/90 text-sm tracking-widest mb-10 drop-shadow"
            style={{ fontFamily: 'PlayfairDisplay, serif' }}
          >
            {t('invite.heading', 'The Wedding of')}
          </p> */}

          <motion.svg viewBox="0 150 500 100" width={500}>
            <path id="path" d="M 100,250 A 200,200 0 0, 1 400, 250" fill="transparent" />
            <text fill="rgba(255,255,255,0.9)">
              <textPath href="#path" startOffset="50%" textAnchor="middle" style={{
                fontFamily: 'PlayfairDisplay, serif', fontSize: '1.5rem', letterSpacing: '0.3em'
              }}>
                {t('invite.heading', 'The Wedding of')}
              </textPath>
            </text>
          </motion.svg>

          {/* <p
            className="text-white/90 text-sm tracking-widest mb-10 drop-shadow"
            style={{ fontFamily: 'PlayfairDisplay, serif' }}
          >
            The Wedding of
          </p> */}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9 }}
            className="text-white leading-none drop-shadow-xl mb-4"
            style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(3.5rem, 14vw, 7rem)' }}
          >
            {wedding.brideName}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-white/70 text-2xl my-3"
            style={{ fontFamily: 'PlayfairDisplay, serif' }}
          >
            &amp;
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9 }}
            className="text-white leading-none drop-shadow-xl mb-10"
            style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(3rem, 12vw, 6rem)' }}
          >
            {wedding.groomName}
          </motion.h1>

          {/* Date — downward arch, mirror of invite.heading upper arch */}
          <motion.svg
            viewBox="0 0 500 72"
            width={400}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            style={{ overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            {/* sweep=0 → counter-clockwise → arc bows downward */}
            <path id="dateCurve" d="M 80,0 A 250,250 0 0,0 420,0" fill="transparent" />
            <text fill="rgba(255,255,255,0.9)">
              <textPath href="#dateCurve" startOffset="50%" textAnchor="middle"
                style={{ fontFamily: 'PlayfairDisplay, serif', fontSize: '2em', letterSpacing: '0.25em' }}>
                {weddingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </textPath>
            </text>
          </motion.svg>

          {wedding.venue && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="text-white/70 text-sm tracking-widest drop-shadow"
              style={{ fontFamily: 'PlayfairDisplay, serif' }}
            >
              {wedding.venue}
            </motion.p>
          )}

          {/* Invite body text */}
          {customConfig?.['invite.body'] && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-white/80 text-sm mt-6 max-w-xs mx-auto leading-relaxed drop-shadow"
              style={{ fontFamily: 'PlayfairDisplay, serif' }}
              dangerouslySetInnerHTML={{ __html: customConfig['invite.body'] }}
            />
          )}

          {/* Scroll cue */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-white/50 text-lg tracking-widest drop-shadow"
            style={{ fontFamily: 'PlayfairDisplay, serif' }}
          >
            <span>scroll</span>
            <span className="text-base">↓</span>
          </motion.div>

        </motion.div>

      </section>

      {/* ── Date + Location ─────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.9 }}
          className="mt-8 flex flex-col items-center gap-1"
        >
          <p className="text-white drop-shadow-lg leading-tight"
            style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(1.6rem, 6vw, 2.2rem)' }}>
            14th June 2026
          </p>
          <p className="text-white drop-shadow-lg leading-tight"
            style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(1.3rem, 5vw, 1.8rem)' }}>
            Sunday
          </p>
          <p className="text-white drop-shadow-lg leading-tight"
            style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>
            28 Zulhijjah 1447H
          </p>
          <div className="mt-3 flex flex-col items-center gap-0.5 mt-10">
            <p className="text-white font-semibold text-lg tracking-widest drop-shadow"
              style={{ fontFamily: 'PlayfairDisplay, serif' }}>
              Location
            </p>
            <p className="text-white/100 text-lg italic leading-snug drop-shadow text-center max-w-[240px]"
              style={{ fontFamily: 'PlayfairDisplay, serif' }}>
              Level 4, Songket Ballroom,<br />Rizqun International Hotel, Gadong
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Section 2: Envelope / RSVP ────────────────────────────────────── */}
      <div ref={envelopeSectionRef} id="rsvp" className="relative flex items-center justify-center">
        <div ref={rsvpRef as React.RefObject<HTMLDivElement>} className="absolute top-0" />

        {/* Envelope — no sticky, no artificial height, natural scroll */}
        <div ref={envelopeWrapperRef} className="relative flex flex-col items-center">

          {/* Glow ring */}
          <AnimatePresence>
            {envelopeOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{ boxShadow: '0 0 80px 40px rgba(210,160,120,0.35)' }}
              />
            )}
          </AnimatePresence>

          {/* Hidden video — data source for canvas */}
          <video ref={videoRef} className="hidden" muted playsInline preload="auto"
            disablePictureInPicture crossOrigin="anonymous">
            <source src="/templates/t5/envelope_keyed.mp4" type="video/mp4" />
          </video>

          {/* Canvas */}
          <div
            className="relative"
            style={{ cursor: envelopeOpen ? 'pointer' : 'default' }}
            onClick={() => { if (envelopeOpen) setRsvpOpen(true); }}
            role={envelopeOpen ? 'button' : undefined}
            aria-label={envelopeOpen ? 'Open RSVP' : undefined}
          >
            <canvas ref={canvasRef}
              className="w-auto max-w-[65vw] max-h-[68vh] object-contain"
              style={{ display: 'block' }} />
          </div>

          {/* Tap hint */}
          <AnimatePresence>
            {envelopeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.4 }}
                className="mt-3 flex flex-col items-center gap-1 pointer-events-none"
              >
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-white/80 text-xs tracking-[0.3em] uppercase"
                  style={{ fontFamily: 'PlayfairDisplay, serif' }}
                >
                  Tap to RSVP
                </motion.p>
                <motion.span
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-white/60 text-sm"
                >
                  ↑
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Aturcara Majlis ─────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.9 }}
          className="mt-8 flex flex-col items-center gap-2 w-full max-w-[280px]"
        >
          <p className="text-white drop-shadow-lg text-center leading-none mb-1"
            style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(1.8rem, 7vw, 2.4rem)' }}>
            Aturcara Majlis
          </p>
          {[
            { time: '10:30 – 11:15 Pagi', event: 'Menerima Jemputan' },
            { time: '2:55 Petang', event: 'Pihak Lelaki Di Jangka Tiba' },
            { time: '3:00 Petang', event: 'Akad Nikah' },
            { time: '', event: 'Bacaan Doa Selamat' },
            { time: '', event: 'Menikmati Jamuan' },
          ].map((row, i) => (
            <div key={i} className="flex w-full items-start">
              <div className="flex-none w-32 text-right pr-3">
                <span className="text-white/80 drop-shadow"
                  style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(0.8rem, 2.8vw, 1rem)' }}>
                  {row.time}
                </span>
              </div>
              <div className="flex-none w-px self-stretch bg-white/35 mx-1" />
              <div className="flex-1 pl-3">
                <span className="text-white drop-shadow"
                  style={{ fontFamily: 'Armelie, cursive', fontSize: 'clamp(0.8rem, 2.8vw, 1rem)' }}>
                  {row.event}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Section 3: Wishes ─────────────────────────────────────────────── */}
      <section ref={wishesRef} id="wishes" className="relative min-h-screen flex flex-col items-center justify-center px-5 py-20">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h2
              className="text-4xl text-white drop-shadow-lg mb-2"
              style={{ fontFamily: 'PlayfairDisplay, serif', fontWeight: 700 }}
            >
              Wishes &amp; Blessings
            </h2>
            <p className="text-white/80 text-sm" style={{ fontFamily: 'PlayfairDisplay, serif' }}>
              {t('wish.prompt', 'Leave a heartfelt message for the happy couple')}
            </p>
          </div>

          <div
            className="rounded-3xl p-6 mb-5"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 8px 32px rgba(180,120,100,0.12)',
            }}
          >
            {wishSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-center text-sm text-green-700">
                ✅ Your wish was submitted!
              </div>
            )}
            <form onSubmit={handleWishSubmit} className="space-y-3">
              <input
                type="text" placeholder="Your Name *" required
                value={wishData.guestName}
                onChange={(e) => setWishData({ ...wishData, guestName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 focus:border-rose-300 focus:outline-none bg-white/70 text-sm"
              />
              <textarea
                placeholder="Your wishes for the couple..." required rows={4}
                value={wishData.message}
                onChange={(e) => setWishData({ ...wishData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 focus:border-rose-300 focus:outline-none bg-white/70 text-sm resize-none"
              />
              <button
                type="submit" disabled={wishSubmitting}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${wishSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-rose-400 to-pink-400 hover:shadow-lg'
                  }`}
                style={{ fontFamily: 'PlayfairDisplay, serif' }}
              >
                {wishSubmitting ? 'Submitting...' : 'Send Wish ✨'}
              </button>
            </form>
          </div>

          {wishes.length > 0 && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {wishes.map((wish) => (
                <div
                  key={wish.wishId}
                  className="rounded-2xl p-4 border-l-4 border-rose-300"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <p className="font-semibold text-gray-800 text-sm mb-1" style={{ fontFamily: 'PlayfairDisplay, serif' }}>
                    {wish.guestName}
                  </p>
                  <p className="text-gray-600 text-sm italic">"{wish.message}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Photos ─────────────────────────────────────────────── */}
      {photoBoothEnabled && (
        <section ref={photosRef} id="photos" className="relative min-h-screen flex flex-col items-center justify-center px-5 py-20">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h2
                className="text-4xl text-white drop-shadow-lg mb-2"
                style={{ fontFamily: 'PlayfairDisplay, serif', fontWeight: 700 }}
              >
                Photo Booth
              </h2>
              <p className="text-white/80 text-sm" style={{ fontFamily: 'PlayfairDisplay, serif' }}>
                Share your favourite moments 📸
              </p>
            </div>

            <div
              className="rounded-3xl p-6 mb-5"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(180,120,100,0.12)',
              }}
            >
              {photoSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-center text-sm text-green-700">
                  ✅ Photo uploaded!
                </div>
              )}
              <form onSubmit={handlePhotoSubmit} className="space-y-3">
                <label className="block w-full border-2 border-dashed border-rose-200 rounded-xl p-4 text-center cursor-pointer hover:border-rose-400 transition-colors bg-white/60">
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  ) : (
                    <div className="py-4 text-gray-400 text-sm">
                      <div className="text-3xl mb-2">📷</div>
                      Tap to select a photo
                    </div>
                  )}
                </label>
                <input type="text" placeholder="Your Name *" required
                  value={photoData.guestName}
                  onChange={(e) => setPhotoData({ ...photoData, guestName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 focus:border-rose-300 focus:outline-none bg-white/70 text-sm"
                />
                <input type="text" placeholder="Caption (optional)"
                  value={photoData.caption}
                  onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 focus:border-rose-300 focus:outline-none bg-white/70 text-sm"
                />
                <button
                  type="submit" disabled={photoSubmitting || !selectedFile}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${photoSubmitting || !selectedFile ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-rose-400 to-pink-400 hover:shadow-lg'
                    }`}
                  style={{ fontFamily: 'PlayfairDisplay, serif' }}
                >
                  {photoSubmitting ? 'Uploading...' : 'Upload Photo 📤'}
                </button>
              </form>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.photoId}
                    className="rounded-2xl overflow-hidden shadow-md"
                    style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}
                  >
                    <img src={`${API_BASE}${photo.photoUrl}`} alt={photo.caption} className="w-full h-40 object-cover" />
                    {(photo.guestName || photo.caption) && (
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-700">{photo.guestName}</p>
                        {photo.caption && <p className="text-xs text-gray-500 italic">"{photo.caption}"</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="relative text-center py-10 text-white/60 text-xs tracking-widest"
        style={{ fontFamily: 'PlayfairDisplay, serif' }}
      >
        <p>{t('footer.tagline', 'Made with love for our special day')}</p>
      </footer>

      {/* ── RSVP Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {rsvpOpen && (
          <RSVPModal
            wedding={wedding}
            onRSVP={onRSVP}
            onClose={() => setRsvpOpen(false)}
            seatingEnabled={seatingEnabled}
            tables={tables}
            t={t}
          />
        )}
      </AnimatePresence>
    </>
  );
}
