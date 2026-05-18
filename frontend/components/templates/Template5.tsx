'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wedding, Wish, Photo, SeatingTable, ItineraryItem } from '@/lib/api';
import SeatingStep from './SeatingStep';
import styles from './Template5.module.css';

gsap.registerPlugin(ScrollTrigger);

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

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
  itinerary?: ItineraryItem[];
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

function RSVPModal({ onRSVP, onClose, seatingEnabled, tables, t }: RSVPModalProps) {
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
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <div className={styles.modalBackdrop} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        onClick={(e) => e.stopPropagation()}
        className={styles.modalSheet}
      >
        <div className={styles.modalFloral} />
        <div className={styles.modalFrost} />

        <div className={styles.modalContent}>
          <div className={styles.dragHandle} />

          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>RSVP</h2>
              <p className={styles.modalSubtitle}>
                {t('rsvp.subtitle', "We'd love to celebrate with you")}
              </p>
            </div>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>

          <AnimatePresence mode="wait">
            {rsvpSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.rsvpSuccess}
              >
                <div className={styles.rsvpSuccessEmoji}>💌</div>
                <h3 className={styles.rsvpSuccessTitle}>RSVP Received!</h3>
                <p className={styles.rsvpSuccessBody}>Thank you — see you on the big day.</p>
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
                className={styles.rsvpFormStack}
              >
                <div className={styles.attendanceBtns}>
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setIsAttending(val)}
                      className={`${styles.attendanceBtn} ${isAttending === val ? styles.attendanceBtnActive : ''}`}
                    >
                      {val ? '✅ Attending' : "😢 Can't make it"}
                    </button>
                  ))}
                </div>

                <input type="text" placeholder="Your Name *" required
                  value={rsvpData.guestName}
                  onChange={(e) => setRsvpData({ ...rsvpData, guestName: e.target.value })}
                  className={styles.rsvpFormInput}
                />

                {isAttending && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={styles.rsvpFormStack}
                  >
                    <input type="email" placeholder="Email"
                      value={rsvpData.email}
                      onChange={(e) => setRsvpData({ ...rsvpData, email: e.target.value })}
                      className={styles.rsvpFormInput}
                    />
                    <input type="tel" placeholder="Phone Number"
                      value={rsvpData.phoneNumber}
                      onChange={(e) => setRsvpData({ ...rsvpData, phoneNumber: e.target.value })}
                      className={styles.rsvpFormInput}
                    />
                    <div className={styles.sideGrid}>
                      {(['Bride', 'Groom'] as const).map((side) => (
                        <label key={side} className={styles.sideLabel}>
                          <input
                            type="radio"
                            name="side"
                            value={side}
                            className={styles.srOnly}
                            checked={rsvpData.brideOrGroomSide === side}
                            onChange={() => setRsvpData({ ...rsvpData, brideOrGroomSide: side })}
                          />
                          <div className={`${styles.sideLabelInner} ${rsvpData.brideOrGroomSide === side ? styles.checked : ''}`}>
                            <span className={styles.sideIcon}>{side === 'Bride' ? '👰' : '🤵'}</span>
                            <span className={styles.sideText}>{side}'s Side</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <input type="number" placeholder="Number of Guests *" required min="1" max="10"
                      value={rsvpData.numberOfAttendees}
                      onChange={(e) => setRsvpData({ ...rsvpData, numberOfAttendees: parseInt(e.target.value) })}
                      className={styles.rsvpFormInput}
                    />
                    <input type="text" placeholder="Song Request 🎵"
                      value={rsvpData.songRequest}
                      onChange={(e) => setRsvpData({ ...rsvpData, songRequest: e.target.value })}
                      className={styles.rsvpFormInput}
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className={rsvpSubmitting ? styles.rsvpSubmitBtnDisabled : styles.rsvpSubmitBtn}
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
  itinerary = [],
}: Template5Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;

  const formatOrdinalDate = (date: Date): string => {
    const d = date.getDate();
    const suffix = d % 100 >= 11 && d % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][d % 10] ?? 'th');
    return `${d}${suffix} ${date.toLocaleDateString('en-GB', { month: 'long' })} ${date.getFullYear()}`;
  };

  const toHijriMalay = (date: Date): string => {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'numeric', year: 'numeric',
    }).formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value ?? '';
    const month = parseInt(parts.find(p => p.type === 'month')?.value ?? '1', 10);
    const year = parts.find(p => p.type === 'year')?.value ?? '';
    const months = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jamadil Awal', 'Jamadil Akhir', 'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'];
    return `${day} ${months[month - 1] ?? ''} ${year}H`;
  };

  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState<string>('welcome');

  const [wishData, setWishData] = useState({ guestName: '', message: '' });
  const [wishSide, setWishSide] = useState<'Bride' | 'Groom'>('Bride');
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);
  const [wishExpanded, setWishExpanded] = useState(false);
  const [displayedWishes, setDisplayedWishes] = useState(10);
  const [photoExpanded, setPhotoExpanded] = useState(false);

  const [photoData, setPhotoData] = useState({ guestName: '', caption: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [photoLayout, setPhotoLayout] = useState<'stack' | 'grid'>('stack');
  const [stackIndex, setStackIndex] = useState(0);
  const [stackDirection, setStackDirection] = useState(1);
  const autoShuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userInteractingRef = useRef(false);
  const interactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const envelopeSectionRef = useRef<HTMLDivElement>(null);
  const envelopeWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const welcomeRef = useRef<HTMLElement>(null);
  const ceremonyRef = useRef<HTMLElement>(null);
  const wishesRef = useRef<HTMLElement>(null);
  const photosRef = useRef<HTMLElement>(null);

  const weddingDate = new Date(wedding.weddingDate);

const NAV_EMOJIS: Record<string, string> = {
    welcome: '💍',
    ceremony: '🗓️',
    rsvp: '✉️',
    wishes: '✨',
    photos: '📸',
  };

  const navItems = [
    { id: 'welcome', label: t('nav.welcome', 'Welcome'), ref: welcomeRef },
    { id: 'ceremony', label: t('nav.ceremony', 'Ceremony'), ref: ceremonyRef },
    { id: 'rsvp', label: t('nav.rsvp', 'RSVP'), ref: envelopeSectionRef },
    { id: 'wishes', label: t('nav.wishes', 'Wishes'), ref: wishesRef },
    ...(photoBoothEnabled
      ? [{ id: 'photos', label: t('nav.photos', 'Photos'), ref: photosRef }]
      : []),
  ];

  const scrollToSection = (ref: React.RefObject<HTMLElement | HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const refs = [
      { id: 'welcome', ref: welcomeRef },
      { id: 'ceremony', ref: ceremonyRef },
      { id: 'rsvp', ref: envelopeSectionRef },
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
      // readyState < 2 means no decoded frame yet — keep retrying until HAVE_CURRENT_DATA
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

    scheduleDraw();

    const onSeeked = () => scheduleDraw();
    video.addEventListener('seeked', onSeeked);

    const setupScrollTrigger = () => {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Fixed viewport-percentage triggers so the open phase always lands at
      // the viewport center regardless of section height or canvas size.
      // start: envelope center at 85% from top (just entering from below)
      // end:   envelope center at 15% from top (almost past the top)
      // → PIVOT = 0.5 (exactly mid-range = viewport center)
      const HOLD = 0.04;
      const lo = 0.5 - HOLD;
      const hi = 0.5 + HOLD;

      const st = ScrollTrigger.create({
        trigger: wrapper,
        start: 'center 85%',
        end: 'center 15%',
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          const tri =
            p < lo ? p / lo :
              p < hi ? 1 :
                (1 - p) / (1 - hi);
          video.currentTime = 0.5 + tri * (video.duration - 0.5);
          setEnvelopeOpen(tri > 0.85);
          scheduleDraw();
        },
        onLeave: () => {
          video.currentTime = 0.2;
          setEnvelopeOpen(false);
          scheduleDraw();
        },
        onLeaveBack: () => {
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

  useEffect(() => {
    if (photoLayout !== 'stack' || photos.length <= 1) return;
    const id = setInterval(() => {
      if (!userInteractingRef.current) {
        setStackDirection(1);
        setStackIndex(i => (i + 1) % photos.length);
      }
    }, 350000000);
    autoShuffleRef.current = id;
    return () => { clearInterval(id); autoShuffleRef.current = null; };
  }, [photoLayout, photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const markInteraction = () => {
    userInteractingRef.current = true;
    if (interactTimerRef.current) clearTimeout(interactTimerRef.current);
    interactTimerRef.current = setTimeout(() => { userInteractingRef.current = false; }, 6000);
  };

  const goNext = () => {
    markInteraction();
    setStackDirection(1);
    setStackIndex(i => (i + 1) % photos.length);
  };

  const goPrev = () => {
    markInteraction();
    setStackDirection(-1);
    setStackIndex(i => (i - 1 + photos.length) % photos.length);
  };

  const stackVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 260 : -260, rotate: dir > 0 ? 10 : -10, opacity: 0, scale: 0.85 }),
    center: { x: 0, rotate: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -260 : 260, rotate: dir > 0 ? -10 : 10, opacity: 0, scale: 0.85 }),
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishSubmitting(true);
    try {
      await onSubmitWish({ ...wishData, brideOrGroomSide: wishSide });
      setWishSuccess(true);
      setWishData({ guestName: '', message: '' });
      setWishExpanded(false);
      setTimeout(() => setWishSuccess(false), 3000);
    } catch { alert('Failed to submit wish'); }
    finally { setWishSubmitting(false); }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
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
      setPhotoExpanded(false);
      setTimeout(() => setPhotoSuccess(false), 3000);
    } catch { alert('Failed to upload photo'); }
    finally { setPhotoSubmitting(false); }
  };

  return (
    <>
      {/* ── Fixed background ─────────────────────────────────────────── */}
      <div className={styles.background} />

      {/* ── Side Navigation ──────────────────────────────────────────── */}
      <nav className={styles.sideNav}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          className={styles.sideNavList}
        >
          {navItems.map((item) => {
            const isActive = activeNavSection === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.ref)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.9 }}
                className={`${styles.sideNavBtn} ${isActive ? styles.sideNavBtnActive : ''}`}
              >
                <span className={styles.sideNavEmoji}>{NAV_EMOJIS[item.id] ?? '•'}</span>
                <span className={styles.sideNavTooltip}>{item.label}</span>
                {item.id === 'wishes' && wishes.length > 0 && (
                  <span className={styles.sideNavBadge} />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </nav>

      {/* ── Section 1: Welcome ───────────────────────────────────────── */}
      <section ref={welcomeRef} id="welcome" className={styles.sectionWelcome}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={styles.invitationContent}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.25em' }}
            transition={{ delay: 0.3, duration: 1 }}
            className={styles.inviteLabel}
          >
            You're invited
          </motion.p>

          {/* <motion.svg viewBox="0 150 500 100" width={500}>
            <path id="path" d="M 100,250 A 200,200 0 0, 1 400, 250" fill="transparent" />
            <text fill="rgba(255,255,255,0.9)">
              <textPath href="#path" startOffset="50%" textAnchor="middle"
                style={{ fontFamily: 'PlayfairDisplay, serif', fontSize: '1.5rem', letterSpacing: '0.3em' }}>
                {t('invite.heading', 'The Wedding of')}
              </textPath>
            </text>
          </motion.svg> */}

          <motion.svg viewBox="0 150 500 100" width="100%" style={{ maxWidth: 500 }}>
            <defs>
              {/* 1. Define the shadow filter */}
              <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
                {/* Blur the alpha channel */}
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                {/* Shift the shadow down and right */}
                <feOffset dx="2" dy="2" result="offsetblur" />
                {/* Change shadow color and opacity */}
                <feFlood flood-color="#000000" flood-opacity="0.8" />
                <feComposite in2="offsetblur" operator="in" />
                {/* Merge shadow with original text */}
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path id="path" d="M 100,250 A 200,200 0 0, 1 400, 250" fill="transparent" />

            {/* 2. Apply filter attribute to text */}
            <text
              fill="rgba(255,255,255,0.9)"
              filter="url(#text-shadow)"
              style={{ fontFamily: 'PlayfairDisplay, serif', fontSize: '1.75rem', letterSpacing: '0.3em' }}
            >
              <textPath href="#path" startOffset="50%" textAnchor="middle">
                {t('invite.heading', 'The Wedding of')}
              </textPath>
            </text>
          </motion.svg>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9 }}
            className={styles.coupleName}
          >
            {wedding.brideName}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={styles.ampersand}
          >
            &amp;
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9 }}
            className={styles.coupleNameGroom}
          >
            {wedding.groomName}
          </motion.h1>

          {/* Date — downward arch */}
          {/* <motion.svg
            viewBox="0 0 500 72"
            width={400}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            style={{ overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            <path id="dateCurve" d="M 80,0 A 250,250 0 0,0 420,0" fill="transparent" />
            <text fill="rgba(255,255,255,0.9)">
              <textPath href="#dateCurve" startOffset="50%" textAnchor="middle"
                style={{ fontFamily: 'PlayfairDisplay, serif', fontSize: '2em', letterSpacing: '0.25em' }}>
                {weddingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </textPath>
            </text>
          </motion.svg> */}

          <motion.svg
            viewBox="0 0 500 72"
            width="100%"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            style={{ maxWidth: 400, overflow: 'visible' }}
          >
            <defs>
              {/* Define the shadow filter */}
              <filter id="date-text-shadow" x="-20%" y="-20%" width="140%" height="140%">
                {/* Softness of the shadow */}
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />

                {/* 1. ADJUST ANGLE & DISTANCE HERE */}
                <feOffset dx="2" dy="3" result="offsetblur" />

                {/* 2. ADJUST DARKNESS HERE (e.g., 0.85 for darker) */}
                <feFlood flood-color="#000000" flood-opacity="0.85" />

                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path id="dateCurve" d="M 80,0 A 250,250 0 0,0 420,0" fill="transparent" />

            <text
              fill="rgba(255,255,255,0.9)"
              filter="url(#date-text-shadow)" // 👈 Applies the defined shadow filter
              style={{ fontFamily: 'PlayfairDisplay, serif', fontSize: '1.75em', letterSpacing: '0.25em' }}
            >
              <textPath href="#dateCurve" startOffset="50%" textAnchor="middle">
                {weddingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </textPath>
            </text>
          </motion.svg>


          {/* {wedding.venue && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className={styles.inviteVenue}
            >
              {wedding.venue}
            </motion.p>
          )} */}

          {/* {customConfig?.['invite.body'] && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className={styles.inviteBody}
              dangerouslySetInnerHTML={{ __html: customConfig['invite.body'] }}
            />
          )} */}

          <div className={styles.scrollCue}>
            <span>scroll</span>
            <span className={styles.scrollCueArrow}>↓</span>
          </div>
        </motion.div>
      </section>

      {/* ── Section 2: Ceremony ──────────────────────────────────────── */}
      <section ref={ceremonyRef} id="ceremony" className={styles.sectionCeremony}>
        <p className={styles.ceremonyTitle}>Walimatul Urus</p>

        {/* Glassmorphism card: walimah body + date + location */}
        <div className={styles.ceremonyCard}>
          {customConfig?.['walimah.body'] && (
            <div
              className={styles.walimahBody}
              dangerouslySetInnerHTML={{ __html: customConfig['walimah.body'] }}
            />
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.9 }}
            className={styles.dateInner}
          >
            <div className={styles.dateBlock}>
              <p className={styles.dateText}>{formatOrdinalDate(weddingDate)}</p>
              <p className={styles.dayText}>{weddingDate.toLocaleDateString('en-GB', { weekday: 'long' })}</p>
              {t('general.showIslamicDate', 'false') === 'true' && (
                <p className={styles.hijriText}>{toHijriMalay(weddingDate)}</p>
              )}
            </div>
            <div className={styles.locationBlock}>
              <p className={styles.locationLabel}>Location</p>
              {wedding.venueAddress && (
                <p className={styles.locationAddress}>{wedding.venueAddress}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Separate card for itinerary */}
        {itinerary.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.9 }}
            className={styles.aturcaraInner}
            style={{ marginTop: '2rem' }}
          >
            <div className={styles.aturcaraCard}>
              <p className={styles.aturcaraTitle}>Aturcara Majlis</p>
              {itinerary.map((item) => (
                <div key={item.itineraryItemId} className={styles.itineraryRow}>
                  <div className={styles.itineraryTime}>{item.detail}</div>
                  <div className={styles.itineraryEvent}>
                    <span className={styles.itineraryDot} />
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Section 3: Envelope / RSVP ───────────────────────────────── */}
      <div ref={envelopeSectionRef} id="rsvp" className={styles.envelopeSection}>
        <div ref={envelopeWrapperRef} className={styles.envelopeWrapper}>
          <AnimatePresence>
            {envelopeOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={styles.glowRing}
              />
            )}
          </AnimatePresence>

          <video ref={videoRef} className={styles.hiddenVideo} muted playsInline preload="auto"
            disablePictureInPicture crossOrigin="anonymous">
            <source src="/templates/t5/envelope_keyed.mp4" type="video/mp4" />
          </video>

          <div
            className={envelopeOpen ? styles.canvasWrapperOpen : styles.canvasWrapper}
            onClick={() => { if (envelopeOpen) setRsvpOpen(true); }}
            role={envelopeOpen ? 'button' : undefined}
            aria-label={envelopeOpen ? 'Open RSVP' : undefined}
          >
            <canvas ref={canvasRef} className={styles.envelopeCanvas} />
          </div>

          <AnimatePresence>
            {envelopeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.4 }}
                className={styles.tapHint}
              >
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={styles.tapHintText}
                >
                  Tap to RSVP
                </motion.p>
                <motion.span
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={styles.tapHintArrow}
                >
                  ↑
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Section 5: Wishes ────────────────────────────────────────── */}
      <section ref={wishesRef} id="wishes" className={styles.sectionWishes}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeading}>Wishes &amp; Blessings</h2>
            <p className={styles.sectionSubheading}>
              {t('wish.prompt', 'Leave a heartfelt message for the happy couple')}
            </p>
          </div>

          <div
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setWishExpanded(false);
              }
            }}
          >
          <div className={styles.glassCard}>
            <form onSubmit={handleWishSubmit} className={styles.formStack}>
              {/* Message field — always visible, collapses to one line until focused */}
              <div className={styles.wishField} style={{ alignItems: wishExpanded ? 'flex-start' : 'center' }}>
                <span className={styles.wishFieldIcon} style={{ paddingTop: wishExpanded ? 2 : 0 }}>💬</span>
                <textarea
                  placeholder="Leave a wish for the couple... ✨"
                  required
                  rows={wishExpanded ? 3 : 1}
                  value={wishData.message}
                  onChange={(e) => setWishData({ ...wishData, message: e.target.value })}
                  onFocus={() => setWishExpanded(true)}
                  className={`${styles.formTextarea} ${wishExpanded ? styles.formTextareaExpanded : styles.formTextareaCollapsed}`}
                />
              </div>

              {/* Secondary fields — slide in on expand */}
              <AnimatePresence>
                {wishExpanded && (
                  <motion.div
                    key="wish-extras"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ overflow: 'hidden' }}
                    className={styles.wishExtras}
                  >
                    {wishSuccess && (
                      <div className={styles.successMsg}>✅ Your wish was submitted!</div>
                    )}
                    <div className={styles.wishField}>
                      <span className={styles.wishFieldIcon}>👤</span>
                      <input
                        type="text" placeholder="Your Name *" required
                        value={wishData.guestName}
                        onChange={(e) => setWishData({ ...wishData, guestName: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.wishChips}>
                      {(['Bride', 'Groom'] as const).map((side) => (
                        <button
                          key={side} type="button"
                          onClick={() => setWishSide(side)}
                          className={`${styles.wishChip} ${wishSide === side ? styles.wishChipActive : ''}`}
                        >
                          {side === 'Bride' ? "Bride's Side" : "Groom's Side"}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit" disabled={wishSubmitting}
                      className={wishSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
                    >
                      {wishSubmitting ? 'Submitting...' : 'Send Wish ✨'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
          </div>

          {wishes.length > 0 && (
            <div className={styles.wishList}>
              {wishes.slice(0, displayedWishes).map((wish) => (
                <div key={wish.wishId} className={styles.wishCard}>
                  <p className={styles.wishAuthor}>{wish.guestName}</p>
                  <p className={styles.wishMessage}>"{wish.message}"</p>
                </div>
              ))}
              {wishes.length > displayedWishes && (
                <button
                  className={styles.wishLoadMore}
                  onClick={() => setDisplayedWishes(n => n + 10)}
                >
                  Load more ({wishes.length - displayedWishes} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Photos ────────────────────────────────────────── */}
      {photoBoothEnabled && (
        <section ref={photosRef} id="photos" className={styles.sectionPhotos}>
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>Photo Booth</h2>
              <p className={styles.sectionSubheading}>Share your favourite moments 📸</p>
            </div>

            <div
              onBlur={(e) => {
                if (
                  !selectedFile &&
                  e.relatedTarget !== null &&
                  !e.currentTarget.contains(e.relatedTarget as Node)
                ) {
                  setPhotoExpanded(false);
                }
              }}
            >
            <div className={styles.glassCard}>
              <form onSubmit={handlePhotoSubmit} className={styles.formStack}>
                {/* Always visible: full dropzone */}
                <label className={styles.fileDropzone} onClick={() => setPhotoExpanded(true)}>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className={styles.fileInput} />
                  {previewUrl ? (
                    <div className={styles.photoPreviewWrapper}>
                      <img src={previewUrl} alt="Preview" className={styles.photoPreview} />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleRemovePhoto(); }}
                        className={styles.removePhotoBtn}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      <span className={styles.photoPlaceholderIcon}>📷</span>
                      Tap to select a photo
                    </div>
                  )}
                </label>

                {/* Secondary fields — slide in when expanded */}
                <AnimatePresence>
                  {photoExpanded && (
                    <motion.div
                      key="photo-extras"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ overflow: 'hidden' }}
                      className={styles.wishExtras}
                    >
                      {photoSuccess && (
                        <div className={styles.successMsg}>✅ Photo uploaded!</div>
                      )}
                      <div className={styles.photoField}>
                        <span className={styles.wishFieldIcon}>👤</span>
                        <input type="text" placeholder="Your Name *" required
                          value={photoData.guestName}
                          onChange={(e) => setPhotoData({ ...photoData, guestName: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.photoField}>
                        <span className={styles.wishFieldIcon}>✏️</span>
                        <input type="text" placeholder="Caption (optional)"
                          value={photoData.caption}
                          onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                      <button
                        type="submit" disabled={photoSubmitting || !selectedFile}
                        className={photoSubmitting || !selectedFile ? styles.submitBtnDisabled : styles.submitBtn}
                      >
                        {photoSubmitting ? 'Uploading...' : 'Upload Photo 📤'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
            </div>

            {photos.length > 0 && (
              <>
                {/* Layout toggle */}
                <div className={styles.galleryHeader}>
                  <div className={styles.layoutToggle}>
                    <button
                      className={`${styles.layoutBtn} ${photoLayout === 'stack' ? styles.layoutBtnActive : ''}`}
                      onClick={() => setPhotoLayout('stack')}
                    >Stack</button>
                    <button
                      className={`${styles.layoutBtn} ${photoLayout === 'grid' ? styles.layoutBtnActive : ''}`}
                      onClick={() => setPhotoLayout('grid')}
                    >Grid</button>
                  </div>
                </div>

                {photoLayout === 'stack' ? (
                  <div className={styles.stackContainer}>
                    {/* Ghost cards peeking behind */}
                    {photos.length > 2 && (
                      <div className={styles.stackGhost2}>
                        <div className={styles.stackPolaroid}>
                          <img
                            src={`${API_BASE}${photos[(stackIndex + 2) % photos.length].photoUrl}`}
                            className={styles.stackPhoto} alt="" draggable={false}
                          />
                        </div>
                      </div>
                    )}
                    {photos.length > 1 && (
                      <div className={styles.stackGhost1}>
                        <div className={styles.stackPolaroid}>
                          <img
                            src={`${API_BASE}${photos[(stackIndex + 1) % photos.length].photoUrl}`}
                            className={styles.stackPhoto} alt="" draggable={false}
                          />
                        </div>
                      </div>
                    )}

                    {/* Active draggable card */}
                    <AnimatePresence custom={stackDirection} mode="sync">
                      <motion.div
                        key={stackIndex}
                        className={styles.stackCard}
                        custom={stackDirection}
                        variants={stackVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.22}
                        onDragStart={() => markInteraction()}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -55 || info.velocity.x < -400) goNext();
                          else if (info.offset.x > 55 || info.velocity.x > 400) goPrev();
                        }}
                        onClick={() => setLightboxPhoto(photos[stackIndex])}
                      >
                        <div className={styles.stackPolaroid}>
                          <div className={styles.polaroidTape} />
                          <img
                            src={`${API_BASE}${photos[stackIndex].photoUrl}`}
                            alt={photos[stackIndex].caption ?? ''}
                            className={styles.stackPhoto}
                            draggable={false}
                          />
                          {photos[stackIndex].caption && (
                            <span className={styles.polaroidCaption}>{photos[stackIndex].caption}</span>
                          )}
                          {photos[stackIndex].guestName && (
                            <span className={styles.polaroidBy}>— {photos[stackIndex].guestName}</span>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Prev / Next arrows */}
                    {photos.length > 1 && (
                      <>
                        <button className={`${styles.stackNav} ${styles.stackNavPrev}`} onClick={goPrev}>‹</button>
                        <button className={`${styles.stackNav} ${styles.stackNavNext}`} onClick={goNext}>›</button>
                      </>
                    )}

                    {/* Dot indicators */}
                    {photos.length > 1 && (
                      <div className={styles.stackDots}>
                        {photos.map((_, i) => (
                          <span
                            key={i}
                            className={`${styles.stackDot} ${i === stackIndex ? styles.stackDotActive : ''}`}
                            onClick={() => { markInteraction(); setStackDirection(i > stackIndex ? 1 : -1); setStackIndex(i); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.polaroidGrid}>
                    {photos.map((photo) => (
                      <div key={photo.photoId} className={styles.polaroid}
                        onClick={() => setLightboxPhoto(photo)}>
                        <div className={styles.polaroidTape} />
                        <img src={`${API_BASE}${photo.photoUrl}`} alt={photo.caption ?? ''}
                          className={styles.polaroidPhoto} />
                        {photo.caption && (
                          <span className={styles.polaroidCaption}>{photo.caption}</span>
                        )}
                        {photo.guestName && (
                          <span className={styles.polaroidBy}>— {photo.guestName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <p>{t('footer.tagline', 'Made with love for our special day')}</p>
      </footer>

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.lightboxOverlay}
            onClick={() => setLightboxPhoto(null)}
          >
            <div className={styles.lightboxCard} onClick={(e) => e.stopPropagation()}>
              <img
                src={`${API_BASE}${lightboxPhoto.photoUrl}`}
                alt={lightboxPhoto.caption ?? ''}
                className={styles.lightboxPhoto}
              />
              {lightboxPhoto.caption && (
                <p className={styles.lightboxCaption}>{lightboxPhoto.caption}</p>
              )}
              <button
                className={styles.lightboxClose}
                onClick={() => setLightboxPhoto(null)}
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RSVP Modal ───────────────────────────────────────────────── */}
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
