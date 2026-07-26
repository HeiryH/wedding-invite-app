'use client';

import { useEffect, useRef, useState } from 'react';
import type { SlotProps } from '../types';
import styles from './slots.module.css';

/**
 * Page-level chrome — a scroll-spy nav rail, an autoplaying music bubble, and a footer tagline —
 * ported from Template5.tsx's bespoke versions of each. All three are `position: fixed` (see
 * slots.module.css), so which stage's layer list they're attached to is irrelevant: they float
 * over the whole page regardless. Reasonable emoji/label fallbacks are used since an authored
 * template's stage ids are author-chosen strings, not the fixed set T5's own hardcoded
 * `NAV_EMOJIS` assumed.
 */
const NAV_EMOJI_BY_ID: Record<string, string> = {
  welcome: '💍', hero: '💍', ceremony: '🗓️', walimah: '🗓️',
  rsvp: '✉️', envelope: '✉️', wishes: '✨', photos: '📸', photobooth: '📸',
};

/** Reads the already-rendered `[data-stage]` sections (id + `aria-label`, both set by Stage.tsx)
 *  rather than needing the full stage list threaded through SlotProps — same trick
 *  `ScrollCueSlot` already uses to jump to "the next section". */
export function NavSlot({ wishes }: SlotProps) {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Deferred to a rAF callback (rather than reading the DOM synchronously in the effect body)
    // so the initial setItems is an async update, not a same-pass render cascade.
    const raf = requestAnimationFrame(() => {
      const sections = [...document.querySelectorAll<HTMLElement>('[data-stage]')];
      setItems(sections.map((s) => ({
        id: s.dataset.stage ?? '',
        label: s.getAttribute('aria-label') || s.dataset.stage || '',
      })));

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.stage ?? '');
          });
        },
        { threshold: 0.4 },
      );
      sections.forEach((s) => observer.observe(s));
      observerRef.current = observer;
    });
    return () => {
      cancelAnimationFrame(raf);
      observerRef.current?.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  const scrollTo = (id: string) =>
    document.querySelector(`[data-stage="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <nav className={styles.navRail}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navBtn} ${active === item.id ? styles.navBtnActive : ''}`}
          onClick={() => scrollTo(item.id)}
          aria-label={item.label}
        >
          <span className={styles.navEmoji}>{NAV_EMOJI_BY_ID[item.id] ?? '•'}</span>
          <span className={styles.navTooltip}>{item.label}</span>
          {item.id === 'wishes' && wishes.length > 0 && <span className={styles.navBadge} />}
        </button>
      ))}
    </nav>
  );
}

/** Autoplay-with-graceful-fallback music bubble — same phased strategy as Template5.tsx's
 *  original: try unmuted, fall back to muted-until-first-gesture if the browser blocks it.
 *  Skips creating a real `Audio` element entirely while `editing` (the couple/author preview),
 *  matching how RSVP/wish slots no-op writes there — nobody wants surprise audio in an editor. */
export function MusicSlot({ t, editing }: SlotProps) {
  const url = t('music.url', '');
  const loop = t('music.loop', 'true') !== 'false';
  const [isPlaying, setIsPlaying] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url || editing) return;
    let cancelled = false;
    let unlock: (() => void) | null = null;
    const audio = new Audio(url);
    audio.loop = loop;
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    audio.play().catch(() => {
      if (cancelled) return;
      audio.muted = true;
      audio.play()
        .then(() => {
          if (cancelled) return;
          setNeedsGesture(true);
          unlock = () => { if (!cancelled) { audio.muted = false; setNeedsGesture(false); } };
          document.addEventListener('click', unlock, { once: true });
          document.addEventListener('touchstart', unlock, { once: true });
        })
        .catch(() => { if (!cancelled) setIsPlaying(false); });
    });

    return () => {
      cancelled = true;
      if (unlock) {
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
      }
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
    };
  }, [url, loop, editing]);

  if (!url) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else { audio.muted = false; audio.play().catch(() => {}); }
  };

  return (
    <button className={styles.musicBubble} onClick={toggle} title={isPlaying ? 'Mute music' : 'Play music'}>
      <span className={styles.musicIcon}>{isPlaying && !needsGesture ? '♪' : '♪̸'}</span>
    </button>
  );
}

export function FooterSlot({ t }: SlotProps) {
  return (
    <footer className={styles.chromeFooter}>
      <p>{t('footer.tagline', 'Made with love for our special day')}</p>
    </footer>
  );
}
