'use client';
import { useInvitationAudio } from '../_shared/hooks/useInvitationAudio';
import { configValue } from '@/components/templates/configValue';
import type { TemplateRsvpSubmission, PhotoUploadSubmission } from '@/components/templates/guestContracts';

import { Fragment, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wedding,
  Wish,
  Photo,
  ItineraryItem,
  SeatingTable,
  CreateWish,
} from '@/lib/api';
import { useScrollSection } from '../_shared/nav/useScrollSection';
import { animateScrollIntoView } from '../_shared/animateScrollTo';
import { resolveSectionOrder } from '@/lib/templateUtils';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { useBreakpoint } from '@/components/templates/_shared/hooks/useBreakpoint';
import { useWebGLSupport } from './hooks/useWebGLSupport';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useFairyConfig } from './hooks/useFairyConfig';
import { useAnchors } from './useAnchors';
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
  onRSVP: (data: TemplateRsvpSubmission) => Promise<void>;
  onSubmitWish: (data: CreateWish) => Promise<void>;
  onUploadPhoto?: (data: PhotoUploadSubmission) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  /** Set only by the customize preview iframe — drives the decorative-layer overlay editing. */
  editor?: EditorHandle;
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
  seatingEnabled = false,
  tables = [],
  customConfig,
  itinerary = [],
  editor,
}: Template6Props) {
  const t = (key: string, fallback: string) => configValue(customConfig, key, fallback);
  const webgl = useWebGLSupport();
  const reduced = useReducedMotion();
  const fairyConfig = useFairyConfig(customConfig);

  const overlayBreakpoint: Breakpoint = useBreakpoint(editor?.enabled ? editor.breakpoint : undefined);
  const overlayProps = { breakpoint: overlayBreakpoint, config: customConfig, editor };
  const { a, tx, sx, ax } = useAnchors(customConfig, overlayBreakpoint, editor);

  const [musicExpanded, setMusicExpanded] = useState(true);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);
  const musicUrl = t('music.url', '');
  const musicLoop = t('music.loop', 'true') === 'true';
  const { isPlaying: musicPlaying, toggle: toggleMusic, enabled: musicEnabled } = useInvitationAudio(musicUrl, musicLoop, { disabled: Boolean(editor?.enabled) });
  const showIslamicDate = t('general.showIslamicDate', 'false') === 'true';

  // Determine which sections to show
  const rawOrder = t('section.order', 'welcome,walimah,rsvp,itinerary,wishes,photobooth');
  const hasWalimah = Boolean(t('walimah.body', ''));
  const hasItinerary = itinerary.length > 0;
  const sections = resolveSectionOrder(rawOrder, hasWalimah, hasItinerary, photoBoothEnabled);
  const activeSection = useScrollSection({ sectionIds: sections });

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

  const scrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) animateScrollIntoView(target);
  }, []);

  const scrollDown = useCallback(() => {
    const next = sections[1];
    if (next) scrollToSection(next);
  }, [sections, scrollToSection]);

  const sectionContent: Record<string, ReactNode> = {
    welcome: (
      <WelcomeSection
        wedding={wedding}
        config={fairyConfig}
        webgl={webgl}
        reduced={reduced}
        customConfig={customConfig}
        showIslamicDate={showIslamicDate}
        onScrollDown={scrollDown}
        overlayProps={overlayProps}
        a={a}
        tx={tx}
        sx={sx}
        ax={ax}
      />
    ),
    walimah: (
      <CeremonySection customConfig={customConfig} overlayProps={overlayProps} a={a} />
    ),
    rsvp: (
      <RSVPSection seatingEnabled={seatingEnabled} tables={tables} onRSVP={onRSVP} customConfig={customConfig} wedding={wedding} overlayProps={overlayProps} a={a} />
    ),
    itinerary: (
      <ItinerarySection items={itinerary} overlayProps={overlayProps} a={a} />
    ),
    wishes: (
      <WishesSection
        wishes={wishes}
        onSubmitWish={onSubmitWish}
        customConfig={customConfig}
        overlayProps={overlayProps}
        a={a}
      />
    ),
    photobooth: (
      <PhotoBoothSection photos={photos} onUploadPhoto={onUploadPhoto} overlayProps={overlayProps} a={a} />
    ),
  };

  return (
    <div className={styles.wrapper}>
      {/* Music toggle */}
      <AnimatePresence>
        {musicUrl && musicEnabled && (
          <motion.button
            className={styles.musicBubble}
            onClick={() => {
              void toggleMusic();
              setMusicExpanded(true);
              if (collapseTimer.current) clearTimeout(collapseTimer.current);
              collapseTimer.current = setTimeout(() => setMusicExpanded(false), 4000);
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

      {/* Sections follow the same resolved order as navigation and Adjust. */}
      {sections.map((id) => <Fragment key={id}>{sectionContent[id]}</Fragment>)}

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
