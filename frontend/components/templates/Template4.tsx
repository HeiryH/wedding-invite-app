'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Wedding, Wish, Photo, SeatingTable, TemplateSlots } from '@/lib/api';
import SeatingStep from './SeatingStep';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

interface Template4Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
}

interface StackCard {
  id: string;
  src: string;
  caption?: string;
  author?: string;
}

// ── Helpers ───────────────────────────────────────────────
function getMedia(coupleMedia: Photo[] | undefined, slot: number): string | null {
  const m = coupleMedia?.find((p) => p.templateSlot === slot);
  return m ? `${API_BASE}${m.photoUrl}` : null;
}

// Torn paper SVG divider (cream coloured tear)
function TornEdge({ fromDark = false }: { fromDark?: boolean }) {
  const fill = fromDark ? '#1C1C1A' : '#F7F6F1';
  const bg = fromDark ? '#F7F6F1' : '#1C1C1A';
  return (
    <div className="w-full overflow-hidden leading-none" style={{ background: bg }}>
      <svg viewBox="0 0 1200 48" preserveAspectRatio="none" className="w-full" style={{ height: 48, display: 'block' }}>
        <path
          d="M0,0 L0,28 Q25,42 52,22 Q78,5 108,26 Q135,44 165,20 Q195,0 228,28 Q258,44 290,18 Q320,0 355,26 Q388,44 420,20 Q452,0 486,28 Q516,44 548,16 Q578,0 610,26 Q642,44 675,18 Q706,0 740,26 Q772,44 804,18 Q835,0 868,28 Q900,44 932,18 Q963,0 996,26 Q1028,44 1060,20 Q1092,0 1124,26 Q1156,44 1200,24 L1200,0 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

// Countdown hook (live)
function useCountdown(target: Date) {
  const calc = () => {
    const d = target.getTime() - Date.now();
    if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      minutes: Math.floor((d % 3600000) / 60000),
      seconds: Math.floor((d % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// ── Minimal SVG icons ──────────────────────────────────────
const IcoChurch = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M10 4h4" /><rect x="3" y="10" width="18" height="11" rx="1" /><path d="M7 21v-6h10v6M3 10l9-5 9 5" />
  </svg>
);
const IcoGlass = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 22h8M12 11v11M5 3h14l-3 8a4 4 0 0 1-8 0L5 3z" /><path d="M5 3a10 10 0 0 0 14 0" />
  </svg>
);
const IcoRings = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" />
  </svg>
);
const IcoPin = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IcoFork = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M3 2v7c0 1.7 1.3 3 3 3h1v9a1 1 0 0 0 2 0v-9h1c1.7 0 3-1.3 3-3V2" /><path d="M18 2v20" />
  </svg>
);
const IcoParty = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IcoCamera = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IcoChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
);
const IcoChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
);

// ── Card Stack Component ───────────────────────────────────
function CardStack({
  cards,
  onSwipe,
}: {
  cards: StackCard[];
  onSwipe: (dir: 'left' | 'right') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-18, 18]);
  const overlayOpacity = useTransform(x, [-120, 0, 120], [0.25, 0, 0.25]);
  const overlayColor = useTransform(x, [-120, 0, 120], ['#000', '#000', '#000']);

  const handleDragEnd = (_: any, info: any) => {
    const swipeThreshold = 80;
    const velocityThreshold = 400;
    if (
      Math.abs(info.offset.x) > swipeThreshold ||
      Math.abs(info.velocity.x) > velocityThreshold
    ) {
      const dir = info.offset.x > 0 ? 1 : -1;
      animate(x, dir * 600, {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }).then(() => {
        x.set(0);
        onSwipe(dir > 0 ? 'right' : 'left');
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
    }
  };

  const VISIBLE = Math.min(cards.length, 4);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 380 }}>
        <p className="text-[#6A6A64] text-sm tracking-widest">No photos yet</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto select-none" style={{ width: 280, height: 380 }}>
      {/* Back cards (static, scaled down) */}
      {Array.from({ length: VISIBLE - 1 })
        .map((_, i) => i + 1)
        .reverse()
        .map((offset) => {
          const card = cards[offset % cards.length];
          return (
            <motion.div
              key={`${card.id}-bg-${offset}`}
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
              animate={{
                scale: 1 - offset * 0.05,
                y: offset * 14,
                rotate: offset % 2 === 0 ? offset * 1.5 : -offset * 1.5,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ zIndex: VISIBLE - offset }}
            >
              <img
                src={card.src}
                alt={card.caption || 'Wedding photo'}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          );
        })}

      {/* Front card (draggable) */}
      <motion.div
        key={cards[0].id}
        className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
        style={{ x, rotate, zIndex: VISIBLE + 1 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <img
          src={cards[0].src}
          alt={cards[0].caption || 'Wedding photo'}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        {/* Swipe hint overlay */}
        <motion.div
          className="absolute inset-0 bg-black rounded-2xl pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
        {/* Caption bar */}
        {(cards[0].caption || cards[0].author) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-8">
            {cards[0].caption && (
              <p className="text-white text-xs italic">{cards[0].caption}</p>
            )}
            {cards[0].author && (
              <p className="text-white/70 text-[10px] mt-0.5">— {cards[0].author}</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Upload Bottom Sheet ────────────────────────────────────
function UploadSheet({
  visible,
  onClose,
  onSubmit,
  submitting,
  success,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { guestName: string; caption: string; file: File }) => Promise<void>;
  submitting: boolean;
  success: boolean;
}) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;
    await onSubmit({ guestName: name, caption: '', file });
    setName('');
    setFile(null);
    setPreview(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#F7F6F1] rounded-t-3xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          >
            <div className="w-12 h-1 bg-[#D0CFC8] rounded-full mx-auto mt-3 mb-5" />

            {success ? (
              <div className="text-center px-6 pb-12 pt-4">
                <p className="text-2xl italic text-[#1C1C1A] mb-2">Photo shared!</p>
                <p className="text-sm text-[#8A8A80]">Thank you for capturing the moment.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 pb-10 space-y-4">
                {/* Photo picker */}
                <label className="block cursor-pointer">
                  {preview ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <p className="text-white text-xs tracking-widest uppercase">Tap to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 border border-dashed border-[#C0BFB8] rounded-xl flex flex-col items-center justify-center gap-2 text-[#8A8A80] hover:border-[#1C1C1A] transition-colors">
                      <IcoCamera />
                      <p className="text-xs tracking-widest uppercase">Select a photo</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>

                <input
                  type="text"
                  placeholder="Your name *"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#E0DFD9] bg-white px-4 py-3 text-sm text-[#1C1C1A] placeholder-[#B0AFA8] focus:outline-none focus:border-[#1C1C1A] transition-colors"
                />

                <button
                  type="submit"
                  disabled={submitting || !file || !name.trim()}
                  className="w-full py-3 bg-[#1C1C1A] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#333] transition-colors disabled:opacity-40"
                >
                  {submitting ? 'Uploading…' : 'Share photo'}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function Template4({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  seatingEnabled = false,
  tables = [],
  coupleMedia,
  customConfig,
}: Template4Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const weddingDate = new Date(wedding.weddingDate);
  const countdown = useCountdown(weddingDate);

  // Scroll spy
  const sections = ['hero', 'rsvp', 'wishes', ...(photoBoothEnabled ? ['photos'] : [])];
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (const id of sections) {
        const el = document.getElementById(`t4-${id}`);
        if (el) {
          const { offsetTop, offsetHeight } = el;
          if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [photoBoothEnabled]);

  const scrollTo = (id: string) => {
    document.getElementById(`t4-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Couple media slots
  const heroPhoto = getMedia(coupleMedia, TemplateSlots.GROOM_PORTRAIT);
  const midPhoto = getMedia(coupleMedia, TemplateSlots.BRIDE_PORTRAIT);
  const extra1 = getMedia(coupleMedia, TemplateSlots.EXTRA_1);
  const extra2 = getMedia(coupleMedia, TemplateSlots.EXTRA_2);
  const extra3 = getMedia(coupleMedia, TemplateSlots.EXTRA_3);

  // Photo booth stack: couple extras first, then approved guest photos
  const boothCards: StackCard[] = [
    ...[extra1, extra2, extra3]
      .filter(Boolean)
      .map((src, i) => ({ id: `couple-extra-${i}`, src: src! })),
    ...photos.map((p) => ({
      id: `guest-${p.photoId}`,
      src: `${API_BASE}${p.photoUrl}`,
      caption: p.caption || undefined,
      author: p.guestName || undefined,
    })),
  ];
  const [cards, setCards] = useState<StackCard[]>(boothCards);

  // Keep cards in sync if photos prop changes (new uploads)
  useEffect(() => {
    setCards([
      ...[extra1, extra2, extra3]
        .filter(Boolean)
        .map((src, i) => ({ id: `couple-extra-${i}`, src: src! })),
      ...photos.map((p) => ({
        id: `guest-${p.photoId}`,
        src: `${API_BASE}${p.photoUrl}`,
        caption: p.caption || undefined,
        author: p.guestName || undefined,
      })),
    ]);
  }, [photos.length, extra1, extra2, extra3]);

  const handleSwipe = (_dir: 'left' | 'right') => {
    setCards((prev) => {
      if (prev.length <= 1) return prev;
      return [...prev.slice(1), prev[0]];
    });
  };

  const swipeLeft = () => {
    if (cards.length <= 1) return;
    setCards((prev) => [...prev.slice(1), prev[0]]);
  };
  const swipeRight = () => {
    if (cards.length <= 1) return;
    setCards((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
  };

  // RSVP
  const [isAttending, setIsAttending] = useState(true);
  const [rsvpData, setRsvpData] = useState({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    songRequest: '',
  });
  const [rsvpStep, setRsvpStep] = useState<1 | 2>(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const submitRSVP = async () => {
    setRsvpSubmitting(true);
    try {
      await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId });
      setRsvpSuccess(true);
      setRsvpStep(1);
      setSelectedTableId(null);
      setRsvpData({ guestName: '', email: '', phoneNumber: '', brideOrGroomSide: 'Bride', numberOfAttendees: 1, songRequest: '' });
      setTimeout(() => { setRsvpSuccess(false); scrollTo('wishes'); }, 2200);
    } catch { alert('Failed to submit RSVP'); }
    finally { setRsvpSubmitting(false); }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending && seatingEnabled && rsvpStep === 1) { setRsvpStep(2); return; }
    await submitRSVP();
  };

  // Wishes
  const [wishData, setWishData] = useState({ guestName: '', message: '' });
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishSubmitting(true);
    try {
      await onSubmitWish(wishData);
      setWishSuccess(true);
      setWishData({ guestName: '', message: '' });
      setTimeout(() => setWishSuccess(false), 3000);
    } finally { setWishSubmitting(false); }
  };

  // Photo upload
  const [showUpload, setShowUpload] = useState(false);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const handlePhotoUpload = async (data: { guestName: string; caption: string; file: File }) => {
    if (!onUploadPhoto) return;
    setPhotoSubmitting(true);
    try {
      await onUploadPhoto(data);
      setPhotoSuccess(true);
      setTimeout(() => { setPhotoSuccess(false); setShowUpload(false); }, 2000);
    } finally { setPhotoSubmitting(false); }
  };

  // Shared input style
  const inp = 'w-full border border-[#E0DFD9] bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors';

  const dayName = weddingDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dayNum = weddingDate.getDate();
  const monthName = weddingDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

  return (
    <div className="bg-[#F7F6F1]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* ── Floating dot nav (right side) ── */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((id) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            aria-label={id}
            className="group flex items-center gap-2 justify-end"
          >
            <span className="text-[9px] text-[#1C1C1A] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 px-1.5 py-0.5 rounded">
              {id}
            </span>
            <span
              className={`block rounded-full border transition-all duration-300 ${
                activeSection === id
                  ? 'w-2 h-2 bg-[#1C1C1A] border-[#1C1C1A]'
                  : 'w-2 h-2 bg-transparent border-[#8A8A80] hover:border-[#1C1C1A]'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════ */}
      <section id="t4-hero" className="relative min-h-screen flex flex-col">
        {/* Full-bleed hero photo */}
        {heroPhoto ? (
          <div className="absolute inset-0">
            <img src={heroPhoto} alt="Couple" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#1C1C1A]" />
        )}

        {/* Hero text */}
        <div className="relative z-10 flex flex-col items-center justify-end flex-1 text-center pb-16 px-6">
          <motion.p
            className="text-white/70 text-[10px] tracking-[0.4em] uppercase mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {t('invite.heading', 'We\'re getting married')}
          </motion.p>
          <motion.h1
            className="text-white text-5xl md:text-6xl italic font-normal leading-tight mb-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {wedding.brideName} &amp; {wedding.groomName}
          </motion.h1>
          <motion.p
            className="text-white/60 text-sm tracking-[0.25em] mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {String(weddingDate.getDate()).padStart(2, '0')}.
            {String(weddingDate.getMonth() + 1).padStart(2, '0')}.
            {weddingDate.getFullYear()}
          </motion.p>

          {/* Scroll hint */}
          <motion.button
            onClick={() => scrollTo('rsvp')}
            className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <span className="text-[9px] tracking-widest uppercase">Scroll</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.button>
        </div>

        {/* Torn edge into cream section */}
        <div className="relative z-10">
          <TornEdge fromDark />
        </div>
      </section>

      {/* ── Countdown + Details (cream) ── */}
      <div id="t4-details" className="bg-[#F7F6F1] py-16 px-6">
        <div className="max-w-lg mx-auto">
          {/* Countdown */}
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#8A8A80] mb-8">
              {t('invite.countdown_prefix', 'Counting down to the big day')}
            </p>
            <div className="flex justify-center gap-8">
              {[
                { val: countdown.days, label: 'Days' },
                { val: countdown.hours, label: 'Hrs' },
                { val: countdown.minutes, label: 'Min' },
                { val: countdown.seconds, label: 'Sec' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-4xl font-light text-[#1C1C1A] tabular-nums leading-none">
                    {String(val).padStart(2, '0')}
                  </p>
                  <p className="text-[9px] tracking-widest text-[#8A8A80] uppercase mt-2">{label}</p>
                </div>
              ))}
            </div>
            {/* Day boxes */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <div className="border border-[#1C1C1A] px-4 py-2.5">
                <p className="text-[9px] tracking-widest uppercase text-[#8A8A80]">{dayName}</p>
              </div>
              <div className="border border-[#1C1C1A] px-5 py-2.5">
                <p className="text-2xl font-light text-[#1C1C1A] leading-none">{dayNum}</p>
              </div>
              <div className="border border-[#1C1C1A] px-4 py-2.5">
                <p className="text-[9px] tracking-widest uppercase text-[#8A8A80]">{monthName}</p>
              </div>
            </div>
          </div>

          {/* Invite body */}
          <p
            className="text-center text-[#4A4A44] text-sm leading-relaxed mb-12"
            dangerouslySetInnerHTML={{
              __html: t('invite.body', 'We joyfully invite you to share in the celebration of our wedding day. Your presence will make this moment unforgettable.'),
            }}
          />

          {/* Ceremony */}
          <div className="text-center border-t border-[#E0DFD9] pt-10 pb-10">
            <div className="flex justify-center text-[#1C1C1A] mb-3"><IcoChurch /></div>
            <h3 className="text-xl italic text-[#1C1C1A] mb-1">Ceremony</h3>
            <p className="text-sm text-[#8A8A80] mb-0.5">{wedding.venue}</p>
            {wedding.venueAddress && (
              <>
                <p className="text-xs text-[#B0AFA8] mb-4">{wedding.venueAddress}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(wedding.venueAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border border-[#1C1C1A] px-5 py-2 text-[10px] tracking-widest uppercase text-[#1C1C1A] hover:bg-[#1C1C1A] hover:text-white transition-colors"
                >
                  <IcoPin /> Directions
                </a>
              </>
            )}
          </div>

          {/* Reception */}
          <div className="text-center border-t border-[#E0DFD9] py-10">
            <div className="flex justify-center text-[#1C1C1A] mb-3"><IcoGlass /></div>
            <h3 className="text-xl italic text-[#1C1C1A] mb-1">Reception</h3>
            <p className="text-sm text-[#8A8A80]">{wedding.venue}</p>
          </div>
        </div>
      </div>

      {/* ── Schedule + Mid Photo (dark) ── */}
      <div id="t4-schedule" className="bg-[#1C1C1A]">
        <TornEdge fromDark={false} />
        <div className="py-16 px-6">
          <div className="max-w-sm mx-auto">
            <p className="text-center text-[9px] tracking-[0.35em] uppercase text-[#6A6A64] mb-10">Schedule</p>
            {[
              { time: '20:00 Hs', label: 'Arrival — Take your seat', icon: <IcoPin /> },
              { time: '20:30 Hs', label: 'Ceremony', icon: <IcoRings /> },
              { time: '21:30 Hs', label: 'Toast', icon: <IcoGlass /> },
              { time: '22:00 Hs', label: 'First Course', icon: <IcoFork /> },
              { time: '00:00 Hs', label: 'Party', icon: <IcoParty /> },
            ].map(({ time, label, icon }) => (
              <div key={time} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-0">
                <div className="text-white/40 flex-shrink-0">{icon}</div>
                <div>
                  <p className="text-[9px] text-[#6A6A64] tracking-widest uppercase">{time}</p>
                  <p className="text-white text-sm font-light">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mid couple photo */}
        {midPhoto && (
          <div className="w-full overflow-hidden" style={{ maxHeight: 440 }}>
            <img src={midPhoto} alt="Couple" className="w-full object-cover" style={{ maxHeight: 440 }} />
          </div>
        )}
        <div className="pb-2" />
      </div>

      {/* ══════════════════════════════════════
          SECTION 2 — RSVP (cream)
      ══════════════════════════════════════ */}
      <section id="t4-rsvp" className="bg-[#F7F6F1] py-20 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#8A8A80] mb-2">Kindly reply</p>
              <h2 className="text-4xl italic font-normal text-[#1C1C1A]">RSVP</h2>
              <p className="text-sm text-[#8A8A80] mt-2">{t('rsvp.subtitle', 'Will you be joining us?')}</p>
            </div>

            <AnimatePresence mode="wait">
              {rsvpSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-[#E0DFD9] bg-white p-10 text-center"
                >
                  <p className="text-2xl italic text-[#1C1C1A] mb-2">Thank you!</p>
                  <p className="text-sm text-[#8A8A80]">Your RSVP has been received.</p>
                </motion.div>
              ) : rsvpStep === 2 ? (
                <div key="seating" className="border border-[#E0DFD9] bg-white p-6">
                  <SeatingStep
                    tables={tables}
                    numberOfAttendees={rsvpData.numberOfAttendees}
                    selectedTableId={selectedTableId}
                    onSelect={setSelectedTableId}
                    onBack={() => setRsvpStep(1)}
                    onSubmit={submitRSVP}
                    submitting={rsvpSubmitting}
                    accentClass="bg-[#1C1C1A] hover:bg-[#333]"
                    accentBorderClass="border-[#1C1C1A] bg-gray-50"
                  />
                </div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleRSVPSubmit}
                  className="border border-[#E0DFD9] bg-white p-6 space-y-3"
                >
                  {/* Attending toggle */}
                  <div className="flex gap-3">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setIsAttending(v)}
                        className={`flex-1 py-3 text-[10px] tracking-widest uppercase border transition-all ${
                          isAttending === v
                            ? 'bg-[#1C1C1A] text-white border-[#1C1C1A]'
                            : 'text-[#8A8A80] border-[#E0DFD9] hover:border-[#1C1C1A]'
                        }`}
                      >
                        {v ? 'Attending' : 'Not Attending'}
                      </button>
                    ))}
                  </div>

                  {['guestName', 'email', 'phoneNumber'].map((field) => (
                    <input
                      key={field}
                      type={field === 'email' ? 'email' : field === 'phoneNumber' ? 'tel' : 'text'}
                      placeholder={field === 'guestName' ? 'Your name *' : field === 'email' ? 'Email' : 'Phone'}
                      required={field === 'guestName'}
                      value={(rsvpData as any)[field]}
                      onChange={(e) => setRsvpData({ ...rsvpData, [field]: e.target.value })}
                      className="w-full border border-[#E0DFD9] px-4 py-3 text-sm text-[#1C1C1A] placeholder-[#B0AFA8] focus:outline-none focus:border-[#1C1C1A] transition-colors"
                    />
                  ))}

                  {isAttending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="flex gap-3">
                        {['Bride', 'Groom'].map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => setRsvpData({ ...rsvpData, brideOrGroomSide: side as 'Bride' | 'Groom' })}
                            className={`flex-1 py-2.5 text-[10px] tracking-widest uppercase border transition-all ${
                              rsvpData.brideOrGroomSide === side
                                ? 'bg-[#1C1C1A] text-white border-[#1C1C1A]'
                                : 'text-[#8A8A80] border-[#E0DFD9] hover:border-[#1C1C1A]'
                            }`}
                          >
                            {side}&apos;s side
                          </button>
                        ))}
                      </div>
                      <input
                        type="number" min={1} max={10}
                        placeholder="Number of guests"
                        value={rsvpData.numberOfAttendees}
                        onChange={(e) => setRsvpData({ ...rsvpData, numberOfAttendees: Number(e.target.value) })}
                        className="w-full border border-[#E0DFD9] px-4 py-3 text-sm text-[#1C1C1A] placeholder-[#B0AFA8] focus:outline-none focus:border-[#1C1C1A] transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Song request (optional)"
                        value={rsvpData.songRequest}
                        onChange={(e) => setRsvpData({ ...rsvpData, songRequest: e.target.value })}
                        className="w-full border border-[#E0DFD9] px-4 py-3 text-sm text-[#1C1C1A] placeholder-[#B0AFA8] focus:outline-none focus:border-[#1C1C1A] transition-colors"
                      />
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={rsvpSubmitting}
                    className="w-full py-3 bg-[#1C1C1A] text-white text-[10px] tracking-widest uppercase hover:bg-[#333] transition-colors disabled:opacity-40 mt-1"
                  >
                    {rsvpSubmitting ? 'Sending…' : isAttending && seatingEnabled ? 'Continue →' : 'Send RSVP'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 3 — WISHES (dark)
      ══════════════════════════════════════ */}
      <section id="t4-wishes" className="bg-[#1C1C1A] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#6A6A64] mb-2">Leave a message</p>
              <h2 className="text-4xl italic font-normal text-white">Wishes</h2>
              <p className="text-sm text-[#6A6A64] mt-2">{t('wish.prompt', 'Share your love with the happy couple')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Submit form */}
              <div>
                <AnimatePresence mode="wait">
                  {wishSuccess ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border border-white/10 p-10 text-center"
                    >
                      <p className="text-xl italic text-white">Wish sent!</p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="wishform"
                      onSubmit={handleWishSubmit}
                      className="space-y-3"
                    >
                      <input
                        type="text"
                        placeholder="Your name *"
                        required
                        value={wishData.guestName}
                        onChange={(e) => setWishData({ ...wishData, guestName: e.target.value })}
                        className={inp}
                      />
                      <textarea
                        placeholder="Write your wishes… *"
                        required
                        rows={5}
                        value={wishData.message}
                        onChange={(e) => setWishData({ ...wishData, message: e.target.value })}
                        className={`${inp} resize-none`}
                      />
                      <button
                        type="submit"
                        disabled={wishSubmitting}
                        className="w-full py-3 border border-white/30 text-white text-[10px] tracking-widest uppercase hover:bg-white hover:text-[#1C1C1A] transition-colors disabled:opacity-40"
                      >
                        {wishSubmitting ? 'Sending…' : 'Send Wishes'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishes wall */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                {wishes.length === 0 && (
                  <p className="text-[#6A6A64] text-sm text-center pt-10">Be the first to leave a wish.</p>
                )}
                {wishes.map((wish) => (
                  <motion.div
                    key={wish.wishId}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="border border-white/10 p-5"
                  >
                    <p className="text-white/80 text-sm italic leading-relaxed">&ldquo;{wish.message}&rdquo;</p>
                    <p className="text-[#6A6A64] text-[10px] tracking-widest uppercase mt-3">— {wish.guestName}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4 — PHOTO BOOTH (cream)
      ══════════════════════════════════════ */}
      {photoBoothEnabled && (
        <section id="t4-photos" className="bg-[#F7F6F1]">
          {/* TornEdge outside padding so the transition is flush with the dark section above */}
          <TornEdge fromDark />
          <div className="py-20 px-6">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#8A8A80] mb-2">Capture the moment</p>
                <h2 className="text-4xl italic font-normal text-[#1C1C1A]">Photo Booth</h2>
                <p className="text-[10px] text-[#B0AFA8] tracking-wider mt-2 uppercase">
                  Swipe left or right to browse
                </p>
              </div>

              {/* Card Stack */}
              <div className="flex flex-col items-center">
                <CardStack cards={cards} onSwipe={handleSwipe} />

                {/* Navigation arrows + counter */}
                {cards.length > 1 && (
                  <div className="flex items-center gap-6 mt-8">
                    <button
                      onClick={swipeRight}
                      className="w-10 h-10 border border-[#D0CFC8] flex items-center justify-center text-[#8A8A80] hover:border-[#1C1C1A] hover:text-[#1C1C1A] transition-colors"
                    >
                      <IcoChevronLeft />
                    </button>
                    <span className="text-[10px] tracking-widest text-[#B0AFA8] uppercase">
                      {cards.length} photo{cards.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={swipeLeft}
                      className="w-10 h-10 border border-[#D0CFC8] flex items-center justify-center text-[#8A8A80] hover:border-[#1C1C1A] hover:text-[#1C1C1A] transition-colors"
                    >
                      <IcoChevronRight />
                    </button>
                  </div>
                )}

                {/* Upload button */}
                {onUploadPhoto && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-8 flex items-center gap-2 border border-[#1C1C1A] px-6 py-2.5 text-[10px] tracking-widest uppercase text-[#1C1C1A] hover:bg-[#1C1C1A] hover:text-white transition-colors"
                  >
                    <IcoCamera /> Add your photo
                  </button>
                )}
              </div>
            </motion.div>
          </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="bg-[#F7F6F1] border-t border-[#E0DFD9] py-10 text-center">
        <p className="text-xs tracking-widest text-[#B0AFA8] uppercase">
          {wedding.brideName} &amp; {wedding.groomName}
        </p>
        <p className="text-[10px] text-[#C8C7C0] mt-1">
          {weddingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-[10px] text-[#C8C7C0] mt-3">{t('footer.tagline', 'Made with love')}</p>
      </div>

      {/* Upload bottom sheet */}
      <UploadSheet
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onSubmit={handlePhotoUpload}
        submitting={photoSubmitting}
        success={photoSuccess}
      />
    </div>
  );
}
