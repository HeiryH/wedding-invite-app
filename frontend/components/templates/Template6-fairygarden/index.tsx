'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wedding,
  Wish,
  Photo,
  ItineraryItem,
  SeatingTable,
  CreateWish,
} from '@/lib/api';
import { resolveSectionOrder } from '@/lib/templateUtils';
import { useWebGLSupport } from './hooks/useWebGLSupport';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useFairyConfig } from './hooks/useFairyConfig';
import WelcomeSection from './components/WelcomeSection';
import CeremonySection from './components/CeremonySection';
import RSVPSection from './components/RSVPSection';
import ItinerarySection from './components/ItinerarySection';
import WishesSection from './components/WishesSection';
import PhotoBoothSection from './components/PhotoBoothSection';
import NavBar from './components/NavBar';
import styles from './Template6.module.css';

// ── Prop types (matches TemplateWrapper interface) ──────────────────────────
interface Template6Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: CreateWish) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
}

// ── Nav items per section ───────────────────────────────────────────────────
const SECTION_NAV: Record<string, { emoji: string; label: string }> = {
  welcome:    { emoji: '🌿', label: 'Home' },
  walimah:    { emoji: '🌸', label: 'Ceremony' },
  rsvp:       { emoji: '✉️', label: 'RSVP' },
  itinerary:  { emoji: '📋', label: 'Programme' },
  wishes:     { emoji: '💌', label: 'Wishes' },
  photobooth: { emoji: '📷', label: 'Photos' },
};

export default function Template6({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  customConfig,
  itinerary = [],
}: Template6Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const webgl = useWebGLSupport();
  const reduced = useReducedMotion();
  const fairyConfig = useFairyConfig(customConfig);

  const [activeSection, setActiveSection] = useState('welcome');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicExpanded, setMusicExpanded] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicUrl = t('music.url', '');
  const musicLoop = t('music.loop', 'true') === 'true';
  const showIslamicDate = t('general.showIslamicDate', 'false') === 'true';

  // Determine which sections to show
  const rawOrder = t('section.order', 'welcome,walimah,rsvp,itinerary,wishes,photobooth');
  const hasWalimah = Boolean(t('walimah.body', ''));
  const hasItinerary = itinerary.length > 0;
  const sections = resolveSectionOrder(rawOrder, hasWalimah, hasItinerary, photoBoothEnabled);

  const navItems = sections.map((id) => ({
    id,
    ...(SECTION_NAV[id] ?? { emoji: '✦', label: id }),
  }));

  // Music collapse after 4s
  useEffect(() => {
    if (!musicUrl) return;
    const timer = setTimeout(() => setMusicExpanded(false), 4000);
    return () => clearTimeout(timer);
  }, [musicUrl]);

  // Music playback
  useEffect(() => {
    if (!musicUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = musicLoop;
    }
    if (musicPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [musicPlaying, musicUrl, musicLoop]);

  // Clean up audio on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollDown = useCallback(() => {
    const next = sections[1];
    if (next) scrollToSection(next);
  }, [sections, scrollToSection]);

  return (
    <div className={styles.wrapper}>
      {/* Music toggle */}
      <AnimatePresence>
        {musicUrl && (
          <motion.button
            className={styles.musicBubble}
            onClick={() => {
              setMusicPlaying((p) => !p);
              setMusicExpanded(true);
              setTimeout(() => setMusicExpanded(false), 4000);
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            aria-label={musicPlaying ? 'Pause music' : 'Play music'}
          >
            <span>{musicPlaying ? '🎵' : '🔇'}</span>
            <span className={`${styles.musicLabel} ${musicExpanded ? '' : styles.musicLabelHidden}`}>
              {musicPlaying ? 'Playing…' : 'Music off'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sections */}
      {sections.includes('welcome') && (
        <WelcomeSection
          wedding={wedding}
          config={fairyConfig}
          webgl={webgl}
          reduced={reduced}
          customConfig={customConfig}
          showIslamicDate={showIslamicDate}
          onScrollDown={scrollDown}
        />
      )}

      {sections.includes('walimah') && (
        <CeremonySection customConfig={customConfig} />
      )}

      {sections.includes('rsvp') && (
        <RSVPSection onRSVP={onRSVP} customConfig={customConfig} />
      )}

      {sections.includes('itinerary') && (
        <ItinerarySection items={itinerary} />
      )}

      {sections.includes('wishes') && (
        <WishesSection
          wishes={wishes}
          onSubmitWish={onSubmitWish}
          customConfig={customConfig}
        />
      )}

      {sections.includes('photobooth') && (
        <PhotoBoothSection photos={photos} onUploadPhoto={onUploadPhoto} />
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerTagline}>{t('footer.tagline', 'Made with love for our special day')}</p>
        <span>🌿</span>
      </footer>

      {/* Nav */}
      <NavBar items={navItems} active={activeSection} onNav={scrollToSection} />
    </div>
  );
}
